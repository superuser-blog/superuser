---
id: 95
title: Stuff You Can Do While Tuning HBase
date: 2017-04-09T23:42:31+00:00
author: sanket
layout: single
guid: http://superuser.blog/?p=95
permalink: /tuning-hbase/
header:
  overlay_image: /wp-content/uploads/2017/04/hbase-config.jpg
  overlay_filter: rgba(10, 10, 10, 0.75)
categories:
  - HBase
tags:
  - Hbase
---
So you are setting up HBase! Congratulations! 

When it comes to tuning HBase there are so many things you can do. And most of the things will be dependent upon type of data you will be storing and it's access patterns. So I will be saying this a lot: 'value of this parameter depends upon your workload'. Here I will try to enlist some of the variables that you can tweak while tuning hbase. This list is not at all exhaustive.

<img class="aligncenter" src="//hbase.apache.org/images/hbase_logo_with_orca_large.png" alt="hbase-logo" width="470" height="120" />

### 1. HBase RegionServer Maximum Memory (hbase\_regionserver\_heapsize)

First thing's first. If you have heavy load and/or available capacity in terms of RAM, you may want to increase this number. This means more space in memory to cache blocks for read and write. That simple.

### 2. Percent of RegionServer Allocated to Read Buffers (hfile.block.cache.size)

Now this one depends on your type of workload. If you have less writes compared to reads then you would want to set this higher (>40%) This will allocate more heap to cache blocks used for  reading.

### 3. Percent of RegionServer Allocated to Write Buffers (hbase.regionserver.global.memstore.size)

Same as above, depends on your workload. If you have heavy writes you may want to set this higher. The total of read and write buffers should be around 80%. If you are not sure, you may want to leave these values 40-40.

### 4. Memstore Flush Size (hbase.hregion.memstore.flush.size)

This value defines, after what size, for a particular column family, memstore should be flushed to disk. If you have heavy writes with large row size you may want to increase this size from 128MB to 256MB. This will reduce the frequency of memstore flushes and hence increase the performance. Recommended value for this parameter is the value of block size of HDFS you have set. (64MB or 128MB usually)

### 5. Number of Handlers per RegionServer (hbase.regionserver.handler.count)

This is number of handlers available per regionserver to serve request. Default might be around 30. If you are seeing long size for calls in queue then it's time to increase number of handlers. Increasing this very high will also affect performance. Try to find a sweet spot.

### 6. Maximum Region File Size (hbase.hregion.max.filesize)

This defines a size after which a region will be split into two regions. You want to tune this size because very small size will create more number of regions and it is recommended to maintain no more than 200 regions per regionserver. So you should take in account number of regionserver and size of your dataset while setting this parameter. You also want to look at <a href="//hortonworks.com/blog/apache-hbase-region-splitting-and-merging/" target="_blank" rel="noopener noreferrer">split policies</a> in hbase and want to choose one which suits your purpose.

### 7. Timeouts (Zookeeper Session, RPC, Phoenix Query )

The values for these defaults are set very low and you want to set this values in magnitude of minutes (10 minutes around) to avoid facing kinds of timeouts.

### 8. RegionServer Lease Period (hbase.regionserver.lease.period)

For some kinds of requests (queries) which takes more time to get processed, you may face Scanner Timeouts or Scanner not Found Errors. And to avert this you should increase this value.

![hbase_conf]({{"/wp-content/uploads/2017/04/hbase-tune-768x295.png"}})

### 9. Setting Off-Peak Hours (base.offpeak.[end|start].hour)

HBase also allow to schedule major compaction during certain time period. HBase will try to run major compaction during this time. You should set these values when load on your cluster is relatively low (night time maybe).

### 10. Compression and Datablock Encoding

This is one more functionality HBase provides for which there is no reason not to use it. <a href="//hadoop-hbase.blogspot.in/2016/02/hbase-compression-vs-blockencoding_17.html" target="_blank" rel="noopener noreferrer">This article</a> provides more insights into this. While this may impact the performance a little but it will save you lots of disk space.

As I said, this list is not exhaustive and there is a lot you can do while tuning hbase. Take a look at <a href="//hbase.apache.org/0.94/book/performance.html" target="_blank" rel="noopener noreferrer">this</a> chapter from HBase book. You also can perform <a href="//superuser.blog/hbase-benchmarking/" target="_blank" rel="noopener noreferrer">benchmarking</a> after tuning parameters so that you know how that particular change affected the performance.

Happy Tuning 😀