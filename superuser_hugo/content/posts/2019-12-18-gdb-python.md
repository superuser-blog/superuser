---
id: 191218
title: "Debugging a Running Python Process"
author: sanket
date: 2019-12-18
layout: single
guid: https://superuser.blog/?p=191218
permalink: /debug-running-python-process
header:
  overlay_image: assets/images/gdb-py.png
  overlay_filter: rgba(10, 10, 10, 0.55)  
  show_overlay_excerpt: false
categories:
  - python
  - linux
---

Only if it were as easy as installing debug symbols, attach the process with gdb and `py-bt`! So we have a python agent, which distributes files, running across the fleet. And on some random hosts, it went haywire! On those set of hosts, the process was using 100% of CPU and not doing anything meaningful work. Restarting the process fixes the problem. I had worked on [debugging a stuck process](/debugging-stuck-process-linux/), but this was the opposite. Time to dive deep.

# First Obvious Step: `strace`
```
...
open("/", O_RDONLY|O_CLOEXEC)           = 4
fstat(4, {st_mode=S_IFDIR|0555, st_size=4096, ...}) = 0
close(4)                                = 0
open("/", O_RDONLY|O_CLOEXEC)           = 4
fstat(4, {st_mode=S_IFDIR|0555, st_size=4096, ...}) = 0
close(4)                                = 0
open("/", O_RDONLY|O_CLOEXEC)           = 4
fstat(4, {st_mode=S_IFDIR|0555, st_size=4096, ...}) = 0
close(4)                                = 0
...
```
So for _some_ reason, the process is constantly opening root dir and calling fstat on it. Why? I don't know!

# `pdb`?
Cannot work, because
 1. I have not worked with it before (I really should)
 2. Problem is not reproducible, the 100% CPU usage appeared on random hosts so stopping a process is not an option.

