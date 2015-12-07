// Programmhülle für Animation

var x = 200,        // x-Position
    y = 200,        // y-Position
    dx = 10,         // Bewegungsrichtung und -geschwindigkeit von x
    dy = -0.3;         // Bewegungsrichtung und -geschwindigkeit von y

var Ludmilla = function() {
    // hier kommen die Zeichenbefehle für Ludmilla hinein
    // ...
    ellipse(0, 0, 70, 70);
};

var draw = function() {
    background(255);        // Hintergrund löschen
    
    resetMatrix();          // Koordinatensystem zurücksetzen
    translate(x,y);         // Koordinatensystem nach x/y verschieben
    Ludmilla();             // Figur zeichnen
    
    x = x + dx;             // x-Wert um dx verändern (jede 1/60 Sekunde)
    y = y + dy;             // dgl. y-Wert
    
    if( x < 0 || x > 400 ) {    // Test ob x den Bildschirm verlässt
        dx = -dx;           // Wenn ja: x-Richtung umkehren
    }
    
    if( y < 0 || y > 400 ) {    // Text ob y den Bildschirm verlässt
        dy = -dy;           // Wenn ja: y-Richtung umkehren
    }
};