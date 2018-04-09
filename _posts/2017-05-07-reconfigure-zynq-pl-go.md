---
id: 152
title: How to reconfigure Zynq-PL on-the-go?
date: 2017-05-07T19:27:39+00:00
author: parth parikh
layout: single
guid: https://superuser.blog/?p=152
permalink: /reconfigure-zynq-pl-go/
categories:
  - FPGA
  - Linux
  - Zynq
tags:
  - FPGA
  - linux
  - Vivado
  - Zynq
---
You would have wondered if it&#8217;s possible to reconfigure the PL part without any interruption while PS is running Linux. Well, it&#8217;s possible and as simple as,

<!--more-->

<pre class="lang:default decode:true ">#echo '0' &gt; /sys/devices/soc0/amba/f8007000.devcfg/is_partial_bitstream
//echo '1' for partial bitstreams
#cat whatever_the_bit_file_name_is.bit &gt; /dev/xdevcfg</pre>

Yeah, that&#8217;s it! Make sure you&#8217;re running it as root.

Don&#8217;t have a nice Linux running on ZedBoard yet? have a look at <a href="//superuser.blog/pynq-linux-on-zedboard/" target="_blank" rel="noopener noreferrer">PYNQ Linux on ZedBoard</a>