# Attach `gdb` to the process?
Sure! I have heard it works with python too with extensions. There is this [official DebuggingWithGdb guide](https://wiki.python.org/moin/DebuggingWithGdb) which suggests vanilla steps of installing debug symbols with `yum` or `apt-get`. If life were that simple. The thing is we do not run on system python, the one that you find under /usr/bin/python. There is a separately compiled and packaged python installed on hosts at a non-standard location, so grabbing random debug symbols from the internet would not work.

Searched on slack chat history (poor man's stackoverflow!) if someone has tried this adventure earlier, and some people sure had. Got a link to debug symbol RPM from chat history and installed that

```bash
$ sudo yum install python37-debuginfo.x86_64
``` 

And to get where exactly did that RPM install the debug binary (remember custom in-house built python? It does not install files at any standard location)

```bash
$ sudo rpm -ql python37-debuginfo | less
```

Search for a `bin/python3.debug` or something similar in that. Once you get the path to debug binary, it would be as simple as this, right?

```bash
$ sudo gdb /usr/lib/debug/foo/bar/python/3.7.1/bin/python3.7.debug <PID>
```

Wrong! Turns out, when we attach gdb using that debug binary, it cannot load most symbols and errors out like 

```bash
$ sudo gdb /usr/lib/debug/foo/bar/python/3.7.1/bin/python3.7.debug <PID>
...
<http://www.gnu.org/software/gdb/bugs/>...
Reading symbols from /usr/lib/debug/foo/bar/python/3.7.1/bin/python3.7.debug...done.
Attaching to program: /usr/lib/debug/foo/bar/python/3.7.1/bin/python3.7.debug, process 3536
Reading symbols from /foo/bar/python/3.7.0/lib/libpython3.7m.so.1.0...(no debugging symbols found)...done.
Loaded symbols for /foo/bar/python/3.7.0/lib/libpython3.7m.so.1.0
Reading symbols from /lib64/libpthread.so.0...(no debugging symbols found)...done.
[Thread debugging using libthread_db enabled]
Loaded symbols for /lib64/libpthread.so.0
Reading symbols from /lib64/libdl.so.2...(no debugging symbols found)...done.
Loaded symbols for /lib64/libdl.so.2
Reading symbols from /lib64/libutil.so.1...(no debugging symbols found)...done.
Loaded symbols for /lib64/libutil.so.1
Reading symbols from /lib64/librt.so.1...(no debugging symbols found)...done.
Loaded symbols for /lib64/librt.so.1
Reading symbols from /lib64/libm.so.6...(no debugging symbols found)...done.
Loaded symbols for /lib64/libm.so.6
Reading symbols from /lib64/libc.so.6...(no debugging symbols found)...done.

Missing separate debuginfos, use: debuginfo-install python37_3_7_0-0.0.9-3.7.0.el6.x86_64

```

Despite given the debug binary, gdb somehow is not able to load symbols. Meaning python binary that is run as a process and the debug binary that we provided do not correspond to the same version or build of python. The command on the last line did not work either saying package not found. Let's first confirm the running python binary

```bash
$ ps auxww | grep <PID>
root      <PID> 81.1  0.0 227152 40560 ?        R    07:50 158:57 /foo/bar/python/3.7/bin/python3.7 /abc/def/python-app.pex

$ sudo yum whatprovides /foo/bar/python/3.7/bin/python3.7
python37_3_7_0-0.0.9-3.7.0.el6.x86_64 : Python 3.7.0 from straightforward source build
```
[On a side note, the running pex file is a PythonEXecutable, something like zipped virtualenv]

Apparently, the binary that runs python is 3.7.0 and build version 0.0.9 (not sure what exactly does that mean) and that version did not match with original debug binary I installed earlier. To find corresponding debug binary, which would not be available on the internet, I searched on local artifact store (remember `debuginfo-install` was not able to find it) where there was a promising-looking `python37-debuginfo_linux_rhel6_x86_64-0.0.9-3.7.0.el6.x86_64.rpm` which exactly corresponds to the binary version that process is running. Okay, now using same `rpm -ql` command we find the debug binary and run

```bash
$ sudo gdb /usr/lib/debug/foo/bar/python/3.7.0/bin/python3.debug <PID>
...
Reading symbols from /usr/lib/debug/foo/bar/python/3.7.0/bin/python3.debug...done.
Attaching to program: /usr/lib/debug/foo/bar/python/3.7.0/bin/python3.debug, process 3536
Reading symbols from /foo/bar/python/3.7.0/lib/libpython3.7m.so.1.0...Reading symbols from /usr/lib/debug/foo/bar/python/3.7.0/lib/libpython3.7m.so.1.0.debug...done.
done.
Loaded symbols for /foo/bar/python/3.7.0/lib/libpython3.7m.so.1.0
```

So that symbols are getting loaded. Now just run `py-bt` and get backtrace, right? Wrong!

```bash
(gdb) py-bt
Undefined command: "py-bt".  Try "help".
```

Okay, gdb. That was supposed to work! Why did it not? Turns out, all these [python related macros](https://fedoraproject.org/wiki/Features/EasierPythonDebugging#New_gdb_commands) does not come built-in but they are kind of added at runtime. CPython interpreter ships with a script that gdb loads and these python magic macros work. That script in an ideal world, loads automatically and you don't need to do anything. But remember where we live :) The script is called `python37-gdb.py` but it was for some strange reason not shipped with the debug binary installed. Again, in an ideal world, the script is supposed to come with the package and should be autoloaded. This is where you can get it from python source code [Tools/gdb/libpython.py](https://github.com/python/cpython/blob/v3.7.0/Tools/gdb/libpython.py) It is named a bit differently. During build time it gets renamed I guess. Anyway, here's how you load the file and then the macros would work! Yeeeey!!!

```bash
(gdb) source /path/to/libpython.py
```

Now process was getting paused at some memcpy function. **From original strace output it seemed to be getting stuck in an infinite open calls. So that's our pointer. We set a breakpoint at open call and then take a backtrace. And we get to know who's doing it!**

```bash
(gdb) break open
Breakpoint 1 at 0x3a60a0ef70
(gdb) c
Continuing.

Breakpoint 1, 0x0000003a60a0ef70 in open64 () from /lib64/libpthread.so.0
(gdb) py-bt
Traceback (most recent call first):
  <built-in method open of module object at remote 0x7fd738659db8>
  File "/foo/bar/python/3.7/lib/python3.7/zipfile.py", line 180, in is_zipfile
    with open(filename, "rb") as fp:
  File ".bootstrap/pex/third_party/__init__.py", line 104, in containing
  File ".bootstrap/pex/third_party/__init__.py", line 156, in _iter_importables
  (frame information optimized out)
  (frame information optimized out)
  <built-in method exec of module object at remote 0x7fd738709c28>
  (frame information optimized out)
  (frame information optimized out)
```

Cool stuff! We know form pex's third party module we're making those calls. Let's go frame by frame

```bash
(gdb) py-up
#12 Frame 0x7fd73546c230, for file /foo/bar/python/3.7/lib/python3.7/zipfile.py, line 180, in is_zipfile (filename='/', result=False)
    with open(filename, "rb") as fp:
(gdb) py-up
#15 Frame 0x7fd737c02d30, for file .bootstrap/pex/third_party/__init__.py, line 104, in containing (cls=<type at remote 0x26a2d48>, root='/abc/def/python-app.pex/.bootstrap', prefix='//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////...(truncated)
```

The second frame looks suspicious. The function `containing` has an argument prefix '/////////....' and we also saw in our initial strace output the program opening '/' repeatedly. So the dots connect. Next? Go to pex's github repo and search for reported issues and there indeed was [PR#638](https://github.com/pantsbuild/pex/pull/638) Here's the code snippet from the earlier version

```python
class _ZipIterator(namedtuple('_ZipIterator', ['zipfile_path', 'prefix'])):
  @classmethod
  def containing(cls, root):
    prefix = ''
    path = root
    while path:
      if zipfile.is_zipfile(path):
        return cls(zipfile_path=path, prefix=prefix + os.sep if prefix else '')
      prefix = os.path.join(prefix, os.path.basename(path))
      path = os.path.dirname(path)
    raise ValueError('Could not find the zip file housing {}'.format(root))
```

So this method is passed a zip argument (the pex python file) and `zipfile.is_zipfile` will return true and program proceeds happily. But when does it not, it modifies path as a parent dir using `os.path.dirname(...)` and while loop continues. The parent dir is not zip either, so it goes to its parent dir. And so it goes on till path is `/`. Now parent of `/` is `/` itself so while loop continues infinitely and we see 100% CPU usage and process doing nothing else. The issue is [explained here by author who raised a fix](https://github.com/pantsbuild/pex/pull/638/files#r273808423).

# The Root Cause
So ideally the zip (.pex) file is supposed to exist. This particular scenario happened while we were moving away from pex. We install a newer packaged file and restart the process. But for some reason (which we will not discuss here) the process was not getting killed and it continued running with a pex file which did not exist anymore (hence `is_zipfile` fails) because of the upgrade to new packaging.
