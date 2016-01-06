// Schlangen-Spiel (#1 Besserer Name) 

var Schlange = [],
    Elastizität = 10,   // (#2 Elastizität der Schlange ändern)
    n = 20,             // (#3 Länge der Schlange)
    Käfer = [],
    SchlangeAktiv = false,
    KäferMax = 5,       // (#4 Anzahl der möglichen Käfer zu Beginn, auch unten)
    GeschwMax = 0.5,    // (#5 Geschwindigkeit der Käfer)
    ZeitZumNächstenKäfer = 10000,   // (#6 Zeit bis zum nächsten Käfer, auch unten)
    MultZeit = 0.95,    // (#7 Beschleunigung der Zeit zum nächsten Käfer)
    Zeit = 0,
    Punktzahl = 0,
    GameOver = false;

var Pling = getSound("Spielplatz/Ticken");    // (#8 Sound ändern)
var Treffer = getSound("Spielplatz/Hallo");   // (#9 Sound ändern)

for( var i=0 ; i<n ; i++ ) {
    Schlange.push({
        x: 200,
        y: 200,
    });
}

textAlign(CENTER, CENTER);

var draw = function() {
    background(255);    // (#10 Hintergrundfarbe)
    
    if( !GameOver ) {
        for( var i=0 ; i<n ; i++ ) {
            var s = Schlange[i];
            
            if( i===0 ) {
                s.x += (mouseX - s.x)/Elastizität;
                s.y += (mouseY - s.y)/Elastizität;
            } else {
                s.x += (Schlange[i-1].x - s.x)/Elastizität;
                s.y += (Schlange[i-1].y - s.y)/Elastizität;
            }
            
            noStroke();
            fill(255, 0, 0, 255-i*10);  // (#11 Füllfarbe der Schlange)
            var Größe = 30;             // (#12 Max. Größe eines Kreises)
            
            if( i === n-1 ) {
                if( dist(s.x, s.y, Schlange[i-1].x, Schlange[i-1].y) > 30-i ) {
                    if( !SchlangeAktiv ) {
                        playSound(Pling); 
                        debug("playing Sound");
                    }
    
                    fill(250, random(128,255), 0);  // (#13 Aktiver Schwanz der Schlange)
                    Größe = 40;                     //   ...
                    SchlangeAktiv = true;           //   ...
                } else {
                    SchlangeAktiv = false;
                }            
            }
            
            ellipse(s.x, s.y, Größe-i, Größe-i); // (#14 Form eines Schlangenkreises)
        }
    }
    
    textSize(50);           // (#15 Größe der Punktzahl)
    fill(255, 0, 0,40);     // dito Farbe
    text(Punktzahl,40,25);  // dito Punktzahl schreiben
    
    textSize(30);           // (#16 Größe der Käfer-Zähler)
    fill(0, 0, 255,40);     // dito Farbe
    text(Käfer.length + " / " + floor(KäferMax),331,25);

    if( !GameOver && millis() - Zeit > ZeitZumNächstenKäfer ) {
        Zeit = millis();
        ZeitZumNächstenKäfer *= MultZeit;
        
        var dx = random(-GeschwMax, GeschwMax),
            dy = random(-GeschwMax, GeschwMax);
            
        if( abs(dx+dy) < GeschwMax/2 ) {
            dx += GeschwMax/2;
        }
         
        Käfer.push({
            x: 200,                 // (#17 Ort wo Käfer erscheinen)
            y: 200,                 //  dito y
            dx: dx,
            dy: dy,
            Größe: random(15,30),   // (#18 Zufällige Größe der Käfer)
        });

        if( Käfer.length > KäferMax ) {
            GameOver = true;
        }
    }
    
    for( var i=0 ; i<Käfer.length ; i++ ) {
        var k = Käfer[i];
        
        k.x += k.dx;
        k.y += k.dy;
        fill(50, random(128,255), 255, 130);    // (#19 Farbe der Käfer)
        ellipse(k.x, k.y, k.Größe, k.Größe);    // (#20 Form der Käfer)
        
        if( k.x < -k.Größe/2 || k.x > 400+k.Größe/2 ) {
            k.dx = -k.dx;
        }
        if( k.y < -k.Größe/2 || k.y > 400+k.Größe/2 ) {
            k.dy = -k.dy;
        }
        
        if( !GameOver && SchlangeAktiv &&
            dist( k.x, k.y, Schlange[n-1].x, Schlange[n-1].y ) < (k.Größe + 20)/2 ) {
            
            Käfer.splice(i,1);
            KäferMax+=0.33;
            Punktzahl++;
            playSound(Treffer);
        }
    }

    if( GameOver ) {
        textSize(70);                   // (#21 Game over, Größe)
        fill(140, 127, 42);             //  dito Farbe
        text("Game over!", 200, 200);   //  dito Text
        
        if( mouseIsPressed ) {
            Käfer = [];
            KäferMax = 5;               // (#4 Anzahl der möglichen Käfer zu Beginn, 
            Punktzahl = 0;
            ZeitZumNächstenKäfer = 10000; // (#6 Zeit zum nächsten Käfer)
            GameOver = false;
        }
    }
};

// (#22 Mehr Sound!)