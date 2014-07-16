function initGL(canvas) {    
   var gl;
   try {
       gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
       gl.clearColor(0.0, 0.0, 0.0, 0.0);
       gl.enable(gl.DEPTH_TEST);
       gl.enable(gl.BLEND);
       gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
       gl.projection = identity();
       gl.view = identity();
       gl.model = identity();
       var floatTextures = gl.getExtension('OES_texture_float');
       if (!floatTextures) {
           alert('no floating point texture support');
       }
   } catch (e) {
   }
   if (!gl) {
       alert("Could not initialise WebGL, sorry :-(");
    }
    canvas.gl = gl;
    gl.canvas = canvas;
}
function getText(id, done, preludeClass) {
    var element = document.getElementById(id);
    if (!element) {
        alert("shader missing")
        return null;
    }
    return getTextFromElement(element, done, preludeClass);
}
function getTextFromElement(element, done, preludeClass) {
    if(done[element.id] == true) {
        return "";
    }
    done[element.id] = true;
    var str = "";
    for(var k = element.firstChild;k;k=k.nextSibling) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
    }

    if(!done["__prelude__"]) {
        done["__prelude__"] = true;
        var elements = document.getElementsByClassName(preludeClass);
        for(var i = 0; i < elements.length; ++i) {
            var preludeStr = getTextFromElement(elements[i], done, preludeClass);
            str = preludeStr + "\n" + str;
        }
    }
    return str.replace(/#include (.*)/, function(_, n) {
        return getText(n,done) ;
    });
}
function getShader(gl, id) {
    var str = getText(id, {}, "slinc");
    var shader;
    if (id[id.length-2] == 'f') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (id[id.length-2] == 'v') {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        alert("wrong type")
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
function assignUniform(gl, program, uniform, data) {
    var id = uniform.id;
    switch(uniform.type) {
        case gl.FLOAT:
            var d = data;
            if(d[0] != null) d = d[0];
            gl.uniform1f(id, d);
            break;
        case gl.FLOAT_VEC2:
            gl.uniform2f(id, data[0], data[1]);
            break;
        case gl.FLOAT_VEC3:
            gl.uniform3f(id, data[0], data[1], data[2]);
            break;
        case gl.FLOAT_VEC4:
            gl.uniform4f(id, data[0], data[1], data[2], data[3]);
            break;
        case gl.FLOAT_MAT4:
            gl.uniformMatrix4fv(id, false, [
                data[0], data[4], data[8], data[12],
                data[1], data[5], data[9], data[13],
                data[2], data[6], data[10], data[14],
                data[3], data[7], data[11], data[15]]);
            break;
        case gl.SAMPLER_2D:
            var slotNum = uniform.textureSlot;
            var slot = gl["TEXTURE"+ slotNum.toString()];
            if(data.id == null) {
                var texture = gl.createTexture();
                data.id = texture;
                gl.activeTexture(slot);
                gl.bindTexture(gl.TEXTURE_2D, data.id);
                var arrayType = data.arrayType;
                if(arrayType == null) arrayType = gl.FLOAT;
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, data.width, data.height, 0, gl.RGBA, arrayType, new Float32Array(data));
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            }
            else {
                gl.activeTexture(slot);
                gl.bindTexture(gl.TEXTURE_2D, data.id);
            }
            gl.uniform1i(id, uniform.textureSlot);
            break;
        case gl.SAMPLER_CUBE:
            console.log("SAMPLER CUBE NOT IMPLEMENTED");
            break;
    }
}
function initShaders(gl, id) {
    var shaderProgram;
    var fragmentShader = getShader(gl, id+"-fs");
    var vertexShader = getShader(gl, id+"-vs");
    console.log(id);
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shaderProgram);
    var uniformCount = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
    shaderProgram.uniforms = new Array(uniformCount);
    var textureSlot = 0;
    for(var i = 0; i < uniformCount; ++i) {
        var uniform = gl.getActiveUniform(shaderProgram, i);
        if(uniform.type == gl.SAMPLER_2D) uniform.textureSlot = textureSlot++;
        uniform.id = gl.getUniformLocation(shaderProgram, uniform.name);
        shaderProgram.uniforms[i] = uniform;
    }
    var attribCount = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
    shaderProgram.attribs = new Array(attribCount);
    for(var i = 0; i < attribCount; ++i) {
        var attrib = gl.getActiveAttrib(shaderProgram, i);
        switch(attrib.type) {
        case gl.FLOAT:
            attrib.dataSize=1;
            break;
        case gl.FLOAT_VEC2:
            attrib.dataSize=2;
            break;
        case gl.FLOAT_VEC3:
            attrib.dataSize=3;
            break;
        case gl.FLOAT_VEC4:
            attrib.dataSize=4;
            break;
        }
        attrib.id = gl.getAttribLocation(shaderProgram, attrib.name);
        shaderProgram.attribs[i] = attrib;
    }
    return shaderProgram;
}
function initRandTexture(gl) {
    var data = [];
    for(var i = 0; i < 256*256*4; ++i) {
        var r = Math.random();
        data[i] = r;
    }
    data.width = data.height = 256;
    gl.randTex = data;
}
function drawMesh(gl, material, mesh) {
    var shader = material.shader;
    if(shader == null) return;
    gl.useProgram(shader);
    for(var i = 0; i < shader.uniforms.length; ++i) {
        var uniform = shader.uniforms[i];
        var name = uniform.name;
        var data = mesh[name];
        if(data == null) data = material[name];
        if(data == null) data = gl[name];
        if(data == null) data = gl.canvas[name];
        if(data == null) data = this[name];
        if(data == null) continue;
        assignUniform(gl, shader, uniform, data);
    }
    var vertexCount = 0;
    for(var i = 0; i < shader.attribs.length; ++i) {
        var attrib = shader.attribs[i];
        var name = attrib.name;
        var data = mesh[name];
        if(data == null) continue;
        var dynamic = mesh.dynamic == true;
        if(data.id == null) {
            data.id = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, data.id);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
        }
        else if(dynamic) {
            gl.bindBuffer(gl.ARRAY_BUFFER, data.id);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
        }
        else {
            gl.bindBuffer(gl.ARRAY_BUFFER, data.id);
        }
        gl.enableVertexAttribArray(attrib.id);
        gl.vertexAttribPointer(attrib.id, attrib.dataSize, gl.FLOAT, false, 0, 0);
        vertexCount = data.length / attrib.dataSize;
    }
    var triangles = mesh.triangles;
    var strip = triangles == null || mesh.strip == true;
    if(triangles != null) {
        if(triangles.id == null) {
            triangles.id = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangles.id);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
        }
        else if(dynamic) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangles.id);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), gl.DYNAMIC_DRAW);
        }
        else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangles.id);
        }
        gl.drawElements(strip ? gl.TRIANGLE_STRIP : gl.TRIANGLES, triangles.length, gl.UNSIGNED_SHORT, 0);
    }
    else {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
    }
    for(var i = 0; i < shader.attribs.length; ++i) {
        var attrib = shader.attribs[i];
        gl.disableVertexAttribArray(attrib.id);
    }
}

