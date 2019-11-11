Title: fsck
Date: 2019-11-27 11:11
Tags: blag
Category: blag
Slug: fsck
Summary: I ruined it
Status: draft


My friend keeps a sheet of paper with two columns: lessons, and # of times learned

<div id="counts" class="p5"></div>

A few days ago, I thought it'd be a great idea to install linux on my laptop (a 2014 macbook pro, which has no ethernet port).
I'd use the fresh install to minimize distraction, and put creative software like [darktable](https://www.darktable.org/)
and [ORCA](https://100r.co/pages/orca.html) on it, and I'd be a wizard in no time.

The photos from my trip to dia:beacon have been collecting dust on my hard drive for weeks. I glanced through them, but Finder (osx)
is too slow and irritating to preview images. The pros use Adobe Bridge, and I heard that the cool kids use darktable. I was going to get it done.
I just needed to install an operating system, download the tools, configure it the way I like it, and get to work

The photos were going to be magnificent

<img src="{dirname}/steel.jpg">

I was getting more productive already: I was thinking about all these things while downloading elementary OS and upgrading etcher.
I picked up a USB stick on my way home (16gb, the finest $7.99 could buy), and had it installed that evening

Maybe this is the year of the linux desktop?

<div id="compy" class="p5"></div>

But there was a problem; The wifi wasn't working. It worked fine when running on the USB, so I know it has the drivers,
but why not after installing?

The next two days were filled with stackoverflow answers, `dpkg-scanpackages`, 
and booting up osx to look at the internet before diving back in.

I realized I was shaving a yak, booted up osx, deleted the linux partition, and formatted the USB stick so I wouldn't be tempted again.
Maybe next year

But something went *wrong*

<div id="glitch" class="p5"></div>

I couldn't resize my osx partition to use the whole drive. After fussing with it and adding/removing partitions, I decided to reboot

My heart stopped when it booted up grub. I tried again, and osx wasn't a boot option anymore!

I did an osx network boot, and my partition looked in-tact, but the boot loader couldn't find it. it's right there, dummy!

But then I noticed the partition's type was `FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF`, which is never a number I want to see.
I don't know what that means, but it's definitely wrong.

More stack overflow answers, but this time from my phone

It's telling me to edit the partition table with `gpt`. what am I doing? how did i get myself into this mess? I'm definitely losing all that data

So I delete my partition, and re-add it with the same offset and size, and a new type GUID. I typed everything carefully,
made the modifications that make sense for my system, and triple checked it

and it's still wrong

The bootloader can't find the partition. Disk Utility doesn't see it anymore

This is bad

<div id="worse" class="p5"></div>

Then I looked up the GUID partition table on wikipedia. Looks like I had the id for apple's older filesystem, and maybe I should be using the newer one

So I re-added the partition again, triple checking that I got the sizes right, and typed it in right

It worked!

<div id="bless" class="p5"></div>

I booted up osx, resized the partition, and vowed never to install linux on my primary hard drive until I forget this lesson again

Another lesson: tools matter, but not that much. Michael Jordan in crocs could still dunk on me

<div id="fin" class="p5"></div>


<style> 
.p5 {
	display: flex;
	justify-content: center;
}

.p5 canvas {
	border-radius: 1rem;
}

img {
	width: 50%;
	height: auto;
	margin-left: auto;
	margin-right: auto;
	display:block;
}

</style>

<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.9.0/p5.min.js"></script>
<script src="/scripts/colours.js"></script>
<script>
(function() {

	var makeSketch = function(target, draw, preload) {
		var sketch = function(p) {
			let e = document.getElementById(target);

			if(preload) {
				p.preload = function() {
					preload(p);
				}
			}

			p.setup = function() {

				let s = getComputedStyle(e)
				let w = parseInt(s.width)/2;
				if(preload) {
					p.createCanvas(w,w, p.WEBGL);
				}
				else {
					p.createCanvas(w,w);
				}
				p.background(0);
			}

			p.windowResized = function() {
				let s = getComputedStyle(e)
				let w = parseInt(s.width)/2;
				p.resizeCanvas(w, w);
			}
			p.draw = function() {
				draw(p);
			}
		}
		new p5(sketch, target);
	}



	makeSketch('counts', function(p) {
		let prevFrame = p.get();
		p.background(0);
		
		p.tint(255, 220);
		let s = 0.01;
		p.push();
		p.translate(p.width/2, p.height/2);
		p.rotate(p.PI * 0.005);
		p.translate(-p.width/2, -p.height/2);
		p.image(prevFrame, -p.width*s, -p.height*s, p.width * (1 + s*2), p.height * (1 + s*2));
		p.pop();

		p.tint(255,255);
		p.fill(255);
		p.textSize(p.height/2);
		p.textAlign(p.CENTER, p.CENTER);
		let f = performance.now() / 1000.0 * 12.0;
		p.text('' + Math.floor((f%100)/10) + Math.floor(f%10), p.width/2, p.height/2);
	})

	makeSketch('compy', function(p) {
		p.background(0);
		p.fill(255);

		let s = p.width / 24;
		let mx = p.width / 2;
		let my = p.height/2;
		p.rect(mx-s*6, my-s*6, s*12, s*10);
		p.rect(mx-s*2, my+s*4, s*4, s*1);
		p.rect(mx-s*3, my+s*5, s*6, s*1);

		p.fill(0);
		p.rect(mx-s*5, my-s*5, s*10, s*8);

		if(performance.now() % 1000 < 500) {
			p.fill(0, 255, 0);
			p.rect(mx-s*4, my-s*4, s*1, s*1);
		}
	})

	makeSketch('glitch', function(p) {
		let prevFrame = p.get();
		p.background(0);
		p.tint(255, 225);
		//p.image(prevFrame, -p.width * 0.01, -p.height * 0.01, p.width * 1.02, p.height * 1.02);
		p.image(prevFrame, 0,0,p.width,p.height);

		if(Math.random() > 0.1) {
			return;
		}

		let r = [0,0,p.width,p.height]
		for(let i = 0; i < 5 || Math.random() < 0.5; ++i) {
			let ri = i%2;
			if(Math.random() < 0.5) {
				r[ri] = (r[ri]+r[ri+2]) / 2;
			}
			else {
				r[ri+2] = (r[ri]+r[ri+2]) / 2;
			}
		}

		if(Math.random() < 0.5) {
			r = [r[1], r[0], r[3], r[2]];
		}

		let hcl = [Math.random() * p.PI * 2, 30, 90];
		hcl = CHCLToHCL(hcl);
		let rgb = HCLToRGB(hcl);
		p.fill(rgb[0] * 255, rgb[1] * 255, rgb[2] * 255);
		p.rect(r[0], r[1], r[2]-r[0], r[3]-r[1]);
	})

	makeSketch('worse', function(p) {
		p.background(0);
		p.fill(255);
		p.ellipse(p.width/2, p.height/2, p.width*0.75, p.width*0.75);

		p.fill(0);
		p.ellipse(p.width/2, p.height/2, p.width/5, p.width/5);


		for(let i = 0; i < 200; ++i) {
			let rand = Math.random();
			let a = rand * p.PI * 0.33 + p.PI * 0.125;
			let r = Math.random() * p.width*0.75 *0.5 * Math.sin(rand * p.PI);
			let x = p.width/2 + Math.cos(a) * r ;
			let y = p.height/2 - Math.sin(a) * r;
			p.line(p.width/2, p.height/2, x, y);
		}
		//p.noLoop();
	})

	makeSketch('bless', function(p) {
		
		let s = p.state.shader;
		p.shader(s);
		s.setUniform('time', performance.now()/1000.0);
		p.rect(0, 0, p.width, p.height);

	}, function(p) {
		p.state = {}
		p.state.shader = p.loadShader('{dirname}/quad.vert', '{dirname}/bless.frag');
	})

	makeSketch('fin', function(p) {
		p.background(0);
		p.fill(255);
		p.ellipse(p.width/2, p.height/2, p.width/4, p.width/4);
		p.fill(0);
		p.ellipse(p.width/2, p.height/2, p.width/4.5, p.width/4.5);
		p.noLoop();

	})
	
})()
</script>