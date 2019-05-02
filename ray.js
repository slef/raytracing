

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(p) {
	return new Point (this.x+p.x, this.y+p.y);
    }
    minus(p) {
	return new Point (this.x-p.x, this.y-p.y);
    }
    times(c) {
	return new Point (this.x*c, this.y*c);
    }
    sqnorm() {
	return this.dotprod(this);
    }
    dotprod(p) {
	return this.x*p.x + this.y*p.y;
    }
    det(p) {
	return this.x*p.y - this.y*p.x;
    }
    perp() { //ccw
	return new Point(-this.y,this.x);
    }
    dual(c) { //returns two points outside the [-c,+c]^2 boundary
	if (this.sqnorm() < 1/sq(2*c))
	    return false;
	if (sq(this.y) > 1/sq(2*c)) { // ax+by = 1 <=> by = 1-ax
	    return [new Point (-c,(1+c*this.x)/this.y),
		    new Point (c,(1-c*this.x)/this.y)];
	} else {
	    var u = new Point ((1+c*this.y)/this.x,-c);
	    var v = new Point ((1-c*this.y)/this.x,c);
	    if (u.x < v.x) {
		return [u,v];
	    } else {
		return [v,u];
	    }
	}
    }
}

var points = [];

var line = new Point(0,0); //polar dual

function sq(x) {
    return x*x;
}

function orientation(a,b,c) {
    return -b.x*c.y+b.y*c.x+a.x*c.y-a.y*c.x-a.x*b.y+a.y*b.x;
}

function translation(x,y) {
    return [[1, 0, x][0, 1, y][0, 0, 1]];
}

function reflection(p, q, r) { // reflect p wrt line qr
    var qr = r.minus(q);
    var u = q.add(qr.times(p.minus(q).dotprod(qr)/qr.sqnorm())); //projection of p on vector qr from the origin 
    return u.add(u.minus(p));
}

function intersection(s,t,q,r) { //intersection point of ray p->t with line qr
    return q.add(r.minus(q).times(t.minus(s).det(q.minus(s)) / r.minus(q).det(t.minus(s))));
}

function refraction(p,s,q,r,d) { //refraction of ray ps across line qr with refraction index d>1
    var sp = p.minus(s);
    var rq = q.minus(r);
    var sprq = sp.dotprod(rq);
    var ts = rq.times(sprq/d).add(rq.perp().times(Math.sqrt((sp.sqnorm()*rq.sqnorm())-(sq(sprq)/(d*d)))));
    return ts.times(-1);
}

function critical(p,s,q,r,d) {
    var sp = p.minus(s);
    var rq = q.minus(r);
    var sprq = sp.dotprod(rq);
    return (sp.sqnorm()*rq.sqnorm())-(sq(sprq)/(d*d)) < 0;
}

function findEdge(s,t,poly,sign) {
    for (i=0;i<poly.length;i++) {
	if (orientation(s,poly[i],poly[(i+1)%poly.length])*sign>0 &&
	    orientation(s,t,poly[i])*sign<0 &&
	    orientation(s,t,poly[(i+1)%poly.length])*sign>=0) {
	    return i;
	}
    }
    return -1;
}

function bounces(s,t,poly,d) { // d: refraction index
    var i = findEdge(s,t,poly,1);
    if (i < 0)
	return 0;
    var count = 2;
    var u = intersection(s,t,poly[i],poly[(i+1)%poly.length]);
    //p.line(s.x,s.y,u.x,u.y);
    //p.ellipse(u.x,u.y,4,4);
    var uv = refraction(s,u,poly[i],poly[(i+1)%poly.length],d);
    var v = u.add(uv);
    var j = findEdge(u,v,poly,-1);
    var w = intersection(u,v,poly[j],poly[(j+1)%poly.length]);
    //p.line(u.x,u.y,w.x,w.y);
    //p.ellipse(w.x,w.y,4,4);
    try{
    while (critical(u,w,poly[(j+1)%poly.length],poly[j],1/d)) {
	v = reflection(w.add(w.minus(u)),poly[(j+1)%poly.length],poly[j]);
	u = w;
	j = findEdge(u,v,poly,-1);
	w = intersection(u,v,poly[j],poly[(j+1)%poly.length]);
	//p.ellipse(w.x,w.y,4,4);
	//p.line(u.x,u.y,w.x,w.y);
	count += 1;
    }
    }
    catch(error) {
	console.log("bleh");
	console.log(u,v);
    }
    //uv = refraction(u,w,poly[(j+1)%poly.length],poly[j],1/refrIndex);
    //u = w.add(uv)
    //p.line(w.x,w.y,u.x,u.y);
    return count;
}

