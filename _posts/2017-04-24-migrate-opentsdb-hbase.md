---
id: 97
title: Migrating OpenTSDB to Another HBase Cluster
date: 2017-04-24T22:52:16+00:00
author: sanket
layout: single
guid: http://superuser.blog/?p=97
permalink: /migrate-opentsdb-hbase/
medium_post:
  - 'O:11:"Medium_Post":11:{s:16:"author_image_url";N;s:10:"author_url";N;s:11:"byline_name";N;s:12:"byline_email";N;s:10:"cross_link";s:2:"no";s:2:"id";N;s:21:"follower_notification";s:3:"yes";s:7:"license";s:19:"all-rights-reserved";s:14:"publication_id";s:2:"-1";s:6:"status";s:6:"public";s:3:"url";N;}'
image: /wp-content/uploads/2017/04/tsdb-hbase.jpg
categories:
  - HBase
tags:
  - Hbase
  - metrics
  - opentsdb
---
As a part of migration from CDH cluster to HDP cluster, we also had to migrate OpenTSDB which was running on CDH cluster. There are many methods to copy/transfer data between clusters and what we used here was <a href="//hbase.apache.org/0.94/book/ops.snapshots.html" target="_blank" rel="noopener noreferrer">ExportSnapshot</a>.

<!--more-->

<img class="aligncenter wp-image-122 size-medium" src="//superuser.blog/wp-content/uploads/2017/04/opentsdb-300x62.png" alt="opentsdb logo" width="300" height="62" srcset="https://superuser.blog/wp-content/uploads/2017/04/opentsdb-300x62.png 300w, https://superuser.blog/wp-content/uploads/2017/04/opentsdb.png 364w" sizes="(max-width: 300px) 100vw, 300px" />

So these are the steps roughly:

  1. Stop TSDs
  2. Take snapshot(s)
  3. Transfer snapshots
  4. Restore snapshots
  5. Modify and start TSDs

Steps 1 and 5 are self understood. We will look at how to take,transfer and restore snapshots.

## Snapshot OpenTSDB Tables:

Fire up hbase shell and take snapshot of opentsdb tables. You can choose any name for snapshot to be created.

<pre class="lang:default decode:true ">hbase&gt; snapshot 'tsdb', 'tsdb-&lt;date&gt;'
hbase&gt; snapshot 'tsdb-uid', 'tsdb-uid-&lt;date&gt;'
hbase&gt; snapshot 'tsdb-meta', 'tsdb-meta-&lt;date&gt;'
hbase&gt; snapshot 'tsdb-tree', 'tsdb-tree-&lt;date&gt;'</pre>

## Transfer OpenTSDB Tables to New HBase Cluster

Here we will use ExportSnapshot utility provided by HBase. It takes snapshot name, destination cluster address as primary arguments. As it will run as a map-reduce job, you can also specify number of mapper to use.

<pre class="lang:default decode:true">$ sudo su - hdfs
export HADOOP_MAPRED_HOME=/usr/lib/hadoop-0.20-mapreduce/
export HADOOP_HOME=/usr/lib/hadoop
export HBASE_HOME=/usr/lib/hbase
$ hbase org.apache.hadoop.hbase.snapshot.ExportSnapshot -snapshot tsdb-&lt;date&gt; -copy-to hdfs://&lt;dest-hdfs&gt;:8020/hbase -mappers 4</pre>

Repeat last line for other three opentsdb tables also. This will copy all the snapshot meta data and related HFiles to destination cluster. Make sure you set correct hbase path in destination cluster.

Once done you can check for copied snapshot files in destination cluster. You also want to check owner of the copied files so that HBase can access it properly. In case of HDP cluster it needed to get changed to _hbase:hdfs _and here is how to do it.

<pre class="lang:default decode:true ">$ sudo su - hdfs
hadoop fs -chown -R hbase:hdfs /apps/hbase/data/archive
hadoop fs -chown -R hbase:hdfs /apps/hbase/data/.hbase-snapshot/tsdb-&lt;date&gt;</pre>

You may want to repeat last line for all four opentsdb tables snapshots.

## Restoring OpenTSDB Table Snapshots

Now to list and restore snapshots on destination cluster, you can do the following in HBase shell. The first command should list all the snapshot and that should include all four opentsdb table snapshots we just transferred. The second line will restore a snapshot into a table.

<pre class="lang:default decode:true ">hbase&gt; list_snapshots
hbase&gt; restore_snapshot 'tsdb-&lt;date&gt;'</pre>

If you have already created tables in destination cluster then you may want to disable table first and then restore snapshot and then enable it. Repeat the second line for all four tsdb tables.

Once all tables are restored and you have verified it, you can change HBase address in TSDs and start them.