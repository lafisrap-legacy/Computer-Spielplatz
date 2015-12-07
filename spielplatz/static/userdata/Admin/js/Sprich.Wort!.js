///////////////////////////////////////////////
// Spielsystem
var currentScene = null;
(function() {
    imageMode(CENTER);
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
})();
var Layer = function(zIndex, images, sounds) {
    this.zIndex = zIndex;
    this.images = images;
    this.sounds = sounds;
    this.isPaused = false;
    this.isVisible = true;
    
    this.draw = function() {};
    
    this.pause = function() {
        this.isPaused = true;
    };
    
    this.resume = function() {
        this.isPaused = false;
    };
    
    this.show = function(options) {
        this.isVisible = true;
        this.isPaused = false;
        if( this.init ) {
            this.init(options);
        }
    };

    this.hide = function() {
        this.isVisible = false;
        this.isPaused = true;
    };
};
var Scene = function() {
    this.Layers = [];
    
    this.addLayer = function(zIndex, images, sounds) {
        var layer = new Layer(zIndex, images, sounds);
        this.Layers.push(layer);
        this.Layers.sort(function(a,b) {
            return a.zIndex < b.zIndex? -1 : 1;
        });

        return layer;
    };
    
    this.each = function(cb) {
        for( var i=0 ; i<this.Layers.length ; i++ ) {
            cb(this.Layers[i]);
        }
    };
    
    this.draw = function() {
        this.each(function(layer) {
            pushMatrix();
            resetMatrix();
            if( layer.isVisible ) {
                layer.draw(layer.isPaused);
            }
            popMatrix();
        });
    };
};
var setScene = function(scene) {
    currentScene = scene;

    if( scene.init ) {
        scene.init();
    }
};
var mousePressed = function() {
    currentScene.each(function(layer) {
        if( layer.mousePressed && !layer.isPaused ) {
            layer.mousePressed(); 
        }
    });
};
var mouseMoved = function() {
    currentScene.each(function(layer) {
        if( layer.mouseMoved && !layer.isPaused ) {
            layer.mouseMoved(); 
        }
    });
};
var mouseReleased = function() {
    currentScene.each(function(layer) {
        if( layer.mouseReleased && !layer.isPaused ) {
            layer.mouseReleased(); 
        }
    });
};
var keyPressed = function() {
    currentScene.each(function(layer) {
        if( layer.keyPressed && !layer.isPaused ) {
            layer.keyPressed(); 
        }
    });
};
var keyReleased = function() {
    currentScene.each(function(layer) {
        if( layer.keyReleased && !layer.isPaused ) {
            layer.keyReleased(); 
        }
    });
};
var draw = function() {
    background(250);
    
    if( currentScene ) {
        currentScene.draw();
    }
};

////////////////////////////////////////////////
// Szenen (Scenes) und Ebenen (Layers)
var TitelSzene = new Scene();
var SpielSzene = new Scene();
var Titel;

////////////////////////////
// Titel-Szene
TitelSzene.init = function() {
    Titel.show();
};

/////////////////////////////
// Ebenen
var Titel = TitelSzene.addLayer(0, {
        // Liste der verwendeten Bilder
        Kaktus1: getImage("Spielplatz/Kaktus1"),
        Kaktus2: getImage("Spielplatz/Kaktus2"),
        Spinne: getImage("Spielplatz/Spinne"),
    },{
        // Liste der verwendeten Sounds
        Klingel: getSound("Spielplatz/Türglocke"),
    });

Titel.init = function() {
    Titel.x = 600;
    Titel.dx = -10;
    Titel.ux = -100;
    Titel.dux = 5;
    Titel.Größe = 0;
    Titel.uFarbe = color(3, 0, 3);
    Titel.SpinneY = -250;
};

Titel.draw = function(isPaused) {
    background(148, 212, 242);
    fill(74, 15, 74);
    textSize(Titel.Größe);
    text("Sprich.Wort!", Titel.x, 170); 
    fill(Titel.uFarbe);
    textSize(25);
    image(Titel.images.Kaktus1, 340,325, 90, 150);
    
    strokeWeight(2);
    stroke(0);
    line(82, Titel.SpinneY, 82, 0 );
    image(Titel.images.Spinne, 80, Titel.SpinneY, 50, 50);
    
    if( !isPaused ) {
        text("Drücke eine Taste ...", Titel.ux, 235); 

        Titel.x += Titel.dx;
        if( Titel.x <= 200 ) {
            Titel.dx = 0;
        }
        Titel.ux += Titel.dux;
        if( Titel.ux >= 200 ) {
            Titel.dux = 0;
        }
        Titel.SpinneY += 2;
        if( Titel.SpinneY >= 125 ) {
            Titel.SpinneY = 125;
        }
        Titel.Größe+=0.9;
        if( Titel.Größe > 70 ) {
            Titel.Größe = 70;
        }
    }
};

Titel.keyPressed = function() {
    setScene( SpielSzene );
};

Titel.keyReleased = function() {
};

Titel.mousePressed = function() {
    setScene( SpielSzene );
};

Titel.mouseMoved = function() {
};

Titel.mouseReleased = function() {
};

//////////////////////////////////////////
// Spielszene
var Spielfeld, Gewonnen, Verloren;

SpielSzene.init = function() {
    Spielfeld.show();
    Gewonnen.hide();
    Verloren.hide();
};

