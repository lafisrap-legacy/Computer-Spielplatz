var scaleXY = 3,
    translateX = 200,
    translateY = 200,
    buttonSize = 8,
    orgVerts = [
		[-14,13.67,-17,0.67,-9.67,-0.33],
		[-10.33,-6.33,-3.67,-9,-1.67,-1.67],
		[9.28,-1.67,10,1,3,5.67],
		[3.05,10.05,-1.33,11.67,-5,7.33],
	],
    verts = orgVerts,
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
                    debug(dragging);
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
        if( dragging.i !== undefined ) {
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
