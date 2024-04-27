---
id: 18930
title: 'Encrypt Existing AWS RDS : The GDPR Series'
author: Sanket
layout: single
date: 2018-09-30
guid: https://superuser.blog/?p=18930
slug: /encrypt-existing-aws-rds/
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
tags:
  - AWS
---

Last, and the most dreaded, comes the MySQL RDS. The most critical part of infrastructure which is responsible for auth, new sign-ups and other user related activities.

The task was dreaded because **there is no way to enable encryption once RDS has been created** and most ways, which we will discuss, incurred downtime. 

## The Task
 > Encrypt existing MySQL RDS, which is also multi AZ, with near-zero downtime.

The RDS instance we had was a MySQL one which is also multi AZ. After lots of docs reading, googling around and chatting with AWS support we found following ways to go about it.
  1. The Snapshot Way [huge downtime]
  2. The dump way.
  2. The DMS Way
  3. The Looong Way

## The Snapshot Way:
Probably the easiest to follow, the one mentioned in AWS docs too. BUT. Huge downtime depending on the DB size. Because once the RDS instance has been created, there is no way to enable encryption, what AWS suggests is to do:
  - Take a snapshot.
  - Encrypt snapshot.
  - Restore an RDS from encrypted snapshot.

 Clearly, if we don't want to miss-out writes, we will have to shut the DB down and that is downtime. Not the way to go about it.

## The Dump Way:
Also has downtime bus lesser than the previous one. The idea is to take dump of whatever db you want to be encrypted only. And not whole DB instance. And upload it to newly created empty encrypted RDS. We tried taking dump and uploaded on new RDS and measured time. It was in minutes and not acceptable. 

## The DMS Way:
AWS has this cool service called Database Migration Service [DMS] which lets you migrate databases across DB engines. And from same engine to same engine too ie from MySQL to MySQL. 

So here we though the trick that should work is:
   1. Create new RDS with encryption enabled (we can only do it while starting new one)
   2. Create DMS job to migrate existing DB to new one.
   3. Also choose `replicate old data and continue to keep DBs in sync`

So what DMS basically does (I think) is you give them two DBs. Source and destination (encrypted here). And tell it to keep them in sync. So they will upload initial DB dump on new db and then continue replicating bin log on new one and thus keeping them in sync.

This should work, right? **Wrong!** It was all cool on test setup. It did replicate old db to new one and it also kept replicating live writes. And mind well that this was on dump of our production db that we wanted to encrypt. But when we tried to move this setup with staging infra. DMS replication started failing! Why? **The JSON Columns**. Turns out, DMS did not support replicating JSON columns so when one such cell is updated in source DB, it could not replicate the same on destination encrypted db.

**BUMMER!** I thought life is easy. Nope! Hence,

## The Looong Way:
Running out of options we had to go this way:
  1. Make a read replica of existing non-encrypted DB
  2. Wait for replica to start and get in sync with source.
  3. Stop replication on read replica
  4. Note where replication was stopped.
  5. Take snapshot of read replica
  6. Encrypt snapshot
  7. Restore RDS from step 6 snapshot
  8. Start replication. Set RDS master as the original db and replication start point as noted in step 4

Now before you start, make sure binlog are enabled and is in row format (by default it is). Also increase bin log retention duration so that we have it to get replicated to new db.

```
show variables like 'binlog_format';
# Create replication user and increase binlog retention to 24hrs:
CREATE USER 'rep_user'@'%' IDENTIFIED BY 'rep_user';
GRANT REPLICATION slave ON *.* TO 'rep_user'@'%' IDENTIFIED BY 'rep_user';
FLUSH PRIVILEGES;

# increase binlog retention
call mysql.rds_set_configuration('binlog retention hours', 24);
```

Now create a read replica of existing RDS from AWS console. Wait for it to get in sync and be available fully. Monitor the console and see when it becomes available. Also you can log-in to ReadReplica (RR) and `do show slave status\G;`

Now moving to step 3, we will stop replication and note the points.

```
Stop replication:
CALL mysql.rds_stop_replication;
# Note the replication state:
show slave status\G;
```

And note-down `Relay_Master_log_file` and `Exec_Master_log_pos` :: this basically says in which file till which position replication has been done. We will use the same position while resuming replication.

RDS page should say replication has been stopped using command in RED fonts. Take snapshot from RDS UI.
Check for snapshot progress and once done encrypt snapshot using RDS UI only. Restore RDS from encrypted snapshot. It will have most settings as default, you can set rds name here. You can make whatever modification you want to have in your new encrypted DB. 

Once RDS has been started it will have default SG (no access from EC2 or office), have backup disabled, default parameter group etc. Just modify this RDS to have same setting as source RDS. we will need to reboot this RDS to apply parameter group.

Now we have encrypted RDS which has data similar to what ReadReplica had. Now we need to enable replication from the points we noted above.On new encrypted RDS

```
CALL mysql.rds_set_external_master('<source rds>', 3306, '<replication user>', '<that user's passwd>', '<Relay_Master_log_file>', <Exec_Master_log_pos>, 0);

CALL mysql.rds_start_replication;
```


Now do `show slave status\G;` and monitor Replication Delay. It would be in some thousands of seconds as it takes time to take and encrypt snapshot. Withing couple of minutes, new RDS should sync and delay should get to 0.

Now you have both the RDS in sync, any writes to unencrypted one is replicated to encrypted one. You can now switch your application to use new one. While migrating we should make sure that all service instance are migrated **at once** , ie there should be no point where both RDS are in use by set of services. Why? Because this may break replication.

Example: Say we have auto-increment column in a DB and we have written till column 100. Now if you write on slave (encrypted RDS here), you will be able to write and that column will be 101. If you write on master (unencrypted RDS here) you also will be able to write with column 101. But the replication will try to replicate master's 101 column and because it already exists on slave replication would break and all DB will stop getting replicated :) 

So let's tear replication down as there are no writes on master. Do this on slave (new encrypted RDS):

```
	CALL mysql.rds_stop_replication;
	CALL mysql.rds_reset_external_master;
```


And that is it! Again, couple things to remember:
  1. Needless to say, try it all on staging setup. Try it couple of times 
  2. While migrating, there should be no instance while both RDS are simultaneously being used by service.
  3. Try using DMS if you don't have json columns.  


Ref:

1. [Encrypting Amazon RDS Resources](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html)