var canvas = document.getElementById("canvas");
if(canvas.webkitRequestFullScreen) {
	canvas.webkitRequestFullScreen();
}
else {
	canvas.mozRequestFullScreen();
}
var processing = new Processing(canvas, function(processing) {
	processing.size(320, 568);
	processing.background(0,0,0,0);

	if( $(".container").length ) {
		var container = $( ".container" );
	} else {
		var container = $( "body > div" );
	}

    ////////////////////////////////////////////////////////
    // For use in websites: External start and stop events
	var canvas = $( "canvas", container ),
        drawFn = null;

    canvas.on( "startProgram", function() {
        if( drawFn ) processing.draw = drawFn;
    } ).on( "stopProgram", function() {
        processing.draw = function() {};
    } );

    /////////////////////////////////////////////////////////
    // Mouse and touch handling
	var mouseIsPressed = false;
	container.on("mousedown touchstart", function(e) {
		mouseIsPressed = true;

        var pageX = e.changedTouches && e.changedTouches[0].pageX || e.pageX,
            pageY = e.changedTouches && e.changedTouches[0].pageY || e.pageY,
            offset = $( "canvas", container ).offset();

		processing.mouseX = pageX - offset.left;
		processing.mouseY = pageY - offset.top;

		if( processing.mousePressed ) processing.mousePressed();

	}).on("mouseup touchend", function(e) {
		mouseIsPressed = false;

        var pageX = e.changedTouches && e.changedTouches[0].pageX || e.pageX,
            pageY = e.changedTouches && e.changedTouches[0].pageY || e.pageY,
            offset = $( "canvas", container ).offset();

		processing.mouseX = pageX - offset.left;
		processing.mouseY = pageY - offset.top;

		if( processing.mouseReleased ) processing.mouseReleased();

	}).on("mousemove touchmove", function(e) {

        var pageX = e.changedTouches && e.changedTouches[0].pageX || e.pageX,
            pageY = e.changedTouches && e.changedTouches[0].pageY || e.pageY,
            offset = $( "canvas", container ).offset();

		processing.mouseX = pageX - offset.left;
		processing.mouseY = pageY - offset.top;

		if( processing.mouseMoved ) processing.mouseMoved();
	});

	var keyIsPressed = false;
	processing.keyPressed = function () { keyIsPressed = true; };
	processing.keyReleased = function () { keyIsPressed = false; };

	function getSound(s) {
		var url = "sounds/" + s + ".mp3";
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
		var url = "img/" + s + ".png";
		return processing.loadImage(url);
	}

	var rotateFn = processing.rotate;
	processing.rotate = function(angle) {
		rotateFn(processing.radians(angle));
	}
	var arcFn = processing.arc;
	processing.arc = function(x,y,w,h,a1,a2) {
		return arcFn(x,y,w,h,processing.radians(a1), processing.radians(a2));
	}
	var sinFn = processing.sin;
	processing.sin = function(angle) {
		return sinFn(processing.radians(angle));
	}
	var asinFn = processing.asin;
	processing.asin = function(value) {
		return processing.degrees(asinFn(value));
	}
	var cosFn = processing.cos;
	processing.cos = function(angle) {
		return cosFn(processing.radians(angle));
	}
	var acosFn = processing.acos;
	processing.acos = function(value) {
		return processing.degrees(acosFn(value));
	}
	var tanFn = processing.tan;
	processing.tan = function(angle) {
		return tanFn(processing.radians(angle));
	}
	var atanFn = processing.atan;
	processing.atan = function(value) {
		return processing.degrees(atanFn(value));
	}
	var atan2Fn = processing.atan2;
	processing.atan2 = function(y, x) {
		return processing.degrees(atan2Fn(y,x));
	}

	with (processing) {
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// Programm-Code hier einfügen ...
	/////////////////////////////////////////////////////////////////////////////////////////////
	

	};

	if (typeof draw !== 'undefined') processing.draw = draw;
    drawFn = processing.draw;
});
