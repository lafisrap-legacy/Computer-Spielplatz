////////////////////////////////////////////////////////////////////////
// cpg-paper.js contains the editor logic for the paper edit field
//

////////////////////////////////////////////////////////////////////////
// Cropper is the cropping tool for the editor. It's part of the BaseLayer
//
var CropperTopLeft = new Point( 100, 100 );		// Upper left corner of maximum cropper
var Cropper = Base.extend( {
	_class: "Cropper",
	_minSize: new Size( 40, 40 ),				// Minimum cropper size
	_maxSize: new Size( 400, 400 ),				// Maximum cropper size ( max: 580 )
	_areaRect: new Rectangle( 0, 0, 600, 600 ),	// Complete area
	_topLeft: CropperTopLeft,					// Upper left corner
	_tintedArea: null,							// Surrounding tinted area
	_rect: null,								// Drawing area
	_border: 10,								// Border width of drawing area
	_cursor: null,								// Cursor shape
	_serializeFields: { },						// Paper.js serialize

	/////////////////////////////////////////////////////////////////////
	// Method initialize is called at construction time
	//
	initialize: function( rect ) {
		var self = this,
			rect = rect || new Rectangle( new Point( 0, 0 ), this._maxSize );

		this._tintedArea = new CompoundPath( {
			children: [
				new Path.Rectangle( this._areaRect ),
				new Path.Rectangle( this._topLeft + rect.point, rect.size )
			],
			fillColor: "black",
			opacity: 0.7
		} );
		this._rect = new Path.Rectangle( this._topLeft - this._border / 2 + rect.point,
										rect.size + this._border );
		this._rect.strokeWidth = this._border;
		this._rect.strokeColor = "#aaa";
		this._rect.opacity = 0.5;

		var viewerBackground = new Path.Rectangle( this._areaRect.topRight, new Size( 600 , this._areaRect.height ) );
		viewerBackground.fillColor = "white";

		this._rect.onMouseMove = function( event ) { self.onMouseMove( event ); };
		this._rect.onMouseLeave = function( event ) { self.onMouseLeave( event ); };
		this._rect.onMouseDrag = function( event ) { self.onMouseDrag( event ); };
		$( "#page-paper" ).on( "mouseup", function( event ) {
			var offset = $("#paperCanvasWrapper").offset();

			event.point = new Point( event.pageX - offset.left, event.pageY - offset.top );
			self.onMouseUp( event );
		});	
	},

	/////////////////////////////////////////////////////////////////////
	// Method set sets the cropper rectangle
	//
	set: function( x1, y1, x2, y2 ) {
		var min = this._minSize,
			max = this._maxSize;

		// Handle Rectangle parameter
		if ( x1 instanceof Rectangle ) {
			var rect = x1.clone();
			rect.point -= CropperTopLeft;

			x1 = rect.topLeft.x;
			y1 = rect.topLeft.y;
			x2 = rect.bottomRight.x;
			y2 = rect.bottomRight.y;
		}

		// Check bounds
		if ( x1 < 0 ) x1 = 0;
		if ( x2 < x1 + min.width ) x2 = x1 + min.width;
		if ( x2 > max.width ) x2 = max.width;
		if ( x1 > x2 - min.width ) x1 = x2 - min.width;
		if ( y1 < 0 ) y1 = 0;
		if ( y2 < y1 + min.height ) y2 = y1 + min.height;
		if ( y2 > max.height ) y2 = max.height;
		if ( y1 > y2 - min.height ) y1 = y2 - min.height;

		// Set the path positions
		var w2 = this._rect.strokeWidth / 2,
			ox = this._topLeft.x,
			oy = this._topLeft.y,
			areaPoints = [	new Point( x2 + ox, y2 + oy ),
							new Point( x2 + ox, y1 + oy ),
							new Point( x1 + ox, y1 + oy ),
							new Point( x1 + ox, y2 + oy ) ],
			rectPoints = [	new Point( x2 + ox + w2, y2 + oy + w2 ),
							new Point( x2 + ox + w2, y1 + oy - w2 ),
							new Point( x1 + ox - w2, y1 + oy - w2 ),
							new Point( x1 + ox - w2, y2 + oy + w2 ) ],
			areaCurves = this._tintedArea.children[ 1 ].curves,
			rectCurves = this._rect.curves;

		for ( var i = 0 ; i < areaCurves.length ; i++ ) {
			areaCurves[ i ].point1 = areaPoints[ i ];
			rectCurves[ i ].point1 = rectPoints[ i ];
		}
	},

	/////////////////////////////////////////////////////////////////////
	// Method getRect returns cropper rectangle
	//
	getRect: function() {
		return this._areaRect;
	},

	/////////////////////////////////////////////////////////////////////
	// Method getRect returns cropper rectangle
	//
	getMaxSize: function() {
		return this._maxSize;
	},

	/////////////////////////////////////////////////////////////////////
	// Method getInnerRect returns inner rectangle
	//
	getInnerRect: function(border) {
		var rect = this._tintedArea.children[ 1 ].bounds.clone();

		if( border ) {
			rect.topLeft -= this._border;
			rect.bottomRight += this._border;			
		}

		return rect;
	},

	/////////////////////////////////////////////////////////////////////
	// Method getCursor returns the current cursor
	//
	getCursor: function() {
		return this._cursor;
	},

	/////////////////////////////////////////////////////////////////////
	// Method setCursor sets the current cursor
	//
	setCursor: function( cursor ) {
		this._cursor = cursor;
	}
}, {

	/////////////////////////////////////////////////////////////////////
	// Method onMouseMove changes the cursor shape according to mouse position
	//
	onMouseMove: function( event ) {
		//if ( baseViewer ) baseViewer.onMouseMove( event );

		console.log("Cropper onMouseMove");
		if ( this.isDragging ) return;

		var rect = this._rect.bounds,
			point = event.point - rect.point,
			width = this._rect.strokeWidth;

		if ( point.x < width && point.y < width ||
			point.x > rect.width - width && point.y > rect.height - width ) {
			document.body.style.cursor = "nwse-resize";
			this._rect.moveX = point.x < width ? 1 : 2;
			this._rect.moveY = point.y < width ? 1 : 2;
		} else if ( point.x < width && point.y > rect.height - width ||
			point.x > rect.width - width && point.y < width ) {
			document.body.style.cursor = "nesw-resize";
			this._rect.moveX = point.x < width ? 1 : 2;
			this._rect.moveY = point.y < width ? 1 : 2;
		} else if ( point.x < width || point.x > rect.width - width ) {
			document.body.style.cursor = "ew-resize";
			this._rect.moveX = point.x < width ? 1 : 2;
			this._rect.moveY = 0;
		} else {
			document.body.style.cursor = "ns-resize";
			this._rect.moveX = 0;
			this._rect.moveY = point.y < width ? 1 : 2;
		}

		this._rect.moveOffset = new Point( ( point.x < width ? width - point.x - width / 2 :
											-width + rect.width - point.x + width / 2 ),
										   ( point.y < width ? width - point.y - width / 2 :
											-width + rect.height - point.y + width / 2 ) );
		this._cursor = "resize";
	},

	/////////////////////////////////////////////////////////////////////
	// Method onMouseDrag changes the size of the cropper rect
	//
	onMouseDrag: function( event ) {

		if ( baseCommands.cursorMode === "bounds" || moveItem ) return;

		if( !this.isDragging ) this._oldRect = this.getInnerRect();

		this.set( this.getNewInnerRect( event ) );

		this.isDragging = true;
	},

	/////////////////////////////////////////////////////////////////////
	// Method onMouseUp
	//
	onMouseUp: function( event ) {
		if ( baseCommands.cursorMode === "bounds" || moveItem || !this.isDragging ) return;

		Do.execute( {
			item: this,
			oldRect: this._oldRect,
			newRect: this.getNewInnerRect( event ),
			action: "ResizeCropper",
			join: false
		} );
		this.isDragging = false;

		document.body.style.cursor = baseCommands.cursorShape;
	},

	/////////////////////////////////////////////////////////////////////
	// Method onMouseLeave resets the cursor shape
	//
	onMouseLeave: function( event ) {
		document.body.style.cursor = baseCommands.cursorShape;
		this._cursor = null;
	},

	/////////////////////////////////////////////////////////////////////
	// Method getNewInnerRect returns the new rect positions after a mouse event
	//
	getNewInnerRect: function( event ) {
		var rect = this._tintedArea.children[ 1 ].bounds,
			point = event.point + this._rect.moveOffset,
			mx = this._rect.moveX,
			my = this._rect.moveY,
			newRect = new Rectangle();

		newRect.left = mx === 1 ? point.x : rect.point.x,
		newRect.top = my === 1 ? point.y : rect.point.y,
		newRect.right = mx === 2 ? point.x : rect.point.x + rect.size.width,
		newRect.bottom = my === 2 ? point.y : rect.point.y + rect.size.height			

		return newRect;
	}

} );

