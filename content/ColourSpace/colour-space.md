Title: colour picker
Date: 2014-07-6 20:30
Tags: graphics, colour
Category: toys
Slug: colour-picker
Summary: colour picker

<div style="text-align:center;">


<div>
<canvas id="LC-canvas" width="500" height="600" class="shader-demo update mouse"></canvas>
<br>
<canvas id="H-canvas" width="500" height="100" class="shader-demo update mouse"></canvas>
<br>
<canvas id="S-canvas" width="500" height="100" class="shader-demo update mouse"></canvas>
</div>


<div>
<p style="width:500px; height:40px; display:inline-block;" class="primary">primary</p>
<br>
<p style="width:250px; height:40px; display:inline-block;" class="secondary0">secondary0</p>
<p style="width:250px; height:40px; display:inline-block;" class="secondary1">secondary1</p>
</div>
</div>

#colour space

this is using the HCL colour space, which is a hue/chroma transformation of [CIELUV](http://en.wikipedia.org/wiki/CIELUV), which is a perceprually uniform colour space (meaning, distance between colours in the colour space line up with human perception of how different the colours are).

it's restricted to the colours that are in sRGB by treating hue and lightness as fixed, and clamping the chroma to be in range. see [here](http://cscheid.net/2012/02/16/hcl-color-space-blues.html) for an explanation of why it needs to be clamped.

#secondary colours

secondary colours are chosen by picking two colours of the same chroma and lightness, but with hue shifted. near the left of the slider, the secondary colours will be [split complementary](http://en.wikipedia.org/wiki/Color_scheme#Split-Complementary), and near the right, they will be [analogous](http://en.wikipedia.org/wiki/Color_scheme#Analogous_colors).

#colour names

i'm taking [this](http://xkcd.com/color/rgb.txt) big list of colours from a xkcd survey, transforming them to CIELUV, and then picking the nearest one to the selected colour.

there's some fun ones in there, like "ugly yellow" and "poop brown".

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

<script id="LC-canvas-fs" type="x-shader/x-fragment">



varying vec2 position;
uniform vec2 canvasSize;
uniform vec3 mouseState;
uniform vec3 hclColour;

void main() {
    vec3 hcl = vec3(hclColour.x, position.y * 200.0, position.x * 100.0);
    vec3 c = HCLTosRGB(hcl);

    vec2 diff = (hcl.yz - hclColour.yz) * vec2(1,2);
    float d =  dot(diff, diff);
    if(d > 1.0 && d < 2.0) {
         gl_FragColor = vec4(0,0,0,1);
    }
    else if(hcl.y > maxChroma(hcl.xz))  {
        gl_FragColor = vec4(c,0.0);
    }
    else {
        gl_FragColor = vec4(c, 1.0);
    }
}
</script>
<script id="LC-canvas-vs" type="x-shader/x-vertex">
    attribute vec2 vertex;
    varying vec2 position;
    void main(void) {
        position = vertex * 0.5 + 0.5;
        gl_Position = vec4(vertex, 0.0, 1.0);
    }
</script>

<script id="H-canvas-fs" type="x-shader/x-fragment">



varying vec2 position;
uniform vec2 canvasSize;
uniform vec3 mouseState;
uniform vec3 hclColour;

void main() {
    float h = position.x * 3.14*2.0;
    float l = hclColour.z;
    float c = hclColour.y;
    vec3 col = HCLTosRGB(vec3(h,c,l));
    float d = abs(h-hclColour.x);
    if((position.y < 0.4 || position.y > 0.6) && d < 0.03) col = vec3(0,0,0);
    gl_FragColor = vec4(col,1.0);
}
</script>
<script id="H-canvas-vs" type="x-shader/x-vertex">
    attribute vec2 vertex;
    varying vec2 position;
    void main(void) {
        position = vertex * 0.5 + 0.5;
        gl_Position = vec4(vertex, 0.0, 1.0);
    }
</script>

<script id="S-canvas-fs" type="x-shader/x-fragment">



varying vec2 position;
uniform vec2 canvasSize;
uniform vec3 mouseState;
uniform vec3 hclColour;
uniform float split;

void main() {
    float s = sign(position.y - 0.5);
    float h = hclColour.x + 3.14159 * (1.0 + s * position.x);
    float l = hclColour.z;
    float c = hclColour.y;
    vec3 col = HCLTosRGB(vec3(h,c,l));


    float d = abs(split-position.x);
    if((position.y < 0.4 || position.y > 0.6) && d < 0.005) col = vec3(0,0,0);
    gl_FragColor = vec4(col,1.0);
}
</script>
<script id="S-canvas-vs" type="x-shader/x-vertex">
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
var hclColour = [1,50,50];
var split = 0.15;
var pHex;
var sHex0;
var sHex1;

function colourByClass(c, hcl) {
    var blocks = document.getElementsByClassName(c);
    var hex = HCLToHex(hcl);
    var luv = HCLToLUV(hcl);
    var text = hcl[2] > 50 ? 'black' : 'white';

    var nearest = nearestXKCD(luv);
    for(var i = 0; i < blocks.length; ++i) {
        var b = blocks[i];
        b.style.backgroundColor = hex;
        b.style.color = text;
        b.innerHTML = hex + "<br>" + nearest.name;
    }
}
function rebuildColour() {
    var primary = CHCLToHCL(hclColour);
    hclColour = primary;
    pHex = HCLToHex(primary);

    var secondary0 = CHCLToHCL(hueShift(hclColour, (1+split)*0.5));
    sHex0 = HCLToHex(secondary0);
    var secondary1 = CHCLToHCL(hueShift(hclColour, (1-split)*0.5));
    sHex1 = HCLToHex(secondary1);

    document.body.style["backgroundColor"] = pHex;

    colourByClass("primary", primary);
    colourByClass("secondary0", secondary0);
    colourByClass("secondary1", secondary1);
}
rebuildColour();

var LCCanvas = document.getElementById("LC-canvas");
function updateLC() {
    var canvas = LCCanvas;
    var mstate = [canvas.mouseState[0] / canvas.gl.canvasSize[0], canvas.mouseState[1] / canvas.gl.canvasSize[1], canvas.mouseState[2]];
    if(mstate[2] == 0.0) return;
    hclColour[1] = mstate[1] * 200;
    hclColour[2] = mstate[0] * 100;
    rebuildColour();
}
setInterval(updateLC, 1000/30);

var HCanvas = document.getElementById("H-canvas");
function updateH() {
    var canvas = HCanvas;
    var mstate = [canvas.mouseState[0] / canvas.gl.canvasSize[0], canvas.mouseState[1] / canvas.gl.canvasSize[1], canvas.mouseState[2]];
    if(mstate[2] == 0.0) return;
    hclColour[0] = mstate[0] * 3.14159*2.0;
    rebuildColour();
}
setInterval(updateH, 1000/30);

var SCanvas = document.getElementById("S-canvas");
function updateS() {
    var canvas = SCanvas;
    var mstate = [canvas.mouseState[0] / canvas.gl.canvasSize[0], canvas.mouseState[1] / canvas.gl.canvasSize[1], canvas.mouseState[2]];
    if(mstate[2] == 0.0) return;
    split = mstate[0];
    rebuildColour();
}
setInterval(updateS, 1000/30);
</script>