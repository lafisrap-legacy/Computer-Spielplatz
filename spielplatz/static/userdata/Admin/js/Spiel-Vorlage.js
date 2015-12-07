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
        debug("Hello! 2");

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
    },{
        // Liste der verwendeten Sounds
        Klingel: getSound("Spielplatz/Türglocke"),
    });

Titel.init = function() {
};

Titel.draw = function(isPaused) {
    background(205, 234, 247);
    fill(74, 15, 74);
    textSize(70);
    text("Ein Spiel", 200, 170); 
    fill(54, 11, 54);
    textSize(25);

    if( !isPaused ) {
        text("Drücke eine Taste ...", 200, 235); 

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
        Rob: getImage("Spielplatz/Rob_entspannt"),
    },{
        Tooor: getSound("Spielplatz/Schlagzeug"),
    });

Spielfeld.init = function() {
    Spielfeld.x = 0;
    Spielfeld.y = random(100,300);
};

Spielfeld.draw = function(isPaused) {
    if( !isPaused ) {
        noStroke();
    
        ellipse(Spielfeld.x, Spielfeld.y, 40, 40);
        
        Spielfeld.x += 5;
        
        if( Spielfeld.x > 400 ) {
            Spielfeld.pause();
            Verloren.show();
        }
    }
};

Spielfeld.keyPressed = function() {
};

Spielfeld.keyReleased = function() {
};

Spielfeld.mousePressed = function() {
    if( dist(mouseX, mouseY, Spielfeld.x, Spielfeld.y) < 20) {
        Spielfeld.pause();
        Gewonnen.show();
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