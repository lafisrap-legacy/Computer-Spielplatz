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

		if( baseCommands.cursorMode === "bounds" || moveItem ) return;
		
		var rect = this._area.children[1].bounds,
			point = event.point - this._offset + this._rect.moveOffset,
			mx = this._rect.moveX,
			my = this._rect.moveY,
			x1 = mx === 1? point.x : rect.point.x - this._offset.x,
			y1 = my === 1? point.y : rect.point.y - this._offset.y,
			x2 = mx === 2? point.x : rect.point.x + rect.size.width - this._offset.x,
			y2 = my === 2? point.y : rect.point.y + rect.size.height - this._offset.y;

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
		document.body.style.cursor = baseCommands.cursorShape;		
		this._cursor = null;
	},
	onMouseUp: function(event) {
		document.body.style.cursor = baseCommands.cursorShape;		
	}
});

////////////////////////////////////////////////////////////////////////
// Viewer show the magifying glass, color picker etc. It's part of the BaseLayer
// 
var Viewer = Base.extend({
	_class: 'Viewer',
	_viewRect: new Rectangle( new Point(parseInt($("#viewCanvasWrapper").css("left")),parseInt($("#viewCanvasWrapper").css("top"))), new Size(256, 256)),
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
			//console.log("mousedown: "+event.pageY);
			self._colorPickerIsDragging = true;
			self._colorPickerYOffset = parseInt($(".colorpicker-scroll").css("top")) - event.pageY;
		});

		$(window).mousemove(function(event) {
			//console.log("mousemove: "+self._colorPickerIsDragging);
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
	getCtx: function() {
		return this._ctx;
	}
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

var Colorizer = Base.extend({
	_class: 'Colorizer',
	_enabled: true,
	_serializeFields: {

	},
	
	point: new Point(parseInt($("#colorizerOptions").css("left")), parseInt($("#colorizerOptions").css("top"))),
	size:  new Size(parseInt($("#colorizerOptions").css("width")), parseInt($("#colorizerOptions").css("height"))),
	item: null,

	initialize: function(options) {

		var currentLayer = project.activeLayer;
		baseLayer.activate();

		var children = [];
		for( var i=0 ; i<options.length ; i++ ) {
			children.push(new Slider({
				name: window.CPG_Locale.Colorizer[options[i].filter],
				filter: options[i].filter,
				startValue: options[i].startValue,
				bounds: new Rectangle( this.point + new Point(0,options[i].yPos), this.size ),
				camanValue: options[i].camanValue,
				parent: this,
			}));
		};
		this.item = new Group(children);

		currentLayer.activate();
	},

	show: function() {
		var self = this;

		this.item.visible = true;

		$("#page-paper").on("itemSelected", function(event, item) {
			self.enable(item);
			console.log("event: itemSelected");
		});
		$("#page-paper").on("itemDeselected", function(event, item) {
			self.disable();
			console.log("event: itemDeselected");
		});

		this.enable(project.selectedItems[0]);
	},

	hide: function() {
		this.item.visible = false;

		this.disable();

		$("#page-paper").off("itemSelected");
		$("#page-paper").off("itemDeselected");
	},

	enable: function(item) {
		this._enabled = true;

		if( item === this._orgItem ) return;

		if( this._orgItem ) {
			this._orgItem.filter({commit: true});
			this._orgItem = null;
		}

		if( item.className === "Raster" ) {

			this._orgItem = item;

			Base.each(this.item.children, function(slider) {
				slider.resetValue();
				slider.setSliderFillColor(true);
			});

			this.update();
		}
	},

	disable: function() {
		if( !this._orgItem ) return;

		this._enabled = false;
		this._orgItem.filter({commit: true});
		this._orgItem = null;

		Base.each(this.item.children, function(slider) {
			slider.resetValue();
			slider.setSliderFillColor(false);
		});
	},

	enabled: function() {
		return this._enabled;
	},

	update: function() {

		var options = {};
		Base.each(this.item.children, function(slider) { slider.getValue(options); });
		this._orgItem.filter(options);
	},
}, {

});

var Slider = Base.extend({
	_class: 'Slider',
	_serializeFields: {

	},

	group: null,
	
	initialize: function(options) {
		var self = this,
			point = this._point = options.bounds.topLeft,
			size = this._size = options.bounds.size,
			value = this._startValue = options.startValue,
			sWidth = 20,
			sHeight = 40,
			margin = 20,
			width = size.width - margin*2,
			enabled = false;

		var group = this.group = new Group([
			new PointText({
				point: new Point(point.x + margin, point.y ),
			    content: options.name,
			    fillColor: 'black',
			    fontFamily: 'Courier New',
			    fontSize: 16,
			}),
			new Path.Rectangle({
				point: new Point(point.x + margin, point.y + 15),
				size: new Size(width, sWidth),
				radius: 10,
				strokeColor: "black",
			}),
			new Path.Rectangle({
				point: new Point(point.x + margin + value*width, point.y + 5),
				size: new Size(sWidth, sHeight),
				radius: 10,
				strokeColor: "black"
			}),
		]);

		var slider = group.children[2],
			xOffset = null;

		slider.onMouseDown = function(event) {
			if( !options.parent.enabled() ) return;

			xOffset = event.point.x - slider.position.x;
		};

		slider.onMouseDrag = function(event) {
			if( !options.parent.enabled() ) return;

			slider.position.x = event.point.x - xOffset;
			if( slider.position.x < point.x + margin ) slider.position.x = point.x + margin;
			if( slider.position.x >= point.x + margin + width ) slider.position.x = point.x + margin + width;

			value = (slider.position.x - point.x - margin)/width;
		};

		$("#page-paper").on("mouseup", function(event) {
			if( !options.parent.enabled() || xOffset === null ) return;
				
			options.parent.update();		
			xOffset = null;	
		});

		group.getValue = function(opt) {
			if( typeof opt === "object" ) opt[options.filter] = options.camanValue(value);
			return value;
		};

		group.setValue = function(val) {
			value = val;
			slider.position.x = point.x + margin + width * value;
		};

		group.resetValue = function() {
			value = options.startValue;
			slider.position.x = point.x + margin + width * value;
		};

		group.setSliderFillColor = function(enable) {
			if( enable ) {
				slider.fillColor = {
			        gradient: {
			            stops: ['yellow', 'red', 'blue']
			        },
			        origin: [0, point.y + 5],
			        destination: [0, point.y + sHeight],
			    }
			} else {
				slider.fillColor = {
			        gradient: {
			            stops: ['grey', 'blue', 'gray']
			        },
			        origin: [0, point.y + 5],
			        destination: [0, point.y + sHeight],
			    }
			}
		};
		group.setSliderFillColor(false);

		return group;
	},

	resetValue: function() { this.group.resetValue(); },
	setSliderFillColor: function(enable) { this.group.setSliderFillColor(enable); },
	getValue: function(options) { this.group.getValue(options); },
}, {

});

////////////////////////////////////////////////////////////////////////
// Commands shows and handles all commands 
// 
var COMMAND_POINTER 	= 1,
	COMMAND_PEN 		= 2,
	COMMAND_RUBBER 		= 3,
	COMMAND_DELETE 		= 4,
	COMMAND_MAGIC 		= 5,
	COMMAND_PIPETTE		= 6,
	COMMAND_COLORIZER 	= 7,
	COMMAND_RESIZE 		= 11,
	COMMAND_ROTATE 		= 12;
	BRUSH_RADII			= [0.5,1,2,4,8,12,18,24];

var Commands = Base.extend({
	_class: 'Commands',
	_currentColor: new Color("red"),
	_cursorShapes: {},

	_serializeFields: {

	},
	_initFns: {},
	_exitFns: [],

	commandMode: "pointer",
	resizeMode: COMMAND_RESIZE,
	cursorMode: null,
	cursorShape: "default",
	rubberCircle: null,

	initialize: function() {
		var self = this;

		var buttonBlink = function(button) {
			button.addClass("active btn-success");
			setTimeout(function() {
				button.removeClass("active btn-success");
			}, 200);
		};

		var initClickCommand = function(type, mode, cursorShape, initFn, exitFn) {
			self._cursorShapes[type] = cursorShape;
			self._initFns[type] = initFn;
			if( exitFn ) self._exitFns.push(exitFn);

			return $(".command-"+type).on("click tap", function(event) {
				self.activateCommand(type, event);
			});
		};

		var getRubberBrush = function(index) {
			var currentLayer = project.activeLayer,
				layer = new Layer(),
				radius = BRUSH_RADII[index],
				maxRadius = BRUSH_RADII[BRUSH_RADII.length-1];

			new Path.Rectangle({
				point: [0,0],
				size: [maxRadius*2, maxRadius*2],
				strokeColor: new Color(0,0,0,0)
			});
			var path = new Path.Circle({
			    center: [maxRadius,maxRadius],
			    radius: radius,
			    strokeColor: new Color(0,0,0,0)
			});
			path.fillColor = {
				gradient: {
	        		stops: [['black', 0.70], [new Color(0,0,0,0), 1]],
	        		radial: true
    			},
			    origin: path.position,
	    		destination: path.bounds.rightCenter
			};

			var image = layer.rasterize(undefined, false).toDataURL();
			layer.remove();
			project.activeLayer = currentLayer;
			return image;
		};

		$(".colorfield").css("background-color", this._currentColor.toCSS());

		//////////////////////////////////////////////////////////////////7
		// Menü-Command: Undo / Redo
		$(".command-undo").on("click tap", function(event) {
			Do.undo();
		});

		$(".command-redo").on("click tap", function(event) {
			Do.redo();
		});

		//////////////////////////////////////////////////////////////////7
		// Menü-Command: Download 
		$(".command-download").on("click tap", function(event) {
			showModalImageFiles(function(res, image) {
				if( res === "open" ) {

					var r1 = new Raster(image),
						r2 = Do.execute(r1, "Import");

			        r1.remove();

					var items = project.activeLayer.children;
					if( items.length === 1 ) baseCropper.set(r2.bounds);
				}
			});
		});

		///////////////////////////////////////////////////////////////////
		// Menü-Command: Click-Commands
		var rubberInit = function(event) {
			var currentLayer = project.activeLayer,
				brush = $("#rubberOptions .cursorShape .commandBox.selected"),
				radius = BRUSH_RADII[brush.attr("index")],
				offset = $("#paperCanvasWrapper").offset();
			
			baseLayer.activate();

			self.rubberCircle = new Path.Circle({
			    center: [event.pageX - offset.left, event.pageY - offset.top],
			    radius: radius,
			    strokeColor: new Color(0,0,0,255),
			    dashArray: [1]
			});

			var raster = new Raster($("img", brush)[0]);
			
			self.rubberBrush = raster.getImageData();
			raster.remove();

			currentLayer.activate();
		};

		var rubberExit = function(event) {
			if( self.rubberCircle ) {
				self.rubberCircle.remove();
				self.rubberCircle = null;
			}
		};

		var colorizer1Init = function(event) {
			baseColorizer1.show();
		};

		var colorizer1Exit = function(event) {
			baseColorizer1.hide();
		};

		var colorizer2Init = function(event) {
			baseColorizer2.show();
		};

		var colorizer2Exit = function(event) {
			baseColorizer2.hide();
		};

		initClickCommand("pointer"	   , COMMAND_POINTER	 , "default").addClass("active btn-primary");
		initClickCommand("pen"    	   , COMMAND_PEN		 , "url('static/img/cur_pen.png') 0 22, auto");
		initClickCommand("rubber" 	   , COMMAND_RUBBER	 , "url('static/img/cur_rubber.png') 4 4, auto", rubberInit, rubberExit);
		initClickCommand("delete" 	   , COMMAND_DELETE	 , "url('static/img/cur_delete.png') 8 8, auto");
		initClickCommand("magic"  	   , COMMAND_MAGIC	 , "url('static/img/cur_magic.png') 11 11, auto");
		initClickCommand("pipette"	   , COMMAND_PIPETTE	 , "url('static/img/cur_pipette.png') 1 21, auto");
		initClickCommand("colorizer-1" , COMMAND_COLORIZER, "default", colorizer1Init, colorizer1Exit);
		initClickCommand("colorizer-2" , COMMAND_COLORIZER, "default", colorizer2Init, colorizer2Exit);

		//////////////////////////////////////////////////////////////////7
		// Menü-Command: Rotate 
		$(".command-rotate").on("click tap", function(event) {
			$(".command-resize").removeClass("active btn-primary");
			$(".command-rotate").addClass("active btn-primary");
			self.resizeMode = COMMAND_ROTATE;
		});
		// Menü-Command: Resize 
		$(".command-resize").on("click tap", function(event) {
			$(".command-rotate").removeClass("active btn-primary");
			$(".command-resize").addClass("active btn-primary");
			self.resizeMode = COMMAND_RESIZE;
		}).addClass("active btn-primary");
		//////////////////////////////////////////////////////////////////7
		// Menü-Command: Arrange etc.
		$(".command-arrange-down").on("click tap", function(event) {
			Base.each(project.selectedItems, function(item) { item.sendToBack(); });
			if( project.selectedItems.length ) buttonBlink($(this));
		});
		$(".command-arrange-up").on("click tap", function(event) {
			Base.each(project.selectedItems, function(item) { item.bringToFront(); });
			if( project.selectedItems.length ) buttonBlink($(this));
		});
		$(".command-clone").on("click tap", function(event) {
			Base.each(project.selectedItems, function(item) {
				var newItem = item.clone();
				$("#page-paper").trigger("itemDeselected", item); 
				setTimeout( function() { $("#page-paper").trigger("itemSelected", newItem); }, 5); 
				item.selected = false;
			});
			if( project.selectedItems.length ) buttonBlink($(this));
		});
		$(".command-rasterize").on("click tap", function(event) {
			Base.each(project.selectedItems, function(item) { 
				if( item.className === "Raster") {
					item = self.cropRaster(item);
					item.selected = true;					
				}
			});
			if( project.selectedItems.length ) buttonBlink($(this));
		});

		/////////////////////////////////////////////////////////////////////////////////
		// Command options
		// Delete Options
		$(".commandOptions").fadeOut();
		var cursorShapeBoxes = $("#rubberOptions .cursorShape .commandBox").on("tap click", function(event) {
			cursorShapeBoxes.removeClass("selected");
			$(this).addClass("selected");

			if( self.rubberCircle ) {
				rubberExit(event);
				rubberInit(event);
			}
		});
		$.each(cursorShapeBoxes, function(index, box) {
			$(box).html("<img src='"+getRubberBrush(index)+"' />");
		});
	},

	activateCommand: function(type, event) {
		// deactivate all commands
		$(".click-command").removeClass("active btn-primary");
		$(".commandOptions").fadeOut();
		Base.each(this._exitFns, function(fn) { fn(event); });

		// activate selected command
		$(".command-"+type).addClass("active btn-primary");
		$("#"+type+"Options").fadeIn();			

		this.commandMode = type;
		this.cursorShape = this._cursorShapes[type];
		document.body.style.cursor = this.cursorShape;
		if( this._initFns[type] ) this._initFns[type](event);
	},
},{
	cropRaster: function(raster) {
		// check bounds
		var oldRaster = raster;

		raster = raster.rasterize();

		var ctx = raster.getContext(),
			b = raster.size;

		var findPixel = function( data ) {
			for( var i=0 ; i<data.length ; i+=4 ) if( data[i+3] !== 0 ) return true;
			return false;
		};

		for( var i=0, found=false ; i<b.width && !found ; i++ ) found = findPixel(ctx.getImageData(i, 0, 1, b.height).data); 
		if( !found ) {
			raster.remove();
			return;
		}
		var x = i-1;

		for( var i=0, found=false ; i<b.height && !found ; i++ ) found = findPixel(ctx.getImageData(x, i, b.width-x, 1).data); 
		var y = i-1;

		for( var i=b.width-1, found=false ; i>=x && !found ; i-- ) found = findPixel(ctx.getImageData(i, y, 1, b.height-y).data); 
		var width = i+2 - x;

		for( var i=b.height-1, found=false ; i>=y && !found ; i-- ) found = findPixel(ctx.getImageData(x, i, width, 1).data);
		var height = i+2 - y;

		var newRaster = raster.getSubRaster(new Rectangle(x, y, width, height));
		raster.remove();

		Do.execute(newRaster, "Crop", oldRaster);

		return newRaster;
	},

	setColor: function(color) {
		this._currentColor = color;
		$(".colorfield").css("background-color", color.toCSS())		
	},

	drawRubberData: function(item, point) {
		var w = this.rubberBrush.width,
			h = this.rubberBrush.height,
			p = point - item.position + item.size/2 - new Point(w/2, h/2),
			brush = this.rubberBrush.data,
			mask = this.rubberMask.data,
			buffer = item.getImageData(new Rectangle(p.x, p.y, w, h));

		// workaround for Chrome (part 1)
		if( buffer.width !== w ) {
			var bufCorr = w - buffer.width;
			buffer = item.getImageData(new Rectangle(p.x, p.y, w+bufCorr, h));
		}

		for( var i=0 ; i<h ; i++ ) {
			var y = p.y + i;
			if( y >= 0 && y < item.size.height ) {
				for( var j=0 ; j<w ; j++ ) {
					var x = p.x + j,
						mp = y*item.size.width*4+x*4+3,
						bp = i*h*4+j*4+3;

					if( x >= 0 && x < item.size.width && mask[mp] < brush[bp] ) {
						buffer.data[bp] -= brush[bp] - mask[mp];
						mask[mp] = brush[bp];
					}
				}				
			} 
		}

		// workaround for Chrome (part 2)
		if( bufCorr && p.x < 0 ) p.x += bufCorr;
		item.setImageData(buffer, p);

		var r1 = new Rectangle(p.x, p.y, buffer.width, buffer.height),
			r2 = baseCommands.rubberDirtyRect || r1;

		if( r1.left   < r2.left )   r2.left   = r1.left;
		if( r1.right  > r2.right )  r2.right  = r1.right;
		if( r1.top    < r2.top )    r2.top    = r1.top;
		if( r1.bottom > r2.bottom ) r2.bottom = r1.bottom;

		baseCommands.rubberDirtyRect = r2.intersect(new Rectangle(0,0, item.width, item.height));
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

		baseCommands.activateCommand("pointer");

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
				break;

			case "Import":
				var importRaster = null,
					importIndex = null;
				this._reverseActions[this._actionPointer] = function() {
				    importIndex = importRaster.index;
					importRaster.remove();
				}
				this._actions[this._actionPointer] = function() {
				    
				    if( importIndex === null ) importRaster = obj.clone();
					else project.activeLayer.insertChild(importIndex, importRaster);

					project.deselectAll();
					importRaster.position = new Point(300,300);
					importRaster.selected = true;

					return importRaster;
				}
				break;

			case "Move":
				this._reverseActions[this._actionPointer] = function() {
					obj.position = param2;
				}
				this._actions[this._actionPointer] = function() {
					obj.position = param1;
				}
				break;

			case "Crop":
				var cropSelected = null;
				this._reverseActions[this._actionPointer] = function() {
					param1.insertAbove(obj);
					param1.selected = cropSelected; 
					obj.remove();
				}
				this._actions[this._actionPointer] = function() {
					obj.insertAbove(param1);
					if( cropSelected !== null ) obj.selected = cropSelected; 
					else cropSelected = param1.selected;

					param1.remove();
				}
				break;			

			case "Select":
				var selectSelected = null;
				this._reverseActions[this._actionPointer] = function() {
					Base.each(project.selectedItems, function(item) {
						$("#page-paper").trigger("itemDeselected", item); 
					});
					project.deselectAll();

					Base.each(selectSelected, function(item) {
						item.selected = true;
						$("#page-paper").trigger("itemSelected", item);  
					});
				}
				this._actions[this._actionPointer] = function() {
					selectSelected = [];
					Base.each(project.selectedItems, function(item) { 
						selectSelected.push(item); 
						$("#page-paper").trigger("itemDeselected", item);
					});
					project.deselectAll();

					if( obj ) {
						obj.selected = true;
						$("#page-paper").trigger("itemSelected", item); 
					}
				}
				break;
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

	commit: function(rect, join) {
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
		// Join this action with the previous (undo/redo them together)
		this._reverseActions[this._actionPointer].join = join;
		this._actions[this._actionPointer].join = join;

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

	commit: function(rect, join) {
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
		this._actions[this._actionPointer] = function() {
			thisObj.setImageData(thisData, rect.topLeft);
		}

		// join this action with the previous (undo/redo them together)
		this._reverseActions[this._actionPointer].join = join;
		this._actions[this._actionPointer].join = join;

		this._actionPointer++;

		this._actions.length = this._actionPointer;
		this._reverseActions.length = this._actionPointer;
	},

	undo: function() {
		if( this._actionPointer > 0 ) {
			this._reverseActions[--this._actionPointer]();

			if( this._reverseActions[this._actionPointer].join ) this.undo();
		}
	},

	redo: function() {
		if( this._actionPointer < this._actions.length) {
			this._actions[this._actionPointer++]();

			if( this._actions[this._actionPointer].join ) this.redo();
		}		
	},
});



////////////////////////////////////////////////////////
// Program startup
var Do = new UndoManager(); 


if( sessionStorage.paperProject ) {
	project.clear();
	project.importJSON(sessionStorage.paperProject);

	var baseLayer = project.layers[project.layers.length-1],
		cropperBounds = baseLayer.children[0].children[1].bounds;

	baseLayer.removeChildren();	
	baseLayer.activate();
	
	cropperBounds.point -= CropperOffset;
	var baseCropper = new Cropper(cropperBounds);
	var baseViewer = new Viewer(baseCropper);
	var baseCommands = new Commands(baseCropper);
	var baseColorizer1 = new Colorizer([{
		filter: "brightness",
		yPos: 30,
		startValue: 0.5,
		camanValue: function(value) { return (value-0.5)*200; },
	},{
		filter: "saturation",
		yPos: 100,
		startValue: 0.5,
		camanValue: function(value) { return (value-0.5)*200; },
	},{
		filter: "hue",
		yPos: 170,
		startValue: 0.0,
		camanValue: function(value) { return value*100; },
	}]);
	var baseColorizer2 = new Colorizer([{
		filter: "sharpen",
		yPos: 30,
		startValue: 0.0,
		camanValue: function(value) { return value*100; },
	},{
		filter: "stackBlur",
		yPos: 100,
		startValue: 0.0,
		camanValue: function(value) { return value*100; },
	},{
		filter: "sepia",
		yPos: 170,
		startValue: 0.0,
		camanValue: function(value) { return value*100; },
	}]);

	baseColorizer1.hide();
	baseColorizer2.hide();

	project.layers[project.layers.length-2].activate();
} else {
	var baseLayer = project.activeLayer;
	var baseCropper = new Cropper();
	var baseViewer = new Viewer(baseCropper);
	var baseCommands = new Commands(baseCropper);
	var baseColorizer1 = new Colorizer([{
		filter: "brightness",
		yPos: 30,
		startValue: 0.5,
		camanValue: function(value) { return (value-0.5)*200; },
	},{
		filter: "saturation",
		yPos: 100,
		startValue: 0.5,
		camanValue: function(value) { return (value-0.5)*200; },
	},{
		filter: "hue",
		yPos: 170,
		startValue: 0.0,
		camanValue: function(value) { return value*100; },
	},{
		filter: "contrast",
		yPos: 240,
		startValue: 0.5,
		camanValue: function(value) { return (value-0.5)*200; },
	}]);
	var baseColorizer2 = new Colorizer([{
		filter: "sharpen",
		yPos: 30,
		startValue: 0.0,
		camanValue: function(value) { return value*100; },
	},{
		filter: "stackBlur",
		yPos: 100,
		startValue: 0.0,
		camanValue: function(value) { return value*100; },
	},{
		filter: "sepia",
		yPos: 170,
		startValue: 0.0,
		camanValue: function(value) { return value*100; },
	}]);
	baseColorizer1.hide();
	baseColorizer2.hide();

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

	Do.startTransaction(raster);
	for( var i=80 ; i < 100 ; i++ ) for( var j=80 ; j < 100 ; j++ )
		raster.setPixel(i,j,new Color(1,1,0.5));
	Do.commit(new Rectangle(80, 80, 20, 20));

	Do.startTransaction(raster);
	for( var i=100 ; i < 190 ; i++ ) for( var j=10 ; j < 100 ; j++ )
		raster.setPixel(i,j,new Color(1,0,0.5));
	Do.commit(new Rectangle(100, 10, 90, 90));

	Do.startTransaction(raster);
	for( var i=30 ; i < 120 ; i++ ) for( var j=0 ; j < 90 ; j++ )
		raster.setPixel(i,j,new Color(0,0,0.5));
	Do.commit(new Rectangle(30, 0, 90, 90));

	Do.startTransaction(raster);
	for( var i=70 ; i < 90 ; i++ ) for( var j=40 ; j < 60 ; j++ )
		raster.setPixel(i,j,new Color(0,1,1,0));
	Do.commit(new Rectangle(30, 0, 90, 90));

	var circle1 = Do.execute( "Path", "Circle", new Point(250,150), 30 )
	circle1.strokeColor = new Color(0,0,0,1);
	var circle2 = Do.execute( "Path", "Circle", new Point(350,150), 30 )
	circle2.strokeColor = new Color(0,0,0,1);

	Do.execute( circle2, "strokeColor", new Color(0,1,0,1) );
	Do.execute( circle2, "strokeColor", 'red' );
	Do.execute( circle2, "strokeWidth", 5 );

	//Do.undo();
	//Do.redo();
*/
}

baseLayer.bringToFront();

/////////////////////////////////////////////////////////////
// Selecting, moving and modifying items with the mouse
var segment, item, bounds,
	grabPoint = null,
	moveItem, movePosition;

function onMouseMove(event) {
	if( baseViewer ) baseViewer.onMouseMove(event);

	if( baseCommands.rubberCircle ) {
		baseCommands.rubberCircle.position = event.point;
	}

	var hitResult = project.activeLayer.hitTest(event.point, {
		bounds: true,
		selected: true,
		tolerance: 5
	});

	// No hit, nothing to do
	if (!hitResult ) {
		if( baseCommands.cursorMode ) {
			document.body.style.cursor = baseCommands.cursorShape;
			baseCommands.cursorMode = null;
		}	
		return;
	}

	if( hitResult.type === "bounds" ) {
		var c = baseCommands.resizeMode === COMMAND_ROTATE? "cur_rotate.png" : "cur_resize.png";

		document.body.style.cursor = "url('static/img/"+c+"') 11 11, auto";
		baseCommands.cursorMode = "bounds";

		console.log("Cursor command: "+c);
	} else {
		document.body.style.cursor = baseCommands.cursorShape;		
	}
};

function onMouseDown(event) {

	segment = item = moveItem = null;

	//////////////////////////////////////////////////////////////////////////////
	// Checking for selected items
	// If rubber is active and raster item is selected, take this
	if( baseCommands.commandMode === "rubber" && 
		project.selectedItems.length === 1 && 
		project.selectedItems[0].className === "Raster" ) {

		var hitResult = {
			type: "pixel",
			item: project.selectedItems[0],
			location: event.point
		}
	} else if( baseCommands.commandMode === "pipette") {
		var ctx = baseViewer.getCtx(),
			data = ctx.getImageData(event.point.x, event.point.y, 1, 1).data,
			color = new Color(data[0]/255, data[1]/255, data[2]/255, data[3]/255);

		baseCommands.setColor(color);
		return;
	} else {	
		// check if selected item was hit
		var hitResult = project.activeLayer.hitTest(event.point, {
			selected: true,
			bounds: true,
			fill: true,
			tolerance: 5
		});
	}

	// Checking for unselected items
	if( !hitResult ) {
		hitResult = project.activeLayer.hitTest(event.point, {
			selected: false,
			bounds: true,
			fill: true,
			tolerance: 5
		});
	}

	if( !hitResult ) {
		if( baseCropper.getRect().contains(event.point) ) {
			Base.each(project.selectedItems, function(item) {$("#page-paper").trigger("itemDeselected", item); });

			Do.execute(null, "Select");
		}
		return;
	}

	item = hitResult.item;
	item.hasBeenSelected = item.selected;
	if( !item.hasBeenSelected ) Do.execute(item, "Select");

	if( !item.hasBeenSelected ) $("#page-paper").trigger("itemSelected", item); 

	switch( hitResult.type ) {

	case "bounds":
		var position = hitResult.item.position, 
			point = hitResult.point;
		
		grabPoint = {
			point: 		point,
			oppPoint: 	point + (position - point)*2,
			rotation: 	Math.atan2(event.point.y - position.y, event.point.x - position.x) * 180 / Math.PI, 
			item: 	  	hitResult.item,
			name: 		Base.camelize(hitResult.name),
		}
		break;

	case "segment":
		segment = hitResult.segment;
		break;

	case "stroke":
		var location = hitResult.location;
		segment = item.insert(location.index + 1, event.point);
		item.smooth();
		break;

	case "pixel":
		if( baseCommands.commandMode === "rubber" ) {

			item = baseCommands.cropRaster(item);
			item.selected = true;

			var ctx = item.getContext();

			Do.startTransaction(item);
			baseCommands.rubberMask = ctx.createImageData(item.size.width, item.size.height);
			baseCommands.rubberDirtyRect = null;
			baseCommands.drawRubberData(item, event.point);
			break;
		}
		// fall through if not COMMAND_RUBBER mode ...
	case "fill":
		switch( baseCommands.commandMode ) {
		case "pointer":
		case "colorizer-1":
		case "colorizer-2":
			moveItem = "Not moved";
			movePosition = item.position;
			break;
		case "pen":
			break;
		case "delete":
			item.remove();
			if( project.activeLayer.isEmpty() ) {
				$(".command-pointer").trigger("click");	
			}
			break;
		}
	}

	if( baseViewer ) baseViewer.onMouseMove(event);
};

function onMouseDrag(event) {
	var x = event.point.x,
		y = event.point.y;

	if( baseCommands.rubberCircle ) {
		baseCommands.rubberCircle.position = event.point;
		baseCommands.drawRubberData(item, event.point);
	}

	if( grabPoint ) {
		function getSpPoint(A,B,C){
		    var x1=A.x, y1=A.y, x2=B.x, y2=B.y, x3=C.x, y3=C.y;
		    var px = x2-x1, py = y2-y1, dAB = px*px + py*py;
		    var u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
		    var x = x1 + u * px, y = y1 + u * py;
		    return {x:x, y:y}; //this is D
		}

		var b = grabPoint.item.bounds;
		switch( baseCommands.resizeMode ) {
		case COMMAND_RESIZE:
			var gp = grabPoint,
				point = new Point(getSpPoint(gp.point, gp.oppPoint, event.point)),
				zoom = gp.oppPoint.getDistance(point) / gp.oppPoint.getDistance(gp.point),
				hor = gp.name.search(/topCenter|bottomCenter/) !== -1 && !gp.item.rotation? 1 : zoom,
				ver = gp.name.search(/leftCenter|rightCenter/) !== -1 && !gp.item.rotation? 1 : zoom;

			gp.item.scale(hor, ver, gp.oppPoint );
			gp.point = point;
			break;
		case COMMAND_ROTATE:
			var rotation = Math.atan2(y - b.center.y, x - b.center.x) * 180 / Math.PI - grabPoint.rotation;

			grabPoint.item.rotate(rotation);			
			grabPoint.rotation += rotation;			
			break;
		}
	} else if (segment) {
		segment.point += event.delta;
		item.smooth();
	} else if (moveItem) {
		item.position += event.delta;
		moveItem = "Moved";
	}

	if( baseViewer ) baseViewer.onMouseMove(event);
};


function onMouseUp(event) {
	baseCropper.isDragging = false;
	grabPoint = null;

	if( moveItem === "Not moved" && item.hasBeenSelected ) {
		$("#page-paper").trigger("itemDeselected", item); 

		var next = item;
		while( next = next.previousSibling ) {
			if( next.hitTest( event.point ) ) {
				project.deselectAll();
				next.selected = true;
				setTimeout( function() { $("#page-paper").trigger("itemSelected", next); }, 5); 
				return;
			}
		}
		if( hitResult = project.hitTest( event.point ) ) {
			project.deselectAll();
			hitResult.item.selected = true;
			setTimeout( function() { $("#page-paper").trigger("itemSelected", hitResult.item); }, 5); 
			return;
		}
	} else if( moveItem === "Moved" ) {
		Do.execute(item, "Move", item.position, movePosition);
	}

	if( baseCommands.rubberCircle ) {
		Do.commit(baseCommands.rubberDirtyRect, true);
	}
};

function onFrame() {
};

window.paperOnbeforeunload = function() {
	sessionStorage.paperProject = project.exportJSON();
};