////////////////////////////////////////////////////////////////////////
// Viewer shows the magifying glass, color picker etc. It's part of the BaseLayer
//
var Viewer = Base.extend( {
	_class: "Viewer",
	_viewRect: new Rectangle( new Point( parseInt( $( "#viewCanvasWrapper" ).css( "left" ) ),
										parseInt( $( "#viewCanvasWrapper" ).css( "top" ) ) ),
							new Size( 256, 256 ) ), // View rectangle ( without frame )
	_border: null,				// Viewer border
	_borderWidth: 10,			// Vorder width
	_modes: [ "colorpicker" ],	// What is shown, when zoom is inactive
	_zoom: 8,					// Initial zoom factor
	_zoomActive: false,			// Is zoom visible?
	_mode: null,				// Current mode
	_cropper: null,				// Connected cropper
	_context: null,				// Canvas context
	_ctx: null,					// Canvas ctx
	_colorPickerImageData: null,// ImageData cache for color picker
	_colorPickerValue: 0,		// Value of color picker slider
	_colorPickerOffset: null,	// Css offset of color picker slider
	_colorPickerMode: "green",	// Initial Color picker mode
	_colorPickerIsDragging: false,	// Flag for color picker slider is dragging
	_colorPickerYOffset: null,	// Color picker slider dragging offset
	_colorPickerTopOffset: parseInt( $( ".colorpicker-scroll" ).css( "top" ) ), // Top offset
	_serializeFields: {
	},

	/////////////////////////////////////////////////////////////////////
	// Method initialized is called at object creation
	//
	initialize: function( cropper ) {
		var self = this;

		// Init variables
		this._cropper = cropper;
		this._mode = this._modes[ 0 ];
		this._context = document.getElementById( "paperCanvas" );
		this._ctx = this._context.getContext( "2d" );
		this._zoomctx = document.getElementById( "viewCanvas" ).getContext( "2d" );
	    this._zoomctx.imageSmoothingEnabled = false;
	    this._zoomctx.mozImageSmoothingEnabled = false;
	    this._zoomctx.msImageSmoothingEnabled = false;

	    // Create a border
		this._border = new Path.Rectangle(	this._viewRect.point - this._borderWidth / 2,
											this._viewRect.size + this._borderWidth );
		this._border.strokeWidth = this._borderWidth;
		this._border.strokeColor = "#aaa";
		this._border.opacity = 0.5;

		// Set events
		$( "#viewCanvas" ).on( "mousedown", function( event ) {
			event.point = { x:event.pageX, y:event.pageY };

			self.onMouseDown( event );
		} );
		$( "#viewCanvas" ).on( "mousemove", function( event ) {
			event.point = { x:event.pageX, y:event.pageY };
			self.onMouseMove( event );
		} );
		$( "#viewCanvas" ).on( "mouseup", function( event ) {
			event.point = { x:event.pageX, y:event.pageY };
			self.onMouseUp( event );
		} );

		// Init color picker
		this._colorPickerOffset = parseInt( $( ".colorpicker-scroll" ).css( "top" ) );
		$( ".colorpicker-scroll" ).css( "top", this._colorPickerValue + this._colorPickerOffset );
		$( ".colorpicker-scroll-c" ).mousedown( function( event ) {
			self._colorPickerIsDragging = true;
			self._colorPickerYOffset = parseInt( $( ".colorpicker-scroll" ).css( "top" ) ) -
										event.pageY;
		} );

		this.setColorPickerMode( this._colorPickerMode );

		// Catch color picker drag in mouse move event
		$( window ).mousemove( function( event ) {
			if ( self._colorPickerIsDragging ) {
				var top = event.pageY + self._colorPickerYOffset;
				if ( top < self._colorPickerTopOffset ) {
					top = self._colorPickerTopOffset;
				} else if ( top > self._colorPickerTopOffset + 255 ) {
					top = self._colorPickerTopOffset + 255;
				}
				$( ".colorpicker-scroll" ).css( "top", top + "px" );
				$( ".colorpicker-scroll-c" ).text( top - self._colorPickerTopOffset );
				self.drawColorPicker( top - self._colorPickerTopOffset );
			}

		// Set colorpicker on mouseUp
		} ).mouseup( function mouseup( event ) {
			if ( self._colorPickerIsDragging ) {
				var top = event.pageY + self._colorPickerYOffset;
				if ( top < self._colorPickerTopOffset ) {
					top = self._colorPickerTopOffset;
				} else if ( top > self._colorPickerTopOffset + 255 ) {
					top = self._colorPickerTopOffset + 255;
				}
				$( ".colorpicker-scroll" ).css( "top", top + "px" );
				$( ".colorpicker-scroll-c" ).text( top - self._colorPickerTopOffset );
				self.drawColorPicker( top - self._colorPickerTopOffset );
				self._colorPickerIsDragging = false;
			}
		} );

		// Set colorpicker color mode
		$( ".colorpicker-scroll-c1" ).mousedown( function( event ) {

			// Set colorpicker buttons
			switch ( self.getColorPickerMode() ) {
			case "red":
				$( ".colorpicker-scroll-c" ).removeClass( "btn-danger" ).addClass( "btn-success" );
				$( ".colorpicker-scroll-c1" ).removeClass( "btn-success" ).addClass( "btn-danger" );
				self.setColorPickerMode( "green" );
				break;
			case "green":
				$( ".colorpicker-scroll-c" ).removeClass( "btn-success" ).addClass( "btn-danger" );
				$( ".colorpicker-scroll-c1" ).removeClass( "btn-danger" ).addClass( "btn-success" );
				self.setColorPickerMode( "red" );
				break;
			case "blue":
				$( ".colorpicker-scroll-c" ).removeClass( "btn-primary" ).addClass( "btn-danger" );
				$( ".colorpicker-scroll-c1" ).removeClass( "btn-danger" ).addClass( "btn-success" );
				$( ".colorpicker-scroll-c2" ).removeClass( "btn-success" )
					.addClass( "btn-primary" );
				self.setColorPickerMode( "red" );
				break;
			}
		} );
		$( ".colorpicker-scroll-c2" ).mousedown( function( event ) {

			switch ( self.getColorPickerMode() ) {
			case "red":
				$( ".colorpicker-scroll-c" ).removeClass( "btn-danger" ).addClass( "btn-primary" );
				$( ".colorpicker-scroll-c1" ).removeClass( "btn-success" ).addClass( "btn-danger" );
				$( ".colorpicker-scroll-c2" ).removeClass( "btn-primary" )
					.addClass( "btn-success" );
				self.setColorPickerMode( "blue" );
				break;
			case "green":
				$( ".colorpicker-scroll-c" ).removeClass( "btn-success" ).addClass( "btn-primary" );
				$( ".colorpicker-scroll-c2" ).removeClass( "btn-primary" )
					.addClass( "btn-success" );
				self.setColorPickerMode( "blue" );
				break;
			case "blue":
				$( ".colorpicker-scroll-c" ).removeClass( "btn-primary" ).addClass( "btn-success" );
				$( ".colorpicker-scroll-c2" ).removeClass( "btn-success" )
					.addClass( "btn-primary" );
				self.setColorPickerMode( "green" );
				break;
			}
		} );
	},

	/////////////////////////////////////////////////////////////////////
	// Method getCtx return the canvas ctx
	//
	getCtx: function() {
		return this._ctx;
	}
}, {

	/////////////////////////////////////////////////////////////////////
	// Method onMouseDown set the current color after click into colorpicker
	//
	onMouseDown: function( event ) {
		var point = { x: event.pageX -
						$( "#viewCanvas" ).offset().left, y: event.pageY -
						$( "#viewCanvas" ).offset().top },
			pixel = this._zoomctx.getImageData( point.x, point.y, 1, 1 ),
			data = pixel.data,
			color = new Color( data[ 0 ] / 255, data[ 1 ] / 255, data[ 2 ] / 255, data[ 3 ] / 255 );

		baseCommands.setColor( color );
	},

	/////////////////////////////////////////////////////////////////////
	// Method onMouseMove changes between zoom mode and colorpicker
	//
	onMouseMove: function( event ) {

		var size = this._viewRect.size;

		// If mouse is in cropper rect ...
		if ( this._cropper.getInnerRect(true).contains( event.point ) ) {
			if ( !this._zoomActive ) $( ".colorpicker-scroll" ).fadeOut();
			this._zoomActive = true;

			var clipSize = size / this._zoom;

			this._zoomctx.fillStyle = "white";
			this._zoomctx.fillRect( 0, 0, size.width, size.height );
			this._zoomctx.drawImage( this._context,
									event.point.x - clipSize.width / 2,
									event.point.y - clipSize.height / 2,
									clipSize.width, clipSize.height, 0, 0,
									size.width, size.height );

		// If mouse just left the cropper rect
		} else if ( this._zoomActive ) {
			this._zoomActive = false;

			switch ( this._mode ) {
				case "colorpicker":

					// Show the cropper rect
					var colorPicker = $( ".colorpicker-scroll" ).fadeIn();
					this.drawColorPicker();
					break;
			}
		}
	},

	/////////////////////////////////////////////////////////////////////
	// Method drawColorPicker
	//
	drawColorPicker: function( pos ) {
		var mode = this._colorPickerMode,
			mod  = mode === "red" ? 0 : mode === "green" ? 1 : 2;

		// Fill color picker square
		this._colorPickerValue = pos || this._colorPickerValue;
		for ( var i = 0 ; i < 256 ; i++ ) {
			var row = i * 256 * 4;
			for ( var j = 0 ; j < 256 ; j++ ) {
				var col = row + j * 4;
				this._colorPickerImageData.data[ col + mod ] = this._colorPickerValue;
			}
		}
		this._zoomctx.putImageData( this._colorPickerImageData, 0, 0 );
	},

	/////////////////////////////////////////////////////////////////////
	// Method getColorPickerMode
	//
	getColorPickerMode: function() {
		return this._colorPickerMode;
	},

	/////////////////////////////////////////////////////////////////////
	// Method setColorPickerMode prepared the imageData field with all fixed colors
	//
	setColorPickerMode: function( mode ) {
		this._colorPickerMode = mode;

		var	imageData = this._colorPickerImageData = this._zoomctx.createImageData( 256, 256 ),
			fix1 = mode === "red" ? 1 : mode === "green" ? 0 : 0,
			fix2 = mode === "red" ? 2 : mode === "green" ? 2 : 1;

		for ( var i = 0 ; i < 256 ; i++ ) {
			var row = i * 256 * 4;
			for ( var j = 0 ; j < 256 ; j++ ) {
				var col = row + j * 4;
				imageData.data[ col + fix1 ] = i;
				imageData.data[ col + fix2 ] = j;
				imageData.data[ col + 3 ] = 255;
			}
		}

		this.drawColorPicker();
	}
} );

