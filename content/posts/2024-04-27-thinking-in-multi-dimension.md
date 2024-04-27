---
title: "Thinking in Multi Dimensions"
date: 2024-04-27
author: Sanket
layout: single
guid: https://superuser.blog/?p=211013
slug: /thinking-in-multi-dimensions/
cover:
  image: /assets/images/mulidimension.jpeg
tags:
  - AI
  - ML
ShowToc: true
---


*It's been a while since I've written something here. I joined Facebook back in Nov 2021 and since then I've been away from the Python/Linux/SRE domain and got deeper in facebook specific problems related to capacity management. The work involves full stack php-JS-React-GraphQL, the standard Facebook stack. While I am learning a lot of new things, I did not come across anything worth sharing here.*

### Why thinking in multi dimension?

2023 was the rise of LLMs. And that got me intrigued. I studied basic ML, including neural nets back in college but that was nothing practical or production grade. So this holiday season, I decided to dive deep again. I found great resources including the hugging face libraries and their [material](https://huggingface.co/docs/transformers/index), and the legendary [Neural Net Zero to Hero](https://github.com/karpathy/nn-zero-to-hero) from Andrej Karpathy. 

If you are familiar with the domain, especially around the training part, you'd have noticed model parameters often involve array that are 3 or 4 (or more) dimensional. Up to 2 dimensions it is easy to visualize and conceptualise, but I struggled to do the same for higher dimensions. As a result, various operations that are done on them, like [concatenation](https://pytorch.org/docs/stable/generated/torch.cat.html), [broadcasting](https://pytorch.org/docs/stable/notes/broadcasting.html) etc were not intuitive to begin with.


## A way to think about dimensions

A multi dimensional array is basically a bag of numbers*, arranged in a particular fashion. That's it, a bag of numbers. 

Given a multi dimensional array, we can look at its different properties. Let's take an example of a 3-dimensional, 2x3x5 array as an example.
```
[
  [
    [1,2,3,4,5],
    [1,2,3,4,5],
    [1,2,3,4,5]
  ],
  [
    [1,2,3,4,5],
    [1,2,3,4,5],
    [1,2,3,4,5]
  ],
]


This array basically arranged 30 numbers ranging from 1 to 5 in a particular structure.
```


**1. Number of Dimensions:** First property of a multi dimensional array is number of dimensions. In the example above, it has 3 dimensions. 

**2. Number of elements:** The number of total elements the array contains, calculated by multiplying the size of each dimension (2x3x5=30)

**3 The address:** Each number in the array has a unique address, and that address has components that are equal to the number of dimensions. 

### Real world multi dimensional objects

We can take house/street addresses and try to fit them into the framework above. Given address `1101 Dexter Ave N, Seattle, WA, US` 

We have the elements (buildings) which has a 5-dimensional address (Building/Block Number, Street Address, City, State, Country)

### In other words

**Multi dimensional array is basically a bag of numbers. The number of dimensions determines how many 'components' there will be in the address for each of those numbers in the bag. And size of each dimension will determine how many unique values will be there in each of those address components.**

Going back to the example above, each number will have a 3-component address: the first "5" in the array has 3 components the address `[0,0,4]`. The first dimension of size 2 means there will be 2 unique values in the first component of the address, eg `[0, X, X]` or `[1, X, X]`.

### Alternate way to look at it

Give a multi dimensional array of 2x3x5, there will be a regular array of size 5, which will be repeated 3 times in a parent array, and that array will be repeated 2 times in a grand-parent array.

## Operations

With the given way of thinking about multi dimensions, let's see how various operations work involving multi dimensional array. We will look at two but if you will be able to extrapolate the general idea to other operations.

### Concat
When concatenating two multi dimensional arrays, there are two requirements
1. The number of dimensions should be equal in both arrays (equal number of 'components' in the address)
2. The size of the dimension should be equal for all dimensions except for the dimension we're concatenating across.

**Generally speaking, concatenating two multi dimensional arrays means combining two bags of numbers in a bigger bag of numbers, and changing the address of numbers coming from the second bag.**

Examples:

**Concat: A[2x3x5] and B[2x3x7] across last dimension => C[2x3x12]**
Satisfies the first condition of having an equal number of dimensions (3). But we can only concat across the last dimension since the size of that dimension is not equal.

Operation: Take numbers from the second array, for all the numbers, increment the last component in their address by the size of the concat dimension if first array (5) . Eg: a number at address `[0,0,6]` in the B will now be located at `[0,0,11(6+5)]`. 

**Concat: A[2x5x5] and B[2x5x5] across second dimension => C[2x10x5]**
Similarly, doing the above operation would mean in the new combined array, modifying the address of elements in the second array's second dimension. Incrementing it by the size of the same (second) dimension in the first array (5). Eg: number at the address `[1,3,4]` will now be located at `[1,8(3+5),4] `
### Broadcasting (sum, mult, div etc)
When an operation is performed on a two multi dimensional arrays, and if their sizes are not equal, the operation still goes through by applying a specific mechanism of 'broadcasting' the numbers in missing dimensions.

To start with a simplest example, multiply A[2x3x1] with A[1x5]. Since neither the number of dimensions, nor size of those dimensions match, we have to apply rules of broadcasting before we can do the mathematics operation of multiplication. At this point, we do not know which numbers multiply with which.

1. Arrange dimensions to the right.
```
2 x 3 x 1
_ x 1 x 5
```

2. If one array is smaller, initialise that dimension with size 1 (eg: each address gets a '0' prepended to them. address [0,4] now becomes [0,0,4])
```
2 x 3 x 1
1 x 1 x 5
```
3. Ensure for each dimension, either the size of the dimension is the same, OR one of the dimensions is 1.
4. Create a new resultant array, each dimension's size is max across two arrays.
```
Result size: 2 x 3 x 5 ===> (max 2,1) x (max 3,1) x (max 1,5)
```
5. Multiply the numbers from two arrays to fill the result array. This is better explained mathematically
```
Result[x,y,z] = A[x',y',z'] x B[x',y',z']

where 
- x' <= Size(A/B's 1st dimension) == 1 ? 0 : x
- y' <= Size(A/B's 2nd dimension) == 1 ? 0 : y
- z' <= Size(A/B's 3rd dimension) == 1 ? 0 : z
```

The same broadcasting rules apply to other mathematical operations like addition, subtraction etc.
## Conclusion
I initially tried to spatially visualise the multiple dimensions, then I tried to conceptualise them as an array of array of array ... (and not spatial representation). Finally what helped me was letting go of the visual representations and embracing the mathematical representations with its properties (eg: number of dimensions, components in address etc) in mind. 

Hope this helps you too in some way :) 

\*it can be any element (strings, objects) but we're talking about numbers in the given context of ML.