//matrix
function vmul(a, b) {
    var l = Math.min(a.length, b.length);
    var r = new Array(l);
    for(var i = 0; i < l; ++i)  {r[i] = a[i]*b[i]; }
    return r;
}
function vadd(a, b) {
    var l = Math.min(a.length, b.length);
    var r = new Array(l);
    for(var i = 0; i < l; ++i)  {r[i] = a[i]+b[i]; }
    return r;
}
function mmul(a, b) {
    var r = new Array(16);
    for(var row = 0; row < 4; ++row) {
        for(var col = 0; col < 4; ++col) {
            for(var i = 0; i < 4; ++i) {
                r[col*4 + row] += a[row + i*4] * b[col*4+i]
            }
        }
    }
    return r;
}
function identity() {
    return [
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0];
}
function translation(t) {
    return [
    1.0, 0.0, 0.0, t[0],
    0.0, 1.0, 0.0, t[1],
    0.0, 0.0, 1.0, t[2],
    0.0, 0.0, 0.0, 1.0];
}
function scale(s) {return [
    s  , 0.0, 0.0, 0.0,
    0.0, s  , 0.0, 0.0,
    0.0, 0.0, s  , 0.0,
    0.0, 0.0, 0.0, 1.0];
}

function InitShaderDemos() {
    var shaderDemos = document.getElementsByClassName("shader-demo");
    for(i = 0; i < shaderDemos.length; ++i) {
    var fn = function() {
        var canvas = shaderDemos[i];
        initGL(canvas);
        var gl = canvas.gl;
        gl.num = i;
        initRandTexture(gl);
        var shader = initShaders(gl, canvas.id);
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
        canvas.update = function(dt) {
            gl.canvasSize = [canvas.width, canvas.height];
            gl.time[0] += dt;
            gl.time[1] = dt;
            gl.viewport(0, 0, gl.canvasSize[0], gl.canvasSize[1]);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            drawMesh(gl, material, square);
        }
        canvas.update(0);
    };
    fn();
    }
}
var lastDate = new Date().getTime();
var time = 0;
function UpdateAll() {
    var date = new Date().getTime();
    var deltaTime = (date-lastDate) / 1000;
    var updateds = document.getElementsByClassName("update");
    time += deltaTime;
    for(var i = 0; i < updateds.length; ++i) {
        var updated = updateds[i];
        if(updated.update != null && updated.paused != true) updated.update(deltaTime);
    }
    lastDate = date;
}

InitShaderDemos();
function mouseTrack() {
    var date = new Date().getTime();
    var deltaTime = date-lastDate;
    var mouseCheckers = document.getElementsByClassName("mouse");
    for(var i = 0; i < mouseCheckers.length; ++i) {
        var mouseChecker = mouseCheckers[i];
        mouseChecker.mouseState = [0,0,0];
        mouseChecker.onmousemove = function(e) {
            var box = this.getBoundingClientRect();
            this.mouseState[0] = e.clientX - box.left;
            this.mouseState[1] = -(e.clientY - box.bottom);
        };
        mouseChecker.onmousedown = function(e) {
            this.mouseState[2] = 1;
        };
        mouseChecker.onmouseup = function(e) {
            this.mouseState[2] = 0;
        };
        mouseChecker.onmouseout = function(e) {
            this.mouseState[2] = 0;
        }
    }
    lastDate = date;
}
mouseTrack();
setInterval(UpdateAll, 1000/30);