////////////////////////////////////////////////////////////////////////
// cpg-paper.js contains the editor logic for the paper edit field
// 

////////////////////////////////////////////////////////////////////////
// ImageLayer is the base class for a layer for image files
// 
var ImageLayer = Layer.extend({
	_class: 'ImageLayer',
	_serializeFields: {
	},

});

////////////////////////////////////////////////////////////////////////
// Cropper is the cropping tool for the editor. It's part of the BaseLayer
// 
var CropperOffset = new Point(100, 100);
var Cropper = Base.extend({
	_class: 'Cropper',
	_minSize: new Size(40, 40),
	_maxSize: new Size(400, 400),
	_areaRect: new Rectangle(0, 0, 600, 600),
	_offset: CropperOffset,
	_point: null,
	_size: null,
	_area: null,
	_rect: null,
	_rectWidth: 10,
	_cursor: null,
	_serializeFields: {

	},
	initialize: function(rect) {
		var self = this,
			rect = rect || new Rectangle(new Point(0, 0), this._maxSize);

		var point = this._point = rect.getPoint();
		var size = this._size = rect.getSize();
		this._area = new CompoundPath({
			children: [
				new Path.Rectangle(this._areaRect),
				new Path.Rectangle(this._offset + point, size),
			],
		  	fillColor: 'black',	
		    opacity: 0.7,
		});
		this._rect = new Path.Rectangle(this._offset - this._rectWidth/2 + point, size + this._rectWidth);
		this._rect.strokeWidth = this._rectWidth;
		this._rect.strokeColor = "#aaa";
		this._rect.opacity = 0.5;		
		this._rect.onMouseMove 	= function(event) { self.onMouseMove(event); };
		this._rect.onMouseLeave = function(event) { self.onMouseLeave(event); };
		this._rect.onMouseDrag	= function(event) { self.onMouseDrag(event); };
		this._rect.onMouseUp	= function(event) { self.onMouseUp(event); };
	},
	set: function(x1, y1, x2, y2) {
		var min = this._minSize,
			max = this._maxSize;

		if( x1 instanceof Rectangle ) {
			var rect = x1.clone();
			rect.point -= CropperOffset;

			x1 = rect.topLeft.x;
			y1 = rect.topLeft.y;
			x2 = rect.bottomRight.x;
			y2 = rect.bottomRight.y;
		}

		if( x1 < 0 ) x1 = 0;
		if( x2 < x1 + min.width ) x2 = x1 + min.width;
		if( x2 > max.width ) x2 = max.width;
		if( x1 > x2 - min.width ) x1 = x2 - min.width;
		if( y1 < 0 ) y1 = 0;
		if( y2 < y1 + min.height ) y2 = y1 + min.height;
		if( y2 > max.height ) y2 = max.height;
		if( y1 > y2 - min.height ) y1 = y2 - min.height;

		var w2 = this._rect.strokeWidth / 2,
			ox = this._offset.x,
			oy = this._offset.y,
			areaPoints = [new Point(x2+ox, y2+oy), new Point(x2+ox, y1+oy), new Point(x1+ox, y1+oy), new Point(x1+ox, y2+oy)],
			rectPoints = [new Point(x2+ox+w2, y2+oy+w2), new Point(x2+ox+w2, y1+oy-w2), new Point(x1+ox-w2, y1+oy-w2), new Point(x1+ox-w2, y2+oy+w2)],
			areaCurves = this._area.children[1].curves,
			rectCurves = this._rect.curves;

		for( var i=0 ; i<areaCurves.length ; i++ ) {
			areaCurves[i].point1 = areaPoints[i];
			rectCurves[i].point1 = rectPoints[i];
		}
	},
	getOffset: function() {
		return this._offset;
	},
	getRect: function() {
		return this._areaRect;
	},
	getInnerRect: function() {
		var rect = this._area.children[1].bounds.clone();

		rect.topLeft -= this._rectWidth;
		rect.bottomRight += this._rectWidth;

		return rect;
	},
	getCursor: function() {
		return this._cursor;
	}
}, {
	onMouseDrag: function(event) {
		var rect = this._area.children[1].bounds,
			point = event.point - this._offset + this._rect.moveOffset,
			mx = this._rect.moveX,
			my = this._rect.moveY,
			x1 = mx === 1? point.x : rect.point.x - this._offset.x,
			y1 = my === 1? point.y : rect.point.y - this._offset.y,
			x2 = mx === 2? point.x : rect.point.x + rect.size.width - this._offset.x,
			y2 = my === 2? point.y : rect.point.y + rect.size.height - this._offset.y;

		console.log(x1+", "+x2+", "+y1+", "+y2+", "+mx+", "+my+", "+0+", ")
		this.set(x1, y1, x2, y2);

		this.isDragging = true;
	},
	onMouseMove: function(event) {
		if( baseViewer ) baseViewer.onMouseMove(event);

		if( this.isDragging ) return;

		var rect = this._rect.bounds,
			point = event.point - rect.point,
			width = this._rect.strokeWidth;

		if( point.x < width && point.y < width ||
			point.x > rect.width-width && point.y > rect.height-width ) { 
			document.body.style.cursor = "nwse-resize";
			this._rect.moveX = point.x < width? 1:2;
			this._rect.moveY = point.y < width? 1:2;
		} else if( point.x < width && point.y > rect.height-width ||
			point.x > rect.width-width && point.y < width ) { 
			document.body.style.cursor = "nesw-resize";
			this._rect.moveX = point.x < width? 1:2;
			this._rect.moveY = point.y < width? 1:2;
		} else if( point.x < width || point.x > rect.width-width ) {
			document.body.style.cursor = "ew-resize";
			this._rect.moveX = point.x < width? 1:2;
			this._rect.moveY = 0;
		} else { 
			document.body.style.cursor = "ns-resize";
			this._rect.moveX = 0;
			this._rect.moveY = point.y < width? 1:2;
		}

		this._rect.moveOffset = new Point( (point.x < width? width-point.x - width/2 : -width + rect.width - point.x + width/2),
										   (point.y < width? width-point.y - width/2 : -width + rect.height - point.y + width/2));
		this._cursor = "resize";
	},
	onMouseLeave: function(event) {
		document.body.style.cursor = "default";		
		this._cursor = null;
	},
	onMouseUp: function(event) {
		document.body.style.cursor = "default";		
	}
});

