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
// Titel-Szene
var Fahrrad;
TitelSzene.init = function() {
    Fahrrad.show();
};

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
    fill(74, 15, 74);
    textSize(70);
    text("P . O . N . G", 200, 170); 
};

Fahrrad.init = function() {
    Fahrrad.x = 320;
    Fahrrad.dx = 0;
    Fahrrad.rx = 200;
    Fahrrad.ry = 130;
};

Fahrrad.draw = function(isPaused) {
    var i = Fahrrad.images;
    
    Fahrrad.rx += (mouseX-Fahrrad.rx)/10;
    Fahrrad.ry += (mouseY-Fahrrad.ry)/10;
    
    image(i.Rob, Fahrrad.rx, Fahrrad.ry);
    scale(1);
    image(i.Fahrrad, Fahrrad.x, 370);
    
    Fahrrad.x += Fahrrad.dx;
    if( Fahrrad.x < -100 ) {
        setScene( SpielSzene );
    }

    if( Fahrrad.dx === 0 && Fahrrad.rx>300 && Fahrrad.rx<350 && Fahrrad.ry>300 ) {
        Fahrrad.dx = -3; 
        playSound(Fahrrad.sounds.Klingel);
    }
};

//////////////////////////////////////////
// Spielszene
var Warten, Spielfeld, Tooor, Gewonnen, Figuren;

SpielSzene.init = function() {
    Tooor.hide();
    Gewonnen.hide();
    Figuren.show();
    Figuren.pause();
    Spielfeld.show();
    Warten.show();
    
    SpielSzene.PunkteRob = 0;
    SpielSzene.PunkteFred = 0;
};

var Warten = SpielSzene.addLayer(2);
Warten.init = function(Schütze) {
    cursor();
    
    Warten.TasteBob = false;
    Warten.TasteFred = false;
};

Warten.draw = function(isPaused) {
    if( !isPaused ) {
        textSize(24);
        fill(87, 35, 35);
        text("Beide Spieler eine\nihrer Tasten drücken ...", 200, 270);
    
        textSize(14);
        fill(245, 108, 108);
        text("Hoch: A\nRunter: Y", 30, 380);
        fill(132, 163, 201);
        text("Hoch: P\nRunter: L", 370, 380);
        Spielfeld.TastenFade -= 0.2;
    }
};

Warten.keyPressed = function() {
    switch(key.code) {
        case 97: 
        case 121: 
            Warten.TasteBob = true;
            break;
        case 112: 
        case 108: 
            Warten.TasteFred = true;
            break;
    }
    
    if( Warten.TasteFred && Warten.TasteBob ) {
        Warten.hide();
        Figuren.resume();
    }
};

var Spielfeld = SpielSzene.addLayer(0,{},{
        Tooor: getSound("Spielplatz/Schlagzeug")
    });

Spielfeld.draw = function(isPaused) {
    noStroke();
    fill(245, 108, 108);
    rect(5,200,10,200);
    fill(132, 163, 201);
    rect(395,200,10,200);

    textSize(240);
    fill(245, 108, 108, 25);
    text(SpielSzene.PunkteRob, 100, 200);
    fill(132, 163, 201, 25);
    text(SpielSzene.PunkteFred, 300, 200);

    if( !isPaused && Figuren.by > 100 && Figuren.by < 300 ) {
        if( Figuren.bx < Figuren.BallGr/2 + 5 ) {
            Tooor.show("Fred");
            SpielSzene.PunkteFred++;
            playSound(Spielfeld.sounds.Tooor);
        } else if( Figuren.bx > 400 - Figuren.BallGr/2 - 5 ) {
            Tooor.show("Rob");
            SpielSzene.PunkteRob++;
            playSound(Spielfeld.sounds.Tooor);
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
    Tooor.Zähler = 4;
    Tooor.Schütze = Schütze;
    if( Schütze === "Rob" ) {
        Figuren.Gefühl1 = 2;
        Figuren.Gefühl2 = 4;
    } else {
        Figuren.Gefühl1 = 4;
        Figuren.Gefühl2 = 2;
    }
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
            Tooor.pause();
            Tooor.hide();

            Figuren.Gefühl1 = 0;
            Figuren.Gefühl2 = 0;
            if( SpielSzene.PunkteFred >= 3 ) {
                Gewonnen.show("Fred");
            } else if(SpielSzene.PunkteRob >= 3 ) {
                Gewonnen.show("Rob");
            } else {
                Figuren.setBall();
                Figuren.resume();
                Spielfeld.resume();
            }
        } else if( Tooor.Zähler < 3 ) {
            if( Tooor.Schütze === "Rob" ) {
                Figuren.Gefühl1 = 3;
            } else {
                Figuren.Gefühl2 = 3;
            }
        }   
    }
};