var Spielfeld = SpielSzene.addLayer(0,{
        Kakteen: getImage("Spielplatz/Kakteen"),
    },{
        Tooor: getSound("Spielplatz/Schlagzeug"),
    });

Spielfeld.init = function() {
    Spielfeld.Text = "Der ----- fällt nicht weit vom -----!";
    Spielfeld.Lösung ="ApfelStamm";
    Spielfeld.gelöst = 0;
    Spielfeld.x = [];
    Spielfeld.y = [];
    Spielfeld.Größe = [];
    Spielfeld.dy = [];
    Spielfeld.Farbe = [];
    Spielfeld.Buchstabe = [];
    Spielfeld.n = 10;
    for( var i=0 ; i < Spielfeld.n ; i++ ) {
        Spielfeld.x[i] = random(50,350);
        Spielfeld.y[i] = 50-i*40;
        Spielfeld.Größe[i] = random(40,60);
        Spielfeld.dy[i] = random(0.1,0.4);
        Spielfeld.Farbe[i] = color(random(128,255),50,40);
        Spielfeld.Buchstabe[i] = Spielfeld.Lösung.substr(random(0,Spielfeld.Lösung.length),1);
    }
};

Spielfeld.draw = function(isPaused) {
    background(210, 250, 250);
    image(Spielfeld.images.Kakteen, 200, 290);
    fill(255, 255, 15);
    noStroke();
    rect(200,375,400,50);
    if( !isPaused ) {
        noStroke();
        
        for( var i=0 ; i < Spielfeld.n ; i++ ) {
            translate(Spielfeld.x[i], Spielfeld.y[i]);
            fill(Spielfeld.Farbe[i]);
            ellipse(0,0,Spielfeld.Größe[i],Spielfeld.Größe[i]);
            fill(0);
            textSize(25);
            text(Spielfeld.Buchstabe[i],0,0);
            resetMatrix();
                
            Spielfeld.y[i] += Spielfeld.dy[i];
                
            if( Spielfeld.y[i] > 320 ) {
                
                if( Spielfeld.Buchstabe[i] === Spielfeld.Lösung.substr(0,1) ) {
                    debug(Spielfeld.Buchstabe[i]+" === "+Spielfeld.Lösung.substr(0,1));
                    var bs = Spielfeld.Lösung[0],
                        pos = Spielfeld.Text.search("-");
                    debug("bs="+bs+", pos="+pos);                    
                    Spielfeld.Text = Spielfeld.Text.substr(0,pos)+bs+Spielfeld.Text.substr(pos+1);
                    Spielfeld.Lösung = Spielfeld.Lösung.substr(1);
                    if( Spielfeld.Lösung.length === 0 ) {
                        Spielfeld.pause();
                        Gewonnen.show();
                    }
                } else {
                    for( var i=0 ; i < Spielfeld.n ; i++ ) {
                        Spielfeld.y[i] = -50-i*30;
                        Spielfeld.Buchstabe[i] = Spielfeld.Lösung.substr(random(0,Spielfeld.Lösung.length),1);
                    }
                    break;
                }
                //Spielfeld.pause();
                //Verloren.show();
                Spielfeld.y[i] = -50;
                Spielfeld.Buchstabe[i] = Spielfeld.Lösung.substr(random(0,Spielfeld.Lösung.length),1);
            }
        }
    }
    
    fill(0);
    textSize(25);
    text(Spielfeld.Text,200,370);
};

Spielfeld.keyPressed = function() {
};

Spielfeld.keyReleased = function() {
};

Spielfeld.mousePressed = function() {
    for( var i=0 ; i < Spielfeld.n ; i++ ) {
        if( dist(mouseX, mouseY, Spielfeld.x[i], Spielfeld.y[i]) < Spielfeld.Größe[i]/2) {
            if( Spielfeld.Buchstabe[i] === Spielfeld.Lösung.substr(0,1) ) {
                for( var i=0 ; i < Spielfeld.n ; i++ ) {
                    Spielfeld.y[i] = -50-i*30;
                    Spielfeld.Buchstabe[i] = Spielfeld.Lösung.substr(random(0,Spielfeld.Lösung.length),1);
                }
                break;
            }
            Spielfeld.y[i] = -50;
            Spielfeld.Buchstabe[i] = Spielfeld.Lösung.substr(random(0,Spielfeld.Lösung.length),1);
        }
    }
};

Spielfeld.mouseMoved = function() {
};

Spielfeld.mouseReleased = function() {
};

var Gewonnen = SpielSzene.addLayer(2);

Gewonnen.init = function() {
};

Gewonnen.draw = function(isPaused) {
    fill(62, 145, 29);
    textSize(50);
    text("Gewonnen!", 200, 200);
};

Gewonnen.keyPressed = function() {
    setScene( TitelSzene );
};

Gewonnen.keyReleased = function() {
};

Gewonnen.mousePressed = function() {
};

Gewonnen.mouseMoved = function() {
};

Gewonnen.mouseReleased = function() {
};


var Verloren = SpielSzene.addLayer(2);

Verloren.init = function() {
};

Verloren.draw = function(isPaused) {
    fill(255, 0, 0);
    textSize(50);
    text("Verloren ...", 200, 200);
};

Verloren.keyPressed = function() {
    setScene( TitelSzene );
};

Verloren.keyReleased = function() {
};

Verloren.mousePressed = function() {
    setScene( TitelSzene );
};

Verloren.mouseMoved = function() {
};

Verloren.mouseReleased = function() {
};

setScene( TitelSzene );