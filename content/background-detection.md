Title: background detection
Date: 2019-04-1 16:20
Tags: blag
Category: blag
Slug: background-detection
Summary: some js to detect when a window is in the background
Status: published

I was on Twitter (mistake, I know), and some people were concerned that chrome added a feature to detect when the window becomes hidden/visible. This was retweeted on my feed:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Today’s topic:<br><br>  Web pages can now detect when Chrome’s window is covered by another window<a href="https://t.co/F7crhNHmcU">https://t.co/F7crhNHmcU</a> <a href="https://t.co/ZLVNm13oNO">pic.twitter.com/ZLVNm13oNO</a></p>&mdash; Web Platform News (@WebPlatformNews) <a href="https://twitter.com/WebPlatformNews/status/1111304922514030593?ref_src=twsrc%5Etfw">March 28, 2019</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

People were saying that you should stop using chrome because of this!

I'm not sure what the concern is?

- an ad could pause when they were trying to avoid it
- Google doing anything = evil
- 👀they just don't like being watched 👀

But, I wrote some code to do this in all of the other browsers, too. I guess we should all quit the internet now (maybe not the worst idea)


# The Code

```js
var lastTime = null
var consecutiveTime = 0;

function update(time) {
  var delta = (time - lastTime) / 1000.0;
  lastTime = time;
  if(delta > 0.1) {
    consecutiveTime += delta;
    document.getElementById("look-time").textContent = consecutiveTime.toFixed(2);
  }
  else {
    consecutiveTime = 0;
  }
  requestAnimationFrame(update);
}

function start(time) {
    lastTime = time;
    requestAnimationFrame(update);
}

requestAnimationFrame(start);
```

# How it Works

The basic idea is that when you have another tab selected, or another window is blocking it, the `requestAnimationFrame` event stops firing (or happens much less frequently).

You can detect that by measuring the time between `requestAnimationFrame` events. It should be 60 Hz when it's in the foreground on most screens, but I'm leaving a margin of error and checking when it drops below 10 Hz. When it gets that slow, it's presumably running in the background (or your user is browsing on a potato)

Firefox still calls `requestAnimationFrame` events in the background, but much more slowly (once every couple seconds, it seems). To handle that, I'm summing up consecutive slow frames, rather than taking the most recent

btw, you looked away for <span id="look-time">0</span> seconds.

<script>
var lastTime = null
var consecutiveTime = 0;

function update(time) {
  var delta = (time - lastTime) / 1000.0;
  lastTime = time;
  if(delta > 0.1) {
    consecutiveTime += delta;
    document.getElementById("look-time").textContent = consecutiveTime.toFixed(2);
  }
  else {
    consecutiveTime = 0;
  }
  requestAnimationFrame(update);
}

function start(time) {
    lastTime = time;
    requestAnimationFrame(update);
}

requestAnimationFrame(start);
</script>
