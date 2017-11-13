Title: hey, listen!
Date: 2017-11-12 20:00
Tags: blag
Category: blag
Slug: hey-listen
Summary: listening to recursive sequences from wolfram's "A New Kind of Science"
Status: published

I started reading Stephen Wolfram's "A New Kind of Science" a few days ago, and when I got to [page 130](http://www.wolframscience.com/nks/p130--recursive-sequences/), I thought, "hey, those look like audio".

So I wrote a [c program](https://gist.github.com/hclarke/4be53b38786653cda5339d3e20ab44ef) to turn a few of them into wav files: [c](new_science/c.wav), [e](new_science/e.wav), [f](new_science/f.wav)

(run the program like `a.out c > c.wav`)

The basic idea of these sequences is similar to fibonacci numbers, except instead of looking a fixed amount back, they look back a variable amount based on previous values. perhaps more sequences like this sound interesting!

Also, I've been programming for about 10 years now, and I think this is the first time I've written a C program that's compiled and run and did (at least close enough to) what I wanted it to do on the first try.
