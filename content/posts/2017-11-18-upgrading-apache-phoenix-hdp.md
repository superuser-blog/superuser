---
id: 100
title: Upgrading Apache Phoenix in HDP Cluster
date: 2017-11-18T11:26:20+00:00
author: Sanket
layout: single
guid: http://superuser.blog/?p=100
slug: /upgrading-apache-phoenix-hdp/
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
tags:
  - HBase
  - HDP
tags:
  - Hbase
  - hdp
  - phoenix
---
About new Hadoop cluster we set up, the phoenix version bundled with HDP distribution(4.7) had some bugs which would make it impossible to use to run BI queries. There was no way provided by HDP to upgrade phoenix as we were using the latest version. Looking around on the internet, I found that manually we can replace the related jars and bins to have a new version in place.

So that's what I tried. And it kind of worked. (It still is working)

### These are the steps:

  * download latest phoenix binaries (4.10 at that time)
  * Find installed files (under /usr/hdp/current/phoenix)
  * Correlate installed ones with the ones in new binary package/tar
  * Replace older files with new ones and also rename them or make appropriate links.

Here a very lame/lousy bash script I used:

**Disclaimer: It is not meant to use as a copy-paste script. Use it only for reference. Also we did it when cluster was not having production workloads. You might want to be extra cautious and read more around this if your cluster is having production workloads.**

```bash
cp -R /usr/hdp/2.5.3.0-37/phoenix /usr/hdp/2.5.3.0-37/phoenix-bk

cd $NEW_PHOENIX

cp phoenix-4.10.0-HBase-1.1-client.jar phoenix-4.10.0-HBase-1.1-hive.jar  phoenix-4.10.0-HBase-1.1-queryserver.jar phoenix-4.10.0-HBase-1.1-server.jar phoenix-4.10.0-HBase-1.1-thin-client.jar /usr/hdp/2.5.3.0-37/phoenix/
rm -f /usr/hdp/2.5.3.0-37/phoenix/phoenix-4.7.0.2.5.3.0-37-client.jar /usr/hdp/2.5.3.0-37/phoenix/phoenix-4.7.0.2.5.3.0-37-hive.jar /usr/hdp/2.5.3.0-37/phoenix/phoenix-4.7.0.2.5.3.0-37-queryserver.jar /usr/hdp/2.5.3.0-37/phoenix/phoenix-4.7.0.2.5.3.0-37-server.jar /usr/hdp/2.5.3.0-37/phoenix/phoenix-4.7.0.2.5.3.0-37-thin-client.jar



cd /usr/hdp/2.5.3.0-37/phoenix/

rm -f phoenix-client.jar phoenix-hive.jar phoenix-server.jar phoenix-thin-client.jar
ln -s phoenix-4.10.0-HBase-1.1-client.jar phoenix-client.jar
ln -s phoenix-4.10.0-HBase-1.1-hive.jar phoenix-hive.jar
ln -s phoenix-4.10.0-HBase-1.1-server.jar phoenix-server.jar
ln -s phoenix-4.10.0-HBase-1.1-thin-client.jar phoenix-thin-client.jar



cd $NEW_PHOENIX

cp phoenix-core-4.10.0-HBase-1.1.jar phoenix-core-4.10.0-HBase-1.1-sources.jar phoenix-flume-4.10.0-HBase-1.1.jar phoenix-hive-4.10.0-HBase-1.1.jar phoenix-hive-4.10.0-HBase-1.1-sources.jar phoenix-pherf-4.10.0-HBase-1.1.jar phoenix-pherf-4.10.0-HBase-1.1-minimal.jar phoenix-pherf-4.10.0-HBase-1.1-sources.jar phoenix-pig-4.10.0-HBase-1.1.jar phoenix-queryserver-4.10.0-HBase-1.1.jar phoenix-queryserver-4.10.0-HBase-1.1-sources.jar phoenix-queryserver-client-4.10.0-HBase-1.1.jar phoenix-spark-4.10.0-HBase-1.1.jar phoenix-spark-4.10.0-HBase-1.1-sources.jar /usr/hdp/2.5.3.0-37/phoenix/lib


cd /usr/hdp/2.5.3.0-37/phoenix/lib

rm -f phoenix-core-4.7.0.2.5.3.0-37.jar phoenix-core-4.7.0.2.5.3.0-37-sources.jar phoenix-flume-4.7.0.2.5.3.0-37.jar phoenix-hive-4.7.0.2.5.3.0-37.jar phoenix-hive-4.7.0.2.5.3.0-37-sources.jar phoenix-pherf-4.7.0.2.5.3.0-37.jar phoenix-pherf-4.7.0.2.5.3.0-37-minimal.jar phoenix-pherf-4.7.0.2.5.3.0-37-sources.jar phoenix-pig-4.7.0.2.5.3.0-37.jar phoenix-queryserver-4.7.0.2.5.3.0-37.jar phoenix-queryserver-4.7.0.2.5.3.0-37-sources.jar phoenix-queryserver-client-4.7.0.2.5.3.0-37.jar phoenix-spark-4.7.0.2.5.3.0-37.jar phoenix-spark-4.7.0.2.5.3.0-37-sources.jar



cd /usr/hdp/2.5.3.0-37/phoenix/bin

rm -f end2endTest.py performance.py pherf-cluster.py pherf-standalone.py pherf-standalone.py phoenix_utils.pyc queryserver.py sqlline.py sqlline-thin.py traceserver.py


cd $NEW_PHOENIX/bin

cp end2endTest.py performance.py pherf-cluster.py pherf-standalone.py queryserver.py sqlline.py sqlline-thin.py traceserver.py /usr/hdp/2.5.3.0-37/phoenix/bin
```

You can see:

  * I first copied new jars
  * Deleted old ones
  * Make links with the new jars
  * Copied new jars to lib folder and removed older ones.
  * Removed old binaries and copied new ones.

_That's it!_

Also you would want to add your zookeeper address in sqline.py which was there in the previous binary installed by HDP. Else you can pass it as cmdline.

And restart the cluster [server and then clients] 🙂

Do read: <a href="https://phoenix.apache.org/upgrading.html" target="_blank" rel="noopener">https://phoenix.apache.org/upgrading.html </a>

You might also want to look at [Tuning Your HBase]({{<relref "posts/2017-04-09-tuning-hbase.md">}}) or maybe [benchmark]({{<relref "posts/2017-03-05-hbase-benchmarking.md">}}) it.