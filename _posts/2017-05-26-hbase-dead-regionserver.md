---
id: 175
title: 'HBase YouAreDeadException: Dead RegionServer due to GC Pause'
date: 2017-05-26T17:24:15+00:00
author: sanket
layout: post
guid: https://superuser.blog/?p=175
permalink: /hbase-dead-regionserver/
image: /wp-content/uploads/2017/05/hbase_rs_status-811x510.png
categories:
  - HBase
  - HDP
tags:
  - Hbase
  - hdp
---
So the CDH Cluster was replaced by HDP Cluster and everything was going smooth for time being. Until the time when I started getting a dead RegionServer. Frequently. So a deep dive was needed to dig out what indeed was happening. And it turned out to be a long dive.<!--more-->

The following was the logline:

<pre class="lang:default decode:true">2017-05-23 06:59:22,173 FATAL [regionserver/&lt;hostname&gt;/10.10.205.55:16020] regionserver.HRegionServer: ABORTING region server &lt;hostname&gt;,16020,1493962926376: org.apache.hadoop.hbase.YouAreDeadException: Server REPORT rejected; currently processing&lt;hostname&gt;,16020,1493962926376 as dead server</pre>

This alone did not tell much. Further scrolling up in logs, I found this:

<pre class="lang:default decode:true">2017-05-24 04:55:34,712 INFO  [RS_OPEN_REGION-hdps01:16020-2-SendThread(&lt;zkhost&gt;:2181)] zookeeper.ClientCnxn: Client session timed out, have not heard from server in 31947ms for sessionid 0x15be7e4d09e1c4c, closing socket connection and attempting reconnect
2017-05-24 04:55:34,713 WARN  [regionserver/&lt;rs-host&gt;/10.10.205.55:16020] util.Sleeper: We slept 16865ms instead of 3000ms, this is likely due to a long garbage collecting pause and it's usually bad, see //hbase.apache.org/book.html#trouble.rs.runtime.zkexpired
2017-05-24 04:55:34,718 WARN  [JvmPauseMonitor] util.JvmPauseMonitor: Detected pause in JVM or host machine (eg GC): pause of approximately 15598ms
1434184 No GCs detected
</pre>

So according to these lines, something paused the JVM and it was not able to send hart-beat to zookeeper. The node there in zookeeper expired and the HBase Master marked it as dead regionserver. They also have given a <a href="//hbase.apache.org/book.html#trouble.rs.runtime.zkexpired" target="_blank" rel="noopener noreferrer">link</a> in log line which points out to a solution. Go ahead and have a look at it. So basically it says these could be the reasons behind:

  * Not enough RAM while running large imports.
  * Swap partition enabled
  * Something hogging the CPU
  * Low ZooKeeper timeout.

So first three options were ruled out for my dead regionserver. What I had to do was increase zookeeper timeout. BUT! I already had set the zookeeper session timeout (zookeeper.session.timeout) to 30min. And dead regionserver appeared only after 30sec or so.

As suggested in link above, I tried to set tickTime value (hbase.zookeeper.property.tickTime)  to 6s. The calculation is something like this:

Min timeout = 2 * tickTime

Max timeout = 20 * tickTime

So here it must be 120 sec as a zookeeper timeout. But still timeouts were occurring about 40s after.I pulled up GC longs, there was no such long GC. So I went in and checked zookeeper config. Zookeeper also had tickTime value. Confusing it was and now I was not sure which tickTime was be applicable to the dead regionserver. There were two different values of ticktime. One in ZK and one in HBase.

<img class="size-full wp-image-177 aligncenter" src="//superuser.blog/wp-content/uploads/2017/05/zookeeper_config.png" alt="" width="443" height="272" srcset="https://superuser.blog/wp-content/uploads/2017/05/zookeeper_config.png 443w, https://superuser.blog/wp-content/uploads/2017/05/zookeeper_config-300x184.png 300w" sizes="(max-width: 443px) 100vw, 443px" />

As confusing as it was, I went to check zookeeper logs. There I found the cause; the sessions negotiated with zookeeper from dead regionserver were of 40s (20*2s of original ticktime) So clearly the timeout and ticktime we set in regionserver on hbase side were not taking effect. Strange! Roaming around in HDP Server&#8217;s UI, I found this glorious piece of help-text. (Could not take a screenshot as that pop-up appeared only when I hover 😛 )

<img class="alignnone size-full wp-image-178" src="//superuser.blog/wp-content/uploads/2017/05/IMG_20170524_150126.jpeg" alt="" width="720" height="960" srcset="https://superuser.blog/wp-content/uploads/2017/05/IMG_20170524_150126.jpeg 720w, https://superuser.blog/wp-content/uploads/2017/05/IMG_20170524_150126-225x300.jpeg 225w" sizes="(max-width: 720px) 100vw, 720px" />

Now it was evident that if you are using different set of zookeeper quorum, the value set in hbase wont affect! **What? Why do you not print this in bold on some heading?? **So this was the cause and the ticktime was needed to set in zookeeper (as done already: see the screenshot ^^). Many times GC cause long delays. Apart from increasing timeout, you may also want to <a href="//www.oracle.com/technetwork/java/javase/gc-tuning-6-140523.html" target="_blank" rel="noopener noreferrer">tune your GC</a>. Also you may want to look into <a href="//superuser.blog/tuning-hbase/" target="_blank" rel="noopener noreferrer">Tuning Your HBase</a> or maybe <a href="//superuser.blog/hbase-benchmarking/" target="_blank" rel="noopener noreferrer">benchmark</a> it.

After increasing tickTime in zookeeper, it&#8217;s running fine and it&#8217;s been two days. Let&#8217;s hope it just stays that way 🙂