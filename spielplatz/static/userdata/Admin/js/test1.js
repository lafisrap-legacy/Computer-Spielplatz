var xa = [],
    ya = [],
    n = 10;
    
for( var i=0 ; i<n ; i++ ) {
    xa[i] = 200;
    ya[i] = 200;
}

var draw = function() {
    background(255);
    
    for( var i=0 ; i<n ; i++ ) {
        xa[i] += (mouseX-xa[i])/10;
        ya[i] += (mouseY-ya[i])/10;
        
        ellipse(xa[i], ya[i], 20, 20);
    }
};