////////////////////////////////////////////////////////////////////////
// Viewer show the magifying glass, color picker etc. It's part of the BaseLayer
// 
var Viewer = Base.extend({
	_class: 'Viewer',
	_viewRect: new Rectangle( new Point(720,172), new Size(256, 256)),
	_rect: null,
	_rectWidth: 10,
	_modes: ['colorpicker'],
	_zoom: 8,
	_zoomActive: false,
	_mode: null, 
	_cropper: null,
	_context: null,
	_ctx: null,
	_colorPickerValue: 0,
	_colorPickerOffset: null,
	_colorPickerMode: "green",
	_colorPickerIsDragging: false,
	_colorPickerYOffset: null,
	_colorPickerTopOffset: parseInt($(".colorpicker-scroll").css("top")),

	_serializeFields: {

	},
	initialize: function(cropper) {
		var self = this;

		this._cropper = cropper;
		this._mode = this._modes[0];
		this._context = document.getElementById("paperCanvas");
		this._ctx = this._context.getContext('2d');
		this._zoomctx = document.getElementById("viewCanvas").getContext('2d');
	    this._zoomctx.imageSmoothingEnabled = false;
	    this._zoomctx.mozImageSmoothingEnabled = false;
	    this._zoomctx.msImageSmoothingEnabled = false;

		this._rect = new Path.Rectangle(this._viewRect.point - this._rectWidth/2, this._viewRect.size + this._rectWidth);
		this._rect.strokeWidth = this._rectWidth;
		this._rect.strokeColor = "#aaa";
		this._rect.opacity = 0.5;

		$("#viewCanvas").on("mousedown", function(event) { event.point = {x:event.pageX, y:event.pageY}; self.onMouseDown(event); });
		$("#viewCanvas").on("mousemove", function(event) { event.point = {x:event.pageX, y:event.pageY}; self.onMouseMove(event); });
		$("#viewCanvas").on("mouseleave", function(event) { event.point = {x:event.pageX, y:event.pageY}; self.onMouseLeave(event); });
		$("#viewCanvas").on("mouseup", function(event) { event.point = {x:event.pageX, y:event.pageY}; self.onMouseUp(event); });

		this._colorPickerOffset = parseInt($(".colorpicker-scroll").css("top"));
		$(".colorpicker-scroll").css("top", this._colorPickerValue+this._colorPickerOffset);
		this.drawColorPicker();

		$(".colorpicker-scroll-c").mousedown(function(event) {
			console.log("mousedown: "+event.pageY);
			self._colorPickerIsDragging = true;
			self._colorPickerYOffset = parseInt($(".colorpicker-scroll").css("top")) - event.pageY;
		});

		$(window).mousemove(function(event) {
			console.log("mousemove: "+self._colorPickerIsDragging);
			if( self._colorPickerIsDragging ) {
				var top = event.pageY + self._colorPickerYOffset; 
				if( top < self._colorPickerTopOffset ) top = self._colorPickerTopOffset;
				else if( top > self._colorPickerTopOffset + 255 ) top = self._colorPickerTopOffset + 255;
				$(".colorpicker-scroll").css("top", top+"px");
				$(".colorpicker-scroll-c").text(top - self._colorPickerTopOffset);
				self.drawColorPicker(top - self._colorPickerTopOffset);
			}
		}).mouseup(function mouseup(event) {
			if( self._colorPickerIsDragging ) {
				var top = event.pageY + self._colorPickerYOffset; 
				if( top < self._colorPickerTopOffset ) top = self._colorPickerTopOffset;
				else if( top > self._colorPickerTopOffset + 255 ) top = self._colorPickerTopOffset + 255;
				$(".colorpicker-scroll").css("top", top+"px");
				$(".colorpicker-scroll-c").text(top - self._colorPickerTopOffset);
				self.drawColorPicker(top - self._colorPickerTopOffset);
				self._colorPickerIsDragging = false;
			}
		});

		$(".colorpicker-scroll-c1").mousedown(function(event) {

			switch( self.getColorPickerMode() ) {
			case "red":
				$(".colorpicker-scroll-c").removeClass("btn-danger").addClass("btn-success");
				$(".colorpicker-scroll-c1").removeClass("btn-success").addClass("btn-danger");
				self.setColorPickerMode("green");
				break;
			case "green":
				$(".colorpicker-scroll-c").removeClass("btn-success").addClass("btn-danger");
				$(".colorpicker-scroll-c1").removeClass("btn-danger").addClass("btn-success");
				self.setColorPickerMode("red");
				break;
			case "blue":
				$(".colorpicker-scroll-c").removeClass("btn-primary").addClass("btn-danger");
				$(".colorpicker-scroll-c1").removeClass("btn-danger").addClass("btn-success");
				$(".colorpicker-scroll-c2").removeClass("btn-success").addClass("btn-primary");
				self.setColorPickerMode("red");
				break;
			}
		});

		$(".colorpicker-scroll-c2").mousedown(function(event) {

			switch( self.getColorPickerMode() ) {
			case "red":
				$(".colorpicker-scroll-c").removeClass("btn-danger").addClass("btn-primary");
				$(".colorpicker-scroll-c1").removeClass("btn-success").addClass("btn-danger");
				$(".colorpicker-scroll-c2").removeClass("btn-primary").addClass("btn-success");
				self.setColorPickerMode("blue");
				break;
			case "green":
				$(".colorpicker-scroll-c").removeClass("btn-success").addClass("btn-primary");
				$(".colorpicker-scroll-c2").removeClass("btn-primary").addClass("btn-success");
				self.setColorPickerMode("blue");
				break;
			case "blue":
				$(".colorpicker-scroll-c").removeClass("btn-primary").addClass("btn-success");
				$(".colorpicker-scroll-c2").removeClass("btn-success").addClass("btn-primary");
				self.setColorPickerMode("green");
				break;
			}
		});

	},
}, {
	onMouseDown: function(event) {
		var point = { x: event.pageX - $("#viewCanvas").offset().left, y: event.pageY - $("#viewCanvas").offset().top },
			pixel = this._zoomctx.getImageData(point.x, point.y, 1, 1),
			data = pixel.data,
			color = new Color(data[0]/255, data[1]/255, data[2]/255, data[3]/255);

		baseCommands.setColor(color);
	},
	onMouseDrag: function(event) {
	},
	onMouseMove: function(event) {

		var size = this._viewRect.size;

		if( this._cropper.getInnerRect().contains(event.point) ) {
			this._zoomActive = true;		
			$(".colorpicker-scroll").fadeOut();

			var clipSize = size / this._zoom;

			this._zoomctx.fillStyle = "white";
			this._zoomctx.fillRect(0, 0, size.width, size.height);
			this._zoomctx.drawImage(this._context, event.point.x - clipSize.width/2, event.point.y - clipSize.height/2, clipSize.width, clipSize.height, 0, 0, size.width, size.height );	
		} else if( this._zoomActive ) {
			this._zoomActive = false;

			switch( this._mode ) {
				case 'colorpicker':
					var colorPicker = $(".colorpicker-scroll").fadeIn();
					this.drawColorPicker();
					break;
			}			
		}
	},
	onMouseLeave: function(event) {
	},
	onMouseUp: function(event) {
	},

	drawColorPicker: function(pos) {
		var imageData = this._zoomctx.createImageData(1,1),
			mode = this._colorPickerMode,
			mod  = mode === "red"? 0 : mode === "green"? 1 : 2
			fix1 = mode === "red"? 1 : mode === "green"? 0 : 0
			fix2 = mode === "red"? 2 : mode === "green"? 2 : 1;

		this._colorPickerValue = pos || this._colorPickerValue;
		imageData.data[mod] = this._colorPickerValue;
		imageData.data[3] = 255;
		for( var i=0 ; i<256 ; i++ ) {
			imageData.data[fix1] = i;
			for( var j=0 ; j<256 ; j++ ) {
				imageData.data[fix2] = j;
				this._zoomctx.putImageData(imageData, i, j);			
			}	
		}
	},
	getColorPickerMode: function() {
		return this._colorPickerMode;
	},
	setColorPickerMode: function(value) {
		this._colorPickerMode = value;
		this.drawColorPicker();
	},
});

