---
id: 187
title: 'Writing Simple WebSocket Server in Python: PyWSocket'
date: 2017-08-26T14:40:53+00:00
author: sanket
layout: single
guid: https://superuser.blog/?p=187
permalink: /websocket-server-python/
image: /wp-content/uploads/2017/08/pywsocket-825x463.jpg
categories:
  - python
tags:
  - python
  - websocket
---
Journey to websocket was pretty long. I started with an idea to make an app which can play music in sync across the devices during college period. No wonder I couldn&#8217;t get thru it. Later this year I stumbled upon this new thing called WebSockets and they were intriguing. I thought I could finish that app with websockets (and I did, with partial success). Spinned of another app out of it. And websockets were on a roll. It was time I digged further in and ended up writing a websocket server. (GitHub link at the bottom)<!--more-->

### So what is a websocket server?

> A WebSocket server is a TCP application listening on any port of a server that follows a specific protocol, simple as that.

How does it work? : It uses HTTP protocol for handshake and after handshake is complete, it works over TCP protocol and exchanges data in it&#8217;s agreed-upon format called frames. Connections are bi-directional and any party can send message anytime. Unlike HTTP where new TCP connection is made every time you want to communicate, WebSockets maintains a connection using which any side can send message anytime, reducing the message delivery time by using the existing connection.<figure style="max-width: 1223px" class="wp-caption aligncenter">

<img src="//www.fullstackpython.com/img/visuals/websockets-flow-with-client-push.png" alt="" width="1223" height="747" /><figcaption class="wp-caption-text">Credits: fullstackpython.com</figcaption></figure> 

## The WebSocket Server:

We will be writing our server in 4 parts:

  1. Writing a TCP/HTTP server to identify a websocket request.
  2. Performing a handshake
  3. Decoding/Receiving data/frames
  4. Sending data/frames

I will be discussing the protocol implementations as we go thru steps. You can also take a pause have a look at <a href="//developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers" target="_blank" rel="noopener">this</a> awesome piece written by Mozilla on WebSocket Servers. It is a must read. Now or later.

<span style="font-size: 29px; font-weight: bold;">1. Writing a TCP/HTTP Server to Identify WebSocket Request </span>

We will be using python&#8217;s SocketServer library which ptovides simple TCP server. The client will send an HTTP request which looks something like this:

<pre class="lang:default decode:true">GET /chat HTTP/1.1
Host: example.com:8000
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13</pre>

