Title: capture the GIF
Date: 2016-04-15 19:30
Tags: tools
Category: tools
Slug: capture-the-gif
Summary: capturing animated GIFs from unity

Many moons ago, I noticed a lack of tools for recording animated GIFs in Unity. So, I did the obvious thing and made one. We (Duaelist studios) released it in the Unity asset store, mostly as a way to learn how the asset store worked. Last week, I took over maintenance of the project, and I want to tell y'all about some of the things I learned, both about the Asset Store, and animated GIFs.

If you're just looking for the asset, find it [here](https://www.assetstore.unity3d.com/en/#!/content/59922).

# The Store

## Stores have a bureaucratic barrier to entry

Unity's asset store, Apple's app store, Google's Play store, and other online stores have guidelines. If you don't follow those guidelines, you don't get in. It takes (a small amount of) time to fill out the paperwork, and it gets sent back if you do it wrong.

This doesn't prevent you from submitting garbage and getting it in the store, and it probably wards away some good projects done by bureauphobic geniuses. I think these hoops are probably mostly a benefit anyway; if a project isn't worth the paperwork, it's probably not worth buying, and you can stick it on github instead.

There are two levels of barrier: first the robot, then the human.

The robot checks your work immediately, and mostly just makes sure that your store images are the correct size, your product description exists, etc. 

Once your package passes the robot's inspection, it gets sent off to a queue for some other robots and their helper human to check it over. The team will make sure you're not blatantly violating someone's intellectual property, cussing at minors, or delivering a product that will immediately erase your hard drive. They'll also check that your store images fit the style guide, and your description isn't lorem ipsum. It takes a a couple weeks.

## Updates are slow

Updates to your package are also subjected to the bureaucratic barrier. Most of your work is already done (the store images, description, etc.), but it still has to go through the process of some human making sure it's not completely broken, violating someone's copyright, etc. As a result, any updates are going to take a week or three to hit the store.

# GIFs

## Picking a palette is hard

For each frame of the GIF, you need to find 256 colours that best represent the source frame. I went with [NeuQuant](http://members.ozemail.com.au/~dekker/NEUQUANT.HTML), which is a [self-organizing map](https://en.wikipedia.org/wiki/Self-organizing_map) based approach that produces good colours, and has the side bonus of making typical images compress more easily. The downside is that it's somewhat slow.

Other common techniques:

- use a kd-tree or an octree, and assign colours in a breadth-first manner. faster, but worse colours
- use some k-means clustering algorithm. horribly slow, but should give good colours.
- use a preset palette, and look like 1980

## Truecolour vs Animation

You can have a GIF that has more than 256 colours, and you can have an animated GIF, but you can't have both. They both rely on the same system of frames, one uses them spatially, the other uses them temporally.

## you're pronouncing GIF wrong

I don't care how you're saying it; [It's wrong](https://en.wikipedia.org/wiki/Religious_war).

# Recording games

## Time travel is your friend

The initial release came with a script to record the next X seconds when you trigger it. In a patch, I added a script to record the *previous* X seconds when you trigger it. This is really handy, because you typically want to record what led up to some interesting event, not what happened right after.

It works by constantly recording into a buffer of frames, and saving them when you trigger it.

## Threads are your friend

Processing the images is slow. I worked around that by tossing it on a separate thread so that it doesn't block the game loop.

## Wait until the end

Pulling images from the graphics card into RAM is also slow. You don't want hitches in your gameplay, especially if you throught it was interesting enough to record. So, I made it leave the frames on the GPU side until all of them were captured before starting to pull them back to the CPU side. This way, if it does cause hitches, it won't be visible in the GIF.