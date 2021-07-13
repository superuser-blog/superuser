---
id: 200331
title: "Golang Http Client and Compression"
author: sanket
layout: single
guid: https://superuser.blog/?p=200331
permalink: /golang-http-gzip-compression
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
categories:
  - golang
---

I had a very (seemingly) simple task. Verify my golang http client, talking with an ElasticSearch cluster, is compressing data on wire. Because in trials, there was around 8x data compression and 100ms latency improvement. Sounds simple? Apparently not!

# ElasticSearch Side of Things

Http compression is enabled by default and it's an easy configuration. Despite it being enabled by default, still added following in config
```
http.compression: true
```

And verified it works by
```bash
~ $> curl -v http://localhost:9200/_cat/health -H "Accept-Encoding: gzip"
> GET /_cat/health HTTP/1.1
> User-Agent: curl/7.29.0
> Host: localhost:9200
> Accept: */*
> Accept-Encoding: gzip
>
< HTTP/1.1 200 OK
< content-type: text/plain; charset=UTF-8
< content-encoding: gzip
< content-length: 84
<
```


# Client Side of Things
We are using [olivere/elastic](https://github.com/olivere/elastic) client to talk with ElasticSearch. This client takes a config parameter which is documented as following
```
 SetGzip(bool) enables or disables compression on the request side. It is disabled by default.
```
Now this setting is **_supposed to_** enable compression. It does not. We will come to it. [Point 1]

Above ElasticSearch client also accepts an http client. And an HTTP client's transport as well has a compression flag. Here's how an HTTP client looks like, with compression enabled, which is what we had.

```golang
tr := &http.Transport{
  MaxIdleConns:       10,
  IdleConnTimeout:    30 * time.Second,
  DisableCompression: false,
}
client := &http.Client{Transport: tr}
resp, err := client.Get("https://example.com")

// Documentation
    // DisableCompression, if true, prevents the Transport from
    // requesting compression with an "Accept-Encoding: gzip"
    // request header when the Request contains no existing
    // Accept-Encoding value. If the Transport requests gzip on
    // its own and gets a gzipped response, it's transparently
    // decoded in the Response.Body. However, if the user
    // explicitly requested gzip it is not automatically
    // uncompressed.
    DisableCompression bool

```

But how do I verify that the communication indeed was compressing data on the wire?

## Inspect Request/Response Headers From ElasticSearch Client
I tried printing request response headers right at the place where the ES client performs the request. Pardon the formatting but they looked like following. You can see the request data is zipped but `Accept-Encoding` is missing. This is one problem that I mentioned. (Perhaps the `Vary` header is somehow able to achieve that but could not find anything promising). So the library's documentation is bit unclear to me.
```
map[User-Agent:[elastic/5.0.64 (linux-amd64)] Accept:[application/json] Content-Type:[application/json] Content-Encoding:[gzip] Vary:[Accept-Encoding]]
```

## Inspect Headers at http.transport
Since we enabled compression at transport layer, it is supposed to send relevant headers and compress the payload. Diving into source code of transport, I saw a [line setting `Accept-Encoding` header](https://golang.org/src/net/http/transport.go#L2454). `req.extraHeaders().Set("Accept-Encoding", "gzip")` But printing header did not show that encoding header. Apparently is was set in another variable of struct `transportRequest` called `extra`
```
req header at transport:  
map[Vary:[Accept-Encoding] User-Agent:[elastic/5.0.64 (linux-amd64)] Accept:[application/json] Content-Type:[application/json] Content-Encoding:[gzip]]

extra:
map[Accept-Encoding:[gzip]]
```

### Inspecting Response
The same function, which set the above header, receives the response. Printing response's header did not have content encoding.
```
// Src code:
    case re := <-resc:
      if (re.res == nil) == (re.err == nil) {
        panic(fmt.Sprintf("internal error: exactly one of res or err should be set; nil=%v", re.res == nil))
      }
      if debugRoundTrip {
        req.logf("resc recv: %p, %T/%#v", re.res, re.err, re.err)
      }
      if re.err != nil {
        return nil, pc.mapRoundTripError(req, startBytesWritten, re.err)
      }
      fmt.Println("TRANSPORT RESS-=========-")
      fmt.Println(re.res.Header)
      fmt.Println("-=========-")

// Outout:
map[Content-Type:[application/json; charset=UTF-8]]
```

**This is where things get confusing. In the initial curl request, when we set the `Accept-Encoding` header, the ES server returned gzip response. But when go client set the same header, it did not return gzipped response.**

### Going Further Deep
Something seemed wrong, so I went even deeper, to whatever function above transport's `roundTrip` function was calling. Control seemed to be going to [function called `readLoop()`](https://golang.org/src/net/http/transport.go#L1943) where we can find following lines scrolling down a bit
```golang
    resp.Body = body
    if rc.addedGzip && strings.EqualFold(resp.Header.Get("Content-Encoding"), "gzip") {
      fmt.Println("TRANSPORT RESPPPPPP -=========-")
      fmt.Println(resp.Header)
      resp.Body = &gzipReader{body: body}
      resp.Header.Del("Content-Encoding")
      resp.Header.Del("Content-Length")


// Output
TRANSPORT RESPPPPPP -=========-
map[Content-Type:[application/json; charset=UTF-8] Content-Encoding:[gzip] Content-Length:[128]]
```

HELL YEAH! There they are! The response was decompressed and headers were removed. That is why, at layers above this, we were not seeing the header set.

# Summary
  1. We set DisableCompression as false in http client's transport
  2. Transport, for each request, if not already set, will set `Accept-Encoding`. (In a variable called extra)
  3. When the response arrives, it'll check if transport added gzip
    
     3.1 If it did, unzip data<br/>
     3.2 Remove headers which indicates the zipped response from server.

So it works good as a transparent system.

# The Twist
Apparently http.Response struct had a field called `Uncompressed` which states exactly what I investigated. **RTFM!**
```
    // Uncompressed reports whether the response was sent compressed but
    // was decompressed by the http package. When true, reading from
    // Body yields the uncompressed content instead of the compressed
    // content actually set from the server, ContentLength is set to -1,
    // and the "Content-Length" and "Content-Encoding" fields are deleted
    // from the responseHeader. To get the original response from
    // the server, set Transport.DisableCompression to true.
    Uncompressed bool // Go 1.7s
```

### Fin
When I read [I want off Mr. Golang's Wild Ride](https://fasterthanli.me/blog/2020/i-want-off-mr-golangs-wild-ride/), the author's criticism felt valid to me. Later I realized even http timeouts are not as simple as they sound, [this piece on cloudflare blog](https://blog.cloudflare.com/the-complete-guide-to-golang-net-http-timeouts/) explains that. And now this abstraction for gzip! **I feel the convenience that the language gives is good, until it's not!**
