---
id: 87
title: HBase Benchmarking
date: 2017-03-05T22:28:23+00:00
author: sanket
layout: single
guid: http://superuser.blog/?p=87
permalink: /hbase-benchmarking/
header:
  overlay_image: /wp-content/uploads/2017/03/hbase-benchmarking-825x397.jpg
  overlay_filter: rgba(10, 10, 10, 0.70)
  show_overlay_excerpt: false
categories:
  - HBase
tags:
  - Hbase
---
Currently I am working with new setup of Apache HBase cluster to query data using <a href="//phoenix.apache.org/" target="_blank" rel="noopener noreferrer">Phoenix</a>  on top of <a href="//hortonworks.com/products/data-center/hdp/" target="_blank" rel="noopener noreferrer">HDP</a> Distribution. After setting up cluster, the values for heap, cache and timeouts were all defaults. Now I needed to know how good is the cluster in current shape and how can it be improved.
Now for the improvement part, understanding of  HBase internals is needed. How does a write work in HBase. What is the read path. What is the data access and data writing patterns. By analyzing these aspects, you vary parameters. But after varying, one needs to see the effect of variance right? And thus you need something to measure performance and benchmark the cluster.

I found two tools for this purpose:

## PerformanceEvaluation

This comes built-in with the HBase. It has various parameters to run different kinds of workloads. So first we write data. I am using \`&#8211;nomapred\` option because I have not installed YARN. To get list of supported options and parameters just run the command without any options.

So here we first load the data. I am using randonWrite here. With 1 thread.

```shell
$ time hbase org.apache.hadoop.hbase.PerformanceEvaluation -nomapred randomWrite 1
```

The result may show something like:

```
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest Min      = 2.0
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest Avg      = 28.936847686767578
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest StdDev   = 3293.3700704030302
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 50th     = 3.0
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 75th     = 3.0
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 95th     = 5.0
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 99th     = 9.0
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 99.9th   = 93.0
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 99.99th  = 34495.983499997295
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 99.999th = 158854.06521204324
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest Max      = 2486451.0
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest valueSize after 0 measures
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest Min      = 0.0
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest Avg      = 0.0
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest StdDev   = 0.0
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 50th     = 0.0
2017-02-24 08:22:41,491 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 75th     = 0.0
2017-02-24 08:22:41,492 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 95th     = 0.0
2017-02-24 08:22:41,492 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 99th     = 0.0
2017-02-24 08:22:41,492 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 99.9th   = 0.0
2017-02-24 08:22:41,492 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 99.99th  = 0.0
2017-02-24 08:22:41,492 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest 99.999th = 0.0
2017-02-24 08:22:41,492 INFO  [TestClient-0] hbase.PerformanceEvaluation: RandomWriteTest Max      = 0.0
2017-02-24 08:22:41,572 INFO  [TestClient-0] client.ConnectionManager$HConnectionImplementation: Closing zookeeper sessionid=0x25a46883b870366
2017-02-24 08:22:41,578 INFO  [TestClient-0] zookeeper.ZooKeeper: Session: 0x25a46883b870366 closed
2017-02-24 08:22:41,578 INFO  [TestClient-0-EventThread] zookeeper.ClientCnxn: EventThread shut down
2017-02-24 08:22:41,589 INFO  [TestClient-0] hbase.PerformanceEvaluation: Finished class org.apache.hadoop.hbase.PerformanceEvaluation$RandomWriteTest in 32134ms at offset 0 for 1048576 rows (32.08 MB/s)
2017-02-24 08:22:41,589 INFO  [TestClient-0] hbase.PerformanceEvaluation: Finished TestClient-0 in 32134ms over 1048576 rows
2017-02-24 08:22:41,590 INFO  [main] hbase.PerformanceEvaluation: [RandomWriteTest] Summary of timings (ms): [32134]
2017-02-24 08:22:41,590 INFO  [main] hbase.PerformanceEvaluation: [RandomWriteTest]	Min: 32134ms	Max: 32134ms	Avg: 32134ms
2017-02-24 08:22:41,590 INFO  [main] client.ConnectionManager$HConnectionImplementation: Closing zookeeper sessionid=0x25a46883b870365
2017-02-24 08:22:41,647 INFO  [main] zookeeper.ZooKeeper: Session: 0x25a46883b870365 closed
2017-02-24 08:22:41,647 INFO  [main-EventThread] zookeeper.ClientCnxn: EventThread shut down

