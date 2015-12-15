////////////////////////////////////////////////////////////////////////
// cpg-paper.js contains the editor logic for the paper edit field
// 

////////////////////////////////////////////////////////////////////////
// ImageLayer is the base class for image files
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
	_offset: CropperOffset,
	_margin: new Point(5,5),
	_point: null,
	_size: null,
	_area: null,
	_rect: null,
	_serializeFields: {

	},
	initialize: function(rect) {
		var self = this,
			rect = rect || new Rectangle(new Point(0,0), this._maxSize);

		this._point = point = rect.getPoint();
		this._size = size = rect.getSize();
		this._area = new CompoundPath({
			children: [
				new Path.Rectangle(new Point(0,0), view.bounds.size),
				new Path.Rectangle(this._offset + point, size),
			],
		  	fillColor: 'black',	
		    opacity: 0.7,
		});
		this._rect = new Path.Rectangle(this._offset - this._margin + point, size + this._margin*2);
		this._rect.strokeWidth = 10;
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
		console.log("mouseMove: "+this.isDragging);
		if( this.isDragging ) return;

		var rect = this._rect.bounds,
			point = event.point - rect.point,
			width = this._rect.strokeWidth;

		if( point.x < width && point.y < width ||
			point.x > rect.width-width && point.y > rect.height-width ) { 
			var cursor = "nwse-resize";
			this._rect.moveX = point.x < width? 1:2;
			this._rect.moveY = point.y < width? 1:2;
		} else if( point.x < width && point.y > rect.height-width ||
			point.x > rect.width-width && point.y < width ) { 
			var cursor = "nesw-resize";
			this._rect.moveX = point.x < width? 1:2;
			this._rect.moveY = point.y < width? 1:2;
		} else if( point.x < width || point.x > rect.width-width ) {
			var cursor = "ew-resize";
			this._rect.moveX = point.x < width? 1:2;
			this._rect.moveY = 0;
		} else { 
			var cursor = "ns-resize";
			this._rect.moveX = 0;
			this._rect.moveY = point.y < width? 1:2;
		}

		this._rect.moveOffset = new Point( (point.x < width? width-point.x - width/2 : -width + rect.width - point.x + width/2),
										   (point.y < width? width-point.y - width/2 : -width + rect.height - point.y + width/2));
		document.body.style.cursor = cursor;
	},
	onMouseLeave: function(event) {
		document.body.style.cursor = "default";		
	},
	onMouseUp: function(event) {
		document.body.style.cursor = "default";		
	}
});


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
		if( this._actionPointer < this._actions.length ) {
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

	project.layers[project.layers.length-2].activate();
} else {
	var baseLayer = project.activeLayer;
	var baseCropper = new Cropper();
	var activeLayer = new ImageLayer();

	// Action 1	
	var tmp = new Raster('fred');
	raster = tmp.clone();
	tmp.remove();
	raster.position = view.center;
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
	//UM.undo();
	//UM.undo();
	//UM.undo();
	//UM.undo();
	//UM.undo();
	//UM.undo();
	//UM.undo();
	//UM.undo();

	//UM.redo();
	//UM.redo();
	//UM.redo();
	//UM.redo();
	//UM.redo();
	//UM.redo();
	//UM.redo();
	//UM.redo();
	//UM.redo();
}

baseLayer.bringToFront();

/*
var hitOptions = {
	segments: true,
	stroke: true,
	fill: true,
	tolerance: 5
};

var segment, path;
var movePath = false;
function onMouseDown(event) {
	segment = path = null;
	var hitResult = project.activeLayer.hitTest(event.point, hitOptions);
	if (!hitResult )
		return ;

	hitResult.item.selected = true;

	path = hitResult.item;
	if (hitResult.type == 'segment') {
		segment = hitResult.segment;
	} else if (hitResult.type == 'stroke') {
		var location = hitResult.location;
		segment = path.insert(location.index + 1, event.point);
		path.smooth();
	}
	movePath = hitResult.type == 'fill';
	if (movePath)
		project.activeLayer.addChild(hitResult.item);
}

function onMouseMove(event) {
//	var hitResult = baseCropper.hitTest(event.point, baseCropper.hitOptions);
}


function onMouseDrag(event) {
	if (segment) {
		segment.point += event.delta;
		path.smooth();
	} else if (path) {
		path.position += event.delta;
	}
}
*/

function onMouseUp(event) {
	console.log("Global: "+baseCropper.isDragging);
	baseCropper.isDragging = false;
}

window.paperOnbeforeunload = function() {
	sessionStorage.paperProject = project.exportJSON();
}

