
var raster = new Raster('fred');
raster.position = view.center;
raster.scale(1);
raster.rotate(0);
raster.selected = false;

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
	var hitResult = project.hitTest(event.point, hitOptions);
	if (!hitResult)
		return;

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

function onMouseDrag(event) {
	if (segment) {
		segment.point += event.delta;
		path.smooth();
	} else if (path) {
		path.position += event.delta;
	}
}