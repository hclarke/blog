function componentToHex(c) {
	c *= 256;
	c = Math.max(Math.min(Math.floor(c), 255), 0);
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function RGBTosRGB(c) {
    var outc = new Array(3);
    for(var i = 0; i < 3; ++i) {
        if(c[i] <= 0.0031308) {
            outc[i] = c[i]*12.92;
        }
        else {
            outc[i] = Math.pow(c[i], 1.0/2.4) * 1.055 - 0.055;
        }
    }
    return outc;
}
function sRGBToHex(c) {
    return "#" + componentToHex(c[0]) + componentToHex(c[1]) + componentToHex(c[2]);
}

function dot(x, y) {
	var r = 0;
	for(var i = 0; i < x.length && i<y.length; ++i) {
		r += x[i]*y[i];
	}
    return r;
}

function XYZToRGB(c) {
    var rt = [3.2406, -1.5372, -0.4986];
    var gt = [-0.9689, 1.8758, 0.0415];
    var bt = [0.0557, -0.2040, 1.0570];
    return [dot(c,rt), dot(c,gt), dot(c,bt)];
}

function xyYToXYZ(c) {
    var x = c[0];
    var y = c[1];
    var Y = c[2];
    return [Y/y*x, Y, Y/y*(1-x-y)];
}

function YuvToXYZ(c) {
    var X = c[0] * (9.0*c[1])/(4.0*c[2]);
    var Z = c[0] * (12.0-3.0*c[1]-20.0*c[2]) / (4.0*c[2]);
    if (isNaN(X)) X = 0;
    if (isNaN(Z)) Z = 0;
    return [X, c[0], Z];
}
var whitePointYuv = [1, 0.19784, 0.46834];

function LUVToYuv(c) {
    var w = whitePointYuv; 
    var u = c[1] / (13.0 * c[0]) + w[1];
    var v = c[2] / (13.0 * c[0]) + w[2];
    var Y = c[0] <= 8.0 ?
        w[0] * c[0] * Math.pow(3.0/29.0, 3.0) :
        w[0] * Math.pow((c[0]+16.0)/116.0, 3.0);
    return [Y,u,v];
}

function HCLToLUV(c) {
    var u = c[1] * Math.cos(c[0]);
    var v = c[1] * Math.sin(c[0]);
    return [c[2], u, v];
}

function XYZTosRGB(c) {
    return RGBTosRGB(XYZToRGB(c));
}
function RGBToHex(c) {
    return sRGBToHex(RGBTosRGB(c));
}
function XYZToHex(c) {
    return sRGBToHex(XYZTosRGB(c));
}
function xyYToRGB(c) {
    return XYZToRGB(xyYToXYZ(c));
}
function xyYTosRGB(c) {
    return RGBTosRGB(xyYToRGB(c));
}
function xyYToHex(c) {
    return sRGBToHex(xyYTosRGB(c));
}
function LUVToXYZ(c) {
    return YuvToXYZ(LUVToYuv(c));
}
function LUVToHex(c) {
    return XYZToHex(LUVToXYZ(c));
}
function HCLToHex(c) {
    return LUVToHex(HCLToLUV(c));
}
function HCLToLuv(c) {
    return LUVToYuv(c)
}
function YuvToRGB(c) {
    return XYZToRGB(YuvToXYZ(c));
}
function LUVToRGB(c) {
    return YuvToRGB(LUVToYuv(c));
}
function HCLToRGB(c) {
    return LUVToRGB(HCLToLUV(c));
}
function HCLToYuv(c) {
    return LUVToYuv(HCLToLUV(c));
}
function HCLToXYZ(c) {
    return YuvToXYZ(HCLToYuv(c));
}
var startTime = new Date().getTime();

var primaryColour = [0,50,50];
var secondaryColour0 = [0,50,50];
var secondaryColour1 = [0,50,50];

function changeColor() {
    var time = new Date().getTime() - startTime;
    time /= 1000;
    var h = time * 6.28 * 0.2;
    primaryColour = [h, 50, 50];
    var split = 0.2;
    var pHex = HCLToHex(primaryColour);
    document.body.style["backgroundColor"] = pHex;

    var h0 = h + 3.14 * (1-split);
    secondaryColour0 = [h0, 25, 75];
    var menu = document.getElementById("menu");
    menu.style.border = "7px solid " + HCLToHex(secondaryColour0);

    var h1 = h + 3.14 * (1+split);
    secondaryColour1 = [h1, 25, 75];
    var content = document.getElementById("content");
    content.style.border = "7px solid " + HCLToHex(secondaryColour1);

    var bg = document.getElementById("colours").parentNode;
    for(;bg;bg=bg.parentNode) {
        if(bg.style) bg.style["backgroundColor"] = pHex;
    }


    var bg = document.getElementById("colours").parentNode;
    for(;bg;bg=bg.parentNode) {
        if(bg.style) bg.style["backgroundColor"] = pHex;
    }
}

setInterval(changeColor, 1000/30);  