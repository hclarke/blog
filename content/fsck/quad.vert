
attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 uv;

void main() {
  uv = aTexCoord;

  vec4 positionVec4 = vec4(aPosition*2.0-1.0, 1.0);
  gl_Position = positionVec4;
}