Title: background detection
Date: 2019-04-1 15:00
Tags: blag
Category: blag
Slug: background-detection
Summary: some js to detect when a window is in the background
Status: draft

I was on Twitter (mistake, I know), and some people were concerned that chrome added a feature to detect when the window becomes hidden/visible. Presumably so that a video or something could pause when you switch tabs/windows.

People were saying that you should stop using chrome because of this!

I'm not sure what the exact concern is. But, you can do this in all of the other browsers, too
(I tested chrome, firefox, safari. Didn't test edge, ie, or opera, but suspect it works there, too)

Here's some code (explained below):

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
