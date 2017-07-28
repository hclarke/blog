Title: recurse checkin
Date: 2017-07-27 22:50
Tags: blag
Category: blag
Slug: recurse-checkin
Summary: finally got my blog set up reasonably
Status: draft

Hey humans,

I've been at [recurse center](https://www.recurse.com/) for a few weeks now. 
It's taken me this long to write a post about it because my previous blogging method was:

- write a markdown post on my laptop
- build it with pelican to preview
- push to github for safe keeping
- push output folder to second git repo
- ssh into server
- pull second git repo, which apache serves to the world

The new way is:

- write a markdown post directly on github (or laptop if I feel like it)
- use github preview tab
- save the file

The setup is a bit of a dirty hack: I have a build script that pulls the git repo and, if it changed, runs pelican. It runs every minute, every hour, every day via crontab

So, you'll probably be hearing more from me in this format in the future!
