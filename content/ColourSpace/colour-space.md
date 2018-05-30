Title: colour picker
Date: 2014-07-6 20:30
Tags: graphics, colour
Category: tools
Slug: colour-picker
Summary: colour picker

<div style="text-align:center;">


<div>
<canvas id="H-canvas" width="700" height="700" class="shader-demo update mouse"></canvas>
<br>
<p style="width:700px; height:40px; display:inline-block;" class="primary">primary</p>
<br>
<p style="width:350px; height:40px; display:inline-block;" class="secondary0">secondary0</p>
<p style="width:350px; height:40px; display:inline-block;" class="secondary1">secondary1</p>
<br>
<canvas id="S-canvas" width="700" height="60" class="shader-demo update mouse"></canvas>
</div>
</div>

#colour space

this is using the HCL colour space, which is a hue/chroma transformation of [CIELUV](http://en.wikipedia.org/wiki/CIELUV), which is a perceptually uniform colour space (meaning, distance between colours in the colour space line up with human perception of how different the colours are).

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

<script id="H-canvas-fs" type="x-shader/x-fragment">



varying vec2 position;
uniform vec2 canvasSize;
uniform vec3 mouseState;
uniform vec3 hclColour;

void main() {
    vec2 p = (position-0.5)*2.0;
    float r = length(p);
    float ringWidth = 0.1;
    if(r > 1.0-ringWidth && r < 1.0) {

        float l = hclColour.z;
        vec2 dir = position*200.0 - 100.0;
        float c = hclColour.y;
        float h = atan(dir.y, dir.x);
        if(h < 0.0) h += 3.14159*2.0;
        float h1 = hclColour.x;
        if(h1 < 0.0) h1 += 3.14159*2.0;
        float d = abs(h-h1);
        if(d > 3.14159) d = 3.14159*2.0-d;
        
        float rr = (1.0-r)/ringWidth;


        vec3 col = HCLTosRGB(vec3(h,c,l));

        if((rr < 0.3 || rr > 0.7) && d < 0.01) col = vec3(0,0,0);
        gl_FragColor = vec4(col,1.0);
        return;
    }
    vec2 bp = p*sqrt(2.0)*(1.0+ringWidth);
    bp = bp * 0.5 + 0.5;
    if(bp.x > 0.0 && bp.x < 1.0 && bp.y > 0.0 && bp.y < 1.0) {
        vec3 hcl = vec3(hclColour.x, bp.y * 200.0, bp.x * 100.0);
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
        return;
    }

    gl_FragColor = vec4(0.0,0.0,0.0,0.0);

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


<script id="L-canvas-fs" type="x-shader/x-fragment">



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

var HCanvas = document.getElementById("H-canvas");
var wasDown = false;
var clickSpot = null;
function updateH() {

    var canvas = HCanvas;
    var mstate = [canvas.mouseState[0] / canvas.gl.canvasSize[0], canvas.mouseState[1] / canvas.gl.canvasSize[1], canvas.mouseState[2]];
    
    if(!wasDown) {
        clickSpot = [mstate[0],mstate[1],mstate[2]];
    }
    wasDown = mstate[2] == 1.0;
    if(mstate[2] == 0.0) return;

    var p = [mstate[0] * 2.0 - 1.0, mstate[1] * 2.0 - 1.0];
    var r = Math.sqrt(dot(p,p));

    var sp = [clickSpot[0] * 2.0 -1.0, clickSpot[1] * 2.0 - 1.0];
    var sr = Math.sqrt(dot(sp,sp));

    var ringWidth = 0.1;
    if(sr > 1.0-ringWidth && sr < 1.0) {
        var a = Math.atan2(p[1], p[0]);
        hclColour[0] = a;
    }

    var bp = [
        p[0]*Math.sqrt(2.0)*(1.0+ringWidth) *0.5 + 0.5,
        p[1]*Math.sqrt(2.0)*(1.0+ringWidth) *0.5 + 0.5];
    var sbp = [
        sp[0]*Math.sqrt(2.0)*(1.0+ringWidth) *0.5 + 0.5,
        sp[1]*Math.sqrt(2.0)*(1.0+ringWidth) *0.5 + 0.5];

    if(sbp[0] > 0.0 && sbp[0] < 1.0 && sbp[1] > 0.0 && sbp[1] < 1.0) {
        hclColour[1] = bp[1] * 200;
        hclColour[2] = bp[0] * 100;
    }
    rebuildColour();
}

var SCanvas = document.getElementById("S-canvas");
function updateS() {
    var canvas = SCanvas;
    var mstate = [canvas.mouseState[0] / canvas.gl.canvasSize[0], canvas.mouseState[1] / canvas.gl.canvasSize[1], canvas.mouseState[2]];
    if(mstate[2] == 0.0) return;
    split = mstate[0];
    rebuildColour();

    
}

var storedSearch = "";
var updateCount = 0;
function updateAll() {

    
    var search = new URLSearchParams(window.location.search);

    //only update from URL if it changed
    if(window.location.search != storedSearch) {
        storedSearch = window.location.search;

        if ( search.has("H")) {
            hclColour[0] = parseFloat(search.get("H"));
        }
        if ( search.has("C")) {
            hclColour[1] = parseFloat(search.get("C"));
        }
        if( search.has("L")) {
            hclColour[2] = parseFloat(search.get("L"));
        }
        if ( search.has("split")) {
            split = parseFloat(search.get("split"));
        }
    }

    
    updateH();
    updateS();

    if(updateCount % 30 == 0) {
        search.set("H", hclColour[0].toString());
        search.set("C", hclColour[1].toString());
        search.set("L", hclColour[2].toString());
        search.set("split", split.toString());
        window.history.replaceState(null, null, '?' + search.toString());
        storedSearch = window.location.search;
    }

    updateCount += 1;
}


setInterval(updateAll, 1000/30);
</script>