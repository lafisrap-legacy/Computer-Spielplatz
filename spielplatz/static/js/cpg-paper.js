////////////////////////////////////////////////////////////////////////
// cpg-paper.js contains the editor logic for the paper edit field
// 

///////////////////////////////////////////////////////
// baseLayer is the layer that contains all objects that
// are not part of an image

var Cropper = Base.extend({
	_class: 'Cropper',
	_minSize: new Size(20, 20),
	_maxSize: new Size(400, 400),
	_offset: new Point(100, 100),
	_margin: new Point(5,5),
	_pos: null,
	_size: null,
	_area: null,
	_rect: null,
	_serializeFields: {

	},
	initialize: function() {
		var self = this;
		this._pos = pos = new Point(0,0);
		this._size = size = this._maxSize;
		this._area = new CompoundPath({
			children: [
				new Path.Rectangle(new Point(0,0), view.bounds.size),
				new Path.Rectangle(this._offset + pos, size),
			],
		  	fillColor: 'black',	
		    opacity: 0.7,
		});
		this._rect = new Path.Rectangle(this._offset - this._margin + pos, size + this._margin*2);
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

var baseLayer = project.activeLayer;
var baseCropper = new Cropper();



////////////////////////////////////////////////////////
// Global functions

//////////////////////////////////////////
// init is called once at the beginning
var init = function() {
	var w = view.bounds.width,
		h = view.bounds.height;

	initCropper();
};

//////////////////////////////////////////
// init is called once at the beginning
var initCropper = function() {
}

var drawLayers = [],
	currentLayer = 0;
drawLayers[0] = new Layer();
drawLayers[0].activate();

var raster = new Raster('fred');
raster.position = view.center;
raster.scale(1);
raster.rotate(0);
raster.selected = false;

drawLayers[0].visible = false;
drawLayers[1] = new Layer();
drawLayers[1].activate();
currentLayer = 1;

var raster = new Raster('fred');
raster.position = view.center;
raster.scale(1);
raster.rotate(0);
raster.selected = false;


console.log(project.layers, projects);

var hitOptions = {
	segments: true,
	stroke: true,
	fill: true,
	tolerance: 5
};

baseLayer.bringToFront();

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

function onMouseUp(event) {
	console.log("Global: "+baseCropper.isDragging);
	baseCropper.isDragging = false;
}

init();
