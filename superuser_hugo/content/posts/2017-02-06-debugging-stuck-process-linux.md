---
id: 65
title: Debugging Stuck Process in Linux
date: 2017-02-06T00:22:05+00:00
author: Sanket
layout: single
guid: http://superuser.blog/?p=65
slug: /debugging-stuck-process-linux/
cover:
  image: /wp-content/uploads/2017/02/stuck_proc-825x500.jpg 
header:
  overlay_image: /wp-content/uploads/2017/02/stuck_proc-825x500.jpg
  overlay_filter: rgba(10, 10, 10, 0.75)
  show_overlay_excerpt: false
  #overlay_color: "#333"
categories:
  - Linux
tags:
  - debugging
  - linux
  - process
---
The other day I faced a problem with monitoring setup and I found that the WebUI is not responding. I SSHed into server and checked if process is running. It was. Checked if port was open. It was. So as it happened, the process was running and listening on port but it was stuck somewhere and it was not accepting connection. So there it was, a running stuck process.

Now I could simply have restarted the stuck process but that wouldn’t tell me what actually happened and where it was stuck.

This is not step by step guide but it provides an insight on how various tools commands can be used. So here’s what I did to investigate what was going on:

### Find The Stuck Process:

You can use the following to get the process ID

```shell
$ ps auxww | grep
```

Okay so we have PID now. Let’s look into what the stuck process is doing right now. \`strace\` comes to rescue here and it showed something like

```shell  
$ strace -p <pid> 
recvfrom(11, )
```

![strace_output](/wp-content/uploads/2017/02/strace-768x288.jpg)


If you google around for system call called \`recvfrom\` you will get something like:

> The recvfrom() and recvmsg() calls are used to receive messages from a socket, and may be used to receive data on a socket whether or not it is connection-oriented.

So we now know process is trying to receive data and stuck there itself, reading further into that man entry it says the first argument is socketfd (which was 11 in my case) That can help us know more on that socket which is stuck.

So to dig more in that socketfd we use /proc filesystem.

```shell
ls -l /proc//fd
lrwx-- 1 sanket sanket 64 Feb 5 23:00 0 ->; /dev/pts/19
lrwx-- 1 sanket sanket 64 Feb 5 23:00 1 ->; /dev/pts/19
lrwx-- 1 sanket sanket 64 Feb 5 22:59 2 ->; /dev/pts/19
...
lrwx-- 1 sanket sanket 64 Feb 5 23:00 11 -> socket:[102286]
```

Note how FD 11 is a socket fd. Note the number (102286). Now let’s dig more into that socket. \`lsof\` can help us here.

```shell
$ lsof -i -a -p <pid> | grep 102286

COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
  
telnet 14480 sanket 3u IPv4 102286 0t0 TCP 192.168.1.2:59254 ->; maa03s21-in-f78.1e100.net:http (ESTABLISHED)
```

This will finally tell us where the socket is connected to. It can be your database server. So there. You know you have to fix your database.

### Doing something with stuck process:

I went a step ahead to unfreeze the process. Getting it back on without restarting it. So here comes a debugger in picture. Fire up gdb and force process to give up on that FD. ie call the close method on the stuck fd.

```
$ gdb -p <pid>
call close(11)
```
This should close the FD and process should move on.

Happy Debugging ?
