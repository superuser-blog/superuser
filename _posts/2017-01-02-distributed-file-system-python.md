---
id: 37
title: 'Simple Distributed File System in Python : PyDFS'
date: 2017-01-02T23:55:01+00:00
author: sanket
layout: single
guid: http://superuser.blog/?p=37
permalink: /distributed-file-system-python/
medium_post:
  - 'O:11:"Medium_Post":11:{s:16:"author_image_url";s:65:"https://cdn-images-1.medium.com/fit/c/200/200/0*c0aBOUXEnVa4XfJd.";s:10:"author_url";s:30:"https://medium.com/@sanketplus";s:11:"byline_name";N;s:12:"byline_email";N;s:10:"cross_link";s:2:"no";s:2:"id";s:12:"c7ebf021191f";s:21:"follower_notification";s:3:"yes";s:7:"license";s:19:"all-rights-reserved";s:14:"publication_id";s:2:"-1";s:6:"status";s:6:"public";s:3:"url";s:90:"https://medium.com/@sanketplus/simple-distributed-file-system-in-python-pydfs-c7ebf021191f";}'
image: /wp-content/uploads/2017/01/PyDFS-825x416.png
categories:
  - python
tags:
  - distributed file system
  - hadoop
  - HDFS
  - python
---
I was reading on HDFS (Hadoop&#8217;s distributed file system) and it&#8217;s internals. How does it store data. What is reading path. What is writing path. How does replication works. And to understand  it better my mentor suggested me to implement the same. And so I made [PyDFS](//github.com/sanketplus/PyDFS). (Screenshots at bottom of the post)<!--more-->

So the choice of my language was python of course as it has vast number of modules available and you can code faster. I tried to implement very basic distributed file system and the code is ~200 lines. Before I started coding, some decisions needed to be taken.

## Architecture:

Because it is a HDFS clone. It also has similar architecture. The naming for components are inspired from SaltStack. It has a _Master(NameNode)_ and a _Minion(DataNode)_. And a client to communicate with file system.

Master will store file system namespace: Files,blocks,file to block mapping,block to minion mapping.

Minion will just store the blocks. And upon request read or write operations on blocks.

For communication between components, I first thought of exposing HTTP API. So that every component will listen on a port and calls can be made on HTTP as implementing the same would have been fairly easy using [Flask](//flask.pocoo.org). But as mentioned in [HDFS architecture](//hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html), it uses custom RPC protocol for communication over TCP, I searched for something similar for Python and found [RPyC](//rpyc.readthedocs.io/en/latest/). RPyC is very simple and easy to use.

## How does this distributed file system work?

Because I was trying to clone HDFS, I tried to follow similar read and write patterns.

  * To write a file, master will allocate blocks and a minion on which it will be stored. Client will write it to one minion and that minion will pass data to next one.
  * For reading master will provide list of blocks and its location and client will read sequentially. If reading fails from one minion, it will try next minion.
  * File system persistence is implemented via pickling the object. When you give Ctrl+C to master, it will dump the matadata to a file and it will load the same when you fire master up.

## Implementation:

I have uploaded the code on GitHub under [sanketplus/PyDFS](//github.com/sanketplus/PyDFS). I made this during a weekend and I have not added comments but I think code is fairly understandable. Feel free to Star it or make a PR 🙂

Here&#8217;s couple of screenshots of PyDFS in action:

In first image we are putting a file into DFS (my public key) and the lines you see are the blocks of the file (I have set smaller block size here). In second image we are trying to get the image from DFS and it will print it on stdout.

<img class="wp-image-130 size-full alignright" src="https://superuser.blog/wp-content/uploads/2017/01/pydfs_put.png" alt="pydfs put operation" width="944" height="284" srcset="https://superuser.blog/wp-content/uploads/2017/01/pydfs_put.png 944w, https://superuser.blog/wp-content/uploads/2017/01/pydfs_put-300x90.png 300w, https://superuser.blog/wp-content/uploads/2017/01/pydfs_put-768x231.png 768w" sizes="(max-width: 944px) 100vw, 944px" />

<img class="wp-image-131 size-full alignright" src="https://superuser.blog/wp-content/uploads/2017/01/pydfs_get.png" alt="pydfs get operation" width="866" height="169" srcset="https://superuser.blog/wp-content/uploads/2017/01/pydfs_get.png 866w, https://superuser.blog/wp-content/uploads/2017/01/pydfs_get-300x59.png 300w, https://superuser.blog/wp-content/uploads/2017/01/pydfs_get-768x150.png 768w" sizes="(max-width: 866px) 100vw, 866px" />
