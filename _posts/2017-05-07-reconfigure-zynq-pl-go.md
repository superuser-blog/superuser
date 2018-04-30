---
id: 152
title: How to reconfigure Zynq-PL on-the-go?
date: 2017-05-07T19:27:39+00:00
author: parth parikh
layout: single
guid: https://superuser.blog/?p=152
permalink: /reconfigure-zynq-pl-go/
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
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
You would have wondered if i's possible to reconfigure the PL part without any interruption while PS is running Linux. Well, i's possible and as simple as,

```shell
echo '0' > /sys/devices/soc0/amba/f8007000.devcfg/is_partial_bitstream
#echo '1' for partial bitstreams
cat whatever_the_bit_file_name_is.bit &gt; /dev/xdevcfg
```

Yeah, tha's it! Make sure you're running it as root.

Don't have a nice Linux running on ZedBoard yet? have a look at <a href="//superuser.blog/pynq-linux-on-zedboard/" target="_blank" rel="noopener noreferrer">PYNQ Linux on ZedBoard</a>