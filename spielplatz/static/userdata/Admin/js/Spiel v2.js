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
            debug("Hello! 3");

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
    text("Ein Spiel", Titel.x, 170); 
    fill(Titel.uFarbe);
    textSize(25);
    image(Titel.images.Kaktus1, 340,325, 120, 150);
    
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
        Spinne: getImage("Spielplatz/Spinne"),
        Kakteen: getImage("Spielplatz/Kakteen"),
    },{
        Tooor: getSound("Spielplatz/Schlagzeug"),
    });

Spielfeld.init = function() {
    Spielfeld.x = [];
    Spielfeld.y = [];
    Spielfeld.dy = [];
    Spielfeld.Buchstabe = [];
    Spielfeld.Wort = "Hundertwasser";
    Spielfeld.n = 10;
    for( var i=0 ; i<10 ; i++ ) {
        Spielfeld.x[i] = random(100,300);
        Spielfeld.y[i] = -50-i*20;
        Spielfeld.dy[i] = random(0.05,0.6);
        Spielfeld.Buchstabe[i] = Spielfeld.Wort[floor(random(0,Spielfeld.Wort.length))];
    }
};

Spielfeld.draw = function(isPaused) {
    if( !isPaused ) {
        noStroke();
        
        image(Spielfeld.images.Kakteen, 200, 350);
    
        for( var i=0 ; i < Spielfeld.n ; i++ ) {
            translate(Spielfeld.x[i], Spielfeld.y[i]);
            //scale(0.5);
            //rotate(0);
            fill(0);
            ellipse(0,0,50,50);
            fill(255);
            textSize(30);
            text(Spielfeld.Buchstabe[i],0,0);
            resetMatrix();
            
            Spielfeld.y[i] += Spielfeld.dy[i];
            
            if( Spielfeld.y[i] > 400 ) {
                Spielfeld.pause();
                Verloren.show();
            }
        }
    }
};

Spielfeld.keyPressed = function() {
};

Spielfeld.keyReleased = function() {
};

Spielfeld.mousePressed = function() {
    for( var i=0 ; i < Spielfeld.n ; i++ ) {
        if( dist(mouseX, mouseY, Spielfeld.x[i], Spielfeld.y[i]) < 25) {
            Spielfeld.pause();
            Gewonnen.show();
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