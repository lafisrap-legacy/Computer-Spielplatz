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
	processing.sbShow = false;

	if( $(".container").length ) {
		var container = $( ".container" );
	} else {
		var container = $( "body > div" );
	}

	var mouseIsPressed = false;
	container.on("mousedown touchstart", function(e) {
		mouseIsPressed = true;

        var pageX = e.changedTouches && e.changedTouches[0].pageX || e.pageX,
            pageY = e.changedTouches && e.changedTouches[0].pageY || e.pageY;

		processing.mouseX = pageX;
		processing.mouseY = pageY;
		processing.sbShow = false;
	}).on("mouseup touchend", function(e) {
		mouseIsPressed = false;

        var pageX = e.changedTouches && e.changedTouches[0].pageX || e.pageX,
            pageY = e.changedTouches && e.changedTouches[0].pageY || e.pageY;

        processing.mouseX = pageX;
        processing.mouseY = pageY;
	}).on("mousemove touchmove", function(e) {

        var pageX = e.changedTouches && e.changedTouches[0].pageX || e.pageX,
            pageY = e.changedTouches && e.changedTouches[0].pageY || e.pageY;

        processing.mouseX = pageX;
        processing.mouseY = pageY;
	});
	processing.mousePressed = function () { 
		mouseIsPressed = true;
	};
	processing.mouseReleased = function () { 
		mouseIsPressed = false;
	};
	processing.mouseClicked = function () {
		mouseTmp = false;
	};
	processing.mouseDragged = function () {
		mouseTmp = false;
	};
	processing.mouseMoved = function () {
		mouseTmp = false;
	};
	processing.mouseScrolled = function () {
		mouseTmp = false;
	};
	processing.mouseOver = function () {
		mouseTmp = false;
	};
	processing.mouseOut = function () {
		mouseTmp = false;
	};
	processing.touchStart = function () {
		mouseTmp = false;
	};
	processing.touchEnd = function () {
		mouseTmp = false;
	};
	processing.touchMove = function () {
        console.log( "touchMove:", processing.mouseX, processing.mouseY );
		mouseTmp = false;
	};
	processing.touchCancel = function () {
		mouseTmp = false;
	};

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
	var cosFn = processing.cos;
	processing.cos = function(angle) {
		return cosFn(processing.radians(angle));
	}
	var sinFn = processing.sin;
	processing.sin = function(angle) {
		return sinFn(processing.radians(angle));
	}

	with (processing) {
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// Programm-Code hier einfügen ...

	/////////////////////////////////////////////////////////////////////////////////////////////
	};

	if (typeof draw !== 'undefined') processing.draw = draw;
});