////////////////////////////////////////////////////////////////////////
// Commands shows and handles all commands 
// 
var COMMAND_RESIZE = 0,
	COMMAND_ROTATE = 1,
	COMMAND_CROP = 2;
var Commands = Base.extend({
	_class: 'Commands',
	_currentColor: new Color("red"),

	_serializeFields: {

	},

	resizeMode: COMMAND_RESIZE,

	initialize: function(cropper) {
		var self = this;

		$(".colorfield").css("background-color", this._currentColor.toCSS());

		//////////////////////////////////////////////////////////////////7
		// Menü-Command: Download 
		$(".command-download").on("click tap", function(event) {
			showModalImageFiles(function(res, image) {
				if( res === "open" ) {

					var r1 = new Raster(image),
        				r2 = r1.clone();

			        r1.remove();

					project.deselectAll();
					r2.position = new Point(300,300);
					r2.selected = true;

					var items = project.activeLayer.children;
					if( items.length === 1 ) baseCropper.set(r2.bounds);
				}
			});
		});
		//////////////////////////////////////////////////////////////////7
		// Menü-Command: Rotate 
		$(".command-rotate").on("click tap", function(event) {
			$(".command-crop").removeClass("active btn-primary");
			if( $(this).toggleClass("active btn-primary").hasClass("active") ) self.resizeMode = COMMAND_ROTATE;
			else self.resizeMode = COMMAND_RESIZE;
		});
		$(".command-crop").on("click tap", function(event) {
			$(".command-rotate").removeClass("active btn-primary");
			if( $(this).toggleClass("active btn-primary").hasClass("active") ) self.resizeMode = COMMAND_CROP;
			else self.resizeMode = COMMAND_RESIZE;
		});
	},
},{
	setColor: function(color) {
		this._currentColor = color;
		$(".colorfield").css("background-color", color.toCSS())		
	}
});