function bouncesPolar(l,poly,d) {
    if (! l.dual(2)) // line too far
	return 0;
    var s = l.dual(2)[0].add(new Point(2,2)).times(canvasSize/4);
    var t = l.dual(2)[1].add(new Point(2,2)).times(canvasSize/4);
    try{
	return bounces(s,t,poly,d);
    }
    catch (error) {
	//console.log(error);
	//console.log(s);
	//console.log(t);
    }
}

let canvasSize = 400;
let refrIndex = 2.417

let s = function (p) {
    p.setup = function () {
	var cnv = p.createCanvas(canvasSize, canvasSize);
	p.fill('black');
	cnv.mousePressed(addMousePoint);
    }

    p.draw = function () {
	p.background(200);
	for (i=0;i<points.length;i++) {
	    p.ellipse(points[i].x,points[i].y,4,4);
	    if (points.length > 1) {
		p.line(points[i].x,points[i].y,points[(i+1)%points.length].x,points[(i+1)%points.length].y);
	    }
	}
	if (! line.dual(2)) // line too far
	    return;
	var s = line.dual(2)[0].add(new Point(2,2)).times(canvasSize/4);
	var t = line.dual(2)[1].add(new Point(2,2)).times(canvasSize/4);
	var i = findEdge(s,t,points,1);
	if (i>-1) {
	    var u = intersection(s,t,points[i],points[(i+1)%points.length]);
	    p.line(s.x,s.y,u.x,u.y);
	    p.ellipse(u.x,u.y,4,4);
	    var uv = refraction(s,u,points[i],points[(i+1)%points.length],refrIndex);
	    var v = u.add(uv);
	    var j = findEdge(u,v,points,-1);
	    var w = intersection(u,v,points[j],points[(j+1)%points.length]);
	    p.line(u.x,u.y,w.x,w.y);
	    p.ellipse(w.x,w.y,4,4);
	    while (critical(u,w,points[(j+1)%points.length],points[j],1/refrIndex)) {
		v = reflection(w.add(w.minus(u)),points[(j+1)%points.length],points[j]);
		u = w;
		j = findEdge(u,v,points,-1);
		w = intersection(u,v,points[j],points[(j+1)%points.length]);
		p.ellipse(w.x,w.y,4,4);
		p.line(u.x,u.y,w.x,w.y);
	    }
	    uv = refraction(u,w,points[(j+1)%points.length],points[j],1/refrIndex);
	    u = w.add(uv)
	    p.line(w.x,w.y,u.x,u.y);
	} else {
	    p.line(s.x,s.y,t.x,t.y);
	}
    }

    function addMousePoint () {
	points.push(new Point(p.mouseX,p.mouseY));
	var n = points.length;
	if (n>2 && (orientation(points[n-3],points[n-2],points[n-1])>0
		    || orientation(points[n-2],points[n-1],points[0])>0
		    || orientation(points[n-1],points[0],points[1])>0)) {
	    points.pop();
	    console.log("nope");
	}
	if (points.length > 2)
	    rightp5.draw();
    }
}


let t = function (p) {
    p.setup = function () {
	p.pixelDensity(1);
	var cnv = p.createCanvas(canvasSize, canvasSize);
	p.fill('black');
	cnv.mousePressed(setMouseLine);
	cnv.mouseMoved(setMouseLine);
	p.noLoop();
    }

    p.draw = function () {
	p.background(0);
	//p.circle(canvasSize/2,canvasSize/2,canvasSize/4);
	p.loadPixels();
	for (let y = 0; y < p.height; y++) {
	    for (let x = 0; x < p.width; x++) {
		var l = new Point(4*x/canvasSize - 2,
				  4*y/canvasSize - 2);
		var pix = (x+y*p.width)*4;
		var bright = bouncesPolar(l,points,refrIndex);
		if (bright > 10) {
		    bright = 0;
		}
		bright *= 25;
		p.pixels[pix + 0] = bright;
		p.pixels[pix + 1] = bright;
		p.pixels[pix + 2] = bright;
		p.pixels[pix + 3] = 255;
	    }
	}
	p.updatePixels();
    }
    function setMouseLine () {
	if (p.mouseIsPressed) {
	    var a = 4*p.mouseX/canvasSize - 2; // in [-2, 2]
	    var b = 4*p.mouseY/canvasSize - 2; // ax + by = 1 <=> y = 1/b - x * a/b
	    //line.a = -a/b;
	    //line.b = 1/b;
	    line = new Point(a,b);
	    console.log(line);
	}
    }
}

var rightp5 = new p5(t, 'c2');
var leftp5 = new p5(s, 'c1');



