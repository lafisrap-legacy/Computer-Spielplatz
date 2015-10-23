var winkel = 15;

var draw = function() {
    background(255);
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
    rotate(-winkel*1.54137);
    ellipse(0,0,30,100);
    resetMatrix();
    
    winkel++;
};