///////////////////////////////////////////
// showModalCodeFiles shows the code file info and modification dialog
var showModalImageFiles = function(cb) {
	var modal = $("#commands-image-import-modal");

    var afl = window.AllImages,
        ownFiles = $("<div id='modal-imagefiles' class='files ownfiles'>"),
        playgroundFiles = $("<div id='modal-imagefiles' class='files playgroundfiles'>");

    $(".content .ownfiles", modal).hide();
    //$(".content .playgroundfiles").hide();
    $(".content .worldfiles", modal).hide();

    for( var i=0 ; i<afl.length ; i++ ) {

    	var groupName = afl[i].groupName;
    	if( groupName === "Spielplatz" ) target = ownFiles;
    	else target = playgroundFiles;

    	target.append("<div class='title'>"+groupName+"</div>");

    	for( var j=0 ; j<afl[i].images.length ; j++ ) {
	        target.append(
	            "<div class='file file"+i+" pull-left' filename='"+afl[i].images[j]+"'>"+
	            "   <div class='top'>"+
	            "   </div>"+
	            "   <div class='middle'>"+
	            "       <img id='modal-image-"+afl[i].images[j]+"' src='static/userdata/"+window.UserNameForImages+"/images/"+groupName+"/"+(afl[i].images[j]+".png'")+" max-width='100' max-height='100'>"+
	            "   </div>"+
	            "   <div class='bottom'>"+
	            "       <span class='filename text-center'>"+afl[i].images[j]+"</span>"+
	            "   </div>"+
	            "</div>"
	        );
    	}
    }

    $(".content .ownfiles").append(ownFiles);
    $(".content .playgroundfiles").append(playgroundFiles);
    $(".content .worldfiles").append();

    // Correct font size of filenames
    $(".modal-body", modal ).html(target);

    $(".file", modal).on("click", function(e) {
        var lcb = cb;
        cb = null;
        modal.modal('hide');

        if( lcb ) lcb("open", "modal-image-"+$(this).attr("filename"));    	
    });

    $(".modal-cancel", modal).off("click").one("click", function(e) {
        modal.modal('hide');
    });

    modal.one('hidden.bs.modal', function(e) {
        if( cb ) cb("cancel");
    });

    modal.one('shown.bs.modal', function(e) {
	    // Vertically center images after they are shown
	    $(".file img", modal).each(function(index) {
		    var img = $(this),
		    	w = img.width(),
		    	h = img.height(),
		    	maxW = parseInt(img.attr("max-width")),
		    	maxH = parseInt(img.attr("max-height"));

		    img.animate({
		    	marginLeft: ((maxW-w)/2)+"px",
		    	marginTop:  ((maxH-h)/2)+"px",
		    	zoom: 1,
		    	opacity: 1,
		    }, 300);
	    });
    });

    modal.modal('show');
};

