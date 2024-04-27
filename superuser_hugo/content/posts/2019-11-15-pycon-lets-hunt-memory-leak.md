---
id: 191115
title: "PyCon19 India: Let's Hunt a Memory Leak"
author: Sanket
layout: single
date: 2019-11-15
guid: https://superuser.blog/?p=191115
slug: /pycon-lets-hunt-memory-leak/
cover:
  image: /assets/images/pycon19-1.jpg
header:
  overlay_image: /assets/images/pycon19-1.jpg
  overlay_filter: rgba(10, 10, 10, 0.55)  
  show_overlay_excerpt: false
tags:
  - python
  - public speaking
---

We faced a memory leak in production and I wrote about it in [this blog post](/detect-memory-leak-python/). A while back, I somewhere came across the open Call for Proposals for [Pycon India 2019](https://in.pycon.org/2019/) and I submitted a talk titled `Let's Hunt a Memory Leak`. It got selected and I had to prepare! While learning python internals and especially memory related behaviour, I also wrote about [werid behaviour with python 2 and integers](/python-2-integers). The PyCon finally happened and it was pretty fun to learn new things and to deliver it!

# Let's Hunt a Memory Leak

The talk's description looked something like:

>Python being a high level interpreted language, it never bothers us to deal with garbage collection. However, because we do not explicitly free memory like we do in C language, python has to clean it for us and hence there is garbage collection involved with python. While garbage collection works most of the times and never becomes an issue, when there is a memory leak in the code, we have no choice but to dig deeper to uncover it.
<br> <br>
In this talk we will first look at how python manages memory and how does garbage collection works with python. We will look at some hands on examples to confirm the python memory management behavior and we will see why is it important to be aware about this behavior.
<br><br>
Further, we will look at a simulated memory leak scenario which we faced in production with Flask environment and we will look at one of the ways we used to hunt it down.


### Slides and Recording

 - [Slides](https://docs.google.com/presentation/d/1_c4_khxTBC0mtifWp1CwJl3_5Gp6ZTFbVzoafEirOig/edit?usp=sharing) 
 - [YouTube](https://youtu.be/u0qVRm8Hjb4) 

{{<rawhtml>}}
 <iframe width="560" height="315" src="https://www.youtube.com/embed/s9kAghWpzoE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

<br/>
{{</rawhtml>}}

A couple of images :)

![PyCon19 Image 1](/assets/images/pycon19-1.jpg)

![PyCon19 Image 2](/assets/images/pycon19-2.jpg)
