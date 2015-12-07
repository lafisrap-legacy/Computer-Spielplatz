

rectMode(CENTER);
var ludmilla = function(farbe) {
    
    // Kopf
    fill(255);
    strokeWeight(1);
    stroke(0);
    rect(0, -2, 110, 206, 60);
    
    // Augen
    ellipse(-24, -26, 37, 19);
    ellipse(20, -27, 36, 23);
    fill(13, 7, 7);
    ellipse(20, -27, 12, 12);
    ellipse(-24, -27, 12, 12);
    
    // Augenbrauen
    noFill();
    arc(-24, -33, 37, 19, 225, 315);
    arc(20, -34, 36, 23, 225, 315);
    
    // Nase
    strokeWeight(4);
    line(0,0,3,24);
    
    // Mund
    noFill();
    stroke(255, 0, 0);
    strokeWeight(4);
    arc(0, 30, 70, 73, 45, 135);
    
    // Hut
    translate(12, -86);
    rotate(17);
    fill(farbe);
    stroke(color(red(farbe)-30,green(farbe)-30,blue(farbe)-30));
    ellipse(0, 0, 195, 40);
    noStroke();
    rect(0, -31, 80, 48);
    stroke(color(red(farbe)-30,green(farbe)-30,blue(farbe)-30));
    strokeWeight(1);
    arc(0, 0, 60, 11,18,172);
    resetMatrix();
};


var x = 200;
var dx = 1;
var winkel = 0;
var draw = function() {
    background(255);
    
    translate(x, 280);
    ludmilla(color(255,0,0));

    for( var i=0 ; i<4 ; i++ ) {
        translate(50+i*100,50);
        rotate(winkel*(i+1));
        scale(0.3);
        ludmilla(color(i*60, 255-i*60,100));
    }
    
    x = x + dx;
    if( x > 345 || x < 55) {
        dx = -dx;
    }
    
    winkel++;
};
