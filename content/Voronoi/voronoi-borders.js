
    function initGL(canvas) {    
        var gl;
        try {
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
        return gl;
    }


    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            alert("shader missing")
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

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



    function initShaders(gl, id) {
        var shaderProgram;
        var fragmentShader = getShader(gl, id+"-fs");
        var vertexShader = getShader(gl, id+"-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        shaderProgram.randTex = gl.getUniformLocation(shaderProgram, "randTex");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
        return shaderProgram;
    }




    function initBuffers(gl) {

        var squareVertexPositionBuffer;
        squareVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        var vertices = [
             1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
            -1.0, -1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        squareVertexPositionBuffer.itemSize = 2;
        squareVertexPositionBuffer.numItems = 4;
        return squareVertexPositionBuffer;
    }


    function initRandTexture(gl) {
        var data = new Uint8Array(256*256*8);
        for(var i = 0; i < 256*256*8; ++i) {
            var r = Math.random() * 256;
            data[i] = r;
        }
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        return texture;
    }

    function drawScene(gl, shaderProgram, randTexture, squareVertexPositionBuffer) {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, randTexture);
        gl.uniform1i(shaderProgram.randTex, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    }



    function webGLStart() {
        var canvases = document.getElementsByClassName("shader-demo");
        for(i = 0; i < canvases.length; ++i) {
            var canvas = canvases[i];
            var gl = initGL(canvas);
            var square = initBuffers(gl);
            gl.clearColor(0.0, 1.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);
            var randTex = initRandTexture(gl);
            var shader = initShaders(gl, canvas.id);
            drawScene(gl, shader, randTex, square);
        }

    }

    webGLStart();

