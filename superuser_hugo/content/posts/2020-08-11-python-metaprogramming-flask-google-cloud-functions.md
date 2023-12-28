---
id: 200811
title: "Python Metaprogramming: Functions, Flask and Google Cloud Functions"
author: sanket
date: 2020-08-11
layout: single
guid: https://superuser.blog/?p=200811
permalink: /python-metaprogramming-flask-google-cloud-functions
header:
  overlay_color: "#333"
  show_overlay_excerpt: false
categories:
  - python
---
Everything in Python is an object. And that includes functions. Let's see what I learned while I was trying to work with Google cloud functions with python runtime.

## Python Functions
Since functions too are objects, we can see what all attributes a function contains as following
```python
>>> def hello(name):
...     print(f"Hello, {name}!")
...
>>> dir(hello)
['__annotations__', '__call__', '__class__', '__closure__', '__code__', '__defaults__', '__delattr__', '__dict__',
'__dir__', '__doc__', '__eq__', '__format__', '__ge__', '__get__', '__getattribute__', '__globals__', '__gt__',
'__hash__', '__init__', '__init_subclass__', '__kwdefaults__', '__le__', '__lt__', '__module__', '__name__',
'__ne__', '__new__', '__qualname__', '__reduce__', '__reduce_ex__', '__repr__', '__setattr__', '__sizeof__', '__str__', 
'__subclasshook__']
```
While there are a lot of them, let's look at some interesting ones

### __globals__
This attribute, as the name suggests, has references of global variables. If you ever need to know what all global variables are in the scope of this function, this will tell you. See how the function start seeing the new variable in globals
```python
>>> hello.__globals__
{'__name__': '__main__', '__doc__': None, '__package__': None, '__loader__': <class '_frozen_importlib.BuiltinImporter'>, '__spec__': None, '__annotations__': {}, '__builtins__': <module 'builtins' (built-in)>, 'hello': <function hello at 0x7fe4e82554c0>}

# adding new global variable
>>> GLOBAL="g_val"
>>> hello.__globals__
{'__name__': '__main__', '__doc__': None, '__package__': None, '__loader__': <class '_frozen_importlib.BuiltinImporter'>, '__spec__': None, '__annotations__': {}, '__builtins__': <module 'builtins' (built-in)>, 'hello': <function hello at 0x7fe4e82554c0>, 'GLOBAL': 'g_val'}
```

### __code__
This is an interesting one! As everything in python is an object, this includes the bytecode too. The compiled python bytecode is a python code object. Which is accessible via `__code__` attribute here. A function has an associated code object which carries some interesting information.
```python
# the file in which function is defined
# stdin here since this is run in an interpreter
>>> hello.__code__.co_filename
'<stdin>'

# number of arguments the function takes
>>> hello.__code__.co_argcount
1

# local variable names
>>> hello.__code__.co_varnames
('name',)

# the function code's compiled bytecode
>>> hello.__code__.co_code
b't\x00d\x01|\x00\x9b\x00d\x02\x9d\x03\x83\x01\x01\x00d\x00S\x00'
```
There are more code attributes which you can enlist by `>>> dir(hello.__code__)`

### Function Attributes
This might sound weird at first but you can do `function_name.foo='bar'`, like it is an object! (it is, though) These are function attributes and it will be associated with the function.
```python
>>> hello.foo="bar"
>>> hello.foo
'bar'
```
How does this work? The famous `__dict__` attribute which carries these fellas.
```python
>>> hello.__dict__
{'foo': 'bar'}
```
I personally have not yet come across any use for this feature. There are some explained in this feature's proposal at [PEP 232](https://www.python.org/dev/peps/pep-0232/)

## The Cloud Functions

