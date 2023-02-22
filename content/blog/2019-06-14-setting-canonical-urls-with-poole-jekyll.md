---
title: Setting Cannonical Urls for Your Poole / Jekyll Blog
date: "2019-06-14"
tags:
  - seo
description: A simple, one line snippet that adds canonical urls to Jekyll blogs without the need for SEO gems to be installed.
---

## Setting a Canonical Url for your Poole or Jekyll Blog

I have started migrating some of my old posts over from Medium and the recent freeCodeCamp migrations from Medium means that some version of some of my posts now live in 3 places at the moment.

While I don't especially care for SEO on this blog, and have kept bells and whistles and sharing widgets off the blog, I still though it might be worth trying to set up canonical urls since working with static site generated blogs throws up interesting challenges like this occassionally.

It turns out that while Poole (the Jekyll 'butler' I use for this blog) doesn't support canonical urls straight out of the box, it is remarkably easy to set up by editing the `head.html` fragment.

I just wrote the following in `_includes/head.html`, and it works seamlessly for all posts:

```html
<link rel="canonical" href="https://blog.jacksonbates.com{{ page.url }}" />
```

Now to figure out how to update the canonical urls on Medium and freeCodeCamp News!

## Update

Actually, I'll delete them from Medium! Discoverability has tanked on Medium anyway since the paywall. Better to just jump ship all-together, I think.
