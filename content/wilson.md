Title: aleviating wilson's frustration
Date: 2014-08-15 16:00
Tags: maze, wilson's algorithm
Category: demos
Slug: wilson
Summary: less obnoxious variant of wilson's maze algorithm
<div style="text-align:center;">
<canvas id="maze" width="700" height="700"></canvas>
</div>

if you look at wilson's algorithm, as presented [here](http://bl.ocks.org/mbostock/11357811) (and coloured [here](http://bl.ocks.org/mbostock/c03ee31334ee89abad83)) by mike bostock, you might notice that before the first few paths are laid down, it can be painful to watch the random walk try to find the existing maze.

here, i modified his algorithm by adding walls, instead of cutting paths. it has the advantage of starting with the entire edge as a target, so it goes much faster at the start.

i also made each random walk start at a random point, rather than iterating through in row-major order.

<script src="http://d3js.org/d3.v3.min.js"></script>
<script>


var canvas = document.getElementById("maze");

var width = canvas.width,
    height = canvas.height;

var N = 1 << 0,
    S = 1 << 1,
    W = 1 << 2,
    E = 1 << 3;

var cellSize = 4,
    cellSpacing = 4,
    cellWidth = Math.floor((width - cellSpacing) / (cellSize + cellSpacing)),
    cellHeight = Math.floor((height - cellSpacing) / (cellSize + cellSpacing)),
    cells = new Array(cellWidth * cellHeight), // each cell’s edge bits
    previous = new Array(cellWidth * cellHeight), // current random walk path
    i0, x0, y0; // end of current random walk


 var remaining = new Array((cellWidth-2) * (cellHeight-2)); // cell indexes to visit
 var loopIdx = 0;
 for(var j = 1; j < cellHeight-1; ++j) {
 	for(var i = 1; i < cellWidth-1; ++i) {
 		var idx = j*cellWidth+i;
 		remaining[loopIdx++] = idx;
 	}
 }
 //shuffle them
 for(var i = 0; i < remaining.length-1; ++i) {
 	var rest = remaining.length-i;
 	var j = Math.floor(Math.random()*rest);
 	var temp = remaining[i];
 	remaining[i] = remaining[j];
 	remaining[j] = temp;
 }

var context = canvas.getContext("2d");

context.translate(
  Math.round((width - cellWidth * cellSize - (cellWidth + 1) * cellSpacing) / 2),
  Math.round((height - cellHeight * cellSize - (cellHeight + 1) * cellSpacing) / 2)
);

// Add the starting cells.
context.fillStyle = "black";
for(var i = 0; i < cellWidth; ++i) {
	var start = i;
	cells[start] = 0;
	fillCell(start);
	if(i < cellWidth-1) {
		cells[start] |= E;
		fillEast(start);
	}
	if(i > 0) {
		cells[start] |= W;
	}
	start = i + (cellHeight-1)*cellWidth;
	cells[start] = 0;
	fillCell(start);if(i < cellWidth-1) {
		cells[start] |= E;
		fillEast(start);
	}
	if(i > 0) {
		cells[start] |= W;
	}
}
for(var i = 0; i < cellHeight; ++i) {
	var start = i*cellWidth;
	if(cells[start] == null) cells[start] = 0;
	fillCell(start);
	if(i < cellHeight-1) {
		cells[start] |= S;
		fillSouth(start);
	}
	if(i > 0) {
		cells[start] |= N;
	}
	start = i *cellWidth+cellHeight-1;
	if(cells[start] == null) cells[start] = 0;
	fillCell(start);
	if(i < cellHeight-1) {
		cells[start] |= S;
		fillSouth(start);
	}
	if(i > 0) {
		cells[start] |= N;
	}
}

// While there are remaining cells,
// add a loop-erased random walk to the maze.
context.fillStyle = "magenta";
d3.timer(function() {
  for (var k = 0; k < 50; ++k) {
    if (loopErasedRandomWalk()) {
    	var newCells = new Array((cellWidth-1) * (cellHeight-1));
    	var cw = cellWidth-1;
    	var ch = cellHeight-1;
    	for(var j = 0; j < ch; ++j) {
	    	for(var i = 0; i < cw; ++i) {
	    		var cidx = i + cw*j;
	    		var nw = i+cellWidth*j;
	    		var se = nw+1+cellWidth;
	    		newCells[cidx] = 0;
	    		if((cells[nw]&E) == 0) newCells[cidx] |= N;
	    		if((cells[nw]&S) == 0) newCells[cidx] |= W;
	    		if((cells[se]&W) == 0) newCells[cidx] |= S;
	    		if((cells[se]&N) == 0) newCells[cidx] |= E;
    		}
    	}
    	cells = newCells;
    	cellWidth = cw;
    	cellHeight = ch;
    	context.translate(cellSize, cellSize);
    	d3.timer(colour)
     	return true;
    }
  }
});

var frontier = [0],
	distance = 0,
    visited = new Array(cellWidth * cellHeight);
