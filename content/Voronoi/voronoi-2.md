Title: voronoi 2
Date: 2014-06-15 3:00
Tags: graphics, voronoi, shaders
Category: graphics
Slug: voronoi-2
Summary: interactive voronoi


<canvas id="voronoi" width="500" height="500" class="shader-demo update mouse"></canvas>

<script id="voronoi-fs" type="x-shader/x-fragment">
precision mediump float;
uniform sampler2D randTex;
uniform float time;

vec4 rand( vec2 p, float t ) {
    vec4 r = texture2D( randTex, p/256.0, -100.0 );
    return sin(r*(7.0+t)) * 0.5 + 0.5;
}

void voronoi( in vec2 x, out vec2 cell)
{
    vec2 xcell = floor(x);
    vec2 xoffset = fract(x);

    float bestSqrDist = 8.0;
    vec2 bestRelativeCell;
    vec2 bestOffset;

    for( float j = -2.0; j <= 2.0; j++ )
    for( float i = -2.0; i <= 2.0; i++ )
    {
        vec2 relativeCell = vec2(i,j);
        vec2 currentCell = relativeCell + xcell;
		vec2 offset = rand(currentCell, time).xy;
        vec2 relativePoint = relativeCell + offset - xoffset;
        float sqrDist = dot(relativePoint,relativePoint);

        if( sqrDist < bestSqrDist )
        {
            bestSqrDist = sqrDist;
            bestRelativeCell = relativeCell;
            bestOffset = offset;
        }
    }
    cell = bestRelativeCell + xcell;
}

void voronoiBorder(in vec2 x, in vec2 cell, out vec2 uv) {
    vec2 xcell = floor(x);
    vec2 xoffset = fract(x);
    vec2 bestRelativeCell = cell - xcell;
    vec2 bestOffset = rand(cell, time).xy;

    vec2 bestRelativePoint = bestRelativeCell + bestOffset - xoffset;

    float bestBorderDist = 8.0;
    float distAlongEdge;

    for( float j=-2.0; j<=2.0; j++ )
    for( float i=-2.0; i<=2.0; i++ )
    {
    	//skip current cell
    	if(i==0.0 && j==0.0) continue;

        vec2 relativeCell = bestRelativeCell + vec2(i,j);
        vec2 currentCell = relativeCell + xcell;
		vec2 offset = rand(currentCell, time).xy;
        vec2 relativePoint = relativeCell + offset - xoffset;

        vec2 midpoint = (relativePoint + bestRelativePoint) * 0.5;
        vec2 direction = normalize(relativePoint - bestRelativePoint);

        float dist = dot(midpoint, direction);
        if(dist < bestBorderDist) {
        	bestBorderDist = dist;
        	vec2 edgeDir = direction.yx * vec2(1,-1);
        	distAlongEdge = dot(midpoint, edgeDir);
        }
    }

    uv = vec2(bestBorderDist, distAlongEdge);
}

varying vec2 position;
uniform vec2 canvasSize;
uniform vec3 mouseState;

void main( void )
{
    float size = 35.0;
    vec2 p = position * canvasSize / size;
    vec2 m = mouseState.xy / size;

	vec2 cell;
	vec2 border;
    voronoi( p, cell);
    voronoiBorder(p, cell, border);
    vec2 mcell;
    voronoi(m, mcell);

	
	vec4 col = vec4(0.0,0.0,0.0,1.0);

    if(mcell == cell) {
        if(mouseState.z == 1.0) col.xyz = rand(cell, 0.0).xyz;
        float edge = cos(border.y*20.0 + time * 10.0);
        if(edge > 0.0 && border.x < 0.1) col.w = 0.0;
    }
    else {
        if(border.x < 0.1) col.w = 0.0;
    }

    vec2 max = canvasSize/size - 2.0;
    if(cell.x <= 1.0 || cell.y <= 1.0 || cell.x >= max.x || cell.y >= max.y) {
       col.w = 0.0;
   }
    
       gl_FragColor = col;
}

</script>

<script id="voronoi-vs" type="x-shader/x-vertex">
    attribute vec2 vertex;
    varying vec2 position;
    void main(void) {
        position = vertex * 0.5 + 0.5;
        gl_Position = vec4(vertex, 0.0, 1.0);
    }
</script>

<script src="scripts/graphics.js"></script>