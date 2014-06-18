Title: colours
Date: 2014-06-17 4:00
Tags: graphics, colour
Category: graphics
Slug: colours
Summary: colours

<div style="text-align:center;">
<canvas id="colours" width="500" height="500" style="margin:auto;" class="shader-demo update mouse"></canvas>
</div>
<script id="colours-fs" type="x-shader/x-fragment">
precision mediump float;
uniform sampler2D randTex;
uniform float time;

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

vec3 HCLTosRGB(vec3 c) {
	c = HCLToLUV(c);
	c = LUVToYuv(c);
	c = YuvToXYZ(c);
	c = XYZToRGB(c);
	return RGBTosRGB(c);
}

vec4 rand( vec2 p, float t ) {
    vec4 r = texture2D( randTex, p/256.0, -100.0 );
    return sin(r*(7.0+t)) * 0.5 + 0.5;
}

varying vec2 position;
uniform vec2 canvasSize;
uniform vec3 mouseState;
uniform vec3 primaryColour;
uniform float colourSplit;

void voronoi( in vec2 x, out vec4 dists) {
    vec2 xcell = floor(x);
    vec2 xoffset = fract(x);

    vec4 bestSqrDist = vec4(8,8,8,8);
    for( float j = -2.0; j <= 2.0; j++ )
    for( float i = -2.0; i <= 2.0; i++ )
    {
        vec2 relativeCell = vec2(i,j);
        vec2 currentCell = relativeCell + xcell;
		vec2 offset = rand(currentCell, time).xy;
        vec2 relativePoint = relativeCell + offset - xoffset;
        float sqrDist = dot(relativePoint,relativePoint);

        if( sqrDist < bestSqrDist.w ) {
        	bestSqrDist.w = sqrDist;
        }
		if( sqrDist < bestSqrDist.z ) {
			bestSqrDist.w = bestSqrDist.z;
        	bestSqrDist.z = sqrDist;
        }
        if( sqrDist < bestSqrDist.y ) {
			bestSqrDist.z = bestSqrDist.y;
        	bestSqrDist.y = sqrDist;
        }
        if( sqrDist < bestSqrDist.x ) {
			bestSqrDist.y = bestSqrDist.x;
        	bestSqrDist.x = sqrDist;
        }

    }

    dists = sqrt(bestSqrDist);
}

vec2 distort(vec2 uv, out vec2 polar) {
	uv = uv * 2.0 - 1.0;
	float r = polar.x = sqrt(dot(uv,uv));
	float a = polar.y = atan(uv.y, uv.x);
	float d = r;
	uv *= 5.0;
	r *= 5.0;
	const float pi = 3.14;

	float x = uv.x;
	float y = uv.y;
	r = (1.0-d);
	r *= sin(time);
	float u = x*cos(2.0*r) - y*sin(2.0*r);
	float v = y*cos(2.0*r) + x*sin(2.0*r);
	return vec2(u,v)/r;
}
void main() {
	
	vec4 vdists;
	vec2 polar;
	vec2 distorted = distort(position, polar);
	voronoi(distorted, vdists);
	float p = dot(vdists, vec4(0,1,-1,0));
	vec3 c = primaryColour;
	float d = polar.x;
	d = (d-0.8)/0.2;
	d = min(1.0,  max(0.0, d));
	c.x += p * 3.14 * 0.5 * (1.0-d);
	c = HCLTosRGB(c);
	gl_FragColor = vec4(c,1.0);
}
</script>

<script id="colours-vs" type="x-shader/x-vertex">
    attribute vec2 vertex;
    varying vec2 position;
    void main(void) {
        position = vertex * 0.5 + 0.5;
        gl_Position = vec4(vertex, 0.0, 1.0);
    }
</script>


<script src="{dirname}colours.js"></script>
<script src="scripts/graphics.js"></script>