So what we need to lookout for is that if the request is of type GET and it has these three headers namely \`Upgrade: websocket\` \`Connection: Upgrade\` and \`Sec-WebSocket-key: <some random characters>\`

If you find all this, we can proceed towards the next step which is completing the handshake. In our implementation we will check if all the three headers are present and we will proceed with the handshake. The request handler function will look something like this:

<pre class="theme:monokai nums:true lang:python decode:true">def handle(self):
        # self.request is the TCP socket connected to the client
        self.data = self.request.recv(1024).strip()
        headers = self.data.split("\r\n")

        # is it a websocket request?
        if "Connection: Upgrade" in self.data and "Upgrade: websocket" in self.data:
            # getting the websocket key out
            for h in headers:
                if "Sec-WebSocket-Key" in h:
                    key = h.split(" ")[1]
            # let's shake hands shall we?
            self.shake_hand(key)

            while True:
                payload = self.decode_frame(bytearray(self.request.recv(1024).strip()))
                decoded_payload = payload.decode('utf-8')
                self.send_frame(payload)
                if "bye" == decoded_payload.lower():
                    "Bidding goodbye to our client..."
                    return
        else:
            self.request.sendall("HTTP/1.1 400 Bad Request\r\n" + \
                                 "Content-Type: text/plain\r\n" + \
                                 "Connection: close\r\n" + \
                                 "\r\n" + \
                                 "Incorrect request")</pre>

This is the rough flow: If we find a valid websocket request, we proceed with handshake and then in while loop, we just do echo. ie sending back whatever we received. If it&#8217;s not a valid request we send HTTP 400 in response.

Pretty simple till now, innit?

## 2. Performing a Handshake

This is where the protocol details kicks in. You will need to send a specific HTTP response back to client in order to establish the bidirectional connection. The response will look something like this:

<pre class="lang:default decode:true">HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=</pre>

You see there a new header called \`Sec-WebSocket-Accept\` with some random looking characters. Now there&#8217;s a method to calculate this. As per protocol, you concatenate the key you received in request header (&#8216;dGhlIHNhb&#8230;&#8217;) and the <a href="//en.wikipedia.org/wiki/Magic_string" target="_blank" rel="noopener">magic string</a> (&#8220;258EAFA5-E914-47DA-95CA-C5AB0DC85B11&#8221;) , calcualte SHA1 hash of them and send back the base64 encoding of the hash (which is &#8216;s3pPLMB&#8230;&#8217;) This is done so that client can also confirm that the server understands the protocol. So handshake is basically HTTP response with a header containg SHA1 of the key and magic-string and key client sent and those same two headers.

Here&#8217;s how it&#8217;s done in python:

<pre class="theme:monokai nums:true lang:python decode:true">def shake_hand(self,key):
        # calculating response as per protocol RFC
        key = key + WS_MAGIC_STRING
        resp_key = base64.standard_b64encode(hashlib.sha1(key).digest())

        resp="HTTP/1.1 101 Switching Protocols\r\n" + \
             "Upgrade: websocket\r\n" + \
             "Connection: Upgrade\r\n" + \
             "Sec-WebSocket-Accept: %s\r\n\r\n"%(resp_key)</pre>

Here we send the key we received in request header as an argument and we use _hashlib_ to calculate SHA1 and _base64_ to encode it.

## 3. Decoding an Incoming Frame

Now that the connection is established, client/the other side can send us data. Now the data won&#8217;t be in plain-text. It is using a special frame format defined in protocol. A frame looks something like this:

<pre class="lang:default decode:true ">Frame format:  
​​
      0                   1                   2                   3
      0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
     +-+-+-+-+-------+-+-------------+-------------------------------+
     |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
     |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
     |N|V|V|V|       |S|             |   (if payload len==126/127)   |
     | |1|2|3|       |K|             |                               |
     +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
     |     Extended payload length continued, if payload len == 127  |
     + - - - - - - - - - - - - - - - +-------------------------------+
     |                               |Masking-key, if MASK set to 1  |
     +-------------------------------+-------------------------------+
     | Masking-key (continued)       |          Payload Data         |
     +-------------------------------- - - - - - - - - - - - - - - - +
     :                     Payload Data continued ...                :
     + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
     |                     Payload Data continued ...                |
     +---------------------------------------------------------------+
</pre>

I will discuss the fields which we will be using here. Please read that <a href="//developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers" target="_blank" rel="noopener">Mozilla article</a> I mentioned before to get more idea around this.

The FIN bit suggests that this is the last frame.We will assume/set it to 1 as we will be sending small amount of data only. Next 3 bits are reserved. The opcode suggests what kind of operation is this. 0x0 for continuation, 0x1 for text, 0x2 for binary etc. We will be using 0x1. The MASK bit we will discuss shortly.

Payload length is somewhat tricky. I am quoting the Mozilla Article here:

###### Decoding Payload Length {#Decoding_Payload_Length}

To read the payload data, you must know when to stop reading. That&#8217;s why the payload length is important to know. Unfortunately, this is somewhat complicated. To read it, follow these steps:

  1. Read bits 9-15 (inclusive) and interpret that as an unsigned integer. If it&#8217;s 125 or less, then that&#8217;s the length; you&#8217;re **done**. If it&#8217;s 126, go to step 2. If it&#8217;s 127, go to step 3.
  2. Read the next 16 bits and interpret those as an unsigned integer. You&#8217;re **done**.
  3. Read the next 64 bits and interpret those as an unsigned integer (The most significant bit MUST be 0). You&#8217;re **done**.

We are assuming it to be <125. That will leave byte 2 to 6 as masking bytes. If you are using web browser console as a client (which we will) it will set the mask bit to 1. Hence the payload will be masked. You can use XOR operation with the mask to get the original data back. The code to help you understand it better:

<pre class="theme:monokai nums:true lang:python decode:true ">def decode_frame(self,frame):
        opcode_and_fin = frame[0]

        # assuming it's masked, hence removing the mask bit(MSB) to get len. also assuming len is &lt;125
        payload_len = frame[1] - 128

        mask = frame [2:6]
        encrypted_payload = frame [6: 6+payload_len]

        payload = bytearray([ encrypted_payload[i] ^ mask[i%4] for i in range(payload_len)])

        return payload</pre>

We sent frame as a bytearray as you noticed in the first function (\`handle\`). The operations are quite self explanatory. To get the payload length, we are subtracting 128 (the mask bit) from byte 1. (look at the frame structure and you&#8217;ll have a clear picture) Encrypted payload XORed with the mask will give us the decrypted payload.

## 4. Sending Frames

While sending frames, we will do nothing fancy. We will not set MASK bit and we will send data unmasked i.e. in plain text. So that will leave us with filling the FIN bit, the OPCODE, the LEN and finally the payload. Have a look:

<pre class="theme:monokai nums:true lang:python decode:true ">def send_frame(self, payload):
        # setting fin to 1 and opcpde to 0x1
        frame = [129]
        # adding len. no masking hence not doing +128
        frame += [len(payload)]
        # adding payload
        frame_to_send = bytearray(frame) + payload

        self.request.sendall(frame_to_send)</pre>

Yep, that easy. So that wraps up our server. Now let&#8217;s have a look at how can we make it on roll. Fire up a web browser console and try these out:

<img class="aligncenter size-full wp-image-190" src="//superuser.blog/wp-content/uploads/2017/08/websocket_js.png" alt="" width="619" height="361" srcset="https://superuser.blog/wp-content/uploads/2017/08/websocket_js.png 619w, https://superuser.blog/wp-content/uploads/2017/08/websocket_js-300x175.png 300w" sizes="(max-width: 619px) 100vw, 619px" />

We asked our browser side websocket to print whatever it receives in console. And our server is sending back whatever the client sends. So there you are. The mighty WebSockets with <80 lines of python code 😀 Check it out on <a href="//github.com/sanketplus/PyWSocket" target="_blank" rel="noopener">GitHub</a>.

Some interesting links which helped me get here:

  1. <//www.fullstackpython.com/websockets.html>
  2. <//blog.pusher.com/websockets-from-scratch/>