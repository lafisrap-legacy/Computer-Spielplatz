var x = 200;
var y = 350;
var dx = 1;
var dy = -0.3;

textAlign(CENTER, CENTER);

var draw = function() {
    background(255, 255, 255);

    fill(234,23,81);
    ellipse(x, y, 200, 80);
    fill(0, 0, 0);
    textSize(29);
    text("Hello World!", x, y);

    x = x + dx;
    y = y + dy;

    if( x < 100 || x > 300 ) {
        dx = -dx;
    }

    if( y < 40 || y > 360 ) {
        dy = -dy;
    }
};
