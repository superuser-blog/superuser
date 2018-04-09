---
id: 95
title: Stuff You Can Do While Tuning HBase
date: 2017-04-09T23:42:31+00:00
author: sanket
layout: single
guid: http://superuser.blog/?p=95
permalink: /tuning-hbase/
medium_post:
  - 'O:11:"Medium_Post":11:{s:16:"author_image_url";N;s:10:"author_url";N;s:11:"byline_name";N;s:12:"byline_email";N;s:10:"cross_link";s:2:"no";s:2:"id";N;s:21:"follower_notification";s:3:"yes";s:7:"license";s:19:"all-rights-reserved";s:14:"publication_id";s:2:"-1";s:6:"status";s:6:"public";s:3:"url";N;}'
image: /wp-content/uploads/2017/04/hbase-config.jpg
categories:
  - HBase
tags:
  - Hbase
---
So you are setting up HBase! Congratulations! When it comes to tuning HBase there are so many things you can do. And most of the things will be dependent upon type of data you will be storing and it&#8217;s access patterns. So I will be saying this a lot: &#8216;value of this parameter depends upon your workload&#8217;. Here I will try to enlist some of the variables that you can tweak while tuning hbase. This list is not at all exhaustive.<!--more-->

<img class="aligncenter" src="//hbase.apache.org/images/hbase_logo_with_orca_large.png" alt="hbase-logo" width="470" height="120" />

#### 1. HBase RegionServer Maximum Memory (hbase\_regionserver\_heapsize)

First thing&#8217;s first. If you have heavy load and/or available capacity in terms of RAM, you may want to increase this number. This means more space in memory to cache blocks for read and write. That simple.

####  2. % of RegionServer Allocated to Read Buffers (hfile.block.cache.size)

Now this one depends on your type of workload. If you have less writes compared to reads then you would want to set this higher (>40%) This will allocate more heap to cache blocks used for  reading.

####  3. % of RegionServer Allocated to Write Buffers (hbase.regionserver.global.memstore.size)

Same as above, depends on your workload. If you have heavy writes you may want to set this higher. The total of read and write buffers should be around 80%. If you are not sure, you may want to leave these values 40-40.

####  4. Memstore Flush Size (hbase.hregion.memstore.flush.size)

This value defines, after what size, for a particular column family, memstore should be flushed to disk. If you have heavy writes with large row size you may want to increase this size from 128MB to 256MB. This will reduce the frequency of memstore flushes and hence increase the performance. Recommended value for this parameter is the value of block size of HDFS you have set. (64MB or 128MB usually)

####  5. Number of Handlers per RegionServer (hbase.regionserver.handler.count)

This is number of handlers available per regionserver to serve request. Default might be around 30. If you are seeing long size for calls in queue then it&#8217;s time to increase number of handlers. Increasing this very high will also affect performance. Try to find a sweet spot.

####  6. Maximum Region File Size (hbase.hregion.max.filesize)

This defines a size after which a region will be split into two regions. You want to tune this size because very small size will create more number of regions and it is recommended to maintain no more than 200 regions per regionserver. So you should take in account number of regionserver and size of your dataset while setting this parameter. You also want to look at <a href="//hortonworks.com/blog/apache-hbase-region-splitting-and-merging/" target="_blank" rel="noopener noreferrer">split policies</a> in hbase and want to choose one which suits your purpose.

####  7. Timeouts (Zookeeper Session, RPC, Phoenix Query )

The values for these defaults are set very low and you want to set this values in magnitude of minutes (10 minutes around) to avoid facing kinds of timeouts.

####  8. RegionServer Lease Period (<span class="control-group control-label-span" data-bindattr-3036="3036"><label class="control-label"><span id="ember89162" class="ember-view">hbase.<wbr />regionserver.<wbr />lease.<wbr />period</span></label></span>)

For some kinds of requests (queries) which takes more time to get processed, you may face Scanner Timeouts or Scanner not Found Errors. And to avert this you should increase this value.

#### <img class="aligncenter wp-image-144 size-full" src="https://superuser.blog/wp-content/uploads/2017/04/hbase-tune.png" alt="" width="989" height="380" srcset="https://superuser.blog/wp-content/uploads/2017/04/hbase-tune.png 989w, https://superuser.blog/wp-content/uploads/2017/04/hbase-tune-300x115.png 300w, https://superuser.blog/wp-content/uploads/2017/04/hbase-tune-768x295.png 768w" sizes="(max-width: 989px) 100vw, 989px" />

####  9. Setting Off-Peak Hours (<span class="control-group control-label-span" data-bindattr-3020="3020"><label class="control-label"><span id="ember88986" class="ember-view">hbase.<wbr />offpeak.[end|start].<wbr />hour</span></label></span>)

HBase also allow to schedule major compaction during certain time period. HBase will try to run major compaction during this time. You should set these values when load on your cluster is relatively low (night time maybe).

####  10. Compression and Datablock Encoding

This is one more functionality HBase provides for which there is no reason not to use it. <a href="//hadoop-hbase.blogspot.in/2016/02/hbase-compression-vs-blockencoding_17.html" target="_blank" rel="noopener noreferrer">This article</a> provides more insights into this. While this may impact the performance a little but it will save you lots of disk space.

As I said, this list is not exhaustive and there is a lot you can do while tuning hbase. Take a look at <a href="//hbase.apache.org/0.94/book/performance.html" target="_blank" rel="noopener noreferrer">this</a> chapter from HBase book. You also can perform <a href="//superuser.blog/hbase-benchmarking/" target="_blank" rel="noopener noreferrer">benchmarking</a> after tuning parameters so that you know how that particular change affected the performance.

Happy Tuning 😀