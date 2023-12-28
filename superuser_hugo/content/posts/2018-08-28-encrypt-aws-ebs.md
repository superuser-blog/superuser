---
id: 18830
title: 'Encrypting Existing AWS EBS : The GDPR Series'
author: sanket
layout: single
date: 2018-08-28
guid: https://superuser.blog/?p=18830
permalink: /encrypt-aws-ebs/
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
categories:
  - AWS
---

It's been some time since The GDPR has kicked in. And like every other ops person, I too had to work for compliance related tasks. Three major tasks that I took up, which involved mostly encrypting data at rest, were
  1. Encrypting existing EBS
  2. Encrypt S3 buckets
  3. Encrypt RDS

In this GDPR series, I will be sharing my experiences and how did we went on with it.

## The Task
  > Encrypt EBS that is currently in use by a MongoDB cluster. With zero downtime.

#### A word on encrypted EBS: 
EBS encryption makes data encrypted at rest and it is decrypted only on your physical hardware. So on wire ie. from EBS storage till your physical hardware where your instance runs, and on its storage, it is encrypted.

The setup was consisting 3 mongo node with data replicated on all. No fancy stuff like sharding. Because we had three node cluster, the goal of zero downtime was achievable. We could simply take one node down, do our stuff, put it back in cluster. We will discuss the 'do our stuff' part here and not the mongo specific instructions. Ie how to take a node out of cluster and put in back in.

### Step 1 : Unmount the volume
In mongo terms, take node out of cluster, meaning make sure no process is using that volume and it is free to unmount.
```
sudo umount <mount point>
```

If unmount fails stating volume is in use, you can find process using that volume using
```
sudo lsof | grep <mount point>
```

### Step 2 : Encrypt it
We had two options to go with this step:
  1. Attach new encrypted volume and rsync your data
  2. Encrypt existing volume

I remember measuring time for both the options and they were comparable. We found option 2 to be faster because the whole copying-encrypting process is done by AWS and not on your instance. So we decided to go with second way of doing it, which would involve following steps:
  - Take a snapshot of your EBS volume
  - Copy snapshot with encryption enabled.
  - Create a new EBS from copied encrypted snapshot

All the steps mentioned above may take some time depending on size of volume.

### Step 3 : Mount it
Now newly restored EBS can be attached to instance and mounted to older mount point. With mongo, we just start mongo back again and it will get in sync with cluster by replicating missed data. 

Yes so that is how that one went. While encrypting master node of mongo, we had to fail master over to other cluster member and then we followed the same procedure. More detailed docs info can be found on [this AWS Guide](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EBSEncryption.html)