////////////////////////////////////////////////////////
// Global functions
var UndoManager = Base.extend({
	_class: 'UndoManager',
	
	_actions: [],
	_reverseActions: [],
	_actionPointer: 0,

	_transactionObject: null,
	_transactionRect: null,
	_transactionData: null,

	_serializeFields: {

	},

	initialize: function() {
	},

	execute: function(obj, action, param1, param2, param3, param4) {
		switch(action) {
			case "strokeWidth": 
			case "strokeColor": 
				var lastData = obj[action];
				if( typeof lastData === "object" ) {
					lastData = lastData.clone();
				}
				this._reverseActions[this._actionPointer] = function() {
					obj[action] = lastData;
				}
				this._actions[this._actionPointer] = function() {
					obj[action] = param1;
				}
				break;

			case "Circle":
				if( obj !== "Path") return

				var pathObject;
				this._reverseActions[this._actionPointer] = function() {
					pathObject.remove();
				}
				this._actions[this._actionPointer] = function() {
					if( !pathObject ) {
						pathObject = new Path[action](param1, param2, param3, param4);
						pathObject.strokeColor = new Color(0,0,0,1);
						return pathObject;
					} else {
						project.activeLayer.addChild( pathObject );
					}
				}
		}

		var res = this._actions[this._actionPointer++]();
		this._actions.length = this._actionPointer;
		this._reverseActions.length = this._actionPointer;

		return res;
	},

	startTransaction: function(obj) {
		// Currently only with Raster objects
		if( obj.getClassName() !== "Raster" ) return;

		this._transactionObject = obj;
		this._transactionData = obj.getSubRaster(new Point(0,0), obj.size);
		this._transactionData.remove();
	},

	commit: function(rect) {
		// Currently only with Raster objects
		if( !this._transactionData ) return;

		rect = rect || this._transactionObject.bounds;

		var lastObj = this._transactionData,
			thisObj = this._transactionObject,
			lastData = lastObj.getImageData(rect),
			thisData = thisObj.getImageData(rect);

		this._reverseActions[this._actionPointer] = function() {
			thisObj.setImageData(lastData, rect.topLeft);
		}
		this._actions[this._actionPointer++] = function() {
			thisObj.setImageData(thisData, rect.topLeft);
		}

		this._actions.length = this._actionPointer;
		this._reverseActions.length = this._actionPointer;
	},

	startTransaction: function(obj) {
		// Currently only with Raster objects
		if( obj.getClassName() !== "Raster" ) return;

		this._transactionObject = obj;
		this._transactionData = obj.getSubRaster(new Point(0,0), obj.size);
		this._transactionData.remove();
	},

	commit: function(rect) {
		// Currently only with Raster objects
		if( !this._transactionData ) return;

		rect = rect || this._transactionObject.bounds;

		var lastObj = this._transactionData,
			thisObj = this._transactionObject,
			lastData = lastObj.getImageData(rect),
			thisData = thisObj.getImageData(rect);

		this._reverseActions[this._actionPointer] = function() {
			thisObj.setImageData(lastData, rect.topLeft);
		}
		this._actions[this._actionPointer++] = function() {
			thisObj.setImageData(thisData, rect.topLeft);
		}
	},

	undo: function() {
		if( this._actionPointer > 0 ) {
			this._reverseActions[--this._actionPointer]();
		}
	},

	redo: function() {
		if( this._actionPointer < this._actions.length) {
			this._actions[this._actionPointer++]();
		}		
	},
});



