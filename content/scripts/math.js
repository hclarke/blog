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
	var r = new Array[16];
	for(var i = 0; i < 4; ++i) {
		r[i*5] = 1;
	}
	return r;
}
function translation(t) {
	var r = identity();
	for(var i = 0; i < 3; ++i) {
		r[12+i] = t[i];
	}
	return r;
}
function scale(s) {
	var r = identity();
	for(var i = 0; i < 3; ++i) {
		r[i*5] = s;
	}
	return r;
}