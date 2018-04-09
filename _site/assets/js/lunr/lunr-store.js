var store = [{
        "title": "Simple Distributed File System in Python : PyDFS",
        "excerpt":"I was reading on HDFS (Hadoop’s distributed file system) and it’s internals. How does it store data. What is reading path. What is writing path. How does replication works. And to understand  it better my mentor suggested me to implement the same. And so I made PyDFS. (Screenshots at bottom...","categories": ["python"],
        "tags": ["distributed file system","hadoop","HDFS","python"],
        "url": "http://localhost:4000/distributed-file-system-python/",
        "teaser":null},{
        "title": "Debugging Stuck Process in Linux",
        "excerpt":"The other day I faced a problem with monitoring setup and I found that the WebUI is not responding. I SSHed into server and checked if process is running. It was. Checked if port was open. It was. So as it happened, the process was running and listening on port...","categories": ["Linux"],
        "tags": ["debugging","linux","process"],
        "url": "http://localhost:4000/debugging-stuck-process-linux/",
        "teaser":null},{
        "title": "Resize EBS Root Volume of CentOS 6 AMI",
        "excerpt":"So the other day I had to create a CentOS 6 AMI for HDP installation as it had Hue package available only for CentOS 6. I launched an instance with EBS attached of 10 GB with CentOS 6. Went on to create AMI out of it with EBS size of...","categories": ["AWS","Linux"],
        "tags": ["ami","aws","EBS","filesystem","linux"],
        "url": "http://localhost:4000/resize-ebs-root-volume-centos-ami/",
        "teaser":null},{
        "title": "HBase Benchmarking",
        "excerpt":"Currently I am working with new setup of Apache HBase cluster to query data using Phoenix  on top of HDP Distribution. After setting up cluster, the values for heap, cache and timeouts were all defaults. Now I needed to know how good is the cluster in current shape and how can...","categories": ["HBase"],
        "tags": ["Hbase"],
        "url": "http://localhost:4000/hbase-benchmarking/",
        "teaser":null},{
        "title": "Stuff You Can Do While Tuning HBase",
        "excerpt":"So you are setting up HBase! Congratulations! When it comes to tuning HBase there are so many things you can do. And most of the things will be dependent upon type of data you will be storing and it’s access patterns. So I will be saying this a lot: ‘value...","categories": ["HBase"],
        "tags": ["Hbase"],
        "url": "http://localhost:4000/tuning-hbase/",
        "teaser":null},{
        "title": "Configure PS of PYNQ to work with SDK",
        "excerpt":"Hi, If you’re an FPGA fan or someone who’s got PYNQ board for fun, you might be having a hard time making it run Vivado SDK projects. That’s because, the PYNQ-Z1, the cheap Zynq-7020 board doesn’t have any popular DDR ram on board. You need to configure it by hand,...","categories": ["FPGA"],
        "tags": ["FPGA","PYNQ","PYNQ-Z1","Vivado","Xilinx","Zynq"],
        "url": "http://localhost:4000/configure-ps-pynq-work-sdk/",
        "teaser":null},{
        "title": "Migrating OpenTSDB to Another HBase Cluster",
        "excerpt":"As a part of migration from CDH cluster to HDP cluster, we also had to migrate OpenTSDB which was running on CDH cluster. There are many methods to copy/transfer data between clusters and what we used here was ExportSnapshot. So these are the steps roughly: Stop TSDs Take snapshot(s) Transfer snapshots...","categories": ["HBase"],
        "tags": ["Hbase","metrics","opentsdb"],
        "url": "http://localhost:4000/migrate-opentsdb-hbase/",
        "teaser":null},{
        "title": "PYNQ Linux on ZedBoard",
        "excerpt":"Hi There! The PYNQ Linux is a fun, easy and maker-friendly Ubuntu 15.04 rootfs. It comes bundled with the PYNQ-Z1 board, and the official documentations doesn’t even utter a word on how to build or port this image on any other Zynq. Maybe because it’s too obvious how to do...","categories": ["FPGA","Linux","Zynq"],
        "tags": ["FPGA","linux","Zynq"],
        "url": "http://localhost:4000/pynq-linux-on-zedboard/",
        "teaser":null},{
        "title": "How to reconfigure Zynq-PL on-the-go?",
        "excerpt":"You would have wondered if it’s possible to reconfigure the PL part without any interruption while PS is running Linux. Well, it’s possible and as simple as, #echo '0' &gt; /sys/devices/soc0/amba/f8007000.devcfg/is_partial_bitstream//echo '1' for partial bitstreams#cat whatever_the_bit_file_name_is.bit &gt; /dev/xdevcfgYeah, that’s it! Make sure you’re running it as root. Don’t have a...","categories": ["FPGA","Linux","Zynq"],
        "tags": ["FPGA","linux","Vivado","Zynq"],
        "url": "http://localhost:4000/reconfigure-zynq-pl-go/",
        "teaser":null},{
        "title": "HBase YouAreDeadException: Dead RegionServer due to GC Pause",
        "excerpt":"So the CDH Cluster was replaced by HDP Cluster and everything was going smooth for time being. Until the time when I started getting a dead RegionServer. Frequently. So a deep dive was needed to dig out what indeed was happening. And it turned out to be a long dive....","categories": ["HBase","HDP"],
        "tags": ["Hbase","hdp"],
        "url": "http://localhost:4000/hbase-dead-regionserver/",
        "teaser":null},{
        "title": "Writing Simple WebSocket Server in Python: PyWSocket",
        "excerpt":"Journey to websocket was pretty long. I started with an idea to make an app which can play music in sync across the devices during college period. No wonder I couldn’t get thru it. Later this year I stumbled upon this new thing called WebSockets and they were intriguing. I...","categories": ["python"],
        "tags": ["python","websocket"],
        "url": "http://localhost:4000/websocket-server-python/",
        "teaser":null},{
        "title": "TCP Fast Open: In Action with Python",
        "excerpt":"Recently I was revisiting concepts of TCP protocol and that reminded me that there was also a thing called TCP Fast Open. Digging further on the same revealed a lot. We will briefly discuss how this enhancement works. What are the limitations. And later we will do the hands on...","categories": ["Networking","python"],
        "tags": [],
        "url": "http://localhost:4000/tcp-fast-open-python/",
        "teaser":null},{
        "title": "Upgrading Apache Phoenix in HDP Cluster",
        "excerpt":"About new Hadoop cluster we set up, the phoenix version bundled with HDP distribution(4.7) had some bugs which would make it impossible to use to run BI queries. There was no way provided by HDP to upgrade phoenix as we were using the latest version. Looking around on the internet,...","categories": ["HBase","HDP"],
        "tags": ["Hbase","hdp","phoenix"],
        "url": "http://localhost:4000/upgrading-apache-phoenix-hdp/",
        "teaser":null},{
        "title": "Setting up Inter Region AWS VPC Peering and Latency Tests",
        "excerpt":"Most of our infrastructure and client facing services are in us-east-1 and we have lots of users connecting from different parts of the world including India. Of course there was a significant latency involved when users connect to US from other part of the world. And we wanted to test...","categories": ["AWS","Networking"],
        "tags": [],
        "url": "http://localhost:4000/aws-vpc-peering-latency-test/",
        "teaser":null},{
        "title": "Welcome to Jekyll!",
        "excerpt":"You’ll find this post in your _posts directory. Go ahead and edit it and re-build the site to see your changes. You can rebuild the site in many different ways, but the most common way is to run jekyll serve, which launches a web server and auto-regenerates your site when...","categories": ["jekyll","update"],
        "tags": [],
        "url": "http://localhost:4000/jekyll/update/welcome-to-jekyll/",
        "teaser":null}]
