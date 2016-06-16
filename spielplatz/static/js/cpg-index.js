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
    var processing = new Processing(canvas, function(processing) {
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
            var url = "static/userdata/Admin/images/" + s + ".mp3";
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
        w = smile? smile/9 : 0;

    noStroke();

    fill(115, 130, 230);
    ellipse(-12+sin(dim.angle)*dim.radius,-18+cos(dim.angle)*dim.radius,5+w,4+w);
    fill(0);
    ellipse(-12+sin(dim.angle)*dim.radius,-18+cos(dim.angle)*dim.radius,3+w,2+w);
};

alfons.rightEye = function(lookAt, smile) {

    var dim = alfons.eyeDim(lookAt, false),
        w = smile? smile/9 : 0;

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
            smile: (1000-abs(constrain(mouseY - pos.top - 300, -1000, 1000 )))/100 * (1000-abs(constrain(mouseX - pos.left - 600, -1000, 1000 )))/1000,
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
    
})(jQuery);