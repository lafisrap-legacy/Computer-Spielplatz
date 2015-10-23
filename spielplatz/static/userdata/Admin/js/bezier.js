var scaleXY = 3,
    translateX = 200,
    translateY = 200,
    buttonSize = 8,
    orgVerts = [
        [ -30,  50, -50,  30, -50,   0],
        [ -50, -30, -30, -50,   0, -50],
        [  30, -50,  50, -30,  50,   0],
        [  50,  30,  30,  50,   0,  50],
    ],
    face = [
        [-19,50.67,-27.67,23.67,-25.33,-2],
		[-24.5,-25.25,-22,-41,4.25,-47],
		[33,-49.33,41,-24.5,37,7],
		[30.75,35.5,16.67,51.67,0,49.75],
    ],
    leftEye = [
		[-8.98,-4.51,-17.05,-4.23,-17.76,-9.19],
		[-18.6,-10.46,-15.92,-13.72,-12,-14],
		[-8.75,-16.25,-3.18,-16.12,1.21,-14.7],
		[3.48,-10.74,1.92,-6.21,-1.9,-4.51],
    ],
    rightEye = [
		[18.83,-5.48,21.92,-7.71,25.9,-10.38],
		[28.3,-12.32,24.7,-14.31,21.23,-14.75],
		[16.23,-16.49,12.65,-15.45,8.7,-14.93],
		[7.37,-11.79,8.53,-7.71,12.48,-5.7],
    ],
    
    verts = rightEye,
    dragging = false;

textSize(5);
rectMode(CENTER);

var normalizeX = function(point) {
    return (point- translateX) / scaleXY;
};

var normalizeY = function(point) {
    return (point - translateY) / scaleXY;
};

var drawShape = function(verts) {
    beginShape();
    vertex(verts[verts.length-1][4], verts[verts.length-1][5]);
    for( var i=0 ; i<verts.length ; i++ ) {
        var v = verts[i];
        bezierVertex(v[0], v[1], v[2], v[3], v[4], v[5]);
    }
    endShape();
};

var draw = function() {

    background(255);
    translate(translateX,translateY);
    scale(scaleXY);
    beginShape();
    stroke(0);
    strokeWeight(1);
    noFill();
    drawShape(verts);

    stroke(150);
    strokeWeight(1);
    noFill();
    var shapes = [face, leftEye, rightEye];
    for( var i=0 ; i<shapes.length ; i++ ) {
        if( shapes[i] !== verts ) {
            drawShape(shapes[i]);
        } 
    }

    for( var i=0 ; i<verts.length ; i++ ) {
        var v = verts[i];
        for( var j=0 ; j<6 ; j+=2 ) {
            if( mouseIsPressed ) {
                var x = normalizeX(mouseX),
                    y = normalizeY(mouseY),
                    bs = buttonSize/scaleXY;
                if( !dragging &&
                    x >= v[j]-bs/2 && x <= v[j]+bs/2 && 
                    y >= v[j+1]-bs/2 && y <= v[j+1]+bs/2 ) {
                    dragging = { i:i, j:j };
                }
            } else {
                if( dragging ) {
                    var code1 = "",
                        code2 = "";
                    for( var i1 = 0 ; i1<verts.length ; i1++ ) {
                        var v = verts[i1];
                        
                        code1 += "bezierVertex(";
                        code2 += "\t\t[";
                        for( var j1=0 ; j1<6 ; j1+=2 ) {
                            var c = (round(v[j1]*100)/100)+","+(round(v[j1+1]*100)/100); 
                            code1+=c;
                            code2+=c;
                            if( j1<4 ) {
                                code1+=",";
                                code2+=",";
                            }
                        }
                        code1+=");\n";
                        code2+="],\n";
                    }
                    debug(code1);
                    debug(code2);
                    dragging = false; 
                }
            }
            fill(82, 151, 255);
            noStroke();
            rect(v[j],v[j+1],buttonSize/scaleXY,buttonSize/scaleXY);
        }
    }
    
    if( dragging ) {
        if( dragging.i ) {
            verts[dragging.i][dragging.j] = normalizeX(mouseX);
            verts[dragging.i][dragging.j+1] = normalizeY(mouseY);
        } else if( dragging.x ) {
            if( dragging.mode === "translate" ) {
                var distX = normalizeX(mouseX) - dragging.x,
                    distY = normalizeY(mouseY) - dragging.y;
                    
                for( var i=0 ; i<verts.length ; i++ ) {
                    var v = verts[i];                
                    for( var j=0 ; j<v.length ; j+=2 ) {
                        v[j]   = dragging.shape[i][j] + distX;
                        v[j+1] = dragging.shape[i][j+1] + distY;
                    }
                }
            } else if( dragging.mode === "scale" ) {
                var zoom = pow( 1.01 , normalizeY(mouseY) - dragging.y );
                debug("Zoom = "+zoom);

                for( var i=0 ; i<verts.length ; i++ ) {
                    var v = verts[i];                
                    for( var j=0 ; j<v.length ; j+=2 ) {
                        v[j]   = dragging.shape[i][j] * zoom;
                        v[j+1] = dragging.shape[i][j+1] * zoom;
                    }
                }
            }
        }
    } else if( mouseIsPressed ) {
        
        var shape = [];
        for( var i=0 ; i<verts.length ; i++ ) {
            var v = verts[i],
                vs = [];
            for( var j=0 ; j<v.length ; j++ ) {
                vs.push(v[j]);
            }
            shape.push(vs);
        }
        dragging = {
            mode: (keyIsPressed && keyCode === SHIFT)? "scale":"translate",
            shape: shape,
            x: normalizeX(mouseX),
            y: normalizeY(mouseY),
        };
    }

    resetMatrix();
};
