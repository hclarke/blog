Title: rain?
Date: 2014-07-31 12:15
Tags: waves
Category: demos
Slug: rain
Summary: not really rain

<div style="text-align:center;">
<canvas id="flood" width="512" height="512" class="update mouse"></canvas>
</div>

try drawing

<script id="frag-inc" class="slinc" type="x-shader/x-fragment">
precision mediump float;
</script>

<script id="drawFlood-fs" type="x-shader/x-fragment">
	varying vec2 position;
	uniform sampler2D state;
	uniform float time;
	void main(void) {
		vec4 state = texture2D( state, position, -100.0 );
		float x = abs(state.x);
		gl_FragColor = vec4(0.0,0.0,0.0, x);
	}

</script>

<script id="drawFlood-vs" type="x-shader/x-vertex">
    attribute vec2 vertex;
    varying vec2 position;
    void main(void) {
        position = vertex * 0.5 + 0.5;
        gl_Position = vec4(vertex, 0.0, 1.0);
    }
</script>

<script id="stepFlood-fs" type="x-shader/x-fragment">
	varying vec2 position;
	uniform sampler2D current;
	uniform sampler2D prev;
	uniform vec2 canvasSize;
	uniform vec3 mouseState;


	uniform sampler2D randTex;
    uniform vec2 randTex_size;
	vec4 rand( vec2 p) {
		p = floor(p*randTex_size)/randTex_size;
    	vec4 r = texture2D( randTex, p, -100.0 );
    	return r;
	}
	uniform float time;

	vec2 getCell(vec2 start, vec2 step) {
		start += step;
		start = floor(start);
		if(start.x < 0.0 || start.y < 0.0 || start.x >= canvasSize.x || start.y >= canvasSize.y) {
			start = canvasSize - start;
		}
		return start;
	}

	vec2 getPos(vec2 start, vec2 step) {
		return getCell(start*canvasSize, step)/canvasSize;
	}

	vec4 getWave(vec4 state, vec4 last, vec4 sr, vec4 sl, vec4 su, vec4 sd) {
		if(mouseState.z == 1.0 && floor(mouseState.xy) == floor(position*canvasSize) && length(mouseState.xy/canvasSize*2.0-1.0) < 0.8) return vec4(1.0,1.0,1.0,0.5) * 1.0;

        float t = time*256.0;
        float tv = floor(time);
        float tu = t-tv;
        vec4 r = rand(vec2(tu/256.0, tv));
        if(r.z < 0.8) {
            vec2 rp = floor(r.xy * canvasSize);
            if(length(r.xy*2.0-1.0) < 0.8 && floor(rp) == floor(position*canvasSize)) {
                return vec4(1.0,1.0,1.0,0.5) * 1.0;
            }
        }

		vec4 blur = (sr + sl + su + sd)*0.25;
        vec4 v = state-last;
		vec4 rain = (blur*2.0-last)*0.97;
        float drop = (state.w*2.0-last.w) * 0.97;
        if(abs(rain.x) < abs(drop)) rain.x = drop;
        return vec4(rain.xyz, drop);
	}


	void main(void) {
		vec2 p = position;
		vec2 cell = floor(p*canvasSize);


    	vec2 rp = position * canvasSize;
    	vec2 rm = mouseState.xy;

    	vec4 cur = texture2D( current, p, -100.0);
    	vec4 last = texture2D(prev, p, -100.0);
		vec3 o = vec3(1.0, 1.0,0.0);
		vec4 sr = texture2D( current, getPos(p, + o.xz), -100.0 );
		vec4 sl = texture2D( current, getPos(p, - o.xz), -100.0 );
		vec4 su = texture2D( current, getPos(p, + o.zy), -100.0 );
		vec4 sd = texture2D( current, getPos(p, - o.zy), -100.0 );

    	vec4 wave = getWave(cur, last, sr, sl, su, sd);

    	gl_FragColor = wave;
	}

</script>

<script id="stepFlood-vs" type="x-shader/x-vertex">
    attribute vec2 vertex;
    varying vec2 position;
    void main(void) {
        position = vertex * 0.5 + 0.5;
        gl_Position = vec4(vertex, 0.0, 1.0);
    }
</script>

<script src="scripts/colours.js" type="text/javascript"></script>
<script src="scripts/graphics.js" type="text/javascript"></script>
<script type="text/javascript">


var fn = function() {
    var canvas = document.getElementById("flood");
    initGL(canvas);
    var gl = canvas.gl;
    gl.num = i;
    initRandTexture(gl);
    var shader = initShaders(gl, "drawFlood");
    var square = { 
        strip : true,
        vertex : [
             1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
            -1.0, -1.0
        ],
    };
    var material = {
        shader : shader,                
    }
    gl.time = [0,0];

    var buffers = new Array(3);
    for(var i = 0; i < 3; ++i) {
    	buffers[i] = createRenderTexture(gl, 512, 512);
    }

    var bufferMaterial = {
    	shader: initShaders(gl, "stepFlood"),
    	blend:false,
    	zTest:false,
    };
    var bufferIndex = 0;
    canvas.update = function(dt) {
    	gl.canvasSize = [gl.canvas.width, gl.canvas.height];
        gl.time[0] += dt;
        gl.time[1] = dt;

        //step simupation
       	var target = buffers[bufferIndex];

        bufferMaterial.current = buffers[(bufferIndex+2)%3];
        bufferMaterial.prev = buffers[(bufferIndex+1)%3];
        drawMesh(gl, bufferMaterial, square, target);

        //draw to screen
        clearTarget(gl);
        material.state = target;
        drawMesh(gl, material, square);

        bufferIndex = (bufferIndex+1)%3;
    }
    canvas.update(0);
};
fn();


</script>