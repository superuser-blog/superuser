---
id: 18923
title: 'Encrypt Existing S3 Bucket : The GDPR Series'
author: Sanket
layout: single
date: 2018-09-23
guid: https://superuser.blog/?p=18923
slug: /encrypt-s3-bucket/
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
tags:
  - AWS
---

So next in line was S3 bucket. This too did not have encryption enabled, ie: data encryption at rest.

## The Task
 > Encrypt existing S3 bucket which contains user data with zero downtime.

### A word on encrypted S3 objects/buckets:
By default there is no encryption involved when you create or put objects in an S3 bucket. However, you can enable default encryption on a bucket and any object put in the bucket will be encrypted by default. And there are ways to enforce it also. S3 at that moment had two types of server side encryption options available.
  1. SSE-S3
  2. SSE-KMS

In first option that is SSE-S3, you just ask S3 to encrypt your objects and the rest will be managed by them. Meaning you don't have to specify a key using which objects will be encrypted. While going with the second option, you can choose your own KMS key which will be used for encryption. 

We went with option 1 as we did not intend to use features provided by KMS keys like rotation and brining in your own key. Also KMS request rate is subject to S3 request rates so you have to be aware of that too.

So this is how we went with it.

### Step 1: Backup (of course)
Goes without saying! Used S3 cli for this purpose. Be mindful of choosing number of threads/concurrency as S3 has some rate limit.[^1] 

```
aws s3 cp s3://bucket-name/ s3://backup-bucket-name/ --recursive
```

### Step 2: Enable Default Encryption
In S3 console go to Properties Tab > Default Encryption. You have option to select SSE-S3 or SSE-KMS. After enabling this, every object put in bucket will be encrypted by default. Now all that we have to do is encrypt older objects.

### Step 3: Encrypt Older Objects
This can be done two ways. You can either use S3 CLI or write your own little python/java program to do it. Using CLI it would look something like:

```
aws s3 cp s3://bucket-name/ s3://bucket-name/ --recursive --sse
```

So what you're doing here is copying objects in-place and while doing that, enable encryption also with `--sse`. What we did it Java way by creating threadpool of 20 or 50.

And that is it! Again, couple things to remember:
  1. Be mindful of S3 request limits. So that real traffic does not get affected. You can contact AWS support beforehand.
  2. If you're using `SSE-KMS`, be careful to not delete the key that was used to encrypt. Otherwise the data is as good as trash. :)  
  3. If using S3 cli, do look into `max_queue_size` and `max_concurrent_requests` to limit the request rate or to increase it. [^2]

Ref:

[^1]: [S3 Request Rate Considerations](https://docs.aws.amazon.com/AmazonS3/latest/dev/request-rate-perf-considerations.html)
[^2]: [S3 CLI config](https://docs.aws.amazon.com/cli/latest/topic/s3-config.html)