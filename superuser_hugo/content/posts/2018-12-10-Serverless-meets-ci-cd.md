---
id: 181210
title: 'Serverless Meets CI/CD'
author: sanket
layout: single
date: 2018-12-10
guid: https://superuser.blog/?p=181210
permalink: /serverless-meets-ci-cd/
header:
  overlay_image: /assets/images/lspe_1.jpeg
  overlay_filter: rgba(10, 10, 10, 0.55)
  show_overlay_excerpt: false
categories:
  - python
  - aws
  - public speaking
---

I have been attending [LSPE [Large Scale Production Engineering] Meetup](https://www.meetup.com/lspe-in/events/qvgqgdyxqblb/) for last two years. And for the last one, I decided to give it back to the community. I conducted a hands-on session titled:

# Serverless meets CI/CD

The session briefly introduced what is Serverless and CD/CD and why should you be concerned about it. We then went hands-on with AWS Lambda as serverless platform and Bitbucket Pipelines for CI/CD. Started from making a Hello World! flask app and using `zappa` we deployed it on AWS Lambda. Then introduced Bitbucket Pipelines and using it, we enabled CI/CD. So what we achieved in the end was the fully automated pipeline that would deploy the flask app to AWS Lambda with just a commit in Bitbucket repo. 

**Attaching a Wiki/HowTo step-by-step guide as well here along with slides.**

 - Slides: [Serverless Meets CI/CD](https://docs.google.com/presentation/d/1FuqHG3Dr7fm9g2yyrNsqeKJtl22esPjjZvxlSb7jljc/edit?usp=sharing) 
 - GitHub Wiki: [github.com/sanketplus/serverless-python](https://github.com/sanketplus/serverless-python/wiki/Serverless-meets-CI-CD)

Couple of images :)

![LSPE Image 2](/assets/images/lspe_1.jpeg)

![LSPE Image 1](/assets/images/lspe.jpeg)