////////////////////////////////////////////////////////////////////////
// Colorizer provides means to change colors of rasters with caman library
//
var Colorizer = Base.extend( {
	_class: "Colorizer",
	_enabled: true,			// Flag if the colorizer is enabled
	_oldValues: {},			// Saving the last slider values
	_serializeFields: {
	},

	point: new Point( parseInt( $( "#colorizerOptions" ).css( "left" ) ),
						parseInt( $( "#colorizerOptions" ).css( "top" ) ) ),		// Position
	size: new Size( parseInt( $( "#colorizerOptions" ).css( "width" ) ),
						parseInt( $( "#colorizerOptions" ).css( "height" ) ) ),	// Size
	item: null,				// The raster that is to be modified

	/////////////////////////////////////////////////////////////////////
	// Method initialized is called at object creation
	//
	initialize: function( sliders ) {

		var currentLayer = project.activeLayer;
		baseLayer.activate();

		// Initialize all sliders
		var children = [];
		for ( var i = 0 ; i < sliders.length ; i++ ) {
			children.push( new Slider( {
				name: window.CPGLocale.Colorizer[ sliders[ i ].filter ],
				filter: sliders[ i ].filter,
				startValue: sliders[ i ].startValue,
				bounds: new Rectangle( this.point + new Point( 0, sliders[ i ].yPos ), this.size ),
				camanValue: sliders[ i ].camanValue,
				parent: this
			} ) );

			this._oldValues[ sliders[ i ].filter ] = sliders[ i ].startValue;
		};
		this.item = new Group( children );

		currentLayer.activate();
	},

	/////////////////////////////////////////////////////////////////////
	// Method show shows the colorizer
	//
	show: function() {
		var self = this;

		this.item.visible = true;

		// Enable the colorizers if an item is selected
		$( "#page-paper" ).on( "itemSelected", function( event, options ) {
			self.enable( options.item, options.join );
		} );

		// Disable the colorizers if an item is deselected
		$( "#page-paper" ).on( "itemDeselected", function( event, options ) {
			self.disable( options.item, options.join );
		} );

		// React on undo and redo events
		$( "#page-paper" ).on( "undoUpdate redoUpdate", function( event, item ) {
			if ( !item || item.className !== "Raster" ) return;

			if ( item === self._orgItem ) {
				self.setValues( item.colorizeValues );
			} else {
				self.setValues( item.colorizeValues );
			}
		} );

		this.enable( project.selectedItems[ 0 ] );
	},

	/////////////////////////////////////////////////////////////////////
	// Method hide hides the colorizer
	//
	hide: function() {
		this.item.visible = false;

		this.disable( this.item );

		// Off all event listeners
		$( "#page-paper" ).off( "itemSelected" );
		$( "#page-paper" ).off( "itemDeselected" );
		$( "#page-paper" ).off( "undoUpdate" );
		$( "#page-paper" ).off( "redoUpdate" );
	},

	/////////////////////////////////////////////////////////////////////
	// Method enable activates the colorizes (sliders movable)
	//
	enable: function( item, join ) {
		this._enabled = true;

		// Nothing to do if the item is the same as before
		if ( item === this._orgItem ) return;

		// Commit former item if is still active
		if ( this._orgItem ) {
			Do.execute( {
				item: this._orgItem,
				oldValues: this._oldValues,
				action: "ColorizeCommit",
				join: join
			} );
			item.joinDirty = true;	// Connect this for undo to the next action (if there is any)
			this._orgItem = null;
		}

		// Set slider values
		if ( item.className === "Raster" ) {

			var self = this;
			this._orgItem = item;
			self._oldValues = {};

			Base.each( this.item.children, function( slider ) {
				slider.getValue( self._oldValues );
				slider.resetValue();
				slider.setSliderFillColor( true );
			} );
		}
	},

	/////////////////////////////////////////////////////////////////////
	// Method disable deactivates sliders
	//
	disable: function( item, join ) {
		if ( !this._orgItem ) return;

		// Commit the color changes
		this._enabled = false;
		Do.execute( {
			item: this._orgItem,
			oldValues: this._oldValues,
			action: "ColorizeCommit",
			join: join
		} );
		this._orgItem = null;
		item.joinDirty = true;

		// Show disabled sliders
		Base.each( this.item.children, function( slider ) {
			slider.resetValue();
			slider.setSliderFillColor( false );
		} );
	},

	/////////////////////////////////////////////////////////////////////
	// Method enabled
	//
	enabled: function() {
		return this._enabled;
	},

	/////////////////////////////////////////////////////////////////////
	// Method update changes color values
	//
	update: function() {

		var newValues = {};

		// Move the sliders to new positions
		Base.each( this.item.children, function( slider ) { slider.getValue( newValues ); } );

		// Change color
		Do.execute( {
			item: this._orgItem,
			action: "Colorize",
			oldValues: this._oldValues,
			newValues: newValues
		} );

		this._oldValues = newValues;
	},

	/////////////////////////////////////////////////////////////////////
	// Method setValues set the values of the individual sliders
	//
	setValues: function( values ) {
		for ( childId in this.item.children ) {
			var child = this.item.children[ childId ],
				filter = child.getFilter();

			if ( values && values[ filter ] !== undefined ) {
				child.setValue( values[ "slider_" + filter ] );
			}
		}
	}
}, {

} );

var Slider = Base.extend( {
	_class: "Slider",
	_serializeFields: {

	},

	group: null,	// Group that the slider belongs to

	/////////////////////////////////////////////////////////////////////
	// Method initialized is called at object creation
	//
	initialize: function( options ) {
		var self = this,
			point = this._point = options.bounds.topLeft,	// Top left corner of slider track
			size = this._size = options.bounds.size,		// Size of slider track
			value = this._startValue = options.startValue,	// Start value (0 ... 1)
			sWidth = 20,									// Slider width
			sHeight = 40,									// Slider height
			margin = 20,									// Margin around slider track
			width = size.width - margin * 2,				// Total width
			enabled = false;								// Activated?

		////////////////////////////////////////////////////////////
		// Create the slider using paperjs items
		//
		var group = this.group = new Group( [
			new PointText( {
				point: new Point( point.x + margin, point.y ),
			    content: options.name,
			    fillColor: "black",
			    fontFamily: "Exo",
			    fontSize: 16
			} ),
			new Path.Rectangle( {
				point: new Point( point.x + margin, point.y + 15 ),
				size: new Size( width, sWidth ),
				radius: 10,
				strokeColor: "black"
			} ),
			new Path.Rectangle( {
				point: new Point( point.x + margin + value * width, point.y + 5 ),
				size: new Size( sWidth, sHeight ),
				radius: 10,
				strokeColor: "black"
			} )
		] );

		////////////////////////////////////////////////////////////
		// Setting up the slider, with events
		//
		var slider = group.children[ 2 ],
			xOffset = null;

		slider.onMouseDown = function( event ) {
			if ( !options.parent.enabled() ) return;

			xOffset = event.point.x - slider.position.x;
		};

		slider.onMouseDrag = function( event ) {
			if ( !options.parent.enabled() ) return;

			slider.position.x = event.point.x - xOffset;
			if ( slider.position.x < point.x + margin ) slider.position.x = point.x + margin;
			if ( slider.position.x >= point.x + margin + width ) {
				slider.position.x = point.x + margin + width;
			}

			value = ( slider.position.x - point.x - margin ) / width;
		};

		$( "#page-paper" ).on( "mouseup", function( event ) {
			if ( !options.parent.enabled() || xOffset === null ) return;

			options.parent.update();
			xOffset = null;
		} );

		group.getValue = function( opt ) {
			if ( typeof opt === "object" ) {
				opt[ options.filter ] = options.camanValue( value );
				opt[ "slider_" + options.filter ] = value;
			}
			return value;
		};

		group.getFilter = function() {
			return options.filter;
		};

		group.setValue = function( val ) {
			value = val;
			slider.position.x = point.x + margin + width * value;
		};

		group.resetValue = function() {
			value = options.startValue;
			slider.position.x = point.x + margin + width * value;
		};

		group.setSliderFillColor = function( enable ) {
			if ( enable ) {
				slider.fillColor = {
			        gradient: {
			            stops: [ "yellow", "red", "blue" ]
			        },
			        origin: [ 0, point.y + 5 ],
			        destination: [ 0, point.y + sHeight ]
			    };
			} else {
				slider.fillColor = {
			        gradient: {
			            stops: [ "grey", "blue", "gray" ]
			        },
			        origin: [ 0, point.y + 5 ],
			        destination: [ 0, point.y + sHeight ]
			    };
			}
		};
		group.setSliderFillColor( false );

		return group;
	},

	//////////////////////////////////////////////////////////7777
	// Interface functions
	resetValue: function() { this.group.resetValue(); },
	setSliderFillColor: function( enable ) { this.group.setSliderFillColor( enable ); },
	getValue: function( options ) { this.group.getValue( options ); },
	getFilter: function() { this.group.getFilter(); }
}, {

} );