var Gewonnen = SpielSzene.addLayer(2);
Gewonnen.init = function(Schütze) {
    if( Schütze === "Rob" ) {
        Gewonnen.x = "x1";
        Gewonnen.y = "y1";
        Gewonnen.gr = "gr1";
        Gewonnen.xInc = (200-Figuren.x1)/60; 
        Gewonnen.yInc = (200-Figuren.y1)/60; 
        Figuren.Gefühl1 = 3;
        Figuren.Gefühl2 = 4;
    } else {
        Gewonnen.x = "x2";
        Gewonnen.y = "y2";
        Gewonnen.gr = "gr2";
        Gewonnen.xInc = (200-Figuren.x2)/60; 
        Gewonnen.yInc = (200-Figuren.y2)/60; 
        Figuren.Gefühl1 = 4;
        Figuren.Gefühl2 = 3;
    }   
    
    cursor();
};

Gewonnen.draw = function(isPaused) {
    if( round(Figuren[Gewonnen.x]) === 200 ) {
        textSize(28);
        fill(87, 35, 35);
        text("Drücke eine Taste ...", 200, 350);
    } else {
        Figuren[Gewonnen.x] += Gewonnen.xInc;
        Figuren[Gewonnen.y] += Gewonnen.yInc;
        Figuren[Gewonnen.gr]+=3;
        Figuren.KreisGr = 0;
    }
};

Gewonnen.keyPressed = function() {
    setScene( TitelSzene );
};

var Figuren = SpielSzene.addLayer(1,{
        Fred:  [getImage("Spielplatz/Fred_stehend"),
                getImage("Spielplatz/Fred_anpackend"),
                getImage("Spielplatz/Fred_Yeah"),
                getImage("Spielplatz/Fred_lächelnd"),
                getImage("Spielplatz/Fred_wütend")],
        Rob:   [getImage("Spielplatz/Rob_cool"),
                getImage("Spielplatz/Rob_cool"),
                getImage("Spielplatz/Rob_cool"),
                getImage("Spielplatz/Rob_cool"),
                getImage("Spielplatz/Rob_cool")],
        Ball: getImage("Spielplatz/BlauerBall"),
    },{
        Tock: getSound("Spielplatz/Glas"),
    });
    
Figuren.init = function() {
    Figuren.setBall();
    Figuren.x1 = 40;
    Figuren.y1 = 200;
    Figuren.gr1 = 100;
    Figuren.x2 = 360;
    Figuren.y2 = 200;
    Figuren.gr2 = 100;
    Figuren.dY1 = 0;
    Figuren.dY2 = 0;
    Figuren.dYMax = 20;
    Figuren.KreisGr = 80;
    Figuren.BallGr = 30;
    Figuren.BumperGr = 120;
    Figuren.BumperOffset = 30;
    Figuren.CollisionTime = 0;
    Figuren.Gefühl1 = 0;
    Figuren.Gefühl2 = 0;
};

