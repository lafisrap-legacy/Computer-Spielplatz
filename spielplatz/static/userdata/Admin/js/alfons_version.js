///////////////////////////////////////////////////////////////////////////////
// ALFONS Computerspielplatz-Figur
// 
// Alle Koordinaten sind normalisiert auf 100 x 100 pixel.
//
// alfons(x, y, w, h, options);
//  x, y, w, h: like ellipse or rect
//  options: object {
//      
//


var y = 0,
    dy = 5,
    angle = 0,
    sc = 0,
    dsc = 0.01;

rectMode(CENTER);

////////////////////////////////////////////////////////
// ALFONS
var alfons = function(x, y, width, height, command) {
    var self = alfons;
    
    translate(x,y);
    scale(width/100, height/100);
    rotate(angle);
    if( !command ) {
        self.face();
    } else {
        switch( command ) {
        default: self.face(command);
        }
    }
    resetMatrix();
};

///////////////////////////
// Alfons Gesicht
alfons.face = function(command) {
    var self = alfons;

    stroke(100);
    strokeWeight(1);
    fill(230, 247, 250);
    beginShape();
    vertex(0, 49.75);
    bezierVertex(-20.66,51,-29.33,24,-26.99,-1.67);
    bezierVertex(-24,-24,-23.66,-40.67,5.34,-49);
    bezierVertex(31.34,-49.67,37.67,-35.67,32,6.67);
    bezierVertex(29.34,36.67,15.01,52,-1.66,50.08);
    endShape();
    translate(0,0);
    self.leftEye(command.lookAt);
    translate(0,0);
    self.rightEye(command.lookAt);
    translate(0,0);
    self.leftBrow(command.raiseEyeBrow);
    translate(0,0);
    self.rightBrow(command.raiseEyeBrow);
    translate(0,0);
    self.nose();
    translate(0,0);
    self.mouth();
    translate(0,0);
    self.leftEar();
    translate(0,0);
    self.rightEar();
    translate(0,0);
    self.hair();
};

///////////////////////////
// Alfons Augen
alfons.leftPupil = {
    x1:  6,
    x2:  4,
    y1:  2.5,
    y2:  3,
};

alfons.rightPupil = {
    x1:  2.5,
    x2:  5,
    y1:  2.5,
    y2:  2.5,
};

alfons.leftEyeBall = function() {
    beginShape();
    vertex(-1.9, -4.51);
    bezierVertex(-8.98,-4.51,-17.05,-4.23,-17.76,-9.19);
    bezierVertex(-18.6,-10.46,-15.92,-13.72,-12,-14);
    bezierVertex(-9,-16.33,-3.18,-16.12,1.21,-14.7);
    bezierVertex(3.48,-10.74,1.92,-6.21,-1.9,-4.51);
    endShape();
};

alfons.rightEyeBall = function() {
    beginShape();
    vertex(12.15, -2.7);
    bezierVertex(18.5,-2.48,21.59,-4.71,25.57,-7.38);
    bezierVertex(27.97,-9.32,24.37,-11.31,20.9,-11.75);
    bezierVertex(15.9,-13.49,12.32,-12.45,8.37,-11.93);
    bezierVertex(7.04,-8.79,8.2,-4.71,12.15,-2.7);
    endShape();
};

alfons.eyeDim = function(lookAt, left) {
    var x = lookAt? constrain(lookAt.x,-100,100) : 0,
        y = lookAt? constrain(lookAt.y,-100,100) : 0,
        p = alfons[left?"leftPupil":"rightPupil"];

    x = x/100 * p[x<0?"x1":"x2"];
    y = y/100 * p[y<0?"y1":"y2"];
    
    return {
        angle: atan2(x,y),
        radius: sqrt(x*x+y*y),
    };
};