////////////////////////////////////////////////////////////////////////
// Commands shows and handles all commands
//
var COMMAND_POINTER		= 1,
	COMMAND_PEN			= 2,
	COMMAND_RUBBER		= 3,
	COMMAND_DELETE		= 4,
	COMMAND_MAGIC		= 5,
	COMMAND_PIPETTE		= 6,
	COMMAND_COLORIZER	= 7,
	COMMAND_RESIZE		= 11,
	COMMAND_ROTATE		= 12;
	BRUSH_RADII			= [ 0.5, 1, 2, 4, 8, 12, 18, 24 ];

var Commands = Base.extend( {
	_class: "Commands",
	_currentColor: new Color( "red" ),	// Start color is red
	_cursorShapes: {},					// Cursor shapes for command mode

	_serializeFields: {
	},
	_initFns: {},						// Initialization functions for single commands
	_exitFns: [],						// Deinitialization functions

	commandMode: "pointer",				// Current command mode (default: normal pointer)
	resizeMode: COMMAND_RESIZE,			// Current resize/rotate mode
	cursorMode: null,					// Current cursor mode
	cursorShape: "default",				// Current cursor shape
	rubberCircle: null,					// Current rubber circle

	///////////////////////////////////////////////////////////////////
	// Method initialize ist the setup for all command, the command window
	//
	initialize: function() {
		var self = this;

		///////////////////////////////////////////////////
		// Method buttonBlink shows short activation of a button
		//
		var buttonBlink = function( button ) {
			button.addClass( "active btn-success" );
			setTimeout( function() {
				button.removeClass( "active btn-success" );
			}, 200 );
		};

		///////////////////////////////////////////////////
		// Method initModeCmd sets up a command that stays active
		//
		var initModeCmd = function( type, mode, cursorShape, initFn, exitFn ) {

			// Set cursor shape and init/exit functions for a command
			self._cursorShapes[ type ] = cursorShape;
			self._initFns[ type ] = initFn;
			if ( exitFn ) self._exitFns.push( exitFn );

			// Activate command on click
			return $( ".command-" + type ).on( "click tap", function( event ) {
				self.activateCommand( type, event );
			} );
		};

		///////////////////////////////////////////////////
		// Method getRubberBrush prepares the current brush to remove background
		//
		var getRubberBrush = function( index ) {

			// Variables
			var currentLayer = project.activeLayer,					// Save current layer
				layer = new Layer(),								// Create a new one
				radius = BRUSH_RADII[ index ],						// Get radius
				maxRadius = BRUSH_RADII[ BRUSH_RADII.length - 1 ];	// Get biggest radius

			// Create rectangle that surrounds brush (always same size)
			new Path.Rectangle( {
				point: [ 0, 0 ],
				size: [ maxRadius * 2, maxRadius * 2 ],
				strokeColor: new Color( 0, 0, 0, 0 )
			} );

			// Create brush circle
			var path = new Path.Circle( {
			    center: [ maxRadius, maxRadius ],
			    radius: radius,
			    strokeColor: new Color( 0, 0, 0, 0 )
			} );

			// Set gradient for brush
			path.fillColor = {
				gradient: {
					stops: [ [ "black", 0.70 ], [ new Color( 0, 0, 0, 0 ), 1 ] ],
					radial: true
				},
			    origin: path.position,
				destination: path.bounds.rightCenter
			};

			// Get raster image from circle brush
			var image = layer.rasterize( undefined, false ).toDataURL();

			layer.remove();
			project.activeLayer = currentLayer;
			return image;
		};

		///////////////////////////////////////////////////////////////////
		// Set color of current color field
		//
		$( ".colorfield" ).css( "background-color", this._currentColor.toCSS() );

		///////////////////////////////////////////////////////////////////
		// Menü-Command: Undo
		//
		$( ".command-undo" ).on( "click tap", function( event ) {
			Do.undo();
		} );

		///////////////////////////////////////////////////////////////////
		// Menü-Command: Redo
		//
		$( ".command-redo" ).on( "click tap", function( event ) {
			Do.redo();
		} );

		///////////////////////////////////////////////////////////////////
		// Menü-Command: Download
		//
		$( ".command-download" ).on( "click tap", function( event ) {
			showModalImageFiles( function( res, image ) {
				if ( res === "open" ) {

					// Create a new raster of the returned image
					var r1 = new Raster( image ),
						r2 = Do.execute( {
							item: r1,
							action: "Import"
						} );

			        r1.remove();

					var items = project.activeLayer.children;
					if ( items.length === 1 ) baseCropper.set( r2.bounds );
				}
			} );
		} );

		///////////////////////////////////////////////////////////////////
		// Menü-Command: Mode-Commands
		//
		///////////////////////////////////////////////
		// Method rubberInit prepares cursor circle and the brush image data
		//
		var rubberInit = function( event ) {
			var currentLayer = project.activeLayer,
				brush = $( "#rubberOptions .cursorShape .commandBox.selected" ),
				radius = BRUSH_RADII[ brush.attr( "index" ) ],
				offset = $( "#paperCanvasWrapper" ).offset();

			baseLayer.activate();

			// Circle that follows the mouse movement
			self.rubberCircle = new Path.Circle( {
			    center: [ event.pageX - offset.left, event.pageY - offset.top ],
			    radius: radius,
			    strokeColor: new Color( 0, 0, 0, 255 ),
			    dashArray: [ 1 ]
			} );

			// Take the raster from the DOM and take it as brush
			var raster = new Raster( $( "img", brush )[ 0 ] );
			self.rubberBrush = raster.getImageData();
			raster.remove();

			currentLayer.activate();
		};

		///////////////////////////////////////////////
		// Method rubberExit
		//
		var rubberExit = function( event ) {
			if ( self.rubberCircle ) {
				self.rubberCircle.remove();
				self.rubberCircle = null;
			}
		};

		///////////////////////////////////////////////
		// Method colorizer1Init inits the first Colorizer
		//
		var colorizer1Init = function( event ) {
			baseColorizer1.show();
		};

		///////////////////////////////////////////////
		// Method colorizer1Exit exits the first Colorizer
		//
		var colorizer1Exit = function( event ) {
			baseColorizer1.hide();
		};

		///////////////////////////////////////////////
		// Method colorizer2Init inits the second Colorizer
		//
		var colorizer2Init = function( event ) {
			baseColorizer2.show();
		};

		///////////////////////////////////////////////
		// Method colorizer2Exit exits the second Colorizer
		//
		var colorizer2Exit = function( event ) {
			baseColorizer2.hide();
		};

		///////////////////////////////////////////////
		// Init all mode commands
		//
		initModeCmd( "pointer", COMMAND_POINTER, "default" ).addClass( "active btn-primary" );
		initModeCmd( "pen", COMMAND_PEN, "url( 'static/img/cur_pen.png' ) 0 22, auto" );
		initModeCmd( "rubber", COMMAND_RUBBER, "url( 'static/img/cur_rubber.png' ) 4 4, auto",
							rubberInit, rubberExit );
		initModeCmd( "delete", COMMAND_DELETE, "url( 'static/img/cur_delete.png' ) 8 8, auto" );
		initModeCmd( "magic", COMMAND_MAGIC, "url( 'static/img/cur_magic.png' ) 11 11, auto" );
		initModeCmd( "pipette", COMMAND_PIPETTE, "url( 'static/img/cur_pipette.png' ) 1 21, auto" );
		initModeCmd( "colorizer-1", COMMAND_COLORIZER, "default", colorizer1Init, colorizer1Exit );
		initModeCmd( "colorizer-2", COMMAND_COLORIZER, "default", colorizer2Init, colorizer2Exit );

		///////////////////////////////////////////////////////////////////
		// Command: Rotate
		//
		$( ".command-rotate" ).on( "click tap", function( event ) {
			$( ".command-resize" ).removeClass( "active btn-primary" );
			$( ".command-rotate" ).addClass( "active btn-primary" );
			self.resizeMode = COMMAND_ROTATE;
		} );

		///////////////////////////////////////////////////////////////////
		// Command: Resize
		//
		$( ".command-resize" ).on( "click tap", function( event ) {
			$( ".command-rotate" ).removeClass( "active btn-primary" );
			$( ".command-resize" ).addClass( "active btn-primary" );
			self.resizeMode = COMMAND_RESIZE;
		} ).addClass( "active btn-primary" );

		///////////////////////////////////////////////////////////////////
		// Menü-Command: Clone
		//
		$( ".command-clone" ).on( "click tap", function( event ) {
			Base.each( project.selectedItems, function( item ) {
				item.joinDirty = false; // Attribute joinDirty may be set by a triggered function
				$( "#page-paper" ).trigger( "itemDeselected", { item: item, join: false } );

				// Clone item
				var newItem = Do.execute( {
					item: item,
					action: "Clone",
					join: item.joinDirty
				} );

				setTimeout( function() {
					$( "#page-paper" ).trigger( "itemSelected", { item: newItem, join: true } );
				}, 5 );
			} );

			if ( project.selectedItems.length ) buttonBlink( $( this ) );
		} );

		///////////////////////////////////////////////////////////////////
		// Menü-Command: Rasterize
		//
		$( ".command-rasterize" ).on( "click tap", function( event ) {
			Base.each( project.selectedItems, function( item ) {
				if ( item.className === "Raster" ) {
					item = self.cropRaster( item );
					item.selected = true;
				}
			} );
			if ( project.selectedItems.length ) buttonBlink( $( this ) );
		} );

		///////////////////////////////////////////////////////////////////
		// Menü-Command: Send to back
		//
		$( ".command-arrange-down" ).on( "click tap", function( event ) {
			Base.each( project.selectedItems, function( item ) {
				Do.execute( {
					item: item,
					action: "SendToBack"
				} );
			} );
			if ( project.selectedItems.length ) buttonBlink( $( this ) );
		} );

		//////////////////////////////////////////////////////////////////
		// Menü-Command: Bring to Front
		//
		$( ".command-arrange-up" ).on( "click tap", function( event ) {
			Base.each( project.selectedItems, function( item ) {
				Do.execute( {
					item: item,
					action: "BringToFront"
				} );
			} );
			if ( project.selectedItems.length ) buttonBlink( $( this ) );
		} );

		/////////////////////////////////////////////////////////////////////////////////
		// Prepare command options
		//
		////////////////////////////////////////////////////////////////////
		// Delete Options
		//
		$( ".commandOptions" ).fadeOut(); // Don't show at start

		var cursorShapeBoxes = $( "#rubberOptions .cursorShape .commandBox" );

		// Click events for delete boxes
		cursorShapeBoxes.on( "tap click", function( event ) {
			cursorShapeBoxes.removeClass( "selected" );
			$( this ).addClass( "selected" );

			if ( self.rubberCircle ) {
				rubberExit( event );
				rubberInit( event );
			}
		} );

		// Draw delete brush boxes
		$.each( cursorShapeBoxes, function( index, box ) {
			$( box ).html( "<img src='" + getRubberBrush( index ) + "' />" );
		} );
	},

	/////////////////////////////////////////////////////////////////////////////////
	// Method activateCommand is called after user click on a command
	//
	activateCommand: function( type, event ) {

		// Deactivate all commands
		$( ".mode-command" ).removeClass( "active btn-primary" );
		$( ".commandOptions" ).fadeOut();
		Base.each( this._exitFns, function( fn ) { fn( event ); } );

		// Activate selected command
		$( ".command-" + type ).addClass( "active btn-primary" );
		$( "#" + type + "Options" ).fadeIn();

		this.commandMode = type;
		this.cursorShape = this._cursorShapes[ type ];
		document.body.style.cursor = this.cursorShape;
		if ( this._initFns[ type ] ) this._initFns[ type ]( event );
	}
}, {

	/////////////////////////////////////////////////////////////////////////////////
	// Method cropRaster normalizes and crops a raster
	//
	cropRaster: function( raster ) {

		// Normalize raster
		var normalizedRaster = raster.rasterize();

		// Crop image to cropper rect
		var rect1 = baseCropper.getInnerRect();
			rect2 = normalizedRaster.bounds;
			rect3 = rect2.intersect( rect1 );

		rect3.point -= rect2.topLeft;

		var croppedRaster = normalizedRaster.getSubRaster( rect3 ),
			ctx = croppedRaster.getContext(),	// Canvas context
			b = croppedRaster.size;				// Raster size

		normalizedRaster.remove();

		// Check if there is pixel data in provided image data
		var findPixel = function( data ) {
			for ( var i = 0 ; i < data.length ; i += 4 ) if ( data[ i + 3 ] !== 0 ) return true;
			return false;
		};

		// Check verticals lines from left side
		for ( var i = 0, found = false ; i < b.width && !found ; i++ ) {
			found = findPixel( ctx.getImageData( i, 0, 1, b.height ).data );
		}
		if ( !found ) {

			// Remove raster if it is completly empty
			croppedRaster.remove();
			return;
		}
		var x = i - 1;	// New left side

		// Check horizontal lines from top to bottom
		for ( var i = 0, found = false ; i < b.height && !found ; i++ ) {
			found = findPixel( ctx.getImageData( x, i, b.width - x, 1 ).data );
		}
		var y = i - 1;

		// Check verticals lines from right side
		for ( var i = b.width - 1, found = false ; i >= x && !found ; i-- ) {
			found = findPixel( ctx.getImageData( i, y, 1, b.height - y ).data );
		}
		var width = i + 2 - x;

		// Check horizontal lines from bottom to top
		for ( var i = b.height - 1, found = false ; i >= y && !found ; i-- ) {
			found = findPixel( ctx.getImageData( x, i, width, 1 ).data );
		}
		var height = i + 2 - y;

		// Create a new raster and remove the old
		var newRaster = croppedRaster.getSubRaster( new Rectangle( x, y, width, height ) );
		croppedRaster.remove();

		// Send old and new raster to undo manager
		Do.execute( {
			item: newRaster,
			action: "Crop",
			oldRaster: raster
		} );

		return newRaster;
	},

	/////////////////////////////////////////////////////////////////////////////////
	// Method getColor
	//
	getColor: function() {
		return this._currentColor;
	},

	/////////////////////////////////////////////////////////////////////////////////
	// Method setColor
	//
	setColor: function( color ) {
		this._currentColor = color;
		$( ".colorfield" ).css( "background-color", color.toCSS() );
	},

	/////////////////////////////////////////////////////////////////////////////////
	// Method drawRubberData erases image data at mouse position
	//
	drawRubberData: function( item, point ) {
		var w = this.rubberBrush.width,
			h = this.rubberBrush.height,
			p = point - item.position + item.size / 2 - new Point( w / 2, h / 2 ),
			brush = this.rubberBrush.data,
			mask = this.rubberMask.data,
			buffer = item.getImageData( new Rectangle( p.x, p.y, w, h ) );

		// Workaround for Chrome ( part 1 )
		if ( buffer.width !== w ) {
			var bufCorr = w - buffer.width;
			buffer = item.getImageData( new Rectangle( p.x, p.y, w + bufCorr, h ) );
		}

		// Erase image data using a mask to remember where we already erased
		for ( var i = 0 ; i < h ; i++ ) {
			var y = p.y + i;
			if ( y >= 0 && y < item.size.height ) {
				for ( var j = 0 ; j < w ; j++ ) {
					var x = p.x + j,
						mp = y * item.size.width * 4 + x * 4 + 3,
						bp = i * h * 4 + j * 4 + 3;

					if ( x >= 0 && x < item.size.width && mask[ mp ] < brush[ bp ] ) {
						buffer.data[ bp ] -= brush[ bp ] - mask[ mp ];
						mask[ mp ] = brush[ bp ];
					}
				}
			}
		}

		// Workaround for Chrome ( part 2 )
		if ( bufCorr && p.x < 0 ) p.x += bufCorr;
		item.setImageData( buffer, p );

		// Set the dirty rect for undo manager
		var r1 = new Rectangle( p.x, p.y, buffer.width, buffer.height ),
			r2 = baseCommands.rubberDirtyRect || r1;
		if ( r1.left   < r2.left )   r2.left   = r1.left;
		if ( r1.right  > r2.right )  r2.right  = r1.right;
		if ( r1.top    < r2.top )    r2.top    = r1.top;
		if ( r1.bottom > r2.bottom ) r2.bottom = r1.bottom;
		baseCommands.rubberDirtyRect =
			r2.intersect( new Rectangle( 0, 0, item.width, item.height ) );
	}
} );