real	0m38.204s
user	0m44.662s
sys	0m2.264s
```

To write in parallel:

```shell
$ time hbase org.apache.hadoop.hbase.PerformanceEvaluation -nomapred randomWrite 3
```

And to read:

```shell
$ time hbase org.apache.hadoop.hbase.PerformanceEvaluation --nomapred randomRead 1 
$ time hbase org.apache.hadoop.hbase.PerformanceEvaluation --nomapred --rows=100000 sequentialRead 1
```

Again, there are so many options to this utility, try them as needed.

## YCSB

<a href="//github.com/brianfrankcooper/YCSB" target="_blank" rel="noopener noreferrer">Yahoo! Cloud Serving Benchmark</a> is tool for benchmarking various kind of databases like Cassandra, MongoGB, Voldemort, HBase etc. The steps for setup are explained <a href="//github.com/brianfrankcooper/YCSB/wiki/Getting-Started" target="_blank" rel="noopener noreferrer">here</a>. These will the steps to follow while using this tool:

  * Create table named _usertable_
  * Load the data
  * Run workload tests

Now after creating table, we first need to load the data into this table. There are various kinds of <a href="//github.com/brianfrankcooper/YCSB/wiki/Core-Workloads" target="_blank" rel="noopener noreferrer">workloads</a> for different purpose. We will use workload A to load the data in table we created.

### Loading the data:

first parameter \`load\` which tells to write data to table. Second parameter is type of database. \`-P\` tells type of workload. Next three parameters are self explanatory. \``` -s` `` prints  progress as loading happens.

```shell
$ ./bin/ycsb load hbase10 -P workloads/workloada -p columnfamily=f1 -p recordcount=1000000 -threads 10 -s > new-A-load-1M.dat
```

The output looks something like:

```
[OVERALL], RunTime(ms), 396804.0
[OVERALL], Throughput(ops/sec), 2520.1358857269583
[TOTAL_GCS_PS_Scavenge], Count, 566.0
...
[TOTAL_GC_TIME_%], Time(%), 0.4821019949395672
[CLEANUP], Operations, 20.0
[CLEANUP], AverageLatency(us), 2676.6
[CLEANUP], MinLatency(us), 4.0
[CLEANUP], MaxLatency(us), 53055.0
[CLEANUP], 95thPercentileLatency(us), 252.0
[CLEANUP], 99thPercentileLatency(us), 53055.0
[INSERT], Operations, 1000000.0
[INSERT], AverageLatency(us), 3941.506955
[INSERT], MinLatency(us), 1125.0
[INSERT], MaxLatency(us), 664575.0
[INSERT], 95thPercentileLatency(us), 6155.0
[INSERT], 99thPercentileLatency(us), 8391.0
[INSERT], Return=OK, 1000000
```

So here I was getting around 2500 operations/sec

### Reading the data

I will use workload C which is read only. You can read more on types of workloads on link given above. Here first parameter is \`run\` as we are running the tests, as opposed to loading the data. All other parameters are familiar looking.

```shell
$ ./bin/ycsb run hbase10 -P workloads/workloadc -p columnfamily=f1 -p recordcount=100000 -p operationcount=100000 -threads 10 -s > new-C-run-100k.dat
```

The output for above test should look like

```
[OVERALL], RunTime(ms), 12776.0
[OVERALL], Throughput(ops/sec), 7827.175954915467
[TOTAL_GCS_PS_Scavenge], Count, 17.0
...
[TOTAL_GC_TIME_%], Time(%), 0.9862241703193488
[READ], Operations, 100000.0
[READ], AverageLatency(us), 1073.35956
[READ], MinLatency(us), 302.0
[READ], MaxLatency(us), 471551.0
[READ], 95thPercentileLatency(us), 1972.0
[READ], 99thPercentileLatency(us), 5703.0
[READ], Return=OK, 100000
...
```

So for reads I was getting around 7800 operations/second.

Find a workload suitable for your usecase. Or create one. Run tests on them. And let me know how is your cluster doing 🙂 I am also planning to write some of my thoughts and findings on tuning the cluster. Until then, happy hadooping...