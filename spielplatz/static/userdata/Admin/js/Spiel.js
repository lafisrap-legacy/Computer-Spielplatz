///////////////////////////////////////////////
// Spielsystem

var currentScene = null;

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
        if( this.init ) {
            debug("Hello show!");
            this.init(options);
        }
    };

    this.hide = function() {
        this.isVisible = false;
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

        layer.show();        
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
                    debug("Hello set!");

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

var keyPressed = function() {
    currentScene.each(function(layer) {
        if( layer.keyPressed && !layer.isPaused ) {
            layer.keyPressed(); 
        }
    });
};

imageMode(CENTER);
rectMode(CENTER);
textAlign(CENTER, CENTER);

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

////////////////////////////
// Ebenen
var Überschrift = TitelSzene.addLayer(0);
var Fahrrad = TitelSzene.addLayer(1, {
        Fahrrad: getImage("Spielplatz/Fahrrad"),
        Rob: getImage("Spielplatz/Rob_entspannt"),
    }, {
        Klingel: getSound("Spielplatz/Türglocke"),
    });
    
/////////////////////////////
// Ebenen-Logik
Überschrift.draw = function(isPaused) {
    fill(237, 61, 237);
    textSize(30);
    text("P . O . N . G", 200, 20); 
};

Fahrrad.x = 320;
Fahrrad.dx = 0;
Fahrrad.draw = function(isPaused) {
    var i = Fahrrad.images;
    
    image(i.Rob, mouseX, mouseY);
    scale(1);
    image(i.Fahrrad, Fahrrad.x, 370);
    
    Fahrrad.x += Fahrrad.dx;
    if( Fahrrad.x < -100 ) {
        setScene( SpielSzene );
    }

    if( mouseX>300 && mouseX<350 && mouseY>350 ) {
        Fahrrad.dx = -3;   
    }
};

//////////////////////////////////////////
// Spielszene
var Spielfeld, Tooor, Figuren;

SpielSzene.init = function() {
    Tooor.hide();
    Figuren.show();
};

var Spielfeld = SpielSzene.addLayer(0);
Spielfeld.draw = function(isPaused) {
    noStroke();
    fill(245, 108, 108);
    rect(5,200,10,200);
    fill(132, 163, 201);
    rect(395,200,10,200);

    if( !isPaused && Figuren.by > 100 && Figuren.by < 300 ) {
        if( Figuren.bx < Figuren.BallGr/2 + 5 ) {
            Tooor.show("Fred");
        } else if( Figuren.bx > 400 - Figuren.BallGr/2 - 5 ) {
            Tooor.show("Rob");
        } else {
            return;
        }
        Figuren.pause();
        Spielfeld.pause();
    }
};

var Tooor = SpielSzene.addLayer(2);
Tooor.init = function(Schütze) {
    Tooor.TextGr = 2;
    Tooor.Zähler = 5;
    Tooor.Schütze = Schütze;
};

Tooor.draw = function(isPaused) {
    if( Tooor.Schütze === "Rob" ) {
        fill(245, 108, 108);
    } else {
        fill(132, 163, 201);
    }
    textSize(Tooor.TextGr);
    text("Toooor!", 200, 200);
    
    Tooor.TextGr += 2;
    if( Tooor.TextGr > 80 ) {
        Tooor.TextGr = 2;
        if( --Tooor.Zähler === 0 ) {
            Figuren.setBall();
            Figuren.resume();
            Spielfeld.resume();
            Tooor.pause();
            Tooor.hide();
        }
    }
};

var Figuren = SpielSzene.addLayer(1,{
        Fred: getImage("Spielplatz/Rob_wütend"),
        Rob:  getImage("Spielplatz/Rob_cool"),
        Ball: getImage("Spielplatz/OrangerBall"),
    });
    
Figuren.x1 = 40;
Figuren.y1 = 200;
Figuren.x2 = 360;
Figuren.y2 = 200;
Figuren.dY1 = 0;
Figuren.dY2 = 0;
Figuren.dYMax = 20;
Figuren.KreisGr = 80;
Figuren.BallGr = 30;
Figuren.CollisionTime = 0;

Figuren.init = function() {
    debug("Hello init!");
    Figuren.setBall();
};

Figuren.draw = function(isPaused) {
    noFill();
    stroke(245, 108, 108);
    image(Figuren.images.Fred, Figuren.x1, Figuren.y1, 100, 70);
    arc(Figuren.x1, Figuren.y1, Figuren.KreisGr, Figuren.KreisGr, -110, 110);
    stroke(132, 163, 201);
    image(Figuren.images.Rob, Figuren.x2, Figuren.y2, 100, 70);
    arc(Figuren.x2, Figuren.y2, Figuren.KreisGr, Figuren.KreisGr, 70, 290);
    image(Figuren.images.Ball, Figuren.bx, Figuren.by, Figuren.BallGr, Figuren.BallGr);

    Figuren.dY1 -= Figuren.dY1/10;
    Figuren.dY2 -= Figuren.dY2/10;
    
    if( !isPaused ) {
        Figuren.dBX *= 1.01;
        Figuren.dBY *= 1.01;
    
        if( Figuren.y1 <= Figuren.KreisGr/2 || Figuren.y1 >= 400-Figuren.KreisGr/2 ) {
            Figuren.dY1 = -Figuren.dY1 * 1.1;
        }
    
        if( Figuren.y2 <= Figuren.KreisGr/2 || Figuren.y2 >= 400-Figuren.KreisGr/2 ) {
            Figuren.dY2 = -Figuren.dY2 * 1.1;
        }
    
        if( Figuren.bx <= Figuren.BallGr/2 || Figuren.bx >= 400-Figuren.BallGr/2 ) {
            Figuren.dBx = -Figuren.dBx;
        }
        
        if( Figuren.by <= Figuren.BallGr/2 || Figuren.by >= 400-Figuren.BallGr/2 ) {
            Figuren.dBy = -Figuren.dBy;
        }
        
        Figuren.collide(Figuren.x1, Figuren.y1, Figuren.dY1);            
        Figuren.collide(Figuren.x2, Figuren.y2, Figuren.dY2);            
    
        Figuren.y1 =constrain(Figuren.y1+Figuren.dY1,Figuren.BallGr/2,400-Figuren.BallGr/2);
        Figuren.y2 =constrain(Figuren.y2+Figuren.dY2,Figuren.BallGr/2,400-Figuren.BallGr/2);
        Figuren.bx =constrain(Figuren.bx+Figuren.dBx,Figuren.BallGr/2,400-Figuren.BallGr/2);
        Figuren.by =constrain(Figuren.by+Figuren.dBy,Figuren.BallGr/2,400-Figuren.BallGr/2);
    }
};

Figuren.keyPressed = function() {
    switch(key.code) {
        case 97: 
            Figuren.dY1 -= 4;
            if( Figuren.dY1 > Figuren.dYMax ) {
                Figuren.dY1 = Figuren.dYMax;
            }
            break;
        case 121: 
            Figuren.dY1 += 4;
            if( Figuren.dY1 < -Figuren.dYMax ) {
                Figuren.dY1 = -Figuren.dYMax;
            }
            break;
        case 112: 
            Figuren.dY2 -= 4;
            if( Figuren.dY2 > Figuren.dYMax ) {
                Figuren.dY2 = Figuren.dYMax;
            }
            break;
        case 108: 
            Figuren.dY2 += 4;
            if( Figuren.dY2 < -Figuren.dYMax ) {
                Figuren.dY2 = -Figuren.dYMax;
            }
            break;
    }
};

Figuren.mousePressed = function() {
};

Figuren.collide = function(x, y, dy) {
    var minDist = (Figuren.KreisGr + Figuren.BallGr)/2,
        geschw = sqrt(Figuren.dBx*Figuren.dBx+Figuren.dBy*Figuren.dBy);

    var d = dist( Figuren.bx, Figuren.by, x, y );
    
    if( d <= minDist ) {
        
        var bx = Figuren.bx,
            by = Figuren.by,
            overlapFactor = (minDist - d)/geschw;
            
        bx -= Figuren.dBx * overlapFactor;
        by -= Figuren.dBy * overlapFactor;
        
        var kugelWinkel = (atan2(y-by, x-bx)+360)%360,
            geschwWinkel =(atan2(Figuren.dBy, Figuren.dBx)+360)%360,
            sign = kugelWinkel - geschwWinkel >= 0? 1:-1,
            neuerWinkel = geschwWinkel - (90-abs(kugelWinkel - geschwWinkel))*2*sign;
        
        Figuren.dBx = cos(neuerWinkel) * geschw;
        Figuren.dBy = sin(neuerWinkel) * geschw;
        
        Figuren.bx = bx + Figuren.dBx * overlapFactor;
        Figuren.by = by + Figuren.dBy * overlapFactor + dy;
    }
};

Figuren.setBall = function() {
    Figuren.bx = 200;
    Figuren.by = 200;
    Figuren.dBx = random(0,10)-5;
    Figuren.dBy = sqrt(100-(sq(Figuren.dBx+5)))-5;
};

setScene( TitelSzene );