////////////////////////////////////////////////////////
// Program startup
var UM = new UndoManager(); 


if( sessionStorage.paperProject ) {
	project.importJSON(sessionStorage.paperProject);

	var baseLayer = project.layers[project.layers.length-1],
		cropperBounds = baseLayer.children[0].children[1].bounds;

	baseLayer.removeChildren();	
	baseLayer.activate();
	
	cropperBounds.point -= CropperOffset;
	var baseCropper = new Cropper(cropperBounds);
	var baseViewer = new Viewer(baseCropper);
	var baseCommands = new Commands(baseCropper);

	project.layers[project.layers.length-2].activate();
} else {
	var baseLayer = project.activeLayer;
	var baseCropper = new Cropper();
	var baseViewer = new Viewer(baseCropper);
	var baseCommands = new Commands(baseCropper);

	var activeLayer = new ImageLayer();
/*
	// Action 1	
	var tmp = new Raster('fred');
	raster = tmp.clone();
	tmp.remove();
	raster.position = new Point(300,300);
	raster.scale(1.0);
	raster.rotate(0);
	raster.selected = false;

	UM.startTransaction(raster);
	for( var i=80 ; i < 100 ; i++ ) for( var j=80 ; j < 100 ; j++ )
		raster.setPixel(i,j,new Color(1,1,0.5));
	UM.commit(new Rectangle(80, 80, 20, 20));

	UM.startTransaction(raster);
	for( var i=100 ; i < 190 ; i++ ) for( var j=10 ; j < 100 ; j++ )
		raster.setPixel(i,j,new Color(1,0,0.5));
	UM.commit(new Rectangle(100, 10, 90, 90));

	UM.startTransaction(raster);
	for( var i=30 ; i < 120 ; i++ ) for( var j=0 ; j < 90 ; j++ )
		raster.setPixel(i,j,new Color(0,0,0.5));
	UM.commit(new Rectangle(30, 0, 90, 90));

	UM.startTransaction(raster);
	for( var i=70 ; i < 90 ; i++ ) for( var j=40 ; j < 60 ; j++ )
		raster.setPixel(i,j,new Color(0,1,1,0));
	UM.commit(new Rectangle(30, 0, 90, 90));

	var circle1 = UM.execute( "Path", "Circle", new Point(250,150), 30 )
	circle1.strokeColor = new Color(0,0,0,1);
	var circle2 = UM.execute( "Path", "Circle", new Point(350,150), 30 )
	circle2.strokeColor = new Color(0,0,0,1);

	UM.execute( circle2, "strokeColor", new Color(0,1,0,1) );
	UM.execute( circle2, "strokeColor", 'red' );
	UM.execute( circle2, "strokeWidth", 5 );

	//UM.undo();
	//UM.redo();
*/
}


