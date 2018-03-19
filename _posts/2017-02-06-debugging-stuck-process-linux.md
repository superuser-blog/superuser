---
id: 65
title: Debugging Stuck Process in Linux
date: 2017-02-06T00:22:05+00:00
author: sanket
layout: post
guid: http://superuser.blog/?p=65
permalink: /debugging-stuck-process-linux/
medium_post:
  - 'O:11:"Medium_Post":11:{s:16:"author_image_url";s:65:"https://cdn-images-1.medium.com/fit/c/200/200/0*c0aBOUXEnVa4XfJd.";s:10:"author_url";s:30:"https://medium.com/@sanketplus";s:11:"byline_name";N;s:12:"byline_email";N;s:10:"cross_link";s:2:"no";s:2:"id";s:12:"61ea828ce267";s:21:"follower_notification";s:3:"yes";s:7:"license";s:19:"all-rights-reserved";s:14:"publication_id";s:2:"-1";s:6:"status";s:6:"public";s:3:"url";s:76:"https://medium.com/@sanketplus/debugging-stuck-process-in-linux-61ea828ce267";}'
image: /wp-content/uploads/2017/02/stuck_proc-825x500.jpg
categories:
  - Linux
tags:
  - debugging
  - linux
  - process
---
The other day I faced a problem with monitoring setup and I found that the WebUI is not responding. I SSHed into server and checked if process is running. It was. Checked if port was open. It was. So as it happened, the process was running and listening on port but it was stuck somewhere and it was not accepting connection. So there it was, a running stuck process.<!--more-->

Now I could simply have restarted the stuck process but that wouldn’t tell me what actually happened and where it was stuck.

This is not step by step guide but it provides an insight on how various tools commands can be used. So here’s what I did to investigate what was going on:

#### Find The Stuck Process:

You can use the following to get the process ID

[shell padlinenumbers=&#8221;false&#8221;]$ ps auxww | grep[/shell]

Okay so we have PID now. Let’s look into what the stuck process is doing right now. \`strace\` comes to rescue here and it showed something like

[shell padlinenumbers=&#8221;false&#8221;]
  
$ strace -p recvfrom(11, )
  
[/shell]

<img class="wp-image-136 size-full aligncenter" src="https://superuser.blog/wp-content/uploads/2017/02/strace.jpg" alt="strace" width="794" height="298" srcset="https://superuser.blog/wp-content/uploads/2017/02/strace.jpg 794w, https://superuser.blog/wp-content/uploads/2017/02/strace-300x113.jpg 300w, https://superuser.blog/wp-content/uploads/2017/02/strace-768x288.jpg 768w" sizes="(max-width: 794px) 100vw, 794px" />

If you google around for system call called \`recvfrom\` you will get something like:

> The recvfrom() and recvmsg() calls are used to receive messages from a socket, and may be used to receive data on a socket whether or not it is connection-oriented.

So we now know process is trying to receive data and stuck there itself, reading further into that man entry it says the first argument is socketfd (which was 11 in my case) That can help us know more on that socket which is stuck.

So to dig more in that socketfd we use /proc filesystem.

[shell padlinenumbers=&#8221;false&#8221;]$ ls -l /proc//fd

lrwx&#8212;&#8212; 1 sanket sanket 64 Feb 5 23:00 0 ->; /dev/pts/19
  
lrwx&#8212;&#8212; 1 sanket sanket 64 Feb 5 23:00 1 ->; /dev/pts/19
  
lrwx&#8212;&#8212; 1 sanket sanket 64 Feb 5 22:59 2 ->; /dev/pts/19
  
&#8230;
  
lrwx&#8212;&#8212; 1 sanket sanket 64 Feb 5 23:00 11 -> socket:\[102286\]\[/shell\]

Note how FD 11 is a socket fd. Note the number (102286). Now let’s dig more into that socket. \`lsof\` can help us here.

[shell padlinenumbers=&#8221;false&#8221;]$ lsof -i -a -p <pid> | grep 102286

COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
  
telnet 14480 sanket 3u IPv4 102286 0t0 TCP 192.168.1.2:59254 ->; maa03s21-in-f78.1e100.net:http (ESTABLISHED)[/shell]

This will finally tell us where the socket is connected to. It can be your database server. So there. You know you have to fix your database.

#### Doing something with stuck process:

I went a step ahead to unfreeze the process. Getting it back on without restarting it. So here comes a debugger in picture. Fire up gdb and force process to give up on that FD. ie call the close method on the stuck fd.

[shell padlinenumbers=&#8221;false&#8221;]$ gdb -p
  
call close(11)[/shell]

This should close the FD and process should move on.

Happy Debugging ?