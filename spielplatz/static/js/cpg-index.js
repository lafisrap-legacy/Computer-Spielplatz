(function($) {
    // Start Bootstrap Addons
    var a = $( "section#galerie .portfolio-box-caption" );
    $( "section#galerie .portfolio-box-caption" ).on( "click tap", function(e) {
        window.open("https://c2064.org/" + $( "img.img-responsive", $( this ).parent() ).attr( "alt" ));

        e.preventDefault();
        e.stopPropagation();
    });

    // Alfred
    var canvas = document.getElementById("canvas");
    new Processing(canvas, function(processing) {
        processing.size(1140, 600);
        processing.background(0,0,0,0);
        processing.sbShow = false;


        var mouseIsPressed = false;
        $("header").on("mousedown touchstart", function(e) {
            mouseIsPressed = true;
            processing.mouseX = e.pageX - ($(window).width() - 1140)/2;
            processing.mouseY = e.pageY;
            processing.sbShow = false;
        }).on("mouseup touchend", function(e) {
            mouseIsPressed = false;
            processing.mouseX = e.pageX - ($(window).width() - 1140)/2;
            processing.mouseY = e.pageY;
        }).on("mousemove touchmove", function(e) {
            processing.mouseX = e.pageX - ($(window).width() - 1140)/2;
            processing.mouseY = e.pageY;
        });
        processing.mousePressed = function () { mouseIsPressed = true; };
        processing.mouseReleased = function () { mouseIsPressed = false; };

        var keyIsPressed = false;
        processing.keyPressed = function () { keyIsPressed = true; };
        processing.keyReleased = function () { keyIsPressed = false; };

        var keyIsPressed = false;
        processing.keyPressed = function () { keyIsPressed = true; };
        processing.keyReleased = function () { keyIsPressed = false; };

        function getSound(s) {
            var url = "static/userdata/Admin/sounds/" + s + ".mp3";
            return new Audio(url);
        }

        function playSound(s) {
            s.play();
        }

        function stopSound(s) {
            s.pause();
            sound.currentTime = 0;
        }

        function debug() {
        }

        function getImage(s) {
            var url = "static/userdata/Admin/images/" + s + ".png";
            //processing.externals.sketch.imageCache.add(url);
            return processing.loadImage(url);
        }

        var rotateFn = processing.rotate;
        processing.rotate = function(angle) {
            rotateFn(processing.radians(angle));
        }
        var cosFn = processing.cos;
        processing.cos = function(angle) {
            return cosFn(processing.radians(angle));
        }
        var sinFn = processing.sin;
        processing.sin = function(angle) {
            return sinFn(processing.radians(angle));
        }
        var atan2Fn = processing.atan2;
        processing.atan2 = function(y, x) {
            return processing.degrees(atan2Fn(y,x));
        }
        var arcFn = processing.arc;
        processing.arc = function(x,y,w,h,a1,a2) {
            return arcFn(x,y,w,h,processing.radians(a1), processing.radians(a2));
        }
        
        with (processing) {

var img = getImage("Spielplatz/Alfred");

var startTime = millis();

var y = 0,
    dy = 5,
    angle = 0,
    sc = 0,
    dsc = 0.01;

imageMode(CENTER);
rectMode(CENTER);
textMode(CENTER);
textAlign(CENTER, BOTTOM);
frameRate(10);


var alfons = function(x, y, width, height, command) {
    var self = alfons;
    
    translate(x,y);
    scale(width/100, height/100);
    rotate(angle);
    if( !command ) {
        self.face();
    } else {
        switch( command ) {
        default: self.face(command);
        }
    }
    resetMatrix();
};


alfons.face = function(command) {
    var self = alfons;

    pushMatrix();
    scale(0.5);
    fill(212, 247, 227, 0);
    beginShape();
    vertex(-10, 94);
    bezierVertex(-70, 87,-81,-120,2,-123);
    bezierVertex(124,-120,39,110,-10,94);
    endShape();
    image( img, 0, 0 );
    popMatrix();

    stroke(100);
    strokeWeight(1);
    translate(0,0);
    self.leftEye(command.lookAt, command.smile);
    translate(0,0);
    self.rightEye(command.lookAt, command.smile);
    translate(0,0);
    self.leftBrow(command.raiseEyeBrow);
    translate(0,0);
    self.rightBrow(command.raiseEyeBrow);
    translate(0,0);
    self.mouth(command.smile);
};

alfons.leftPupil = {
    x1:  6,
    x2:  2,
    y1:  2.5,
    y2:  2,
};

alfons.rightPupil = {
    x1:  2.5,
    x2:  3,
    y1:  2.5,
    y2:  2,
};

alfons.eyeDim = function(lookAt, left) {

    var x = lookAt? constrain(lookAt.x,-100,100) : 0,
        y = lookAt? constrain(lookAt.y,-100,100) : 0,
        p = left? alfons.leftPupil : alfons.rightPupil;

    if( abs(x) < 20 ) {
        x = left? x += 80 - abs(x) * 4 : x -= 80 - abs(x) * 4;
    }

    x = x/100 * p[x<0?"x1":"x2"];
    y = y/100 * p[y<0?"y1":"y2"];
  
    return {
        angle: atan2(x,y),
        radius: sqrt(x*x+y*y),
    };
};

alfons.leftEye = function(lookAt, smile) {

    var dim = alfons.eyeDim(lookAt, true),
        w = smile? smile/6 : 0;

    noStroke();

    fill(115, 130, 230);
    ellipse(-12+sin(dim.angle)*dim.radius,-18+cos(dim.angle)*dim.radius,5+w,4+w);
    fill(0);
    ellipse(-12+sin(dim.angle)*dim.radius,-18+cos(dim.angle)*dim.radius,3+w,2+w);
};

alfons.rightEye = function(lookAt, smile) {

    var dim = alfons.eyeDim(lookAt, false),
        w = smile? smile/6 : 0;

    fill(115, 130, 230);
    ellipse(12+sin(dim.angle)*dim.radius,-17+cos(dim.angle)*dim.radius,5+w,4+w);
    fill(0);
    ellipse(12+sin(dim.angle)*dim.radius,-17+cos(dim.angle)*dim.radius,3+w,2+w);
};

alfons.browMax = 5;
alfons.browY = 0;
alfons.browSpeed = 0.3;
alfons.leftBrow = function(raise) {
    
    if( raise ) {
        alfons.browY = min(alfons.browMax, alfons.browY + alfons.browSpeed);
    } else {
        alfons.browY = max(0, alfons.browY - alfons.browSpeed);
    }
    
    stroke(30);
    strokeWeight(2.2);
    noFill();
    bezier(-21,-26,-14,-30-alfons.browY,-13,-30,-4,-29);
};

alfons.rightBrow = function(raise) {
    if( raise ) {
        alfons.browY = min(alfons.browMax, alfons.browY + alfons.browSpeed);
    } else {
        alfons.browY = max(0, alfons.browY - alfons.browSpeed);
    }
    
    stroke(20);
    strokeWeight(2.0);
    noFill();
    bezier(7,-26,14,-28-alfons.browY,17,-28,23,-26);
};

alfons.mouth = function(smile) {
    smile = constrain(smile || 0, 0, 10);
    stroke(20);
    strokeWeight(2.1);
    noFill();
    bezier(-11,30,-2,28+smile,2,32,3,32);
};



var angle = -5; 
var draw = function() {
    background(255,255,255,0);
    
    translate(170, 200);
    rotate(angle);
    //scale(sc);
    if( millis() - 3000 < startTime ) {
        alfons(0,0,200,200, {
            lookAt: { x: 0, y: 0 },
            raiseEyeBrow: mouseIsPressed? true : false,
            smile: 5,
        });     
    } else {
        var pos = $( ".header-content").position();
        alfons(0,0,200,200, {
            lookAt: { x: (mouseX-90)/3, y: (mouseY-180)/3 },
            raiseEyeBrow: mouseIsPressed? true : false,
            smile: (800-abs(constrain(mouseY - pos.top - 300, -800, 800 )))/80 * (800-abs(constrain(mouseX - pos.left - 600, -800, 800 )))/800,
        });        
    }

    angle+=0.0;
    sc+=dsc;
    if( sc > 3 || sc <= 0 ) {
        dsc = -dsc;
    }
};

        };
        if (typeof draw !== 'undefined') processing.draw = draw;
    });





    // Ka
    var canvas = document.getElementById("canvas_about"),
        canvasWidth = Math.min( $(window).width(), 1140 );
    $( "#canvas_about" ).css( "margin-left", (-canvasWidth/2)+"px")

    new Processing(canvas, function(processing) {
        processing.size(canvasWidth, 600);
        processing.background(0,0,0,0);
        processing.sbShow = false;

        var mouseIsPressed = false;
        $("section#about").on("mousedown touchstart", function(e) {
            mouseIsPressed = true;
            processing.mouseX = e.pageX - ($(window).width() - canvasWidth)/2;
            processing.mouseY = e.pageY - ($("#canvas_about").offset().top);
            processing.sbShow = false;
        }).on("mouseup touchend", function(e) {
            mouseIsPressed = false;
            processing.mouseX = e.pageX - ($(window).width() - canvasWidth)/2;
            processing.mouseY = e.pageY - ($("#canvas_about").offset().top);
        }).on("mousemove touchmove", function(e) {
            processing.mouseX = e.pageX - ($(window).width() - canvasWidth)/2;
            processing.mouseY = e.pageY - ($("#canvas_about").offset().top);
        });
        processing.mousePressed = function () { mouseIsPressed = true; };
        processing.mouseReleased = function () { mouseIsPressed = false; };

        var keyIsPressed = false;
        processing.keyPressed = function () { keyIsPressed = true; };
        processing.keyReleased = function () { keyIsPressed = false; };

        var keyIsPressed = false;
        processing.keyPressed = function () { keyIsPressed = true; };
        processing.keyReleased = function () { keyIsPressed = false; };

        function getSound(s) {
            var url = "static/userdata/Admin/sounds/" + s + ".mp3";
            return new Audio(url);
        }

        function playSound(s) {
            s.play();
        }

        function stopSound(s) {
            s.pause();
            sound.currentTime = 0;
        }

        function debug() {
        }

        function getImage(s) {
            var url = "static/userdata/Admin/images/" + s + ".png";
            //processing.externals.sketch.imageCache.add(url);
            return processing.loadImage(url);
        }

        var rotateFn = processing.rotate;
        processing.rotate = function(angle) {
            rotateFn(processing.radians(angle));
        }
        var cosFn = processing.cos;
        processing.cos = function(angle) {
            return cosFn(processing.radians(angle));
        }
        var sinFn = processing.sin;
        processing.sin = function(angle) {
            return sinFn(processing.radians(angle));
        }
        var atan2Fn = processing.atan2;
        processing.atan2 = function(y, x) {
            return processing.degrees(atan2Fn(y,x));
        }
        var arcFn = processing.arc;
        processing.arc = function(x,y,w,h,a1,a2) {
            return arcFn(x,y,w,h,processing.radians(a1), processing.radians(a2));
        }
        
        with (processing) {

imageMode(CENTER);
rectMode(CENTER);
textMode(CENTER);
textAlign(CENTER, BOTTOM);
frameRate(40);

var color1 = color(255, 0, 0),
    color2 = color(60, 99, 41),
    color3 = color(57, 219, 211),
    jobjects,
    now = millis(),
    jumping = false,
    weirdEyes = 0,
    weirdOffset = 0;
    
var face = function( jo ) {
    fill(0);
    stroke(0);
    strokeWeight(1);
    ellipse(0,0,100,100);
    
    if( jobjects.leftEye.dock === false && 
        jobjects.rightEye.dock === false && 
        jobjects.leftPupil.dock === false &&
        jobjects.rightPupil.dock === false &&
        jobjects.mouth.dock === false &&
        jobjects.hair.dock === false ) {

        fill(255, 213, 0);
        textSize(25);
        text("Hilf mir!", 0, 10); 
    }
};

var leftEye = function( jo ) {
    var x = jo.dock? jo.offx :0, 
        y = jo.dock? jo.offy :0;

    fill(255);
    stroke(0);
    strokeWeight(1);
    ellipse(x,y,33,33);
};

var rightEye = function( jo ) {
    var x = jo.dock? jo.offx :0, 
        y = jo.dock? jo.offy :0;
    fill(255);
    stroke(0);
    strokeWeight(1);
    ellipse(x,y,33,33);
};

var leftPupil = function( jo ) {
    var x = jo.dock? jo.offx + weirdOffset:0, 
        y = jo.dock? jo.offy + weirdOffset:0;
    fill(0);
    stroke(0);
    ellipse(x,y,13,13);
    fill(255);
    ellipse(x-4,y-2,5,5);
};

var rightPupil = function( jo ) {
    var x = jo.dock? jo.offx - weirdOffset:0, 
        y = jo.dock? jo.offy - weirdOffset:0;
    fill(0);
    stroke(0);
    ellipse(x,y,13,13);
    fill(255);
    ellipse(x+4,y-2,5,5);
};

var mouth = function( jo ) {
    var x = jo.dock? jo.offx:0, 
        y = jo.dock? jo.offy:0;
    stroke(255, 0, 0);strokeWeight(6);noFill();arc(x,y,48,34,30,150);
};

var hair = function( jo ) {
    var x = jo.dock? jo.offx:0, 
        y = jo.dock? jo.offy:0;
    strokeWeight(4);
    stroke(color1);line(x,y,x-7,y-17);
    stroke(color2);line(x,y,x,y-17);
    stroke(color3);line(x,y,x+7,y-18);
};


var jobjects = {    
    face: {
        x: 83,
        y: 343,
        r: 0,
        w: 50,
        h: 50,
        dx: 0,
        dy: 0,
        dr: 0,
        fn: face,
        rel: null,
        offx: 0,
        offy: 0,
        dock: false,
        speed: 1,
        weight: 0.0,
    },
    leftEye: {
        x: 0,
        y: 0,
        r: 0,
        w: 33,
        h: 33,
        dx: 2,
        dy: 0,
        dr: 0.5,
        fn: leftEye,
        rel: "face",
        offx: -22,
        offy: -4,
        dock: true,
        speed: 1.6,
        weight: 1.9,
    },
    rightEye: {
        x: 0,
        y: 0,
        w: 33,
        h: 33,
        r: 0,
        dx: 2,
        dy: 0,
        dr: 0.5,
        fn: rightEye,
        rel: "face",
        offx: 22,
        offy: -4,
        dock: true,
        speed: 1.9,
        weight: 2.3,
    },
    leftPupil: {
        x: 0,
        y: 0,
        w: 13,
        h: 13,
        r: 0,
        dx: 2,
        dy: 0,
        dr: 0.5,
        fn: leftPupil,
        rel: "face",
        offx: -22,
        offy: -4,
        dock: true,
        speed: 0.5,
        weight: 1.6,
    },
    rightPupil: {
        x: 0,
        y: 0,
        w: 13,
        h: 13,
        r: 0,
        dx: 2,
        dy: 0,
        dr: 0.5,
        fn: rightPupil,
        rel: "face",
        offx: 22,
        offy: -4,
        dock: true,
        speed: 0.9,
        weight: 1.4,
    },
    mouth: {
        x: 0,
        y: 0,
        w: 48,
        h: 34,
        r: 0,
        dx: 2,
        dy: 0,
        dr: 0.5,
        fn: mouth,
        rel: "face",
        offx: 0,
        offy: 20,
        dock: true,
        speed: 1.5,
        weight: 1.1,
    },
    hair: {
        x: 0,
        y: 0,
        w: 14,
        h: 17,
        r: 0,
        dx: 2,
        dy: 0,
        dr: 0.5,
        fn: hair,           
        rel: "face",
        offx: -0,
        offy: -44,
        dock: true,
        speed: 1.3,
        weight: 0.9,
    },
};
    
var mouseDown = false,
    maxJumps = 10,
    jumps = maxJumps - 5,
    headerHeight = $("header").height();

var draw = function() {
    var scrollTop = $("body").scrollTop();
    if( scrollTop < headerHeight - 80 || scrollTop > headerHeight + 540 ) return;

    background(0,0,0,0);

    for( var j in jobjects ) {

        var jo = jobjects[j];

        if( mouseIsPressed && jo.rel ) {

            if( jo.dock === false ) {
                var destx = jobjects[jo.rel].x + jo.offx,
                    desty = jobjects[jo.rel].y + jo.offy,
                    destr = jobjects[jo.rel].r,
                    destdx = jobjects[jo.rel].dx,
                    destdy = jobjects[jo.rel].dy,
                    destdr = jobjects[jo.rel].dr;

                jo.x += (destx - jo.x) / 7;
                jo.y += (desty - jo.y) / 7;
                jo.r += (destr - jo.r) / 7;
                jo.dx = destdx * jo.speed;
                jo.dy = destdy;
                jo.dr = destdr * jo.speed * jo.speed;
                
                if( dist( jo.x, jo.y, destx, desty ) < 15 ) {
                    jo.dock = true;
                    jumps = maxJumps;

                    if( jobjects.leftEye.dock === true && 
                        jobjects.rightEye.dock === true && 
                        jobjects.leftPupil.dock === true &&
                        jobjects.rightPupil.dock === true &&
                        jobjects.mouth.dock === true &&
                        jobjects.hair.dock === true ) {
                            weirdEyes = 25;
                    }
                }
            }
        } else {
            jo.x += jo.dx;
            jo.y += jo.dy;
            jo.r += jo.dr;
        }
        
        if( jo.dock === true ) {
            jo.x = jobjects[jo.rel].x + jo.offx;
            jo.y = jobjects[jo.rel].y + jo.offy;
            jo.r = jobjects[jo.rel].r;
            jo.dx = jobjects[jo.rel].dx * jo.speed;
            jo.dy = jobjects[jo.rel].dy;
            jo.dr = jobjects[jo.rel].dr * jo.speed * jo.speed;
         }

        if( jo.x > width || jo.x < 0 || mouseIsPressed && !mouseDown ) {
            jo.dx = -jo.dx;
            jo.dr = -jo.dr;
        }

        if( jo.y > height - jo.h ) {
            jo.dy = -jo.dy;
            
            if( j === "face" && !mouseDown ) {
                if( --jumps === 0 ) {
                    jumps = maxJumps;
                    for( var j1 in jobjects ) {
                        jobjects[j1].dock = false;
                    }
                }
            }
        } else {
            jo.dy += jo.weight;
        }

        if( !jo.rel || jo.dock === false ) {
            translate( jo.x, jo.y );
            rotate( jo.r );
        } else {
            translate( jobjects[jo.rel].x, jobjects[jo.rel].y );
            rotate( jobjects[jo.rel].r );
        }
        jo.fn( jo );
        resetMatrix();      
    }

    if( --weirdEyes > 0 ) {
        weirdOffset = 12 - abs( weirdEyes - 12 ); 
        console.log( "weirdOffset", weirdOffset );
    }

    if( millis() - now > 8000 && !jumping ) {
        jumping = true;
        jobjects.face.dx = 2;
        jobjects.face.dy = 7;
        jobjects.face.dr = 0.5;
        jobjects.face.weight = 0.6;
        jumps = 3;
    }

    if( !mouseIsPressed ) {
        mouseDown = false;
    } else {
        mouseDown = true;

        fill(255);
        console.log(mouseX, ">", width - 41, mouseX, "<", width - 14, mouseY, ">", height - 30, mouseY, "<", height);
        if( mouseX > width - 41 && mouseX < width - 14 && mouseY > height - 30 && mouseY < height -5 ) {
            now = 999999999999999;
            jumping = false;
            jobjects.face.x = 83;
            jobjects.face.y = 343;
            jobjects.face.dx = 0;
            jobjects.face.dy = 0;
            jobjects.face.dr = 0;
            jobjects.face.weight = 0;
            jobjects.leftEye.dock = true;
            jobjects.rightEye.dock = true;
            jobjects.leftPupil.dock = true;
            jobjects.rightPupil.dock = true;
            jobjects.mouth.dock = true;
            jobjects.hair.dock = true;
        }
    }

    if( now < 999999999999999 ) {
        noFill();
        stroke(0);
        strokeWeight(1);
        rect( width - 30, height - 20, 15, 15 );
        fill(0);
        textSize( 18 );
        text( "x", width - 29 , height - 10 );      
    }
};
        };
        if (typeof draw !== 'undefined') processing.draw = draw;
    });




    // Schlange
    var canvas = document.getElementById("canvas_spielplatz"),
        canvasWidth = Math.min( $(window).width(), 1140 );
    $( "#canvas_spielplatz" ).css( "margin-left", (-canvasWidth/2)+"px")

    new Processing(canvas, function(processing) {
        processing.size(canvasWidth, 600);
        processing.background(0,0,0,0);

        var mouseIsPressed = false;
        $("section#spielplatz").on("mousedown touchstart", function(e) {
            mouseIsPressed = true;
            processing.mouseX = e.pageX - ($(window).width() - canvasWidth)/2;
            processing.mouseY = e.pageY - ($("#canvas_spielplatz").offset().top);
            processing.sbShow = false;
        }).on("mouseup touchend", function(e) {
            mouseIsPressed = false;
            processing.mouseX = e.pageX - ($(window).width() - canvasWidth)/2;
            processing.mouseY = e.pageY - ($("#canvas_spielplatz").offset().top);
        }).on("mousemove touchmove", function(e) {
            processing.mouseX = e.pageX - ($(window).width() - canvasWidth)/2;
            processing.mouseY = e.pageY - ($("#canvas_spielplatz").offset().top);
        });
        processing.mousePressed = function () { mouseIsPressed = true; };
        processing.mouseReleased = function () { mouseIsPressed = false; };

        var keyIsPressed = false;
        processing.keyPressed = function () { keyIsPressed = true; };
        processing.keyReleased = function () { keyIsPressed = false; };

        var keyIsPressed = false;
        processing.keyPressed = function () { keyIsPressed = true; };
        processing.keyReleased = function () { keyIsPressed = false; };

        function getSound(s) {
            var url = "static/userdata/Admin/sounds/" + s + ".mp3";
            return new Audio(url);
        }

        function playSound(s) {
            s.play();
        }

        function stopSound(s) {
            s.pause();
            sound.currentTime = 0;
        }

        function debug() {
        }

        function getImage(s) {
            var url = "static/userdata/Admin/images/" + s + ".png";
            //processing.externals.sketch.imageCache.add(url);
            return processing.loadImage(url);
        }

        var rotateFn = processing.rotate;
        processing.rotate = function(angle) {
            rotateFn(processing.radians(angle));
        }
        var cosFn = processing.cos;
        processing.cos = function(angle) {
            return cosFn(processing.radians(angle));
        }
        var sinFn = processing.sin;
        processing.sin = function(angle) {
            return sinFn(processing.radians(angle));
        }
        var atan2Fn = processing.atan2;
        processing.atan2 = function(y, x) {
            return processing.degrees(atan2Fn(y,x));
        }
        var arcFn = processing.arc;
        processing.arc = function(x,y,w,h,a1,a2) {
            return arcFn(x,y,w,h,processing.radians(a1), processing.radians(a2));
        }
        
        with (processing) {

var color1 = color(255, 0, 0),
    color2 = color(60, 99, 41),
    color3 = color(57, 219, 211);

imageMode(CENTER);
rectMode(CENTER);
textMode(CENTER);
textAlign(CENTER, BOTTOM);
frameRate(60);


// Schlangen-Spiel (#1 Besserer Name) 

var Schlange = [],
    Elastizität = 6,   // (#2 Elastizität der Schlange ändern)
    n = 22,             // (#3 Länge der Schlange)
    Käfer = [],
    SchlangeAktiv = false,
    KäferMax = 5,       // (#4 Anzahl der möglichen Käfer zu Beginn, auch unten)
    GeschwMax = 0.5,    // (#5 Geschwindigkeit der Käfer)
    ZeitZumNächstenKäfer = 2000,   // (#6 Zeit bis zum nächsten Käfer, auch unten)
    MultZeit = 0.95,    // (#7 Beschleunigung der Zeit zum nächsten Käfer)
    Zeit = 0,
    Punktzahl = 0,
    GameOver = false,
    StopGame = false;

for( var i=0 ; i<n ; i++ ) {
    Schlange.push({
        x: 200,
        y: 200,
    });
}

textAlign(CENTER, CENTER);
rectMode(CENTER);


var gesicht = function() {

    fill(0);stroke(0);strokeWeight(1);ellipse(0,0,300,300);
    fill(255);ellipse(-66,-11,100,100);ellipse(69,-11,100,100);
    fill(0);ellipse(-66,-11,40,40);ellipse(69,-11,40,40);
    fill(255);ellipse(-56,-19,15,15);ellipse(80,-18,15,15);
    strokeWeight(7);
    stroke(color1);line(0,-132,-20,-184);
    stroke(color2);line(0,-132,0,-183);
    stroke(color3);line(0,-132,20,-187);
    stroke(255, 0, 0);strokeWeight(17);noFill();arc(0,59,145,101,30,150);
};


var offsetTop = $("section#spielplatz").offset().top,
    offsetHeight = $("section#spielplatz").height();

var draw = function() {
    var scrollTop = $("body").scrollTop();
    if( scrollTop < offsetTop - 80 || scrollTop > offsetTop + offsetHeight - 200 ) return;


    background(0, 0, 0, 0);    // (#10 Hintergrundfarbe)

    if( StopGame ) {
        return;
    }

    var s;
    if( !GameOver ) {
        for( var i=0 ; i<n ; i++ ) {
            s = Schlange[i];
            
            if( i===0 ) {
                s.x += (mouseX - s.x)/Elastizität;
                s.y += (mouseY - s.y)/Elastizität;
            } else {
                s.x += (Schlange[i-1].x - s.x)/Elastizität;
                s.y += (Schlange[i-1].y - s.y)/Elastizität;
            }
            
            noStroke();
            fill(132, 31, 145, 255-i*10);  // (#11 Füllfarbe der Schlange)
            var Größe = 30;             // (#12 Max. Größe eines Kreises)
            
            if( i === n-1 ) {
                if( dist(s.x, s.y, Schlange[i-1].x, Schlange[i-1].y) > 30-i ) {    
                    fill(227, random(80,130), 211);  // (#13 Aktiver Schwanz der Schlange)
                    Größe = 50;                     //   ...
                    SchlangeAktiv = true;           //   ...
                } else {
                    SchlangeAktiv = false;
                }            
            }

            ellipse(s.x, s.y, Größe-i, Größe-i); // (#14 Form eines Schlangenkreises)
            fill(182, 195, 50, 255-i*10);
            rect(s.x, s.y, 4, 4);
        }

        s = Schlange[0];
        translate(s.x, s.y);
        scale(0.12);
        gesicht();
        resetMatrix();       
    }
    
    if( !GameOver && millis() - Zeit > ZeitZumNächstenKäfer ) {
        Zeit = millis();
        ZeitZumNächstenKäfer -= 1;
        
        var dx = random(-GeschwMax, GeschwMax),
            dy = random(-GeschwMax, GeschwMax);
            
        if( abs(dx+dy) < GeschwMax/2 ) {
            dx += GeschwMax/2;
        }
         
        if( Käfer.length < KäferMax ) {
            Käfer.push({
                x: random(100, width - 100),                 // (#17 Ort wo Käfer erscheinen)
                y: 600,                 //  dito y
                dx: dx,
                dy: dy,
                Größe: random(15,30),   // (#18 Zufällige Größe der Käfer)
            });
        }
    }
    
    for( var i=0 ; i<Käfer.length ; i++ ) {
        var k = Käfer[i];
        
        k.x += k.dx;
        k.y += k.dy;
        strokeWeight(1);
        stroke(50, 100, 155, 70);
        noFill();
        triangle(k.x, k.y, canvasWidth / 2, 790, canvasWidth / 2, 800);
        noStroke();
        fill(184, 174, 70);
        ellipse(k.x, k.y, 12, 15);
        fill(60, 0, 255);
        ellipse(k.x-3,k.y-5,3,3);
        ellipse(k.x+3,k.y-5,3,3);
        pushMatrix();
        fill(50, 160, 255, 130);
        translate(k.x, k.y);
        rotate(35);
        ellipse(7,0,20,8);
        rotate(-70);
        ellipse(-7,0,20,8);
        popMatrix();
        
        if( k.x < -k.Größe/2 || k.x > 600+k.Größe/2 ) {
            k.dx = -k.dx;
        }
        if( k.y < -k.Größe/2 || k.y > 600+k.Größe/2 ) {
            k.dy = -k.dy;
        }
        
        if( !GameOver &&
            dist( k.x, k.y, Schlange[0].x, Schlange[0].y ) < (k.Größe + 20)/2 ) {
            
            Käfer.splice(i,1);
            KäferMax+=0.33;
            Punktzahl++;
        }
    }

    if( GameOver ) {
        Käfer = [];
        KäferMax = 5;               // (#4 Anzahl der möglichen Käfer zu Beginn, 
        Punktzahl = 0;
        ZeitZumNächstenKäfer = 2000; // (#6 Zeit zum nächsten Käfer)
        GameOver = false;
    }

    if( mouseIsPressed && mouseX > width - 41 && mouseX < width - 14 && mouseY > height - 30 && mouseY < height -5 ) {
        StopGame = true;    
    }

    noFill();
    stroke(255);
    strokeWeight(1);
    rect( width - 30, height - 20, 15, 15 );
    textSize( 18 );
    fill( 255 );
    text( "x", width - 29 , height - 20 );      
};



        };
        if (typeof draw !== 'undefined') processing.draw = draw;
    });
    
})(jQuery);