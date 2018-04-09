---
id: 72
title: Resize EBS Root Volume of CentOS 6 AMI
date: 2017-02-28T00:03:41+00:00
author: sanket
layout: single
guid: http://superuser.blog/?p=72
permalink: /resize-ebs-root-volume-centos-ami/
medium_post:
  - 'O:11:"Medium_Post":11:{s:16:"author_image_url";s:65:"https://cdn-images-1.medium.com/fit/c/200/200/0*c0aBOUXEnVa4XfJd.";s:10:"author_url";s:30:"https://medium.com/@sanketplus";s:11:"byline_name";N;s:12:"byline_email";N;s:10:"cross_link";s:2:"no";s:2:"id";s:12:"f10187696d5a";s:21:"follower_notification";s:3:"yes";s:7:"license";s:19:"all-rights-reserved";s:14:"publication_id";s:2:"-1";s:6:"status";s:6:"public";s:3:"url";s:82:"https://medium.com/@sanketplus/resize-ebs-root-volume-of-centos-6-ami-f10187696d5a";}'
image: /wp-content/uploads/2017/02/centos-825x479.jpg
categories:
  - AWS
  - Linux
tags:
  - ami
  - aws
  - EBS
  - filesystem
  - linux
---
So the other day I had to create a CentOS 6 AMI for [HDP](//hortonworks.com/products/data-center/hdp/) installation as it had Hue package available only for CentOS 6. I launched an instance with EBS attached of 10 GB with CentOS 6. Went on to create AMI out of it with EBS size of 100GB.

These all went good and I proceed with launching instances for HDP cluster (12 was the number of instances). Everything went good and installation was complete. Later only [Ambari Server](//ambari.apache.org)  started throwing warnings about disk space. Despite attaching a 100 GB EBS.<!--more-->

Upon checking it came to my notice that the EBS attached is indeed 100 GB but the root partition was only 8 GB. So I can make an fs out of remaining space and mount it somewhere but that&#8217;s not what I wanted.

[shell padlinenumbers=&#8221;false&#8221;]

[sanketp@hdpm01 ~]$ lsblk
  
NAME MAJ:MIN RM SIZE RO TYPE MOUNTPOINT
  
xvda 202:0 0 100G 0 disk
  
└─xvda1 202:1 0 8G 0 part /

[/shell]

So I started searching on how to extend root partition. Found may solutions. Including one on [AWS Docs](//docs.aws.amazon.com/AWSEC2/latest/UserGuide/storage_expand_partition.html).  Most solutions were requiring

  * To unmount and attach it somewhere else and then perform extend operation
  * Take a snapshot and then extend and then launch new instance

Taking 12 instances offline and mounting their EBS on some other instance and extending was not feasible for me. Neither was taking snapshot of every instance and launch new one with extended partition. I wanted to do it online. Tried various tools like parted, resize2fs etc. None of them worked, until I finally found one that did the job while partition being online and mounted.

## growpart:

So this was the savior. And following were the steps I took to get it resized:

  * Get the repo in place.
  * Install the package
  * Run the utility (last number is for partition, here it was first partition)
  * Reboot!
  
    [shell]sudo yum install //download.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm -y
  
    sudo yum install cloud-utils-growpart -y
  
    sudo growpart /dev/xvda 1
  
    sudo reboot
  
    [/shell]

So this little tool came to rescue and saved many hours. This problem tends to happen with older linux versions like CentOS 6, Debian-jessie, SELS11.X. This guy has [solution for Debian](//www.elastic.co/blog/autoresize-ebs-root-volume-on-aws-amis) with same problem.

Cheers!