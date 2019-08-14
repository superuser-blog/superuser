---
id: 190814
title: "Site Wide Memory Leak: An On-Call Story"
author: sanket
layout: single
guid: https://superuser.blog/?p=190814
permalink: /site-wide-memory-leak-on-call-story/
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
categories:
  - linux
---

This happened a while back, sometime in the year of 2017. I was on-call for the week and it was weekend. Usually things are quiet over the weekends but not that weekend. Pages started coming frequently affecting different hosts. The alert was titled 

# WARNING: Memory usage is more than 80%

And that was just not one or set of hosts. This started coming from random hosts from across the infrastructure. Be it a data host, an app host, some ops specific hosts. Pretty random. **Something was obviously wrong**

## Initial Symptoms and Observations:
 1. Alerts were triggered from random hosts
 2. Checking Grafana memory usage graphs clearly indicated increase in memory usage.<br>
This also included hosts like mail servers which had consistent memory usage for months and suddenly they too started using more memory
 3. The time when memory usage started going up across hosts was close enough. That means some change triggered this.

## Next Steps:
There were two obvious things from the initial look at the situation.
 1. *Something* is causing memory leak 
 2. *Some change* triggered this

This is how it went finding answers for above two questions

### What is using the memory?
The most interesting hosts were the mail servers I mentioned earlier. They had nothing significant running on them and yet memory usage touch a GB. Tried finding processes using higest amount of memory but they all were using nominal amount of memory.
```bash
sanket@tfs:~$ ps auxw --sort rss | tail
```
Even tried totaling RSS of all the processes running on that host but that amount was still very very less than total memory used by server
```bash
sanket@tfs:~$ ps auxw | awk 'BEGIN {sum=0} {sum +=$6} END {print sum/1024}'
```
So this still wasn't telling where exactly the memory is being used. Now what tells you comprehensive memory usage picture? `/proc/meminfo`
```bash
sanket@tfs:~$ cat /proc/meminfo
...
MemTotal:        3524440 kB
MemFree:          477176 kB
MemAvailable:    2270304 kB
...
Slab: 538216 kB
SReclaimable: 482496 kB
SUnreclaim: 55720 kB
...
```
So apparently, most of the *leaking* memory was listed under `Slab` section. Initially had no idea what does it mean but further searches on revealed that it's a cache for kernel's data structures. To see what specific data structures are taking that space
```bash
sanket@tfs:~$ sudo slabtop --once
...

  OBJS ACTIVE  USE OBJ SIZE  SLABS OBJ/SLAB CACHE SIZE NAME
 71883  49685   0%    0.19K   3423       21     313692K dentry
...
```
So something called `dentry` was eating all the memory. What is it? It is a directory entry which is cached. When you look up for a file or a directory, the operation goes iteratively scanning each component of path. For example, to get `/etc/passwd`, it has to first find dir `/` and list its contents, after finding `etc` in it, it has to list contents of `etc` and so on. When this lookup is finally done, kernel will cache it because above iterative resolution has to do disk reads which are expensive. (If you want to know more on this, checkout [talk I gave on filesystem](/lets-build-distributed-filesystem/))

Now something was filling up the cache. Wasn't sure what it was but having found what was using the memory, a fix was also found. Because it's a cache, it should be (moderately?) safe to drop it.
```bash
root@tfs:~# echo 3 > /proc/sys/vm/drop_caches
```

So this fixes the symptom at least. We did not need to restart the servers anymore to reclaim the memory.

### Who triggered this?
One of the symptom of the problem was that it was spread site wide. What else works site wide? The configuration management system. [Saltstack](https://www.saltstack.com/).

Going through git logs of salt repo, there was one commit that was correlating with increasing in memory usage.

What was the change? An API that each host contacts to (called from custom salt grain module if I remember correctly) was moved from HTTP to HTTPS. **But why would switching to HTTPS cause a memory leak?!?!**

## The Root Cause:
Running that API in a loop on a host with ample free memory reproduced the problem. Putting it under `strace` revealed that it's trying to access lot of non-existing files. Which also justifies the increase in dentry cache usage. 

Was not exactly sure why would it try to access those files but quick search on the internet landed me on StackExchange post [Unusually high dentry cache usage](https://serverfault.com/questions/561350/unusually-high-dentry-cache-usage) which revealed that it was due to [a bug in NSS](https://bugzilla.redhat.com/show_bug.cgi?format=multiple&id=1044666) (Network Security Services, library developed by Mozilla, used when we do SSL stuff)

The fix was to upgrade the library or temporarily [adjust cache pressure](https://www.kernel.org/doc/Documentation/sysctl/vm.txt). 

## Fin
Guess who learned something new that weekend! The feeling after solving the mystery is so satisfying :D

**Note:** The command executions shown above and its results are not from actual affected servers. The numbers are made up.