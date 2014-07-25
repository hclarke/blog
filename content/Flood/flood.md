Title: snakes on a real projective plane
Date: 2014-07-25 14:00
Tags: snakes, waves
Category: demos
Slug: snakes-on-a-real-projective-plane
Summary: snakes on a real projective plane

<div style="text-align:center;">
<canvas id="flood" width="512" height="512" class="update mouse"></canvas>
</div>

<script id="frag-inc" class="slinc" type="x-shader/x-fragment">
precision mediump float;

float gamma(float x) {
    if(x >= 0.0031308) {
        return pow(x, 1.0/2.4) * 1.055 - 0.055;
    }
    else {
        return x * 12.92;
    }
}

vec3 RGBTosRGB(vec3 c) {
    return vec3(gamma(c.x), gamma(c.y), gamma(c.z));
}
vec3 XYZToRGB(vec3 c) {
    vec3 rt = vec3(3.2406, -1.5372, -0.4986);
    vec3 gt = vec3(-0.9689, 1.8758, 0.0415);
    vec3 bt = vec3(0.0557, -0.2040, 1.0570);
    return vec3(dot(c,rt), dot(c,gt), dot(c,bt));
}

vec3 xyYToXYZ(vec3 c) {
    float x = c.x;
    float y = c.y;
    float Y = c.z;
    return vec3(Y/y*x, Y, Y/y*(1.0-x-y));
}

vec3 YuvToXYZ(vec3 c) {
    float X = c.x * (9.0*c.y)/(4.0*c.z);
    float Z = c.x * (12.0-3.0*c.y-20.0*c.z) / (4.0*c.z);
    return vec3(X, c.x, Z);
}
vec3 whitePointYuv = vec3(1, 0.19784, 0.46834);

vec3 LUVToYuv(vec3 c) {
    vec3 w = whitePointYuv; 
    float u = c.y / (13.0 * c.x) + w.y;
    float v = c.z / (13.0 * c.x) + w.z;
    float Y = c.x <= 8.0 ?
        w.x * c.x * pow(3.0/29.0, 3.0) :
        w.x * pow((c.x+16.0)/116.0, 3.0);
    return vec3(Y,u,v);
}

vec3 HCLToLUV(vec3 c) {
    float u = c.y * cos(c.x);
    float v = c.y * sin(c.x);
    return vec3(c.z, u, v);
}


float maxChroma(vec2 hl) {
    vec3 M[3];

    M[0]=vec3(3.2406, -1.5372, -0.4986);
    M[1]=vec3(-0.9689, 1.8758,  0.0415);
    M[2]=vec3(0.0557, -0.2040,  1.0570);

    vec3 w = whitePointYuv;
    float wu = w.y;
    float wv = w.z;

    float h = hl.x;
    float l = hl.y;
    float sh = sin(h);
    float ch = cos(h);
    float Y = l < 8.0 ? 
        l * pow(3.0/29.0, 3.0) :
        pow((l+16.0)/116.0, 3.0);
    Y *= w.x;
    float A = ch / (13.0 * l);
    float B = sh / (13.0 * l);

    float r = 10000.0;
    for (int i = 0; i < 3; ++i) {
        vec3 m = M[i] * Y;

        float cpart = dot(m, vec3(9.0 * A, 4.0 * B, -3.0 * A - 20.0 * B));
        float hlpart = dot(m, vec3(9.0 * wu, 4.0 * wv, 12.0 - 3.0 * wu - 20.0 * wv));

        for (float j = 0.0; j <= 1.0; ++j) {
            //solve

            float xleft = j * 4.0 * B;
            float left = j * 4.0 * wv;

            xleft -= cpart;
            left -= hlpart;

            float c = -left/xleft;

            if (c >= 0.0 && c < r) {
                r = c;
            }
        }
    }
    return r-0.1;
}

vec3 HCLTosRGB(vec3 c) {
    c.y = min(c.y, maxChroma(c.xz));
    c = HCLToLUV(c);
    c = LUVToYuv(c);
    c = YuvToXYZ(c);
    c = XYZToRGB(c);
    c = RGBTosRGB(c);
    return c;
}

