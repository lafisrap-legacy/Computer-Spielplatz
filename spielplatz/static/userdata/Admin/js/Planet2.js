
var Sonne = {
    Durchmesser     : 80,
    Mutter          : null,
    Farbe           : color(204, 172, 14),
    Umlaufbahn      : 0,
    Geschwindigkeit : 0.2,
    Winkel          : 0,
    x               : 0,
    y               : 0,
    Name            : "Sonne"
};

var Erde = {
    Durchmesser     : 10,
    Mutter          : Sonne,
    Farbe           : color(38, 38, 224),
    Umlaufbahn      : 80,
    Geschwindigkeit : 0.2,
    Winkel          : 0,
    Name            : "Erde"
};

var Mond = {
    Durchmesser     : 3,
    Mutter          : Erde,
    Farbe           : color(133, 133, 153),
    Umlaufbahn      : 15,
    Geschwindigkeit : -2.0,
    Winkel          : 0,
    Name            : "Mond"
};

var Mars = {
    Durchmesser     : 8,
    Mutter          : Sonne,
    Farbe           : color(115, 7, 28),
    Umlaufbahn      : 150,
    Geschwindigkeit : -0.2,
    Winkel          : 0,
    Name            : "Mars"
};


var Planeten = [Sonne, Erde, Mond, Mars];

textAlign(CENTER, CENTER);
translate(200,200);

var t1 = "Hello!";

var draw = function() {
    background(0);
    
    for( var i=0 ; i<Planeten.length ; i++ ) {
        var planet = Planeten[i];
        
        planet.x = 0;
        planet.y = 0;
        
        if( planet.Mutter !== null ) {
            planet.x = planet.Mutter.x + 
                    cos(planet.Winkel)*planet.Umlaufbahn;
            planet.y = planet.Mutter.y + 
                    sin(planet.Winkel)*planet.Umlaufbahn;
        }
    
        fill(planet.Farbe);
        ellipse(planet.x, planet.y, 
                planet.Durchmesser, planet.Durchmesser);
                
        planet.Winkel += planet.Geschwindigkeit;
        
        if( keyIsPressed ) {
            text(planet.Name, planet.x, planet.y -20);
        }
    }
    
    fill(0);
    text(key.code, 0, 0);
};


keyPressed = function() {
    if( key.code === 96 + 13 ) {
        Mond.Geschwindigkeit = -Mond.Geschwindigkeit;
    }
    if( key.code === 96 + 5 ) {
        Erde.Geschwindigkeit = -Erde.Geschwindigkeit;
    }
    if( key.code === 96 + 1 ) {
        Mars.Geschwindigkeit = -Mars.Geschwindigkeit;
    }
    
    if( key.code === 43 ) {
        Mars.Durchmesser++;
    }
    if( key.code === 45 ) {
        Mars.Durchmesser--;
    }
};

mousePressed = function() {
    for( var i=0; i<Planeten.length ; i++ ) {
        var planet = Planeten[i];

        if( dist( mouseX-200, mouseY-200, planet.x, planet.y ) < planet.Durchmesser/2 ) {
        
            planet.Farbe = color(random(0,255),random(0,255),random(0,255));
        }
    }
};