var winkel = 15,
    //s = loadShape("mr-pink-green.svg"),
    bild = getImage("creatures/Hopper-Cool");

frameRate(30);
var mousePressed = function(key) {
};

cursor(CROSS);
debug(nf(2.121232412434,3,3));

var draw = function() {
    
    background(255);
    //shape(s, 0, 0, 100, 100);
    
    fill(0, 150, 0, 128);
    stroke(0, 140, 0);
    
    translate(200, 200);
    rotate(winkel);
    ellipse(0,0,300,100);
    resetMatrix();

    translate(200, 200);
    rotate(-winkel*1.54137);
    ellipse(0,0,100,300);
    resetMatrix();
    
    fill(255, 255, 255, 120);
    stroke(0, 140, 0);

    translate(200, 200);
    rotate(winkel*2.3);
    ellipse(0,0,30,100);
    resetMatrix();

    translate(200, 200);
    rotate(-winkel*1.54127);
    ellipse(0,0,30,100);
    translate(-5, -117);
    rotate(winkel*1.54137);
    image(bild, -25, -50, 50, 50);
    resetMatrix();

    winkel+=2;
};