---
id: 190721
title: "SRECon19 Asia: Let's Build a Distributed File System"
author: Sanket
layout: single
date: 2019-07-21
guid: https://superuser.blog/?p=190721
slug: /lets-build-distributed-filesystem/
cover:
  image: /assets/images/srecon-2.jpeg
header:
  overlay_image: /assets/images/srecon-2.jpeg
  overlay_filter: rgba(10, 10, 10, 0.35)  
  show_overlay_excerpt: false
tags:
  - python
  - public speaking
---

In the [first post on this blog](/distributed-file-system-python/), I wrote about a tiny distributed filesystem I made in python for educational purpose. This year, I had a chance to use it in a talk delivered at [SRECon 19 Asia](https://www.usenix.org/conference/srecon19asia). The title was

# Let's Build a Distributed File System

The talk was listed under something called `Core Principles track` and `Talks in this track will focus on providing a deep understanding of how technologies we use everyday function and why it's important to know these details when supporting and scaling your infrastructure.` If I were to pull up abstract submitted to Usenix
> Let's explore something that we use and rely on every day. The file systems. Typical and distributed.<br/><br/>
We first will look at a typical file system, the architectural components and how they all work together when you perform a read or write. We then will take those components and evolve that into a distributed file system architecture. While the architectures we'll explore will not be of a specific file system, they will be generic enough to be relatable with many file system implementations that exist today.<br/><br/>
We also will then implement a tiny distributed file system in Python to see all those components playing together in action. Please note that this will be a very simple, minimal example, not suitable for real usage. If you are a file system hacker, this session will be too basic for you.

### Slides GitHub and Recording

 - [Slides](https://www.usenix.org/sites/default/files/conference/protected-files/srecon19apac_slides_patel.pdf) 
 - [GitHub](https://github.com/sanketplus/pydfs/tree/srecon)
 - [YouTube](https://www.youtube.com/watch?v=-xYwXUGM7nY) 


{{<rawhtml>}}
 <iframe width="560" height="315" src="https://www.youtube.com/embed/-xYwXUGM7nY" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

<br/>
{{</rawhtml>}}

Couple of images :)

![SRECon19 Image 2](/assets/images/srecon-1.jpeg)

![SRECon19 Image 1](/assets/images/srecon-2.jpeg)