////////////////////////////////////////////////////////////////////////
// showModalImageFiles shows the image files for import
//
var showModalImageFiles = function( cb ) {
	var modal = $( "#commands-image-import-modal" );

    var afl = window.AllImages,
        imageGroups = $( "<div id='modal-imagefiles' class='files'>" );

    for ( var i = 0 ; i < afl.length ; i++ ) {

    	var groupName = afl[ i ].groupName;

    	imageGroups.append( "<div class='title'>"+groupName+"</div>" );

    	for ( var j = 0 ; j < afl[ i ].images.length ; j++ ) {
	        imageGroups.append(
	            "<div class='file file" + i + " pull-left' filename='" + afl[ i ].images[ j ] + "'>" +
	            "   <div class='top'>" +
	            "   </div>" +
	            "   <div class='middle'>" +
	            "       <img id='modal-image-" + afl[ i ].images[ j ] + "' src='static/userdata/" + window.UserNameForImages + "/images/" + groupName + "/" + ( afl[ i ].images[ j ] + ".png'" ) + " max-width='100' max-height='100'>" +
	            "   </div>" +
	            "   <div class='bottom'>" +
	            "       <span class='filename text-center'>" + afl[ i ].images[ j ] + "</span>" +
	            "   </div>" +
	            "</div>"
	        );
    	}
    }

    $( ".content" ).append( imageGroups );

    // Correct font size of filenames
    $( ".modal-body", modal ).prepend( imageGroups );

    $( ".file", modal ).on( "click", function( e ) {
        var lcb = cb;
        cb = null;
        modal.modal( "hide" );

		baseCommands.activateCommand( "pointer" );

        if ( lcb ) lcb( "open", "modal-image-" + $( this ).attr( "filename" ) );
    } );

    $( ".modal-cancel", modal ).off( "click" ).one( "click", function( e ) {
        modal.modal( "hide" );
    } );

    modal.one( 'hidden.bs.modal', function( e ) {
        if ( cb ) cb( "cancel" );
    } );

    modal.one( 'shown.bs.modal', function( e ) {
	    // Vertically center images after they are shown
	    $( ".file img", modal ).each( function( index ) {
		    var img = $( this ),
		    	w = img.width(),
		    	h = img.height(),
		    	maxW = parseInt( img.attr( "max-width" ) ),
		    	maxH = parseInt( img.attr( "max-height" ) );

		    img.animate( {
		    	marginLeft: ( ( maxW - w )/2 ) + "px",
		    	marginTop:  ( ( maxH - h )/2 ) + "px",
		    	zoom: 1,
		    	opacity: 1,
		    }, 300 );
	    } );
    } );

	$("#image-import-local").on('change', function() {
		var input = $(this),
			numFiles = input.get(0).files ? input.get(0).files.length : 1,
			label = input.val().replace(/\\/g, '/').replace(/.*\//, ''),
			reader = new FileReader(),
			lcb = cb;
        
        cb = null;
        modal.modal( "hide" );

		baseCommands.activateCommand( "pointer" );
    
	    reader.onload = function ( event ) {
	        if ( lcb ) lcb( "open", event.target.result );
	    };
    
	    reader.readAsDataURL( document.getElementById("image-import-local").files[0] );    
	});
	
	modal.modal( "show" );
};


////////////////////////////////////////////////////////
// Global functions
var UndoManager = Base.extend( {
	_class: "UndoManager",

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

	execute: function( options ) {
		switch ( options.action ) {
			case "strokeWidth":
			case "strokeColor":
				var lastData = options.item[ options.action ];
				if ( typeof lastData === "object" ) {
					lastData = lastData.clone();
				}
				this._reverseActions[ this._actionPointer ] = function() {
					options.item[ options.action ] = lastData;
				}
				this._actions[ this._actionPointer ] = function() {
					options.item[ options.action ] = options.param1;
				}
				break;

			case "Circle":
				if ( options.item !== "Path" ) return

				var pathObject;
				this._reverseActions[ this._actionPointer ] = function() {
					pathObject.remove();
				}
				this._actions[ this._actionPointer ] = function() {
					if ( !pathObject ) {
						pathObject = new Path[ options.action ]( options.param1, options.param2, options.param3, options.param4 );
						pathObject.strokeColor = new Color( 0, 0, 0, 1 );
						return pathObject;
					} else {
						project.activeLayer.addChild( pathObject );
					}
				}
				break;

			case "Import":
				var importRaster = null,
					importIndex = null;
				this._reverseActions[ this._actionPointer ] = function() {
				    importIndex = importRaster.index;
					importRaster.remove();
				}
				this._actions[ this._actionPointer ] = function() {

				    if ( importIndex === null ) importRaster = options.item.clone();
					else project.activeLayer.insertChild( importIndex, importRaster );

					project.deselectAll();
					importRaster.position = new Point( 300, 300 );
					importRaster.selected = true;

					return importRaster;
				}
				break;

			case "Move":
				this._reverseActions[ this._actionPointer ] = function() {
					options.item.position = options.oldPosition;
				}
				this._actions[ this._actionPointer ] = function() {
					options.item.position = options.newPosition;
				}
				break;

			case "Crop":
				var cropSelected = null;
				this._reverseActions[ this._actionPointer ] = function() {
					options.oldRaster.insertAbove( options.item );
					options.oldRaster.selected = cropSelected;
					options.item.remove();
				}
				this._actions[ this._actionPointer ] = function() {
					options.item.insertAbove( options.oldRaster );
					if ( cropSelected !== null ) options.item.selected = cropSelected;
					else cropSelected = options.oldRaster.selected;

					options.oldRaster.remove();
				}
				break;

			case "Select":
				var selectSelected = null;
				this._reverseActions[ this._actionPointer ] = function() {
					project.deselectAll();

					Base.each( selectSelected, function( item ) { item.selected = true; } );
				}
				this._actions[ this._actionPointer ] = function() {
					selectSelected = [];
					Base.each( project.selectedItems, function( item ) {
						selectSelected.push( item );
					} );
					project.deselectAll();

					if ( options.item ) options.item.selected = true;
				}
				break;

			case "Pipette":
				var pipetteColor = null;
				this._reverseActions[ this._actionPointer ] = function() {
					baseCommands.setColor( pipetteColor );
				}

				this._actions[ this._actionPointer ] = function() {
					pipetteColor = baseCommands.getColor();
					baseCommands.setColor( options.color );
				}
				break;

			case "Delete":
				var deleteInsertPos = null,
					deleteSelected = null;
				this._reverseActions[ this._actionPointer ] = function() {
					project.activeLayer.insertChild( deleteInsertPos, options.item );
					options.item.selected = deleteSelected;
				}

				this._actions[ this._actionPointer ] = function() {
					if ( deleteInsertPos === null ) {
						deleteInsertPos = options.item.index;
						deleteSelected = options.item.selected;
					}
					options.item.remove();
				}
				break;

			case "Clone":
				var cloneItem = null,
					cloneInsertPos = null;
				this._reverseActions[ this._actionPointer ] = function() {
					cloneItem.remove();
					options.item.selected = true;
				}

				this._actions[ this._actionPointer ] = function() {
					if ( cloneInsertPos === null ) {
						cloneItem = options.item.clone();
						cloneInsertPos = cloneItem.index;
					} else {
						project.activeLayer.insertChild( cloneInsertPos, cloneItem );
					}

					cloneItem.selected = true;
					options.item.selected = false;

					return cloneItem;
				}
				break;


			case "Rotate":
				var negRotation = null;
				this._reverseActions[ this._actionPointer ] = function() {
					options.item.rotate( negRotation );
				}

				this._actions[ this._actionPointer ] = function() {
					if ( negRotation === null ) negRotation = -options.rotation;
					else options.item.rotate( options.rotation );
				}
				break;

			case "Resize":
				var resizeBounds = null;
				this._reverseActions[ this._actionPointer ] = function() {
					options.item.bounds = options.bounds;
				}

				this._actions[ this._actionPointer ] = function() {
					if ( resizeBounds === null ) resizeBounds = options.item.bounds;
					else options.item.bounds = resizeBounds;
				}
				break;

			case "BringToFront":
				var toFrontIndex = null;
				this._reverseActions[ this._actionPointer ] = function() {
					options.item.remove();
					project.activeLayer.insertChild( toFrontIndex, options.item );
				}

				this._actions[ this._actionPointer ] = function() {
					if ( toFrontIndex === null ) toFrontIndex = options.item.index;
					options.item.bringToFront();
				}
				break;

			case "SendToBack":
				var toBackIndex = null;
				this._reverseActions[ this._actionPointer ] = function() {
					options.item.remove();
					project.activeLayer.insertChild( toBackIndex, options.item );
				}

				this._actions[ this._actionPointer ] = function() {
					if ( toBackIndex === null ) toBackIndex = options.item.index;
					options.item.sendToBack();
				}
				break;

			case "Colorize":
				var colorizeItem = null;
				this._reverseActions[ this._actionPointer ] = function() {
					options.item.filter( options.oldValues );
					options.item.colorizeValues = options.oldValues;
					return options.item;
				}

				this._actions[ this._actionPointer ] = function() {
					options.item.filter( options.newValues );
					options.item.colorizeValues = options.newValues;
					return options.item;
				}
				break;

			case "ColorizeCommit":
				var colorizeItem = null,
					colorizeIndex = null;
				this._reverseActions[ this._actionPointer ] = function() {
					options.item.filter( options.oldValues );
					options.item.colorizeValues = options.oldValues;
					return options.item;
				}

				this._actions[ this._actionPointer ] = function() {
					options.oldValues.rollback = options.item.filter( {commit: true} );
					options.item.colorizeValues = {};
					return options.item;
				}
				break;

			case "ResizeCropper":
				this._reverseActions[ this._actionPointer ] = function() {

					options.item.set( options.oldRect );

					return options.item;
				}

				this._actions[ this._actionPointer ] = function() {

					options.item.set( options.newRect );

					return options.item;
				}
			break;
		}

		this._reverseActions[ this._actionPointer ].join = options.join;
		this._actions[ this._actionPointer ].join = options.join;

		var res = this._actions[ this._actionPointer++]();
		this._actions.length = this._actionPointer;
		this._reverseActions.length = this._actionPointer;

		return res;
	},

	startTransaction: function( obj ) {
		// Currently only with Raster objects
		if ( obj.getClassName() !== "Raster" ) return;

		this._transactionObject = obj;
		this._transactionData = obj.getSubRaster( new Point( 0, 0 ), obj.size );
		this._transactionData.remove();
	},

	commit: function( rect, join ) {
		// Currently only with Raster objects
		if ( !this._transactionData ) return;

		rect = rect || this._transactionObject.bounds;

		var lastObj = this._transactionData,
			thisObj = this._transactionObject,
			lastData = lastObj.getImageData( rect ),
			thisData = thisObj.getImageData( rect );

		this._reverseActions[ this._actionPointer ] = function() {
			thisObj.setImageData( lastData, rect.topLeft );
		}
		this._actions[ this._actionPointer++] = function() {
			thisObj.setImageData( thisData, rect.topLeft );
		}
		// Join this action with the previous ( undo/redo them together )
		this._reverseActions[ this._actionPointer ].join = join;
		this._actions[ this._actionPointer ].join = join;

		this._actions.length = this._actionPointer;
		this._reverseActions.length = this._actionPointer;
	},

	startTransaction: function( obj ) {
		// Currently only with Raster objects
		if ( obj.getClassName() !== "Raster" ) return;

		this._transactionObject = obj;
		this._transactionData = obj.getSubRaster( new Point( 0, 0 ), obj.size );
		this._transactionData.remove();
	},

	commit: function( rect, join ) {
		// Currently only with Raster objects
		if ( !this._transactionData ) return;

		rect = rect || this._transactionObject.bounds;

		var lastObj = this._transactionData,
			thisObj = this._transactionObject,
			lastData = lastObj.getImageData( rect ),
			thisData = thisObj.getImageData( rect );

		this._reverseActions[ this._actionPointer ] = function() {
			thisObj.setImageData( lastData, rect.topLeft );
		}
		this._actions[ this._actionPointer ] = function() {
			thisObj.setImageData( thisData, rect.topLeft );
		}

		// join this action with the previous ( undo/redo them together )
		this._reverseActions[ this._actionPointer ].join = join;
		this._actions[ this._actionPointer ].join = join;

		this._actionPointer++;

		this._actions.length = this._actionPointer;
		this._reverseActions.length = this._actionPointer;
	},

	undo: function() {
		if ( this._actionPointer > 0 ) {
			this._actionPointer--;
			var item = this._reverseActions[ this._actionPointer ]();
			$( "#page-paper" ).trigger( "undoUpdate", item );

			if ( this._reverseActions[ this._actionPointer ].join ) this.undo();
		}
	},

	redo: function() {
		if ( this._actionPointer < this._actions.length ) {
			var item = this._actions[ this._actionPointer++]();
			$( "#page-paper" ).trigger( "redoUpdate", item );

			if ( this._actionPointer < this._actions.length && this._actions[ this._actionPointer ].join ) this.redo();
		}
	},
} );



////////////////////////////////////////////////////////
// Program startup
var Do = new UndoManager();


if ( sessionStorage.paperProject ) {
	project.clear();
	project.importJSON( sessionStorage.paperProject );

	var baseLayer = project.layers[ project.layers.length-1 ],
		cropperBounds = baseLayer.children[ 0 ].children[ 1 ].bounds;

	baseLayer.removeChildren();
	baseLayer.activate();

	cropperBounds.point -= CropperTopLeft;
	var baseCropper = new Cropper( cropperBounds );
	var baseViewer = new Viewer( baseCropper );
	var baseCommands = new Commands( baseCropper );
	var baseColorizer1 = new Colorizer( [{
		filter: "brightness",
		yPos: 30,
		startValue: 0.5,
		camanValue: function( value ) { return ( value-0.5 )*200; },
	},{
		filter: "saturation",
		yPos: 100,
		startValue: 0.5,
		camanValue: function( value ) { return ( value-0.5 )*200; },
	},{
		filter: "hue",
		yPos: 170,
		startValue: 0.0,
		camanValue: function( value ) { return value * 100; },
	}] );
	var baseColorizer2 = new Colorizer( [{
		filter: "sharpen",
		yPos: 30,
		startValue: 0.0,
		camanValue: function( value ) { return value * 100; },
	},{
		filter: "stackBlur",
		yPos: 100,
		startValue: 0.0,
		camanValue: function( value ) { return value * 100; },
	},{
		filter: "sepia",
		yPos: 170,
		startValue: 0.0,
		camanValue: function( value ) { return value * 100; },
	}] );

	baseColorizer1.hide();
	baseColorizer2.hide();

	project.layers[ project.layers.length-2 ].activate();
} else {
	var baseLayer = project.activeLayer;
	var baseCropper = new Cropper();
	var baseViewer = new Viewer( baseCropper );
	var baseCommands = new Commands( baseCropper );
	var baseColorizer1 = new Colorizer( [{
		filter: "brightness",
		yPos: 30,
		startValue: 0.5,
		camanValue: function( value ) { return ( value-0.5 )*200; },
	},{
		filter: "saturation",
		yPos: 100,
		startValue: 0.5,
		camanValue: function( value ) { return ( value-0.5 )*200; },
	},{
		filter: "hue",
		yPos: 170,
		startValue: 0.0,
		camanValue: function( value ) { return value * 100; },
	},{
		filter: "contrast",
		yPos: 240,
		startValue: 0.5,
		camanValue: function( value ) { return ( value-0.5 )*200; },
	}] );
	var baseColorizer2 = new Colorizer( [{
		filter: "sharpen",
		yPos: 30,
		startValue: 0.0,
		camanValue: function( value ) { return value * 100; },
	},{
		filter: "stackBlur",
		yPos: 100,
		startValue: 0.0,
		camanValue: function( value ) { return value * 100; },
	},{
		filter: "sepia",
		yPos: 170,
		startValue: 0.0,
		camanValue: function( value ) { return value * 100; },
	}] );
	baseColorizer1.hide();
	baseColorizer2.hide();

	var activeLayer = new Layer();
/*
	// Action 1
	var tmp = new Raster( "fred" );
	raster = tmp.clone();
	tmp.remove();
	raster.position = new Point( 300, 300 );
	raster.scale( 1.0 );
	raster.rotate( 0 );
	raster.selected = false;

	Do.startTransaction( raster );
	for ( var i = 80 ; i < 100 ; i++ ) for ( var j = 80 ; j < 100 ; j++ )
		raster.setPixel( i, j, new Color( 1, 1, 0.5 ) );
	Do.commit( new Rectangle( 80, 80, 20, 20 ) );

	Do.startTransaction( raster );
	for ( var i = 100 ; i < 190 ; i++ ) for ( var j = 10 ; j < 100 ; j++ )
		raster.setPixel( i, j, new Color( 1, 0, 0.5 ) );
	Do.commit( new Rectangle( 100, 10, 90, 90 ) );

	Do.startTransaction( raster );
	for ( var i = 30 ; i < 120 ; i++ ) for ( var j = 0 ; j < 90 ; j++ )
		raster.setPixel( i, j, new Color( 0, 0, 0.5 ) );
	Do.commit( new Rectangle( 30, 0, 90, 90 ) );

	Do.startTransaction( raster );
	for ( var i = 70 ; i < 90 ; i++ ) for ( var j = 40 ; j < 60 ; j++ )
		raster.setPixel( i, j, new Color( 0, 1, 1, 0 ) );
	Do.commit( new Rectangle( 30, 0, 90, 90 ) );

	var circle1 = Do.execute( "Path", "Circle", new Point( 250, 150 ), 30 )
	circle1.strokeColor = new Color( 0, 0, 0, 1 );
	var circle2 = Do.execute( "Path", "Circle", new Point( 350, 150 ), 30 )
	circle2.strokeColor = new Color( 0, 0, 0, 1 );

	Do.execute( circle2, "strokeColor", new Color( 0, 1, 0, 1 ) );
	Do.execute( circle2, "strokeColor", "red" );
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

function onMouseMove( event ) {
	if ( baseViewer ) baseViewer.onMouseMove( event );

	if ( baseCommands.rubberCircle ) {
		baseCommands.rubberCircle.position = event.point;
	}

	var hitResult = project.activeLayer.hitTest( event.point, {
		bounds: true,
		selected: true,
		tolerance: 5
	} );

	// No hit, nothing to do
	if ( !hitResult ) {
		if ( baseCommands.cursorMode ) {
			document.body.style.cursor = baseCommands.cursorShape;
			baseCommands.cursorMode = null;
		}
		return;
	}

	if ( hitResult.type === "bounds" ) {
		var c = baseCommands.resizeMode === COMMAND_ROTATE? "cur_rotate.png" : "cur_resize.png";

		document.body.style.cursor = "url( 'static/img/"+c+"' ) 11 11, auto";
		baseCommands.cursorMode = "bounds";
		baseCropper.setCursor( null );
	} else {
		if( baseCropper.getCursor() !== "resize" ) document.body.style.cursor = baseCommands.cursorShape;
	}
};

function onMouseDown( event ) {

	segment = item = moveItem = null;

	if( baseCropper.getCursor() === "resize" ) return; 

	//////////////////////////////////////////////////////////////////////////////
	// Checking for selected items
	// If rubber is active and raster item is selected, take this
	if ( baseCommands.commandMode === "rubber" &&
		project.selectedItems.length === 1 &&
		project.selectedItems[ 0 ].className === "Raster" ) {

		var hitResult = {
			type: "pixel",
			item: project.selectedItems[ 0 ],
			location: event.point
		}
	} else if ( baseCommands.commandMode === "pipette" ) {
		var ctx = baseViewer.getCtx(),
			data = ctx.getImageData( event.point.x, event.point.y, 1, 1 ).data,
			color = new Color( data[ 0 ]/255, data[ 1 ]/255, data[ 2 ]/255, data[ 3 ]/255 );

		Do.execute( {
			action: "Pipette",
			color: color
		} );
		return;
	} else {
		// check if selected item was hit
		var hitResult = project.activeLayer.hitTest( event.point, {
			selected: true,
			bounds: true,
			fill: true,
			tolerance: 5
		} );
	}

	// Checking for unselected items
	if ( !hitResult ) {
		hitResult = project.activeLayer.hitTest( event.point, {
			selected: false,
			bounds: true,
			fill: true,
			tolerance: 5
		} );
	}

	if ( !hitResult ) {
		if ( baseCropper.getRect().contains( event.point ) ) {
			setTimeout( function() {
				Base.each( project.selectedItems, function( item ) {$( "#page-paper" ).trigger( "itemDeselected", { item: item, join: false } ); } );
			}, 0 );

			Do.execute( {
				item: null,
				action: "Select"
			} );
		}
		return;
	}

	item = hitResult.item;
	item.hasBeenSelected = item.selected;
	if ( !item.hasBeenSelected ) {
		Do.execute( {
			item: item,
			action: "Select"
		} );
		$( "#page-paper" ).trigger( "itemSelected", { item: item } );
	}

	switch ( hitResult.type ) {

	case "bounds":
		var position = hitResult.item.position,
			point = hitResult.point;

		startRotation = Math.atan2( event.point.y - position.y, event.point.x - position.x ) * 180 / Math.PI;
		grabPoint = {
			bounds: 	   hitResult.item.bounds,
			point: 		   point,
			oppPoint: 	   point + ( position - point )*2,
			startRotation: startRotation,
			rotation: 	   startRotation,
			item: 	  	   hitResult.item,
			name: 		   Base.camelize( hitResult.name ),
		}
		break;

	case "segment":
		segment = hitResult.segment;
		break;

	case "stroke":
		var location = hitResult.location;
		segment = item.insert( location.index + 1, event.point );
		item.smooth();
		break;

	case "pixel":
		if ( baseCommands.commandMode === "rubber" ) {

			item = baseCommands.cropRaster( item );
			item.selected = true;

			var ctx = item.getContext();

			Do.startTransaction( item );
			baseCommands.rubberMask = ctx.createImageData( item.size.width, item.size.height );
			baseCommands.rubberDirtyRect = null;
			baseCommands.drawRubberData( item, event.point );
			break;
		}
		// fall through if not COMMAND_RUBBER mode ...
	case "fill":
		switch ( baseCommands.commandMode ) {
		case "pointer":
		case "colorizer-1":
		case "colorizer-2":
			moveItem = "Not moved";
			movePosition = item.position;
			break;
		case "pen":
			break;
		case "delete":
			Do.execute( {
				item: item,
				action: "Delete",
				join: item.hasBeenSelected? false : true
			} );
			if ( project.activeLayer.isEmpty() ) {
				$( ".command-pointer" ).trigger( "click" );
			}
			break;
		}
	}

	if ( baseViewer ) baseViewer.onMouseMove( event );
};

function onMouseDrag( event ) {
	var x = event.point.x,
		y = event.point.y;

	if ( baseCommands.rubberCircle ) {
		baseCommands.rubberCircle.position = event.point;
		baseCommands.drawRubberData( item, event.point );
	}

	if ( grabPoint ) {
		function getSpPoint( A, B, C ){
		    var x1 = A.x, y1 = A.y, x2 = B.x, y2 = B.y, x3 = C.x, y3 = C.y;
		    var px = x2-x1, py = y2-y1, dAB = px * px + py * py;
		    var u = ( ( x3 - x1 ) * px + ( y3 - y1 ) * py ) / dAB;
		    var x = x1 + u * px, y = y1 + u * py;
		    return {x:x, y:y}; //this is D
		}

		var b = grabPoint.item.bounds;
		switch ( baseCommands.resizeMode ) {
		case COMMAND_RESIZE:
			var gp = grabPoint,
				point = new Point( getSpPoint( gp.point, gp.oppPoint, event.point ) ),
				zoom = gp.oppPoint.getDistance( point ) / gp.oppPoint.getDistance( gp.point ),
				hor = gp.name.search( /topCenter|bottomCenter/ ) !== -1 && !gp.item.rotation? 1 : zoom,
				ver = gp.name.search( /leftCenter|rightCenter/ ) !== -1 && !gp.item.rotation? 1 : zoom;

			console.log( hor+" : "+ver );
			gp.item.scale( hor, ver, gp.oppPoint );
			gp.point = point;
			break;
		case COMMAND_ROTATE:
			var rotation = Math.atan2( y - b.center.y, x - b.center.x ) * 180 / Math.PI - grabPoint.rotation;

			grabPoint.item.rotate( rotation );
			grabPoint.rotation += rotation;
			break;
		}
	} else if ( segment ) {
		segment.point += event.delta;
		item.smooth();
	} else if ( moveItem ) {
		item.position += event.delta;
		moveItem = "Moved";
	}

	if ( baseViewer ) baseViewer.onMouseMove( event );
};


function onMouseUp( event ) {
	baseCropper.isDragging = false;

	if ( grabPoint ) {

		if ( baseCommands.resizeMode === COMMAND_RESIZE ) {
			Do.execute( {
				item: grabPoint.item,
				action: "Resize",
				bounds: grabPoint.bounds,
			} );
		} else if ( baseCommands.resizeMode === COMMAND_ROTATE ) {
			Do.execute( {
				item: grabPoint.item,
				action: "Rotate",
				rotation: grabPoint.rotation - startRotation
			} );
		}

		grabPoint = null;
	}

	if ( moveItem === "Not moved" && item.hasBeenSelected ) {
		project.deselectAll();
		$( "#page-paper" ).trigger( "itemDeselected", { item: item, join: false } );

		var next = item;
		while( next = next.previousSibling ) {
			if ( next.hitTest( event.point ) ) {
				next.selected = true;
				setTimeout( function() { $( "#page-paper" ).trigger( "itemSelected", { item: next, join: true } ); }, 5 );
				return;
			}
		}
		if ( hitResult = project.hitTest( event.point ) && hitResult && hitResult.item !== item ) {
			hitResult.item.selected = true;
			setTimeout( function() { $( "#page-paper" ).trigger( "itemSelected", { item: hitResult.item, join: true } ); }, 5 );
			return;
		}
	} else if ( moveItem === "Moved" ) {
		Do.execute( {
			item: item,
			action: "Move",
			newPosition: item.position,
			oldPosition: movePosition
		} );
	}

	if ( baseCommands.rubberCircle ) {
		Do.commit( baseCommands.rubberDirtyRect, true );
	}
};

function onFrame() {
};

window.paperOnbeforeunload = function() {
	sessionStorage.paperProject = project.exportJSON();
};