
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
    Durchmesser : 10,
    Mutter      : Sonne,
    Farbe       : color(38, 38, 224),
    Umlaufbahn  : 80,
    Geschwindigkeit: 0.2,
    Winkel      : 0,
    Name            : "Erde"
};

var Mond = {
    Durchmesser : 3,
    Mutter      : Erde,
    Farbe       : color(133, 133, 153),
    Umlaufbahn  : 15,
    Geschwindigkeit: -2.0,
    Winkel      : 0,
    Name            : "Mond"
};

var Mars = {
    Durchmesser : 8,
    Mutter      : Sonne,
    Farbe       : color(115, 7, 28),
    Umlaufbahn  : 150,
    Geschwindigkeit: -0.2,
    Winkel      : 0,
    Name            : "Mars"
};


var Planeten = [Sonne, Erde, Mond, Mars];

textAlign(CENTER, CENTER);
translate(200,200);

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
    
};
