---
id: 215
title: 'TCP Fast Open: In Action with Python'
date: 2017-11-08T20:14:58+00:00
author: Sanket
layout: single
guid: https://superuser.blog/?p=215
slug: /tcp-fast-open-python/
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
tags:
  - Networking
  - python
---
Recently I was revisiting concepts of TCP protocol and that reminded me that there was also a thing called TCP Fast Open. Digging further on the same revealed a lot. We will briefly discuss how this enhancement works. What are the limitations. And later we will do the hands on and see how the TCP Fast Open drastically reduces the load time.

## What is TCP Fast Open?

TCP Fast Open is an optimization over TCP which eliminates the need to wait for 3 way handshake before application can send data over it.

Here's roughly how it happens: First time 3 way handshake happens, server will generate a cookie and pass it to the client. Next time, in first step on 3 way handshake (SYN), client will send cookie+data along with SYN. If cookie stands valid, data is delivered to application, then application can process data and reply. Here we do not wait for 3 way handshake to complete next time.

Here is the traditional 3 way handshake. 

![websocket_js](/wp-content/uploads/2017/11/3whs.png)


So here, if round trip time is 100ms, application will have to wait at least 200ms before it can send any data to server.

If client had set TCP Fast Option set (we will see server and client code soon), server will create a cookie and send back the cookie to client, as shown in the following diagram.


![websocket_js](/wp-content/uploads/2017/11/foc_creation.png)


Now from next time onward, client will send cookie in SYN and if it stands valid, server can immediately send reply back without waiting for handshake to complete as shown below.

![websocket_js](/wp-content/uploads/2017/11/foc_use.png)

We can see that 3 way handshake still happens but application does not need to wait for it as data is delivered to it immediately if valid cookie is present.

This can potentially halve the latency depending upon the application.

## Problems:

  * Not all the devices support it. (Although they will at some point)
  * Some middleware (firewall,NAT) can cause problems as this is relatively new changes to an old protocol.
  * If data that client need to send with SYN is large (> ~1400 bytes), TCP Fast open does not optimize anything.
  * Requests may get duplicated. (The first SYN packet) So applications need to handle that.

## In Action:

We will build simple echo server with TCP Fast Open enabled and see the wireshark traces along with request time to see how fast does it get with TFO enabled.

Echo server:

```python
import socket

def listen():
    connection = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    connection.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    connection.setsockopt(socket.SOL_TCP, 23, 5)
    connection.bind(('0.0.0.0', 8000))
    connection.listen(10)
    while True:
        current_connection, address = connection.accept()
        while True:
            data = current_connection.recv(2048)

            if data:
                current_connection.send(data)
                print data
	    current_connection.close()
	    break


if __name__ == "__main__":
    try:
        listen()
    except KeyboardInterrupt:
        pass
```

The only new/different we do here is the line \`connection.setsockopt(socket.SOL_TCP, 23, 5)\` here 23 is the protocol number of **TCP_FASTOPEN **it is not defined in socket module if python2 so writing manually here and 5 is the queue length for number of TFO request which are yet to complete 3 way handshake.

Echo client:

```python
import socket

addr = ("ssh.movienight.gq", 8000)
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.setsockopt(socket.SOL_TCP, 23, 5)

s.sendto("hello!",536870912,addr)

print s.recv(1000)
```

Here we used \`sendto\` to send SYN packet along with data. second argument is protocol number for MSG_FASTOPEN. Again because of python2. Setting this will send a TFO request to server.

To enable TFO support in linux:

```bash
echo 3 > /proc/sys/net/ipv4/tcp_fastopen
```

number 3 will add support for both TFO client and server.

Let's look at network traces to see TFO working in action:

![websocket_js](/wp-content/uploads/2017/11/normal_3way-768x73.png)

This was trace for simple curl request to server. No TFO set. As we can see, first 3 way handshake happens [first 3 packets] then application (curl) sends HTTP request and after that it gets response.


![websocket_js](/wp-content/uploads/2017/11/tfo_curl-768x207.png)

Here with &#8211;tcp-fastopen option to curl, in the fist packet itself [46645] client will send request data. and it was immediately delivered to application (echo server). Also note that the three way handshake still happens.

Also see how cookie was sent with SYN packet[46645] itself.

![websocket_js](/wp-content/uploads/2017/11/cookie_tfo-768x213.png)

## How fast was it?

Let the results speak for themselves: [ okay, 270ms (TFO) vs 690ms (regular TCP) ]

```shell
sanket@iamgroot /home/sanket/workspace/z_trivial/knetstat (0)  (master)> time curl ssh.movienight.gq:8000      19:59:12
GET / HTTP/1.1
Host: ssh.movienight.gq:8000
User-Agent: curl/7.56.1
Accept: */*

0.00user 0.00system 0:00.69elapsed 1%CPU (0avgtext+0avgdata 8860maxresident)k
0inputs+0outputs (0major+492minor)pagefaults 0swaps



sanket@iamgroot /home/sanket/workspace/z_trivial/knetstat (0)  (master)> 
time curl ssh.movienight.gq:8000 --tcp-fastopen
GET / HTTP/1.1
Host: ssh.movienight.gq:8000
User-Agent: curl/7.56.1
Accept: */*

0.00user 0.00system 0:00.27elapsed 1%CPU (0avgtext+0avgdata 8728maxresident)k
0inputs+0outputs (0major+494minor)pagefaults 0swaps
```


Of course I did not tell the fine details. Please refer:

[1] <a href="https://lwn.net/Articles/508865/" target="_blank" rel="noopener">https://lwn.net/Articles/508865/</a>

[2] <a href="https://bradleyf.id.au/nix/shaving-your-rtt-wth-tfo/" target="_blank" rel="noopener">https://bradleyf.id.au/nix/shaving-your-rtt-wth-tfo/</a>

If Websockets excites you, which is kinda long open TCP connection, speaking it's own language, why don't you look up to <a href="https://superuser.blog/websocket-server-python/" target="_blank" rel="noopener">this article</a>