Figuren.draw = function(isPaused) {
    noFill();
    stroke(245, 108, 108);
    image(Figuren.images.Fred[Figuren.Gefühl1], Figuren.x1, Figuren.y1, Figuren.gr1, Figuren.gr1*0.7);
    arc(Figuren.x1, Figuren.y1, Figuren.KreisGr, Figuren.KreisGr, -110, 110);
    stroke(132, 163, 201);
    image(Figuren.images.Rob[Figuren.Gefühl2], Figuren.x2, Figuren.y2, Figuren.gr2, Figuren.gr2*0.7);
    arc(Figuren.x2, Figuren.y2, Figuren.KreisGr, Figuren.KreisGr, 70, 290);
    image(Figuren.images.Ball, Figuren.bx, Figuren.by, Figuren.BallGr, Figuren.BallGr);
    stroke(200,200, 200);
    ellipse(200, -Figuren.BumperGr/2+Figuren.BumperOffset, 
            Figuren.BumperGr, Figuren.BumperGr);    
    ellipse(200, 400+Figuren.BumperGr/2-Figuren.BumperOffset, 
            Figuren.BumperGr, Figuren.BumperGr);    

    Figuren.dY1 -= Figuren.dY1/10;
    Figuren.dY2 -= Figuren.dY2/10;
    
    if( !isPaused ) {
        Figuren.dBx *= 1.0005;
        Figuren.dBy *= 1.0005;
    
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
        
        Figuren.collide(Figuren.x1, Figuren.y1, Figuren.dY1, Figuren.KreisGr);            
        Figuren.collide(Figuren.x2, Figuren.y2, Figuren.dY2, Figuren.KreisGr);            
        Figuren.collide(200, -Figuren.BumperGr/2+Figuren.BumperOffset, 0, Figuren.BumperGr);
        Figuren.collide(200, 400+Figuren.BumperGr/2-Figuren.BumperOffset, 
                        0, Figuren.BumperGr);            

        Figuren.y1 =constrain(Figuren.y1+Figuren.dY1,Figuren.BallGr/2,400-Figuren.BallGr/2);
        Figuren.y2 =constrain(Figuren.y2+Figuren.dY2,Figuren.BallGr/2,400-Figuren.BallGr/2);
        Figuren.bx =constrain(Figuren.bx+Figuren.dBx,Figuren.BallGr/2,400-Figuren.BallGr/2);
        Figuren.by =constrain(Figuren.by+Figuren.dBy,Figuren.BallGr/2,400-Figuren.BallGr/2);

        if( Figuren.bx < 200 && Figuren.Gefühl1 < 2 ) {
            Figuren.Gefühl1 = 1;
            Figuren.Gefühl2 = 0;
        } else {
            Figuren.Gefühl1 = 0;
            Figuren.Gefühl2 = 1;
        }
    }
};

Figuren.keyPressed = function() {
    switch(key.code) {
        case 97: 
            if( Figuren.dY1 > Figuren.dYMax ) {
                Figuren.dY1 = -Figuren.dY1;
            } else {
                Figuren.dY1 -= 6;
            }
            break;
        case 121: 
            if( Figuren.dY1 < -Figuren.dYMax ) {
                Figuren.dY1 = -Figuren.dY1;
            } else {
                Figuren.dY1 += 6;
            }
            break;
        case 112: 
            if( Figuren.dY2 > Figuren.dYMax ) {
                Figuren.dY2 = -Figuren.dY2;
            } else {
                Figuren.dY2 -= 6;
            }
            break;
        case 108: 
            if( Figuren.dY2 < -Figuren.dYMax ) {
                Figuren.dY2 = -Figuren.dY2;
            } else {
                Figuren.dY2 += 6;
            }
            break;
    }
};

Figuren.mousePressed = function() {
};

Figuren.collide = function(x, y, dy, größe) {
    
    var minDist = (größe + Figuren.BallGr)/2,
        geschw = sqrt(Figuren.dBx*Figuren.dBx+Figuren.dBy*Figuren.dBy);

    var d = dist( Figuren.bx, Figuren.by, x, y+dy );
    
    if( d < minDist ) {
        
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
        Figuren.by = by + Figuren.dBy * overlapFactor;

        playSound(Figuren.sounds.Tock);
    }
};

Figuren.setBall = function() {
    var winkel = random(0,360);
    
    Figuren.bx = 200;
    Figuren.by = 200;
    Figuren.dBx = cos(winkel)*5;
    Figuren.dBy = sin(winkel)*5;
};

setScene( TitelSzene );