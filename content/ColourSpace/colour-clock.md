Title: HCLock
Date: 2014-09-7 23:30
Tags: graphics, colour, clock
Category: demos
Slug: HCLock
Summary: colourful clock

<div style="text-align:center;">


<div>
<canvas id="clock" width="700" height="700" class="shader-demo update mouse"></canvas>
</div>
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

<script id="clock-fs" type="x-shader/x-fragment">



varying vec2 position;
uniform vec4 clockTime;

vec4 getCol(float v, float width, float banding) {
    float t = -v-width;
    width += 0.001;
    banding += width + v;
    banding -= floor(banding);
    if(banding < width) {
        t += banding;
        banding = 0.5;
    }
    else {
        banding = 0.999;//(banding-width) / (1.0-width);
    }

    float h = t * 3.14159*2.0;
    float l = 30.0 + 20.0 * (banding-floor(banding));
    float c = min(maxChroma(vec2(h, l)), 50.0);
    return vec4(HCLTosRGB(vec3(h,c,l)), 1.0);
}
void main() {

    vec4 t = clockTime;
    vec4 ts = t;
    ts.z += ts.w;
    ts.y += ts.z / 60.0;
    ts.x += ts.y / 60.0;
    t /= vec4(12.0, 60.0, 60.0, 1.0);
    ts /= vec4(12.0, 60.0, 60.0, 1.0);
    vec4 rem = ts-t;
    float r = length(position);
    float a = atan(position.y, position.x) / (2.0 * 3.14159);
    a = a - 0.25;

    vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
    if(r > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
    else if(r < 0.9 && r > 0.8) {
        gl_FragColor = getCol(t.z, rem.z, a);
    }
    else if(r > 0.6 && r < 0.7) {
        gl_FragColor = getCol(t.y, rem.y, a);
    }
    else if(r > 0.4 && r < 0.5) {
        gl_FragColor = getCol(t.x, rem.x, a);
    }
    else {
        vec3 c = vec3(a*2.0*3.14159, 50.0, 40.0);
        c.y = min(c.y, maxChroma(c.xz));
        gl_FragColor = vec4(HCLTosRGB(c), 1.0);
    }

}
</script>
<script id="clock-vs" type="x-shader/x-vertex">
    attribute vec2 vertex;
    varying vec2 position;
    void main(void) {
        position = vertex;
        gl_Position = vec4(vertex, 0.0, 1.0);
    }
</script>

<script src="scripts/colours.js" type="text/javascript"></script>
<script src="scripts/graphics.js" type="text/javascript"></script>

<script type="text/javascript">
var clockTime = [0,0,0];
var split = 0.15;
var pHex;
var sHex0;
var sHex1;


function updateClock() {
    var now = new Date();

    var fract = now.getMilliseconds()/1000.0;
    var sec = now.getSeconds();
    var min = now.getMinutes();
    var hour = now.getHours();
    clockTime = [hour, min, sec, fract]
    console.log(clockTime);
}
setInterval(updateClock, 1000/30);

</script>