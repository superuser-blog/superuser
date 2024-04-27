---
id: 114
title: PYNQ Linux on ZedBoard
date: 2017-05-07T19:09:58+00:00
author: parth
layout: single
guid: https://superuser.blog/?p=114
slug: /pynq-linux-on-zedboard/
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
tags:
  - FPGA
  - Linux
  - Zynq
tags:
  - FPGA
  - linux
  - Zynq
---
Hi There!

The PYNQ Linux is a fun, easy and maker-friendly Ubuntu 15.04 rootfs. It comes bundled with the PYNQ-Z1 board, and the official documentations doesn't even utter a word on how to build or port this image on any other Zynq. Maybe because it's too obvious how to do so.

What you need to run Linux on any ARM board?

  1. BOOT image (BOOT.bin)
  2. kernel image (uImage)
  3. devicetree blob (devicetree.dtb)
  4. rootfs

What we need to worry about? everything but the rootfs.

## **TL;DR**

> Write the image file on SD card same as in the pynq tutorial, and replace the files in BOOT partition with these&#8230;
	[ZedBoard BOOT files](https://drive.google.com/file/d/0B9OutAup6VgTNktMLTRpajBSTk0/view?usp=drivesdk)
> 
> **Update:**
> 
> use older image of pynq from [here](https://files.digilent.com/Products/PYNQ/pynq_z1_image_2016_09_14.zip)

## Detailed Explanation (as if you asked for it)

### 0. Set up environment.

You'll obviously need to do this all a Desktop Linux system. I've tried doing onWindows, doesn't work well with MinGW. Haven't tried CygWin or Linux Subsystem for Windows, you may give it a try if you're brave enough.

#### 0.1 Set up the Bash environment to work with Xilinx SDK tools,

```
source /opt/Xilinx/SDK/2016.3/settings64.sh
source /opt/Xilinx/Vivado/2016.3/settings64.sh
# For Older SDKs before 2017.1
export CROSS_COMPILE=arm-xilinx-linux-gnueabi-
```

**Update:**

For latest SDK version 2017.3 the cross compiler is arm-linux-gnueabihf-gcc.

```
# For new SDKs on or after 2017.1
export CROSS_COMPILE=arm-linux-gnueabihf-gcc-
```

#### 0.2 SD Card Patitioning

you don't really need to create partitions of the SD card because loading the image file from the PYNQ linux will do that for you, however you can do it anyways which should look like&#8230; (Use GParted or something)

Partition-1:

  * Type: fat32
  * Free Space Preceding: 4MB (IMPORTANT!!!)
  * Size: 52MB
  * Label: BOOT (Optional)

Partition-2:

  * Type: ext4
  * Size: whatever is left
  * Label: rootfs (Optional)

#### Notes

  * DO NOT REMOVE SD CARD WITHOUT UNMOUNTING IT! Really, don't. It creates badblocks in the SD card which might cause issues booting up the Zynq.
  * You can check my GitHub @parthpower for the modified u-boot and Linux codes to work around this.

### 1. Make BOOT.bin

-> To create BOOT.bin, you'll need 3 things (which you'd have heard everywhere).

  1. First Stage Bootloader to dump the bitstream and call the second stage bootloader
  2. bitstream
  3. Second Stage Bootloader (u-boot.elf)

I'm not going in details of first two things, as they are simple and you can just google them&#8230; Come on now! Ok, in short, make Vivado project with only PS, export it to the SDK, create FSLB application project and you're good!

Let's get to the main part, MAKING u-boot.elf!!!!

Clone the Xilinx UBoot repo from the Xilinx github, checkout to the latest stable release (I used xilinx-v2016.4) (in case you need code)

```shell
git clone //github.com/Xilinx/u-boot-xlnx.git
cd u-boot-xlnx
git checkout xilinx-v2016.4
```

Now, you got to change some stuff in u-boot-xlnx/include/configs/zynq-common.h, find this line &#8220;sdboot=if mmcinfo;&#8221; and make it look like as below

```
"sdboot=if mmcinfo; then " \
			"run uenvboot; " \
			"echo Copying Linux from SD to RAM...RFS in ext4 && " \
			"load mmc 0 ${kernel_load_address} ${kernel_image} && " \
			"load mmc 0 ${devicetree_load_address} ${devicetree_image} && " \
			"bootm ${kernel_load_address} - ${devicetree_load_address}; " \
```


Wait, what did we just messed with? Like what the hell happened?

If you go through the &#8220;Ubuntu on ZedBoard&#8221; tutorial by Avnet, they explain it's for using the rootfs from the filesystem instead of a RAM disk.

To make u-boot,

```
make zynq_zed_config
make
```

You should add _u-boot-xlnx/tools _to the PATH. It'll be useful making the Linux Image later on.

```
export PATH='uboot-xlnx/tools:'$PATH
```

Get the &#8220;u-boot&#8221; file from the root of the u-boot source directory, rename it to u-boot.elf. Now just make the **BOOT.bin**, open &#8220;Create Boot Image&#8221; in SDK use the FSBL.elf, bit file and the u-boot.elf. Mind the order of the files because that's how the Zynq will be booted. FSBL configures the PL with the bit file then loads the second stage bootloader; u-boot.

![boot](/wp-content/uploads/2017/05/BOOT.png)

### 2. Make Linux Kernel Image

The Linux Kernel Image is the actual Kernel being loaded by the u-boot and which has the rootfs of pynq distribution. In less technical words, Linux Kernel is the base system which loads the higher-level root filesystem from the mount point. Now we're done with the theory part, Let's make the kernel!

Fetch the sources,

```shell
git clone //github.com/Xilinx/linux-xlnx.git
git checkout -b xlnx_3.17</pre>
```

Just default config, and make it!

```
make ARCH=arm xilinx_zynq_defconfig
make ARCH=arm UIMAGE_LOADADDR=0x8000 uImage
```

That's it and you have your Linux kernel image ready at _linux-xlnx/arch/arm/boot/**uImage** _save it somewhere safe.

### 3. Device Tree Blob

What? Device tree blob is a &#8220;block-of-binary&#8221; which specifies memory location of the peripherals, their compatible driver names, and some configurations of the peripherals. It's lots of information about the hardware specification of the SoC.

The dtb is compiled from dts (device tree string). For a PS-only design, the dts is already there in the linux-xlnx repository at _/linux-xlnx/arch/arm/boot/dts/zynq-zed.dts_

We need to modify it a little bit to load the rootfs, (yeah, lots of efforts just to load the rootfs)

find the line starting with _bootargs _and change it to,

<pre class="lang:default decode:true">bootargs = "console=ttyPS0,115200 root=/dev/mmcblk0p2 rw earlyprintk rootfstype=ext4 rootwait devtmpfs.mount=1";</pre>

By default, it has bootargs are set to load the rootfs from a ramdisk. But we configured the u-boot not to load the rootfs as ramdisk. So we are mounting it from /dev/mmcblk0p2 (partition 2 of the memory card)

Now go to the root of linux-xlnx and

<pre class="lang:default decode:true ">make ARCH=arm zynq-zed.dtb</pre>

and you have the dtb file at  _/linux-xlnx/arch/arm/boot/dts/**zynq-zed.dtb**_ rename it to devicetree.dtb and copy it somewhere safe.

### 4. rootfs

The root file system we want to use if the one provided by the PYNQ. Download the latest version from //pynq.io. Extract it, and write the image to the sd card. Use _dd _or Win32DiskImage tool or whatever you wish.

> **Update:**
> 
> The latest PYNQ distribution has kernel v4.6. You can use older image from,
> 
> <a href="https://files.digilent.com/Products/PYNQ/pynq_z1_image_2016_09_14.zip" target="_blank" rel="noopener">pynq_z1_image_2016_09_14.zip</a>

Mount the SD card, look into the BOOT partition, replace all the files, BOOT.bin, uImage, devicetree.dtb with the ones we've created, and you're done. Seriously, you're done!

Good thing is, you can put any Linux distribution as long as it is made up on Linux Kernel 3.17 in the rootfs file system and it should work. I tried Linaro , it quite didn't work well with me. Try playing around, let me know what works and what don't work!

Happy Hacking!

Some Really Good References,

<a href="//www.instructables.com/id/Embedded-Linux-Tutorial-Zybo/" target="_blank" rel="noopener noreferrer">Embedded-Linux-Tutorial-Zybo</a>

<a href="//forums.xilinx.com/xlnx/attachments/xlnx/ELINUX/12801/1/Ubuntu_on_Zynq_Tutorial_03.pdf" target="_blank" rel="noopener noreferrer">Ubuntu_on_Zynq_Tutorial_03.pdf </a>

<a href="//fpga.org/2013/05/24/yet-another-guide-to-running-linaro-ubuntu-desktop-on-xilinx-zynq-on-the-zedboard/" target="_blank" rel="noopener noreferrer">Yet Another Guide to Running Linaro Ubuntu Linux Desktop on Xilinx Zynq on the ZedBoard
</a>

<a href="//www.wiki.xilinx.com/" target="_blank" rel="noopener noreferrer">www.wiki.xilinx.com/</a>

# **Update**

  1. PYNQ has recently updated their repository and included instructions to make sd card image section. <a href="https://pynq.readthedocs.io/en/latest/pynq_sd_card.html" target="_blank" rel="noopener">pynq_sd_card</a>  Thanks to <b class="fn">Cathal McCabe </b>for this update.
