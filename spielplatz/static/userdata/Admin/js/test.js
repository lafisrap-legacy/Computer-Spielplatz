var x = 261,
    y = 200,
    dy = 0,
    höhe = 78,
    breite = 119,
    pling = getSound("Spielplatz/Metallscheibe");



var draw = function() {
    
    background(255);
    
    x = x + (mouseX-x)/50;
    //y = y + (mouseY-y)/50;
    
    stroke(255, 0, 0);
    fill(252, 242, 245);
    ellipse(x, y, breite, höhe);
    
    y = y + dy;
    
    
    if( y > 400-höhe/2 || y < höhe/2 ) {
        dy = -dy;
        playSound(pling);
    } else {
        dy += 0.3;
    }
};