////////////////////////////////////////////////////////
// Bootsrap User Interaction
(function() {
})();



baseLayer.bringToFront();


/////////////////////////////////////////////////////////////
// Selecting, moving and modifying items with the mouse
var segment, path, bounds;
var movePath = false;
function onMouseDown(event) {

	segment = path = null;

	// Resizing the cropper has priority
	if( baseCropper.getCursor() === "resize") return;

	// check if an item was hit
	var hitResult = project.activeLayer.hitTest(event.point, {
		bounds: true,
		selected: true,
		fill: true,
		tolerance: 5
	});

	// No hit, nothing to do
	if (!hitResult ) return;

	// select hit item
	project.deselectAll();
	hitResult.item.selected = true;

	path = hitResult.item;
	if (hitResult.type == 'bounds') {
		bounds = hitResult.segment;
	} else if (hitResult.type == 'segment') {
		segment = hitResult.segment;
	} else if (hitResult.type == 'stroke') {
		var location = hitResult.location;
		segment = path.insert(location.index + 1, event.point);
		path.smooth();
	}
	movePath = hitResult.type == 'fill';
	if (movePath) project.activeLayer.addChild(hitResult.item);
}

function onMouseDrag(event) {
	if( baseViewer ) baseViewer.onMouseMove(event);

	if (segment) {
		segment.point += event.delta;
		path.smooth();
	} else if (path) {
		path.position += event.delta;
	}
}


function onMouseMove(event) {
	if( baseViewer ) baseViewer.onMouseMove(event);

	var hitResult = project.activeLayer.hitTest(event.point, {
		bounds: true,
		selected: true,
		tolerance: 5
	});

	// No hit, nothing to do
	if (!hitResult ) return;

	if( hitResult.type === "bounds") {
		var cursor = baseCommands.resizeMode === COMMAND_ROTATE? "cur_rotate.png" : 
					 baseCommands.resizeMode === COMMAND_CROP? 	 "cur_crop.png" : 
																 "cur_resize.png";

		document.body.style.cursor = "url('static/img/"+cursor+"') 11 11, auto";
	} else {
		document.body.style.cursor = "default";		
	}
}

function onMouseUp(event) {
	baseCropper.isDragging = false;
}

function onFrame() {
};

window.paperOnbeforeunload = function() {
	sessionStorage.paperProject = project.exportJSON();
}

