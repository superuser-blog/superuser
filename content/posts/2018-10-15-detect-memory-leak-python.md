---
id: 181015
title: 'Detecting Memory Leak in Python'
author: Sanket
layout: single
date: 2018-10-15
guid: https://superuser.blog/?p=181015
slug: /detect-memory-leak-python/
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
tags:
  - python
---

In production, a memory leak will not always bubble up. And there could be multiple reasons behind it. You may not be getting enough traffic. Frequent deployments. No hard memory usage limit set. Or mix of them.

The flask app we had to debug had same characteristics. It never had huge surge of traffic and there would be multiple deployments over week. Although it had cgroup memory usage limit, it had some room to grow and the leak never appeared. Until we decided to implement cache warmer which would be generating significant traffic and there it goes, uWSGI processes getting killed by OOM Killer!

### Update:
I gave a talk at PyCon 2019 on the same subject, if you prefer detailed explanation in video format, checkout [PyCon19 India: Let's Hunt a Memory Leak](/posts/pycon-lets-hunt-memory-leak/) or just scroll down to the bottom of the page.

## A Word on Python Memory Management:
Python does memory management on its own and it's completely abstracted from user. It generally is not needed to know how is it done internally but when your workers are dying, you gotta know.

Apparently, when certain primitive types of object goes out of scope or you delete it explicitly with `del`, the memory is not released back to OS and it would still be accounted for the python process. The now free objects would go to something called `freelist` and would still stay on heap. It is cleared only when garbage collection of highest generation happens. [^1]

Here we are allocating list of ints and then explicitly deleting it. We will see mem usage with and without GC.
```python
import os, psutil, gc, time


l=[i for i in range(100000000)]
print(psutil.Process(os.getpid()).memory_info())
del l
#gc.collect()
print(psutil.Process(os.getpid()).memory_info())

```

The results would look like:
```bash
# without GC:
pmem(rss=3268038656L, vms=7838482432L, pfaults=993628, pageins=140)
pmem(rss=2571223040L, vms=6978756608L, pfaults=1018820, pageins=140)

# with GC:
pmem(rss=3268042752L, vms=7844773888L, pfaults=993636, pageins=0)
pmem(rss=138530816L, vms=4552351744L, pfaults=1018828, pageins=0)
```

Look that by deleting, we are going from 3.2G -> 2.5G so still a lots of stuff(mostly int objects) lying around heap. If we also trigger a GC, it goes from 3.2G -> 0.13G. So it memory was not given back to OS until a GC was triggered.

This is just an idea on how does python does memory management. Attaching some reference links as well for more details on how is memory management actually done.

## Confirm there's a leak:
To give bit more context on application which was leaking memory, it was a flask app with traffic mostly on one API endpoint with different parameters. 

With the basic knowledge of how python does memory management, we triggered explicit GC with each response sent back. Something like this:
```python
@blueprint.route('/app_metric/<app>')
def get_metric(app):
    
    response, status = get_metrics_for_app(app)
    gc.collect()
    return jsonify(data=response), status
```

Even with this gc collection, memory was still gradually increasing with traffic. Meaning? **IT'S A LEAK!!**

## Starting with heap dump:
So we had this uWSGI worker with high memory utilization. I was not aware of any memory profiler which would attach to a running python process and give real-time object allocations. I still am not aware of any such profiler. (A cool project idea?) So a heap dump was taken to analyze what all is lying there. Here's how it was done:

```bash
$> hexdump core.25867 | awk '{printf "%s%s%s%s\n%s%s%s%s\n", $5,$4,$3,$2,$9,$8,$7,$6}' | sort | uniq -c | sort -nr  | head

1209344 0000000000000000
 748192 0000000000000001
 200862 ffffffffffffffff
 177362 00007f01104e72c0
 169971
 145219 00007f01104e0c70
 140715 fffffffffffffffc
 138963 fffffffffffffffa
 136849 0000000000000002
  99910 00007f01104d86a0

```

It is number of symbols and symbol address mapping. To know what that object is actually:

```bash
$> gdb python core.25867
(gdb) info symbol 0x00007f01104e0c70
PyTuple_Type in section .data of /export/apps/python/3.6.1/lib/libpython3.6m.so.1.0
(gdb) info symbol 0x00007f01104d86a0
PyLong_Type in section .data of /export/apps/python/3.6.1/lib/libpython3.6m.so.1.0
```

So there are lot of tuples and longs (int objects) on the heap. So what? Heap dump does tell what is there on heap but it does not tell who put it there. So this was useless.

## Let's track memory allocations:
There was no other way but to track memory allocations. There are number of python modules available which helps you do that. But they need to be installed separately and since 3.4 python comes bundling `tracemalloc` [^2]. Tracemalloc tracks memory allocations and point it to line/module where object was allocated with size. You can also take snapshots at random point in code path and compare memory difference between those two points. 

Perfect! Since it's a flask app, it's supposed to be stateless and there should not be permanent memory allocations between API calls (which was not the case here). So how do we take snapshot of memory and track memory allocations between API calls, it's stateless.

For love of monkey-patching and the lack of time on Friday evening, this was the best I could come up with: Pass a query parameter in HTTP request which would take a snapshot. Pass a different parameter which would take another snapshot and compare it with the first one! Neat? Here's how it looks:

```python
import tracemalloc
tracemalloc.start()
s1=None
s2=None
...
@blueprint.route('/app_metric/<app>')
 def get_metric(app):
     global s1,s2
     trace = request.args.get('trace',None)

     response, status = get_metrics_for_app(app)

     if trace == 's2':
         s2=tracemalloc.take_snapshot()
         for i in s2.compare_to(s1,'lineno')[:10]:
             print(i)
     elif trace == 's1':
         s1=tracemalloc.take_snapshot()
     return jsonify(data=response), status

```

When `trace=s1` is passed with request, a memory snapshot is taken. When `trace=s2` is passed, another snapshot is taken and it is compared with the first snapshot. We will be printing the difference and that would tell who allocated how much memory between these two requests.

# Hello, leak!
The output of snapshot difference looked like this:
```bash
/<some>/<path>/<here>/foo_module.py:65: size=3326 KiB (+2616 KiB), count=60631 (+30380), average=56 B
/<another>/<path>/<here>/requests-2.18.4-py2.py3-none-any.whl.68063c775939721f06119bc4831f90dd94bb1355/requests-2.18.4-py2.py3-none-any.whl/requests/models.py:823: size=604 KiB (+604 KiB), count=4 (+3), average=151 KiB
/export/apps/python/3.6/lib/python3.6/threading.py:884: size=50.9 KiB (+27.9 KiB), count=62 (+34), average=840 B
/export/apps/python/3.6/lib/python3.6/threading.py:864: size=49.0 KiB (+26.2 KiB), count=59 (+31), average=851 B
/export/apps/python/3.6/lib/python3.6/queue.py:164: size=38.0 KiB (+20.2 KiB), count=64 (+34), average=608 B
/export/apps/python/3.6/lib/python3.6/threading.py:798: size=19.7 KiB (+19.7 KiB), count=35 (+35), average=576 B
/export/apps/python/3.6/lib/python3.6/threading.py:364: size=18.6 KiB (+18.0 KiB), count=36 (+35), average=528 B
/export/apps/python/3.6/lib/python3.6/multiprocessing/pool.py:108: size=27.8 KiB (+15.0 KiB), count=54 (+29), average=528 B
/export/apps/python/3.6/lib/python3.6/threading.py:916: size=27.6 KiB (+14.5 KiB), count=57 (+30), average=496 B
<unknown>:0: size=25.3 KiB (+12.4 KiB), count=53 (+26), average=488 B
```

Turns out, we had a custom module which we were using to make downstream calls to get data for response. That custom modules override the threadpool module to get profiling data ie: how much time did it take to do the downstream call. And for some reason, the result of profiling was appended to a list which was class variable! Which was 2600KB in size (the first line) and this was done for every incoming request. It looked something like this:
```python
class Profiler(object):
    ...
    results = []
    ...
    def end():
      timing = get_end_time()
      results.append(timing)
      ...
```

_**Guess who had a happy Friday! :D**_


[^1]: [gcmodule.c](https://github.com/python/cpython/blob/e42b705188271da108de42b55d9344642170aa2b/Modules/gcmodule.c#L933)
[^2]: [Tracemalloc](https://docs.python.org/3/library/tracemalloc.html)

Interesting reads:

1. [https://hbfs.wordpress.com/2013/01/01/python-memory-management-part-i/](https://hbfs.wordpress.com/2013/01/01/python-memory-management-part-i/)
2. [https://hbfs.wordpress.com/2013/01/08/python-memory-management-part-ii/](https://hbfs.wordpress.com/2013/01/08/python-memory-management-part-ii/)
3. [https://rushter.com/blog/python-memory-managment](https://rushter.com/blog/python-memory-managment)
4. [https://rushter.com/blog/python-garbage-collector](https://rushter.com/blog/python-garbage-collector)

## Recording of the talk:

{{<rawhtml>}}
 <iframe width="560" height="315" src="https://www.youtube.com/embed/s9kAghWpzoE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
{{</rawhtml>}}
