Title: background detection
Date: 2019-04-1 15:00
Tags: blag
Category: blag
Slug: background-detection
Summary: some js to detect when a window is in the background
Status: draft

I was on Twitter (mistake, I know), and saw some people concerned that chrome added a feature to detect when the window becomes hidden/visible. Presumably so that a video or something could pause when you switch tabs/windows.

People were saying that you should stop using chrome because of this

I'm not sure exactly what their reasoning is. But, here's a few lines of javascript to do the same thing that works in chrome, firefox, and edge (didn't test others):

```
var lastTime = null
var consecutiveTime = 0;

function update(time) {
  var delta = (time - lastTime) / 1000.0;
  lastTime = time;
  if(delta > 0.1) {
    consecutiveTime += delta;
    document.getElementById("look-time").textContent = consecutiveTime;
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

btw, you looked away for <span id="look-time">0</span> seconds.

<script>
var lastTime = null
var consecutiveTime = 0;

function update(time) {
  var delta = (time - lastTime) / 1000.0;
  lastTime = time;
  if(delta > 0.1) {
    consecutiveTime += delta;
    document.getElementById("look-time").textContent = consecutiveTime;
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
