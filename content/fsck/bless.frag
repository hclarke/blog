precision mediump float;

varying vec2 uv;
uniform float time;

vec3 cubehelix(float v, float m, float M, float s) {
  const mat3 YUV_to_RGB = mat3(
         1.0,1.0,1.0,
        0.0,-0.39465,2.03211,
        1.13983,-0.58060,0.0);
    
    float a = 3.14159*(v-time*0.5)*2.0 * s;
    vec3 c = vec3(mix(m,M,pow(v,.7)),sin(a),cos(a));
    c.yz *= 0.08;
    
    return YUV_to_RGB*c;
}

void main() {
  vec2 p = uv * 2.0 - 1.0;
  vec3 c = cubehelix(pow(dot(p,p), 0.7), 0.9, 0.5, 2.0);
  gl_FragColor = vec4(c, 1.0 );
}