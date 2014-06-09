Title: voronoi borders
Date: 2014-06-09 13:50
Tags: math, graphics, voronoi, shaders
Category: graphics
Slug: voronoi-borders
Summary: shading the edges of voronoi cells


#basic voronoi

first, here's what a simple voronoi diagram looks like:

<canvas id="voronoi" width="500" height="500" class="shader-demo"></canvas>

the basic idea here is to generate points on a grid, jitter the points, and then for each pixel, find the nearest jittered point.

here's the glsl code that generated the above image:

<pre id="voronoi-fs" type="x-shader/x-fragment">
precision mediump float;
uniform sampler2D randTex;

vec4 rand( vec2 p ) {
	return texture2D( randTex, p/256.0, -100.0 );
}

void voronoi( in vec2 x, out vec2 cell )
{
    vec2 xcell = floor(x);
    vec2 xoffset = fract(x);

    float bestSqrDist = 8.0;
    vec2 bestCell;

    for( float j = -2.0; j <= 2.0; j++ )
    for( float i = -2.0; i <= 2.0; i++ )
    {
        vec2 relativeCell = vec2(i,j);
        vec2 currentCell = relativeCell + xcell;
		vec2 offset = rand(currentCell).xy;
        vec2 relativePoint = relativeCell + offset - xoffset;
        float sqrDist = dot(relativePoint,relativePoint);

        if( sqrDist < bestSqrDist )
        {
            bestSqrDist = sqrDist;
            bestCell = currentCell;
        }
    }
    cell = bestCell;
}

varying vec2 position;
void main( void )
{
    vec2 p = position;

	vec2 cell;
    voronoi( 20.0*p, cell );

	
	vec3 col = rand(cell).xyz;
	gl_FragColor = vec4(col,1.0);
}

</pre>

<script id="voronoi-vs" type="x-shader/x-vertex">
    attribute vec2 aVertexPosition;
    varying vec2 position;
    void main(void) {
    	position = aVertexPosition * 0.5 + 0.5;
        gl_Position = vec4(aVertexPosition, 0.0, 1.0);
    }
</script>

one place i see people go wrong is to only search in the 3x3 grid around the query point. this would be big enough if you needed to search in a unit circle around your query point, but you actually need to search in a circle of radius $\sqrt{2}$ (imagine a query point in the corner of a grid cell, and all 4 adjacent cells have the jittered point in the furthest possible corner). a simple way to do this is to increase the search box to 5x5, but there is probably a more efficient way to do it. you can also stick with the 3x3 and pray to the random number generator gods; it seems to work okay, with a few small artifacts.


#simple borders

<canvas id="voronoiBorders" width="500" height="500" class="shader-demo"></canvas>

the idea here is to find the query point's nearest point, and the cell on the other side of the edge's generating point.
you can construct a line segment between the two cells's generating points, and then do a scalar projection of your query point onto that line to get the distance from the edge. once you have this distance, you can colour every point within a small distance of the edge to get a border.

inigo quilez goes into further detail [here](http://www.iquilezles.org/www/articles/voronoilines/voronoilines.htm), and they wrote a shadertoy example [here](https://www.shadertoy.com/view/ldl3W8#).

here's the code, adapted from iq's shadertoy example: 

<pre id="voronoiBorders-fs" type="x-shader/x-fragment">
precision mediump float;
uniform sampler2D randTex;

vec4 rand( vec2 p ) {
	return texture2D( randTex, p/256.0, -100.0 );
}

void voronoi( in vec2 x, out vec2 cell, out float borderDist )
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
		vec2 offset = rand(currentCell).xy;
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
    vec2 bestRelativePoint = bestRelativeCell + bestOffset - xoffset;

    float bestBorderDist = 8.0;
    vec2 adjacentCell;

    for( float j=-2.0; j<=2.0; j++ )
    for( float i=-2.0; i<=2.0; i++ )
    {
    	//skip current cell
    	if(i==0.0 && j==0.0) continue;

        vec2 relativeCell = bestRelativeCell + vec2(i,j);
        vec2 currentCell = relativeCell + xcell;
		vec2 offset = rand(currentCell).xy;
        vec2 relativePoint = relativeCell + offset - xoffset;

        vec2 midpoint = (relativePoint + bestRelativePoint) * 0.5;
        vec2 direction = normalize(relativePoint - bestRelativePoint);

        float dist = dot(midpoint, direction);
        if(dist < bestBorderDist) {
        	bestBorderDist = dist;
        }
    }

    borderDist = bestBorderDist;
}

varying vec2 position;
void main( void )
{
    vec2 p = position;

	vec2 cell;
	float borderDist;
    voronoi( 20.0*p, cell, borderDist);

	
	vec3 col = rand(cell).xyz;
	if(borderDist > 0.1) col = vec3(0,0,0);
	gl_FragColor = vec4(col,1.0);
}

</pre>

<script id="voronoiBorders-vs" type="x-shader/x-vertex">
    attribute vec2 aVertexPosition;
    varying vec2 position;
    void main(void) {
    	position = aVertexPosition * 0.5 + 0.5;
        gl_Position = vec4(aVertexPosition, 0.0, 1.0);
    }
</script>

#fancy borders

<canvas id="voronoiFancyBorders" width="500" height="500" class="shader-demo"></canvas>

the edge distance was found by doing a scalar projection onto the line between voronoi points. we can use an orthogonal projection to get a signed distance from the midpoint of that same line.

unfortunately, the midpoint of the line between voronoi points is not the midpoint of the edge splitting the cells. but, you can still use it to make a pattern around the edges of the cells.

<pre id="voronoiFancyBorders-fs" type="x-shader/x-fragment">
precision mediump float;
uniform sampler2D randTex;

vec4 rand( vec2 p ) {
	return texture2D( randTex, p/256.0, -100.0 );
}

void voronoi( in vec2 x, out vec2 cell, out vec2 uv )
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
		vec2 offset = rand(currentCell).xy;
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
		vec2 offset = rand(currentCell).xy;
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
void main( void )
{
    vec2 p = position;

	vec2 cell;
	vec2 border;
    voronoi( 20.0*p, cell, border);

	
	vec3 col = rand(cell).xyz;
	if(border.x > 0.1) col = vec3(0,0,0);
	float edge = cos(border.y*20.0);
	if(edge > 0.0) col = vec3(0,0,0);
	gl_FragColor = vec4(col,1.0);
}

</pre>

<script id="voronoiFancyBorders-vs" type="x-shader/x-vertex">
    attribute vec2 aVertexPosition;
    varying vec2 position;
    void main(void) {
    	position = aVertexPosition * 0.5 + 0.5;
        gl_Position = vec4(aVertexPosition, 0.0, 1.0);
    }
</script>

comment on reddit [here](http://www.reddit.com/r/programming/comments/27pk14/shading_voronoi_cell_edges/).

<script type="text/javascript" src="https://glmatrix.googlecode.com/files/glMatrix-0.9.5.min.js"></script>

<script src="{dirname}voronoi-borders.js"></script>