function colour() {
	if (!(n0 = frontier.length)) return true;

  context.fillStyle = d3.hsl(distance++ % 360, 1, .5) + "";

  if (distance & 1) {
    for (var i = 0; i < n0; ++i) {
      fillCell(frontier[i]);
    }
  } else {
    var frontier1 = [],
        i0,
        i1,
        n0;

    for (var i = 0; i < n0; ++i) {
      i0 = frontier[i];
      if (cells[i0] & E && !visited[i1 = i0 + 1]) visited[i1] = true, fillEast(i0), frontier1.push(i1);
      if (cells[i0] & W && !visited[i1 = i0 - 1]) visited[i1] = true, fillEast(i1), frontier1.push(i1);
      if (cells[i0] & S && !visited[i1 = i0 + cellWidth]) visited[i1] = true, fillSouth(i0), frontier1.push(i1);
      if (cells[i0] & N && !visited[i1 = i0 - cellWidth]) visited[i1] = true, fillSouth(i1), frontier1.push(i1);
    }

    frontier = frontier1;
  }
}

function loopErasedRandomWalk() {
  var i1;

  // Pick a location that’s not yet in the maze (if any).
  if (i0 == null) {
    do if ((i0 = remaining.pop()) == null) return true;
    while (cells[i0] >= 0);
    previous[i0] = i0;
    fillCell(i0);
    x0 = i0 % cellWidth;
    y0 = i0 / cellWidth | 0;
    return;
  }

  // Perform a random walk starting at this location,
  // by picking a legal random direction.
  while (true) {
    i1 = Math.random() * 4 | 0;
    if (i1 === 0) { if (y0 <= 0) continue; --y0, i1 = i0 - cellWidth; }
    else if (i1 === 1) { if (y0 >= cellHeight - 1) continue; ++y0, i1 = i0 + cellWidth; }
    else if (i1 === 2) { if (x0 <= 0) continue; --x0, i1 = i0 - 1; }
    else { if (x0 >= cellWidth - 1) continue; ++x0, i1 = i0 + 1; }
    break;
  }

  // If this new cell was visited previously during this walk,
  // erase the loop, rewinding the path to its earlier state.
  if (previous[i1] >= 0) eraseWalk(i0, i1);

  // Otherwise, just add it to the walk.
  else {
    previous[i1] = i0;
    fillCell(i1);
    if (i1 === i0 - 1) fillEast(i1);
    else if (i1 === i0 + 1) fillEast(i0);
    else if (i1 === i0 - cellWidth) fillSouth(i1);
    else fillSouth(i0);
  }

  // If this cell is part of the maze, we’re done walking.
  if (cells[i1] >= 0) {

    // Add the random walk to the maze by backtracking to the starting cell.
    // Also erase this walk’s history to not interfere with subsequent walks.
    context.save();
    context.fillStyle = "#000";
    fillCell(i1);
    while ((i0 = previous[i1]) !== i1) {
      fillCell(i0);
      if (i1 === i0 + 1) cells[i0] |= E, cells[i1] |= W, fillEast(i0);
      else if (i1 === i0 - 1) cells[i0] |= W, cells[i1] |= E, fillEast(i1);
      else if (i1 === i0 + cellWidth) cells[i0] |= S, cells[i1] |= N, fillSouth(i0);
      else cells[i0] |= N, cells[i1] |= S, fillSouth(i1);
      previous[i1] = NaN;
      i1 = i0;
    }
    context.restore();

    previous[i1] = NaN;
    i0 = null;
  } else {
    i0 = i1;
  }
}

function eraseWalk(i0, i2) {
  var i1;
  context.save();
  context.globalCompositeOperation = "destination-out";
  do {
    i1 = previous[i0];
    if (i1 === i0 - 1) fillEast(i1);
    else if (i1 === i0 + 1) fillEast(i0);
    else if (i1 === i0 - cellWidth) fillSouth(i1);
    else fillSouth(i0);
    fillCell(i0);
    previous[i0] = NaN;
    i0 = i1;
  } while (i1 !== i2);
  context.restore();
}

function fillCell(i) {
  var x = i % cellWidth, y = i / cellWidth | 0;
  context.fillRect(x * cellSize + (x + 1) * cellSpacing, y * cellSize + (y + 1) * cellSpacing, cellSize, cellSize);
}

function fillEast(i) {
  var x = i % cellWidth, y = i / cellWidth | 0;
  context.fillRect((x + 1) * (cellSize + cellSpacing), y * cellSize + (y + 1) * cellSpacing, cellSpacing, cellSize);
}

function fillSouth(i) {
  var x = i % cellWidth, y = i / cellWidth | 0;
  context.fillRect(x * cellSize + (x + 1) * cellSpacing, (y + 1) * (cellSize + cellSpacing), cellSize, cellSpacing);
}

d3.select(self.frameElement).style("height", height + "px");

</script>