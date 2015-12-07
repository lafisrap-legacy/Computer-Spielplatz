var kaktus1 = getImage("Spielplatz/Kaktus1");
var kaktus2 = getImage("Spielplatz/Kaktus2");
var twieti = getImage("Spielplatz/Twiieti");
var spinne = getImage("Spielplatz/Spinne");

var tx = 0,
    ty = 0;
var sy = -200;

var draw = function() {
    background(255);
    
    tx += (mouseX-tx)/20;
    ty += (mouseY-ty)/20;
    
    image(kaktus1, 242, 287, 73, 120);
    image(kaktus2, 320, 288, 73, 120);
    image(twieti, tx, ty, 58, 49);

    strokeWeight(2);
    line(348,-200,348,sy);
    image(spinne, 317, sy, 58, 49);
    
    sy += 1;
    
    if( sy > 249 ) {
        sy = 249;
    }
};