Cloud functions, as the name suggest, run a unit of code, that is a function. Here is what a Hello World would look like
```python
def hello_world(request):
    """Responds to any HTTP request.
    Args:
        request (flask.Request): HTTP request object.
    Returns:
        The response text or any set of values that can be turned into a
        Response object using
        `make_response <http://flask.pocoo.org/docs/1.0/api/#flask.Flask.make_response>`.
    """
    request_json = request.get_json()
    if request.args and 'message' in request.args:
        return request.args.get('message')
    elif request_json and 'message' in request_json:
        return request_json['message']
    else:
        return 'Hello World!'
```
A cloud function should be expecting a Flask's `request` object as a parameter. This function will be accessible under `https://<some-domain>.com/hello_world`. The endpoint name is the same as the function name

Now, of course, you won't have just one function and you would want to test/run these functions locally. **Since the injected `request` parameter is of flask, there needs to be a way to run this function with flask locally**

## Flask
While working with flask, functions are generally decorated with flask's `@app.route` decorator and flask would be injecting parameters to that functions if any. HTTP request's content is accessed by a global variable like `from flask import request` while the cloud function expects it as a parameter to function.

To overcome this, we can create a function that wraps the google cloud's above function. Something like
```python
from flask import Flask, request
app=Flask("test")
@app.route("/hello_world")
def hello_test():
    return hello_world(request)
```
Sweet! This works as expected. But there is one issue though. **If there are a lot of google functions, an equal number of test functions will be required.**

# Enters the Metaprogrammer
Python is a dynamic language, so let's make use of it. Here's the plan
 1. Discover the google functions dynamically
 2. Create wrapper function which generates flask compatible functions out of step 1 above
 3. Register them to our test flask app dynamically

### Let's Discover
If all the functions are in one file, discovering them would look like this. We import the module which contains all the functions, we go through each variable in that module and take a note of all the callable ones (ie: the functions)
```python
# suppose all the functions are defined in main.py
local_vars = importlib.import_module("main").__dict__
for name, value in local_vars.items():
    if callable(value):
        print(name)
```

### Wrapper function
GCF's function takes request as a parameter which would be incompatible with the function that flask's route decorator takes. For this, what we can do is create a wrapper function which will call our original google function. And original function takes imported `request` arg. So `make_function` here is a closure.

```python
from flask import request
app = flask.Flask(__name__)

def make_function(f):
    def _function():
        return f(request)
    return _function

wrapped_hello_world = make_function(hello_world)
```

### Register Routes
Once we have the wrapped function, we can register it with flask.

```python
app.route("/hello_world")(wrapped_hello_world)
```

This works well. But as soon as the second wrapper function is registered, it greets us with

```python
>>> app.route("/hi")(make_function(hi))
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/home/sanket/venv/lib/python3.8/site-packages/flask/app.py", line 1315, in decorator
    self.add_url_rule(rule, endpoint, f, **options)
  File "/home/sanket/venv/lib/python3.8/site-packages/flask/app.py", line 98, in wrapper_func
    return f(self, *args, **kwargs)
  File "/home/sanket/venv/lib/python3.8/site-packages/flask/app.py", line 1282, in add_url_rule
    raise AssertionError(
AssertionError: View function mapping is overwriting an existing endpoint function: _function
```

The error is saying a function called `_function` already exits for another endpoint. If you look closer, the wrapper returns a function named `_function` and Flask seems to be using function's name while registering routes. So we cannot have functions with the same name under different routes. Though functions returned by the `make_function` are different, they have the same name. 

Now scrolling back up, a function has an attribute called `__name__`. Flask would be using this to get the function's name. Since we know functions we return are different functions, we can change the function's name before returning it.

```python
def make_function(f):
    def _function():
        return f(request)
    
    _function.__name__ = f.__name__
    
    return _function
```

And then it goes smooth!

So here is the final version

```python
import importlib
from flask import request
app = flask.Flask(__name__)

def make_function(f):
    def _function():
        return f(request)
    # setting the name correctly so that flask does not complain
    _function.__name__ = f.__name__
    return _function

local_vars = importlib.import_module("main").__dict__
for name, value in local_vars.items():
    if callable(value):
        app.route(f"/{name}")(make_function(value))

app.run()
```

Oh and later one day I realized [functools.wraps](https://docs.python.org/3/library/functools.html#functools.wraps) also renames the function along with couple other things.