---
id: 240
title: Setting up Inter Region AWS VPC Peering and Latency Tests
date: 2017-12-14
author: sanket
layout: single
guid: https://superuser.blog/?p=240
permalink: /aws-vpc-peering-latency-test/
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
categories:
  - AWS
  - Networking
---

Most of our infrastructure and client facing services are in us-east-1 and we have lots of users connecting from different parts of the world including India. Of course there was a significant latency involved when users connect to US from other part of the world. And we wanted to test that, if a user from India connects to Mumbai region(faster handshake) and then that region uses VPC peering to us-east-1 to talk to other services. Here's how it went:


First thing we looked out for was AWS provided VPC peering, it does exist, but for limited number of regions (4, 3 US, 1 UK, at the time of writing this) and it did not include Mumbai. So we had to setup our own IPSec VPN tunnels.

The tool we chose for IPSec tunnel was OpenSwan. Found it easy to setup. We tried two different setups:

  1. EC2  <=== tunnel ===> EC2
  2. EC2  <=== tunnel ===> AWS Managed VPN

### VPC Peering: EC2 <=> EC2

Following steps can be taken for setting up EC2, on both the regions.

<li style="list-style-type: none;">
  <ol>
    <li>
      Spin up an EC2 instance. Have an EIP, disable `source-destination` checks.
    </li>
    <li>
      Open ports 500, 4500 UDP and Custom Protocol 50. Allow from the other side/EC2.
    </li>
    <li>
      Modify route tables to forward traffic for other VPC to this EC2 instance. (And this EC2 will tunnel it to the other VPC)
    </li>
    <li>
      Change kernel conf: add following in `/etc/sysctl.conf` and to bring it in effect: `sudo service network restart`
    </li>
  </ol>
</li>

```
net.ipv4.ip_forward = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
```

5. install OpenSwan: \`sudo yum install openswan\`

6. \`sudo vi /etc/ipsec.conf\` and uncomment last line to include files from \`ipsec.d folder.

7. Create conf files:

(/etc/ipsec.d/us-mum.conf)
```
conn us-mum
	type=tunnel
	authby=secret
	left=%defaultroute
	leftid=<your pub IP>
	leftnexthop=%defaultroute
	leftsubnet=<your VPC CIDR>
	right=<opposite side pub IP>
	rightsubnet=<opposite side VPC CIDR>
	pfs=yes
	auto=start
```

(/etc/ipsec.d/us-mum.secrets)
```
<your pub IP> <other side pub IP> : PSK "changemeplease"
```

You would want to do similar setup in the other region's VPC EC2. Obviously, the PSK will the same and new conf files will be created ie:\`/etc/ipsec.d/us-mum.secrets\` and \`us-mum.conf\` with values changed appropriately.

### Establishing tunnel:

```shell
sudo service ipsec start
sudo ipsec verify
sudo service ipsec status
```

If you see any problems with \`verify\` output, you may want to rectify it. For example if you have not set \`send_redirects\` or not set it properly, you can do:

```
echo 0 > /proc/sys/net/ipv4/conf/all/send_redirects
echo 0 > /proc/sys/net/ipv4/conf/default/send_redirects
echo 0 > /proc/sys/net/ipv4/conf/eth0/send_redirects
echo 0 > /proc/sys/net/ipv4/conf/lo/send_redirects
```

### VPC Peering: EC2 <=> AWS Managed VPN

In this case, one instance will be taken care by AWS and one will be EC2 as setup above.

To setup AWS side VPN:

<ol class="remarkup-list">
  <li class="remarkup-list-item">
    Create Virtual Private Gateway on one VPC (let's assume Mumbai) and attach it to VPC.
  </li>
  <li class="remarkup-list-item">
    Create Consumer gateway (again, in Mumbai) and as IP address, give our openswan US EC2's public IP.
  </li>
  <li class="remarkup-list-item">
    Create a VPN connection (again, in Mumbai), select the consumer gateway you created above. Select static routing and give our US VPC CIDR as a route.
  </li>
</ol>

Once you create VPN connection, you will get two public IPs. Use one of them in our EC2 conf as a <tt class="remarkup-monospaced">rightid. </tt>

The rest settings should be same as EC2-EC2 setup and self explanatory.

**Still not working?**

<ul class="remarkup-list">
  <li class="remarkup-list-item">
    is the kernel settings in place?
  </li>
  <li class="remarkup-list-item">
    are the ports open for the other side to connect?
  </li>
  <li class="remarkup-list-item">
    have you set correct routes?
  </li>
  <li class="remarkup-list-item">
    are the values for pub IP,CIDR and PSK correct in conf of both side?
  </li>
</ul>

Ref: <a href="https://aws.amazon.com/articles/connecting-multiple-vpcs-with-ec2-instances-ipsec/" target="_blank" rel="noopener">https://aws.amazon.com/articles/connecting-multiple-vpcs-with-ec2-instances-ipsec/</a>

## Latency Tests:

Here's how we performed latency tests. We had a webserver running in US region. We had one instance in both US and Mumbai region, both had nginx, proxying requests to US region.

Here are the results:

**Connecting Directly to US from Bangalore:**

<figure>
  <img src="{{ site.url }}{{ site.baseurl }}/wp-content/uploads/2017/12/us_initial.jpg" alt="">
  <figcaption>Initial connection: Bangalore to US</figcaption>
</figure> 

<figure>
  <img src="{{ site.url }}{{ site.baseurl }}/wp-content/uploads/2017/12/us_repeat.jpg" alt="">
  <figcaption>Socket reuse: connection from Bangalore to US</figcaption>
</figure> 
&nbsp;


**Connecting to Mumbai from Bangalore , request will be tunneled to US:**

<figure>
<img src="//superuser.blog/wp-content/uploads/2017/12/mum_initial.jpg" alt="" width="521" height="271" srcset="https://superuser.blog/wp-content/uploads/2017/12/mum_initial.jpg 521w, https://superuser.blog/wp-content/uploads/2017/12/mum_initial-300x156.jpg 300w" sizes="(max-width: 521px) 100vw, 521px" />
<figcaption >Initial connection: Bangalore to Mumbai</figcaption>
</figure> 

<figure>
<img class="wp-image-245 size-full" src="//superuser.blog/wp-content/uploads/2017/12/mum_repeat.jpg" alt="" width="520" height="247" srcset="https://superuser.blog/wp-content/uploads/2017/12/mum_repeat.jpg 520w, https://superuser.blog/wp-content/uploads/2017/12/mum_repeat-300x143.jpg 300w" sizes="(max-width: 520px) 100vw, 520px" />
<figcaption >socket reuse: from bangalore to mumbai, tunneled to US</figcaption>
</figure> 


As you can see, for the first request, handshake is much faster (approx 10x) to Mumbai as it is near to client. But when you have the socket established, it's clear that if you take Mumbai route (VPN) to US instead of going directly US, it is approx 1.5x slower as we encounter penalty for VPN encryption and decryption operations.

So that's how that one went. Let me know if any doubts or you're stuck anywhere. Also I would love to know how did it work for you and what improvements you saw with your setup.