alfons.leftEye = function(lookAt) {

    var dim = alfons.eyeDim(lookAt, true);

    noStroke();

    fill(255);
    alfons.leftEyeBall();

    fill(115, 130, 230);
    ellipse(-6+sin(dim.angle)*dim.radius,-10+cos(dim.angle)*dim.radius,7,5);
    fill(0);
    ellipse(-6+sin(dim.angle)*dim.radius,-10+cos(dim.angle)*dim.radius,4,3);
    
    stroke(100);
    strokeWeight(1);
    noFill();
    alfons.leftEyeBall();
};

alfons.rightEye = function(lookAt) {

    var dim = alfons.eyeDim(lookAt, false);

    noStroke();
    fill(255);
    alfons.rightEyeBall();

    fill(115, 130, 230);
    ellipse(14+sin(dim.angle)*dim.radius,-8+cos(dim.angle)*dim.radius,7,5);
    fill(0);
    ellipse(14+sin(dim.angle)*dim.radius,-8+cos(dim.angle)*dim.radius,4,3);

    noFill();
    stroke(100);
    strokeWeight(1);
    alfons.rightEyeBall();
};

alfons.browMax = 10;
alfons.browY = 0;
alfons.browSpeed = 0.5;
alfons.leftBrow = function(raise) {
    
    if( raise ) {
        alfons.browY = min(alfons.browMax, alfons.browY + alfons.browSpeed);
    } else {
        alfons.browY = max(0, alfons.browY - alfons.browSpeed);
    }
    
    stroke(50);
    strokeWeight(1.5);
    noFill();
    bezier(-19,-16,-10,-23-alfons.browY,-9,-22,-1,-21);
};

alfons.rightBrow = function(raise) {
    if( raise ) {
        alfons.browY = min(alfons.browMax, alfons.browY + alfons.browSpeed);
    } else {
        alfons.browY = max(0, alfons.browY - alfons.browSpeed);
    }
    
    stroke(50);
    strokeWeight(1.5);
    noFill();
    bezier(8,-17,16,-24-alfons.browY,17,-23,25,-23);
};

alfons.nose = function() {
    stroke(50);
    strokeWeight(1.5);
    noFill();
    bezier(-2,11,-9,26,-3,23,4,21);
};

alfons.mouth = function() {
    stroke(50);
    strokeWeight(1.6);
    noFill();
    bezier(-2,35,6,36,-3,36,9,37);
};

alfons.leftEar = function() {
    stroke(50);
    fill(230, 247, 250);
    strokeWeight(1);
    bezier(-26.5,0,-32,29,-40,-21,-26,-16);
};

alfons.rightEar = function() {
    stroke(50);
    fill(230, 247, 250);
    strokeWeight(1);
    bezier(33,0,41,18,42,-25,34,-16);
};

alfons.hair = function() {
    stroke(50);
    noFill();
    strokeWeight(0.7);
    bezier(33,-25,15,-70,42,-25,26,-37);
    bezier(21,-41,15,-67,42,-25,9,-51);
    bezier(-3,-42,-5,-70,35,-25,-3,-51);
    bezier(-16,-33,-6,-67,15,-33,-23,-34);
    bezier(-23,-19,-15,-65,14,-32,-20,-36);
    bezier(-19,-25,-15,-65,0,-35,-8,-36);
    bezier(-20,-23,-33,-17,-11,-60,-8,-39);
    bezier(-9,-34,-30,-63,33,-25,1,-52);
    bezier(1,-43,-30,-63,33,-25,16,-48);
    bezier(20,-43,-30,-63,33,-33,28,-41);
};

var draw = function() {
    background(255);
    
    translate(200, 200);
    rotate(angle);
    //scale(sc);
    alfons(0,0,300,300, {
        lookAt: { x: mouseX-200, y: mouseY-200 },
        raiseEyeBrow: mouseIsPressed? true : false,
    });

    angle+=0.0;
    sc+=dsc;
    if( sc > 3 || sc <= 0 ) {
        dsc = -dsc;
    }
};
