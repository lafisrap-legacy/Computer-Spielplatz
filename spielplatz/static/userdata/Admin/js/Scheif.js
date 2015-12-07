var xa = [],
    ya = [],
    n = 15;

for( var i=0 ; i<n ; i++ ) {
    xa[i] = 200;
    ya[i] = 200;
}
    
var draw = function() {
    background(255);

    for( var i=0 ; i<n ; i++ ) {
        if( i === 0 ) {
            xa[0] += (mouseX - xa[0])/10;
            ya[0] += (mouseY - ya[0])/10;
        } else {
            xa[i] += (xa[i-1]-xa[i])/10;
            ya[i] += (ya[i-1]-ya[i])/10;
        }
        
        noStroke();
        fill(160, 0, 0, 255-i*255/n);
        ellipse(xa[i], ya[i], 20, 20);
    }
};

var mouseOut = function() {
    mouseX = 200;
    mouseY = 200;
};
    
    