</script>

<script id="drawFlood-fs" type="x-shader/x-fragment">
	varying vec2 position;
	uniform sampler2D state;
	uniform float time;
	void main(void) {
		vec4 state = texture2D( state, position, -100.0 );
		float x = state.x;
		float t = time / 30.0;
		vec3 hcl = vec3(t*6.28, 35.0, x*50.0+50.0);
		if(state.w != 0.0) {
			hcl.y *= 3.0;
			hcl.z = 85.0;
		}
		vec3 c = HCLTosRGB(hcl);
		gl_FragColor = vec4(c, 1.0);
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
	vec4 rand( vec2 p) {
		p = floor(p*256.0)/256.0;
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
		return getCell(start*canvasSize, step*canvasSize)/canvasSize;
	}

	float getWave(vec4 state, vec4 last, vec4 sr, vec4 sl, vec4 su, vec4 sd) {
		if(mouseState.z == 1.0 && floor(mouseState.xy) == floor(position*canvasSize)) return -1.0;
		if(state.z > 0.0) return state.y;
		float blur = sr.x + sl.x + su.x + sd.x;
			blur = blur / 2.0;

		return (blur-last.x)*0.97;
	}


	vec3 getSnake(vec4 state, vec4 last, vec4 sr, vec4 sl, vec4 su, vec4 sd) {
		float s = state.z - 1.0;
		if(s < 0.0) s = 0.0;
		vec3 ns = vec3(s, 0.0, state.y);
		if(sr.w == 1.0) {
			if(ns.x == 0.0) ns = sr.zwy;
			else ns.y = 0.0;
		}
		if(sl.w == 3.0) {
			if(ns.x == 0.0) ns = sl.zwy;
			else ns.y = 0.0;
		}
		if(su.w == 2.0) {
			if(ns.x == 0.0) ns = su.zwy;
			else ns.y = 0.0;
		}
		if(sd.w == 4.0) {
			if(ns.x == 0.0) ns = sd.zwy;
			else ns.y = 0.0;
		}

		if(ns.y != 0.0) {
			vec4 r = rand(position + rand(vec2(time,time)).xy);
			if(r.x < 0.01) {
				ns.y -= 1.0;
				if(ns.y == 0.0) ns.y = 4.0;
			}
			else if(r.x < 0.02) {
				ns.y += 1.0;
				if(ns.y > 4.0) ns.y = 1.0;
			}
		}

		if(ns.x == 0.0) {
			float t = time*256.0;
			float tv = floor(time);
			float tu = t-tv;
			vec4 r = rand(vec2(tu/256.0, tv));
			if(r.z < 0.1) {
				vec2 rp = floor(r.xy * canvasSize);
				if(floor(rp) == floor(position*canvasSize)) {
					float d = floor(r.z*4.0)+1.0;
					ns = vec3(50.0 + 400.0 * r.w, d, rand(position).x * 0.8 + 0.2);
				}
			}
		}

		return ns;
	}

	void main(void) {
		vec2 p = position;
		vec2 cell = floor(p*canvasSize);


    	vec2 rp = position * canvasSize;
    	vec2 rm = mouseState.xy;

    	vec4 cur = texture2D( current, p, -100.0);
    	vec4 last = texture2D(prev, p, -100.0);
		vec3 o = vec3(1.0/canvasSize.x, 1.0/canvasSize.y,0.0);
		vec4 sr = texture2D( current, getPos(p, + o.xz), -100.0 );
		vec4 sl = texture2D( current, getPos(p, - o.xz), -100.0 );
		vec4 su = texture2D( current, getPos(p, + o.zy), -100.0 );
		vec4 sd = texture2D( current, getPos(p, - o.zy), -100.0 );

    	float wave = getWave(cur, last, sr, sl, su, sd);
    	vec3 snake = getSnake(cur, last, sr, sl, su, sd);

    	gl_FragColor = vec4(wave, snake.z, snake.x, snake.y);
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