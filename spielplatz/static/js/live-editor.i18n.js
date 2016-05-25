var translations = {
	"No sound file provided." : "Du hast keine Sound-Datei angegeben.",
	"Unexpected character." : "Unerwartetes Zeichen.",
	"Parser error." : "Fehler beim Interpretieren des Programms.",
	"This program uses capabilities we've turned off for security reasons. Khan Academy prohibits showing external images, playing external sounds, or displaying pop-ups." :
		"Dieses Programm verwendet Funktionen, die wir aus Sicherheitsgründen abgteschaltet haben. Khan Academy verbietet die Anzeige von externen Bildern, extermem Sound und von Pop-Ups.",
	"Expected function call to '%(name)s' was not made." : "Ich habe einen Funktionsaufruf von '%(name)s' erwartet, der nicht stattgefunden hat.",
	"Correct function call made to %(name)s." : "Die Funktion %(name)s wurde korrekt aufgerufen.",
	"Expected '%(name)s' to be a valid variable name." : "Ich habe erwartet, dass '%(name)s' ein gültiger Variablenname ist.",
	"Expected either '%(first)s' or '%(second)s' to be a valid variable name." : "Ich habe erwartet, dass entweder '%(first)s' oder '%(second)s' ein gültiger Variablenname ist.",
	"Syntax error!" : "Syntaxfehler!",
	"If you want to define a function, you should use \"var %(name)s = function() {}; \" instead!" :
		"Wenn du eine Funktion definieren willst, solltest du \"var %(name)s = function() {}; \" schreiben!",
	"%(word)s is a reserved word." : "%(word)s ist ein reserviertes Wort.",
	"Did you mean to type \"%(keyword)s\" instead of \"%(word)s\"?" : "Wolltest du \"%(keyword)s\" anstatt \"%(word)s\" schreiben?",
	"In case you forgot, you can use it like \"%(usage)s\"" : "Falls du das vergessen hast, du kannst es auch so verwenden: \"%(usage)s\"",
	"Did you forget a space between \"var\" and \"%(variable)s\"?" : "Hast du ein Leerzeichen zwischen \"var\" und \"%(variable)s\" vergessen?",
	"You can't end a line with \"=\"" : "Du kannst eine Zeile nicht mit \"=\" enden lassen.",
	"It looks like you have an extra \")\"" : "Es sieht so aus, als hättest du eine \")\" zuviel.",
	"It looks like you are missing a \")\" - does every \"(\" have a corresponding closing \")\"?" :
		"Es sieht so aus, als würde eine \")\" fehlen - hat jede \"(\" eine passende \")\"?",
	"%(name)s takes 1 parameter, not %(given)s!" : "%(name)s benötigt einen Parameter, nicht %(given)s!", 
	"%(name)s takes %(num)s parameters, not %(given)s!" : "%(name)s benötigt %(num)s Parameter, nicht %(given)s!",
	"or" : "oder",
	"%(name)s takes %(list)s parameters, not %(given)s!" : "%(name)s benötigt %(list)s Parameter, nicht %(given)s!",
	"It looks like you're trying to use %(name)s. In case you forgot, you can use it like: %(usage)s" :
		"Es sieht so aus, als wolltest du %(name)s verwenden. Falls du vergessen hast, du kannst das so verwenden: %(usage)s",
	"Image '%(file)s' was not found." : "Ich kann das Bild '%(file)s' nicht finden.",
	"Sound '%(file)s' was not found." : "Ich kann den Sound '%(file)s' nicht finden.",
	"\"%(word)s\" is not defined. Maybe you meant to type \"%(keyword)s\"" :
		"\"%(word)s\" ist nicht definiert. Wolltest du \"%(keyword)s\" schreiben?",
	"Error: %(message)s" : "Fehler: %(message)s",
	"A critical problem occurred in your program making it unable to run." : "Es ist ein Problem aufgetreten, dein Programm kann nicht starten.",

	///////////////////////////////////////
	// Translations for mouse over hints
	"keyword":
"",
	"function":"Funktion",
	"Draws a rectangle, using the first two coordinates as the top left corner and the last two as the width/height. For alternate ways to position, see rectMode.":
		"Zeichnet ein Rechteck, wobei die ersten beiden Koordinaten die linke obere Ecke bezeichnen und die beiden anderen die Breite und die Höhe. Um die Position zu ändern, siehe rectMode().",
	"x: the x-coordinate of the top left corner":
		"x: Die x-Koordinate der linken oberen Ecke",
	"y: the y-coordinate of the top left corner": 
		"y: Die y-Koordinate der linken oberen Ecke",
	"width: the width of the rectangle":
		"width: Die Breite des Rechtecks",
	"height: the height of the rectangle":
		"height: Die Höhe des Rechtecks",
	"radius:(Optional) the radius of the corners, to round the rectangle": 
		"radius: (optional) Der Radius der Ecken des Rechtecks",
	"Draws an ellipse, using the first two parameters as the center coordinates and the last two as the width/height. For alternate ways to position, see ellipseMode.":
		"Zeichnet ein Rechteck, wobei die ersten beiden Koordinaten die linke obere Ecke bezeichnen und die beiden anderen die Breite und die Höhe. Um die Position zu ändern, siehe rectMode().",
	"x: the x-coordinate of the center":
		"x: Die x-Koordinate des Mittelpunkts",
	"y: the y-coordinate of the center":
		"y: Die y-Koordinate des Mittelpunkts",
	"width: the width of the ellipse":
		"width: Die Breite der Ellipse",
	"height: the height of the ellipse":
		"width: Die Höhe der Ellipse",
	"Draws a triangle": "Zeichnet ein Dreieck.",
	"x1: the x-coordinate of the first vertex":
		"x1: Die x-Koordinate des ersten Eckpunkts",
	"y1: the y-coordinate of the first vertex":
		"y1: Die y-Koordinate des ersten Eckpunkts",
	"x2: the x-coordinate of the second vertex":
		"x2: Die x-Koordinate des zweiten Eckpunkts",
	"y2: the y-coordinate of the second vertex":
		"y2: Die y-Koordinate des zweiten Eckpunkts",
	"x3: the x-coordinate of the third vertex":
		"x3: Die x-Koordinate des dritten Eckpunkts",
	"y3: the y-coordinate of the third vertex":
		"y3: Die y-Koordinate des dritten Eckpunkts",
	"Draws a line from one point to another. The color of the line is determined by the most recent stroke() call. The thickness of the line is determined by the most recent strokeWeight() call. The line ending style can be changed using strokeCap().":
		"Zeichnet eine Linie. Die Farbe der Linie wird bestimmt vom letzten, vorangehenden stroke()-Aufruf, die Dicke der Linie durch den letzten, vorangehenden strokeWeight()-Aufruf und die Linienenden durch den letzten strokeCap()-Aufruf.",
	"x1: the x-coordinate of the first point":
		"x1: Die x-Koordinate des ersten Punkts",
	"y1: the y-coordinate of the first point":
		"y1: Die y-Koordinate des ersten Punkts",
	"x2: the x-coordinate of the second point":
		"x2: Die x-Koordinate des zweiten Punkts",
	"y2: the y-coordinate of the second point":
		"y2: Die y-Koordinate des zweiten Punkts",
	"Draws a point. The color is determined by the most recent stroke() call and the thickness is determined by the most recent strokeWeight() call.":
		"Zeichnet einen Punkt. Die Farbe der Linie wird bestimmt vom letzten, vorangehenden stroke()-Aufruf und die Dicke der Linie durch den letzten, vorangehenden strokeWeight()-Aufruf.",
	"x: the x-coordinate of the point":
		"x: Die x-Koordinate des Punkts",
	"y: the y-coordinate of the point":
		"y: Die y-Koordinate des Punkts",
	"Draws an arc.   It is very similar to an ellipse(), except that the final two parameters, start and stop, decide how much of the ellipse to draw.":
		"Zeichnet einen Ellipsenausschnitt (Kuchenstück). Es ist sehr ählich wie der ellipse()-Befehl. Es kommen am Ende nur zwei Parameter hinzu, start und stop, die angeben, von welchem Winkel bis zu welchem das Kuchenstück gezeichnet werden soll.",
	"x: The x-coordinate of the center of the complete ellipse derived from the arc":
		"Die x-Koordinate des Mittelpunkts der Ellipse, die dem Ellipsenausschnitt zugrunde liegt.",
	"y: The y-coordinate of the center of the complete ellipse derived from the arc":
		"Die y-Koordinate des Mittelpunkts der Ellipse, die dem Ellipsenausschnitt zugrunde liegt.",
	"width: The width of the complete ellipse formed by the partial arc":
		"Die Breite der Ellipse, die dem Ellipsenausschnitt zugrunde liegt.",
	"height: The height of the complete ellipse formed by the partial arc":
		"Die Höhe der Ellipse, die dem Ellipsenausschnitt zugrunde liegt.",
	"start: The angle to start the arc at":
		"Der Startwinkel des Ellipsenausschnitts (0-360).",
	"stop: The angle to stop the arc at":
		"Der Endwinkel des Ellipsenausschnitts (0-360).",
	"Draws a bezier curve. To extract points and tangents after drawing the curve, use bezierPoint() and bezierTangent.":
		"Zeichnet eine Bezier-Kurve. Um einen Punkt auf der Kurve zu bestimmen, verwende bezierPoint(), für eine Tangente bezierTangent().",
	"x1: the x-coordinate of the first endpoint":
		"x1: Die x-Koordinate des ersten Endpunkts",
	"y1: the y-coordinate of the first endpoint":
		"y1: Die y-Koordinate des ersten Endpunkts",
	"cx1: the x-coordinate of the first control point":
		"cx1: Die x-Koordinate des ersten Kontrollpunkts",
	"cy1: the y-coordinate of the first control point":
		"cy1: Die y-Koordinate des ersten Kontrollpunkts",
	"cx2: the x-coordinate of the second control point":
		"cx2: Die x-Koordinate des zweiten Kontrollpunkts",
	"cy2: the y-coordinate of the second control point":
		"cy2: Die y-Koordinate des zweiten Kontrollpunkts",
	"x2: the x-coordinate of the second endpoint":
		"x2: Die x-Koordinate des zweiten Endpunkts",
	"y2: the y-coordinate of the second endpoint":
		"y2: Die y-Koordinate des zweiten Endpunkts",
	"Draws any quadrilateral, with the points listed as parameters in a clockwise or counter-clockwise direction.":
		"Zeichnet ein Viereck, mit den vier mal zwei Eckpunkt-Koordinaten.",
	"x1: the x-coordinate of the first vertex":
		"x1: Die x-Koordinate des ersten Eckpunkts",
	"y1: the y-coordinate of the first vertex":
		"y1: Die y-Koordinate des ersten Eckpunkts",
	"x2: the x-coordinate of the second vertex":
		"x2: Die x-Koordinate des zweiten Eckpunkts",
	"y2: the y-coordinate of the second vertex":
		"y2: Die y-Koordinate des zweiten Eckpunkts",
	"x3: the x-coordinate of the third vertex":
		"x3: Die x-Koordinate des dritten Eckpunkts",
	"y3: the y-coordinate of the third vertex":
		"y3: Die y-Koordinate des dritten Eckpunkts",
	"x4: the x-coordinate of the fourth vertex":
		"x4: Die x-Koordinate des vierten Eckpunkts",
	"y4: the y-coordinate of the fourth vertex":
		"y4: Die y-Koordinate des vierten Eckpunkts",
	"Draw an image on the canvas. The only allowed images are those that popup in the image picker when you use the getImage() method. The image is positioned using the x/y as the upper left corner. For alternate ways to position images, see imageMode.":
		"Zeichne ein Bild auf der Leinwand (canvas). Es sind nur Bilder erlaubt, die in der Bildauswahl erscheinen, wenn du die getImage()-Methode aufrufst.",
	"image: an image returned by getImage()":
		"image: Ein Bild, das du mit getImage() bekommen kannst.",
	"width: (Optional) the width of the drawn image":
		"width: (optional) Die Breite des Bildes",
	"height: (Optional) the height of the drawn image":
		"height: (optional) Die Höhe des Bildes",
	"Plays a short sound. The only allowed sounds are those that popup in the picker when you use the getSound() method.":
		"spielt einen kurzen Sound. Es sind nur Sounds erlaubt, die im Popup erscheinen, wenn du die getSound()-Methode aufrufst.",
	"sound: a sound returned by getSound()":
		"sound: ein Sound, den du mit getSound() bekommen kannst.",
	"Modifies the location from which rectangles draw.":
		"Verändert die Art wie Rechtecke gezeichnet werden (Standard: CORNER = linke, obere Ecke)",
	"MODE: The mode, either CORNER, CORNERS, CENTER, or RADIUS. The default is CORNER.":
		"MODE: Der Modus, entweder CORNER (linke, obere Ecke), CORNERS (zwei Punkte), CENTER (Mittelpunkt), RADIUS (Breite und Höhe halbiert)",
	"Changes how ellipses are drawn.":
		"Verändert die Art wie Ellipsen gezeichnet werden (Standard: CENTER = Mittelpunkt)",
	"MODE: The mode, either CORNER, CORNERS, CENTER, or RADIUS. The default is CENTER.":
		"MODE: Der Modus, entweder CORNER (linke, obere Ecke des umgebenden Rechtecks), CORNERS (zwei Punkte), CENTER (Mittelpunkt), RADIUS (Breite und Höhe halbiert)",
	"Modifies the location from which images are drawn.":
		"Verändert den Postionspunkt von dem aus gezeichnet wird (Standard: CORNER = linke, obere Ecke)",
	"MODE: Either CENTER, CORNERS, or CORNER. The default is CORNER.":
		"MODE: Der Modus, entweder CORNER (linke, obere Ecke), CORNERS (zwei Punkte), CENTER (Mittelpunkt)",
	"Evaluates the Bezier at point t for points a, b, c, d. The parameter t varies between 0 and 1, a and d are points on the curve, and b and c are the control points. This can be done once with the x coordinates and a second time with the y coordinates to get the location of a bezier curve at t.":
		"Bestimmt den Bezier-Wert an Punkt t für die Punkte a, b, c, d. Der Parameter t bewegt sich zwischen 0 und 1, a und d sind der Anfangs- und der Endpunkt auf der Kurve und b und c sind Kontrollpunkte. Mit der Funktion kann man einmal die x-Koordinate bestimmen und einmal die y-Koordinate.",
	"a: coordinate of first point on the curve":
		"a: Koordinate des ersten Punkts auf der Kurve",
	"b: coordinate of first control point":
		"b: Koordinate des ersten Kontrollpunkts",
	"c: coordinate of second control point":
		"c: Koordinate des zweiten Kontrollpunkts",
	"d: coordinate of second point on the curve":
		"d: Koordinate des zweiten Punkts auf der Kurve",
	"t: value between 0 and 1":
		"t: Wert zwischen 0 und 1",
	"Calculates the tangent of a point on a bezier curve. The parameter t varies between 0 and 1, a and d are points on the curve, and b and c are the control points. This can be done once with the x coordinates and a second time with the y coordinates to get the tangent of a bezier curve at t.":
		"Berechnet die Tangente eines Punkts auf einer Bezierkurve. Der Parameter t bewegt sich zwischen 0 und 1, a und d sind der Anfangs- und der Endpunkt auf der Kurve und b und c sind Kontrollpunkte. Mit der Funktion kann man einmal den Tangentwert der x-Koordinaten bestimmen und einmal den der y-Koordinaten. Mit atan2() kann man dann aus x und y einen Winkel berechnen.",
	"a: coordinate of first point on the curve":
		"a: Koordinate des ersten Punkts auf der Kurve",
	"b: coordinate of first control point":
		"b: Koordinate des ersten Kontrollpunkts",
	"c: coordinate of second control point":
		"c: Koordinate des zweiten Kontrollpunkts",
	"d: coordinate of second point on the curve":
		"d: Koordinate des zweiten Punkts auf der Kurve",
	"t: value between 0 and 1":
		"t: Wert zwischen 0 und 1",
	"Used in conjunction with beginShape() and endShape() to draw shapes with bezier curves for sides. Each call to bezierVertex() defines the position of two control points and one anchor point of a Bezier curve, adding a new segment to a line or shape. The first time bezierVertex() is used within a beginShape() call, it must be prefaced with a call to vertex() to set the first anchor point. When using this function, do *not* specify a mode in beginShape().":
		"Wird zusammen mit beginShape() und endShape() verwendet, um Figuren mit bezier-Kurven zu zeichnen. Jeder Aufrufe von bezierVertex() fügt zwei Kontrollpunkte und einen Ankerpunkt zu der Bezier-Kurve hinzu.",
	"cx1: The x-coordinate of 1st control point":
		"cx1: Die x-Koordinate des ersten Kontrollpunkts",
	"cy1: The y-coordinate of 1st control point":
		"cy1: Die y-Koordinate des ersten Kontrollpunkts",
	"cx2: The x-coordinate of 2nd control point":
		"cx2: Die x-Koordinate des zweiten Kontrollpunkts",
	"cy2: The y-coordinate of 2nd control point":
		"cy2: Die y-Koordinate des zweiten Kontrollpunkts",
	"x: The x-coordinate of anchor point":
		"x: Die x-Koordinate des Ankerpunkts",
	"y: The y-coordinate of anchor point":
		"y: Die y-Koordinate des Ankerpunkts",
	"Draws a curved line on the screen. The first and second parameters specify the first anchor point and the last two parameters specify the second anchor. The middle parameters specify the points for defining the shape of the curve. Longer curves can be created by putting a series of curve() functions together. An additional function called curveTightness() provides control for the visual quality of the curve. The curve() function is an implementation of Catmull-Rom splines.":
		"Zeichnet eine Kurve auf die Leinwand. Die ersten beiden Parameter bestimmen den ersten Ankerpunkt und die letzten beiden den zweiten. Die mittleren Parameter bestimmen die die Form der Kurve. Längere Kurven können erzeugt werden, indem man mehrere curve() functionen aneinanderreiht. Mit curveTightness() kann man das Aussehen der Kurve verändern. Die curve()-funktion implementiert die Catmull-Rom Splines.",
	"x1: the x coordinate of first anchor point":
		"x1: Die x-Koordinate des ersten Ankerpunkts",
	"y1: the y coordinate of first anchor point":
		"y1: Die y-Koordinate des ersten Ankerpunkts",
	"x2: the x coordinate of first point":
		"x2: Die x-Koordinate des ersten Punkts",
	"y2: the y coordinate of first point":
		"y2: Die y-Koordinate des ersten Punkts",
	"x3: the x coordinate of second point":
		"x3: Die x-Koordinate des zweiten Punkts",
	"y3: the y coordinate of second point":
		"y3: Die y-Koordinate des zweiten Punkts",
	"x4: the x coordinate of second anchor point":
		"x4: Die x-Koordinate des zweiten Ankerpunkts",
	"y4: the y coordinate of second anchor point":
		"y4: Die y-Koordinate des zweiten Ankerpunkts",
	"Evalutes the curve at point t for points a, b, c, d. The parameter t varies between 0 and 1, a and d are points on the curve, and b and c are the control points. This can be done once with the x coordinates and a second time with the y coordinates to get the location of a curve at t.":
		"Bestimmt die Koordinate an Punkt t für die Punkte a, b, c, d. Der Parameter t bewegt sich zwischen 0 und 1, a und d sind die Punkte auf der Kurve und b und c sind Kontrollpunkte. Mit der Funktion kann man einmal die x-Koordinate bestimmen und einmal die y-Koordinate.",
	"a: the coordinate of the first point":
		"a: Die Koordinate des ersten Punkts",
	"b: the coordinate of the first control point":
		"b: Die Koordinate des ersten Kontrollpunkts",
	"c: the coordinate of the second point":
		"c: Die Koordinate des zweiten Kontrollpunkts",
	"d: the coordinate of the second point":
		"d: Die Koordinate des zweiten Punkts",
	"t: the a value between 0 and 1":
		"t: Wert zwischen 0 und 1",
	"Calculates the tangent at a point the curve. The parameter t varies between 0 and 1, a and d are points on the curve, and b and c are the control points. This can be done once with the x coordinates and a second time with the y coordinates to get the tangent of a curve at t.":
		"Berechnet die Tangente eines Punkts auf einer Kurve. Der Parameter t bewegt sich zwischen 0 und 1, a und d sind der Anfangs- und der Endpunkt auf der Kurve und b und c sind Kontrollpunkte. Mit der Funktion kann man einmal den Tangentwert der x-Koordinaten bestimmen und einmal den der y-Koordinaten. Mit atan2() kann man dann aus x und y einen Winkel berechnen.",
	"a: the coordinate of the first point":
		"a: Koordinate des ersten Punkts auf der Kurve",
	"b: the coordinate of the first control point":
		"b: Koordinate des ersten Kontrollpunkts",
	"c: the coordinate of the second point":
		"c: Koordinate des zweiten Kontrollpunkts",
	"d: the coordinate of the second point":
		"d: Koordinate des zweiten Punkts auf der Kurve",
	"t: the a value between 0 and 1":
		"t: Wert zwischen 0 und 1",
	"Modifies the quality of forms created with curve() and curveVertex(). The tightness parameter determines how the curve fits to the vertex points.":
		"Verändert die Qualität den Formen, die mit curve() und curveVertex() gezeichnet werden. Der tightness-Parameter bestimmt wie die Kurve an die Vertext-Punkte (x/y-Koordinaten-Paar) angepasst wird.",
	"tightness: amount of deformation from the original vertices":
		"tightness: Grad der Deformation der Ausgangspunkte",
	"Used in conjunction with beginShape() and endShape() to draw shapes with bezier curves for sides. The first and last points in a series of curveVertex() lines will be used to guide the beginning and end of a the curve.":
		"Wird zusammen mit beginShape() und endShape() verwendet, um Formen mit Kurven zu zeichnen. Der erste und letzte Punkt einer Serie von curveVertex() Linien wird als Anfang und Ende der Kurve verwendet.",
	"x: the x-coordinate of the vertex":
		"x: Die x-Koordinate des Koordinaten-Paars",
	"y: the y-coordinate of the vertex":
		"y: Die y-Koordinate des Koordinaten-Paars",
	"Using the beginShape() and endShape() functions allow creating more complex forms. To start a form, call beginShape(), then use the vertex() command, then call endShape() to stop. By default, it creates an irregular polygon, but you can control that by sending a mode to beginShape().  Transformations such as translate(), rotate(), and scale() do not work within beginShape(). It is also not possible to use other shapes, such as ellipse() or rect() within beginShape().":
		"beginShape() und endShape() werden verwendet, um komplexere Formen zu erzeugen. Um solch eine Form zu beginnen, rufe beginShape() auf, dann verwende die vertex()-Funktion so oft du willst und dann rufe endShape() auf. Standardmäßig wird ein irreguläres Polygon erzeugt, aber du kannst das durch Wählen eines Modus (mode) ändern. Transformationen wie translate(), rotate() und scale() funktionieren nicht innerhalb von beginShape() / endShape(). Es ist auch nicht möglich, andere Formen zu verwenden wie ellipse() oder rect().",
	"MODE: (Optional) Shape mode. Either POINTS, LINES, TRIANGLES, TRIANGLE_FAN, TRIANGLE_STRIP, QUADS, and QUAD_STRIP":
		"MODE: (optional) Form-Modus. Entweder POINTS, LINES, TRIANGLES, TRIANGLE_FAN, TRIANGLE_STRIP, QUADS, and QUAD_STRIP",
	"Using the beginShape() and endShape() functions allow creating more complex forms. To start a form, call beginShape(), then use the vertex() command, then call endShape() to stop. By default, it creates an irregular polygon, but you can control that by sending a mode to beginShape().  Transformations such as translate(), rotate(), and scale() do not work within beginShape(). It is also not possible to use other shapes, such as ellipse() or rect() within beginShape().":
		"beginShape() und endShape() werden verwendet, um komplexere Formen zu erzeugen. Um solch eine Form zu beginnen, rufe beginShape() auf, dann verwende die vertex()-Funktion so oft du willst und dann rufe endShape() auf. Standardmäßig wird ein irreguläres Polygon erzeugt, aber du kannst das durch Wählen eines Modus (mode) ändern. Transformationen wie translate(), rotate() und scale() funktionieren nicht innerhalb von beginShape() / endShape(). Es ist auch nicht möglich, andere Formen zu verwenden wie ellipse() oder rect().",
	"MODE: (Optional) Specify CLOSE to close the shape.":
		"MODE: (optional) Wähle CLOSE um eine Form abzuschließen.",
	"Using the beginShape() and endShape() functions allow creating more complex forms. To start a form, call beginShape(), then use the vertex() command, then call endShape() to stop. By default, it creates an irregular polygon, but you can control that by sending a mode to beginShape().  Transformations such as translate(), rotate(), and scale() do not work within beginShape(). It is also not possible to use other shapes, such as ellipse() or rect() within beginShape().":
		"beginShape() und endShape() werden verwendet, um komplexere Formen zu erzeugen. Um solch eine Form zu beginnen, rufe beginShape() auf, dann verwende die vertex()-Funktion so oft du willst und dann rufe endShape() auf. Standardmäßig wird ein irreguläres Polygon erzeugt, aber du kannst das durch Wählen eines Modus (mode) ändern. Transformationen wie translate(), rotate() und scale() funktionieren nicht innerhalb von beginShape() / endShape(). Es ist auch nicht möglich, andere Formen zu verwenden wie ellipse() oder rect().",
	"x: the x-coordinate of the vertex":
		"x: Die x-Koordinate des Koordinaten-Paars",
	"y: the y-coordinate of the vertex":
		"y: Die y-Koordinate des Koordinaten-Paars",
	"Sets the background color of the canvas. Note that calling this will color over anything drawn before the command.":
		"Setzt die Hintergrund-Farbe der Leinwand (canvas). Beachte, dass diese Funktion alles übermalen wird, was vorher auf der Leinwand war.",
	"r: amount of red, ranges from 0 to 255":
		"r: Rot-Wert, zwischen 0 und 255",
	"g: amount of green, ranges from 0 to 255":
		"g: Grün-Wert, zwischen 0 und 255",
	"b: amount of blue, ranges from 0 to 255":
		"b: Blau-Wert, zwischen 0 und 255",
	"a: (Optional) transparency, ranges from 0 to 255":
		"a: (optional) Deckkraft, von 0 (transparent) bis 255 (undurchsichtig)",
	"Sets the fill color for all shapes drawn after the function call.":
		"Bestimmt die Füllfarbe für alle danach gezeichneten Formen.",
	"r: amount of red, ranges from 0 to 255":
		"r: Rot-Wert, zwischen 0 und 255",
	"g: amount of green, ranges from 0 to 255":
		"g: Grün-Wert, zwischen 0 und 255",
	"b: amount of blue, ranges from 0 to 255":
		"b: Blau-Wert, zwischen 0 und 255",
	"a: (Optional) transparency, ranges from 0 to 255":
		"a: (optional) Deckkraft, von 0 (transparent) bis 255 (undurchsichtig)",
	"Sets the outline color for all shapes drawn after the function call.":
		"Bestimmt die Randfarbe für alle danach gezeichneten Formen.",
	"r: amount of red, ranges from 0 to 255":
		"r: Rot-Wert, zwischen 0 und 255",
	"g: amount of green, ranges from 0 to 255":
		"g: Grün-Wert, zwischen 0 und 255",
	"b: amount of blue, ranges from 0 to 255":
		"b: Blau-Wert, zwischen 0 und 255",
	"a: (Optional) transparency, ranges from 0 to 255":
		"a: (optional) Deckkraft, von 0 (transparent) bis 255 (undurchsichtig)",
	"This function lets you store all three color components in a single variable. You can then pass that one variable to functions like background(), stroke(), and fill().":
		"Mit dieser Funktion kannst du drei Farbkomponenten (r, g, b) in einer einzelnen Variablen speichern. Du kannst die Variable dann an Funktionen wie background(), stroke() oder fill() übergeben.",
	"r: amount of red, ranges from 0 to 255":
		"r: Rot-Wert, zwischen 0 und 255",
	"g: amount of green, ranges from 0 to 255":
		"g: Grün-Wert, zwischen 0 und 255",
	"b: amount of blue, ranges from 0 to 255":
		"b: Blau-Wert, zwischen 0 und 255",
	"a: (Optional) transparency, ranges from 0 to 255":
		"a: (optional) Deckkraft, von 0 (transparent) bis 255 (undurchsichtig)",
	"Makes all shapes drawn after this function call transparent.":
		"macht alle Formen, die danach gezeichnet werden, transparent.",
	"Disables outlines for all shapes drawn after the function call.":
		"macht alle Umrandungen von Formen, die danach gezeichnet werden, transparent.",
	"Sets the thickness of all lines and outlines drawn after the function call.":
		"setzt die Dicke aller Linien und Umrandungen, die nach dem Funktionsaufruf gezeichnet werden.",
	"thickness: a number specifying the thickness":
		"thickness: Dicke in einzelnen Pixeln (Bildpunkten)",
	"Sets the style of the joints which connect line segments drawn with vertex(). These joints are either mitered, beveled, or rounded and specified with the corresponding parameters MITER, BEVEL, and ROUND.":
		"Bestimmt die Art wie Linien miteinander verbunden werden. Die Verbindungen sind entweder MITER (spitz), BEVEL (abgeschrägt), ROUND (rund).",
	"MODE: Either MITER, BEVEL, or ROUND. The default is MITER.":
		"MODE: Entweder MITER, BEVEL oder ROUND. Standard ist MITER.",
	"Sets the style for rendering line endings. These ends are either squared, extended, or rounded and specified with the corresponding parameters SQUARE, PROJECT, and ROUND.":
		"Bestimmt wie Linienenden aussehen. Linienenden sind entweder SQUARE (quadratisch), ROUND (rund) oder PROJECT (erweitert).",
	"MODE: Either SQUARE, PROJECT, or ROUND. The default is ROUND":
		"MODE: Entweder SQUARE, PROJECT oder ROUND. Standard ist ROUND.",
	"Blends two color values together based on the blending mode given as the MODE parameter.":
		"Vermischt zwei Farben miteinander, im angegebenen Vermischungs-Modus (blend mode).",
	"c1: The first color to blend":
		"c1: Die erste Mischfarbe",
	"c2: The second color to blend":
		"c2: Die zweite Mischfarbe",
	"MODE: Either BLEND, ADD, SUBTRACT, DARKEST, LIGHTEST, DIFFERENCE, EXCLUSION, MULTIPLY, SCREEN, OVERLAY, HARD_LIGHT, SOFT_LIGHT, DODGE, or BURN.":
		"MODE: Entweder BLEND, ADD, SUBTRACT, DARKEST, LIGHTEST, DIFFERENCE, EXCLUSION, MULTIPLY, SCREEN, OVERLAY, HARD_LIGHT, SOFT_LIGHT, DODGE, oder BURN.",
	"Calculates a color or colors between two color at a specific increment. The amount parameter is the amount to interpolate between the two values where 0.0 equal to the first point, 0.1 is very near the first point, 0.5 is half-way in between, etc.":
		"Berechnet eine Farbe an einer bestimmten Stelle zwischen zwei Farben. Der amount-Parameter bestimmt dabei, wo diese Stelle sein soll: 0.1 ist sehr nah an der ersten Farbe, 0.9 sehr nah an der zweiten.",
	"c1: Interpolate from this color":
		"c1: Von dieser Farbe aus interpolieren.",
	"c2: Interpolate to this color":
		"c2: Zu dieser Farbe hin interpolieren.",
	"Changes the way that color values are interpreted when set by fill()/stroke()/background().":
		"Ändert die Art, in der Farbwerte interpretiert werden.",
	"MODE: Either RGB or HSB. The default is RGB.":
		"MODE: Entweder RGB oder HSB. Standard ist RGB.",
	"Extracts the red value from a color, scaled to match current colorMode().":
		"Gibt den Rotwert einer Farbe zurück.",
	"color: Any color data type":
		"color: Ein Farbwert (kann mit color() erzeugt werden)",
	"Extracts the green value from a color, scaled to match current colorMode().":
		"Gibt den Grünwert einer Farbe zurück.",
	"color: Any color data type":
		"color: Ein Farbwert (kann mit color() erzeugt werden)",
	"Extracts the blue value from a color, scaled to match current colorMode().":
		"Gibt den Blauwert einer Farbe zurück.",
	"color: Any color data type":
		"color: Ein Farbwert (kann mit color() erzeugt werden)",
	"Extracts the alpha value from a color.":
		"Gibt den alpha-Wert einer Farbe zurück (Deckkraft).",
	"color: Any color data type":
		"color: Ein Farbwert (kann mit color() erzeugt werden)",
	"Extracts the hue value from a color.":
		"Gibt den Farbton einer Farbe zurück.",
	"color: Any color data type":
		"color: Ein Farbwert (kann mit color() erzeugt werden)",
	"Extracts the saturation value from a color.":
		"Gibt die Sättigung einer Farbe zurück.",
	"color: Any color data type":
		"color: Ein Farbwert (kann mit color() erzeugt werden)",
	"Extracts the brightness value from a color.":
		"Gibt die Helligkeit einer Farbe zurück.",
	"color: Any color data type":
		"color: Ein Farbwert (kann mit color() erzeugt werden)",
	"Draws a string of text at the specified location":
		"Gibt einen Text an einer bestimmten Position auf der Leinwand aus.",
	"message: the string of text to display":
		"message: Der Text, der ausgegeben werden soll",
	"x: the x-coordinate of the bottom left corner":
		"x: Die x-Koordinate der linnken, unteren Ecke.",
	"y: the y-coordinate of the bottom left corner":
		"y: Die y-Koordinate der linnken, unteren Ecke.",
	"width: (Optional) the width of the box for text to auto wrap inside":
		"width (optional): Die Breite des Textes",
	"height: (Optional) the height of the box for text to auto wrap inside":
		"height (optional): Die Höhe des Textes",
	"Using textFont() with createFont(), it's possible to change the font of text drawn.":
		"Wählt einen Zeichensatz (Font), der mit createFont() geladen werden kann.",
	"font: A font returned by the createFont function":
		"font: Ein Zeichensatz, der mit createFont() geladen werden kann",
	"size: (Optional) The size of the font, in pixels":
		"size: (optional) Die Größe des Zeichensatzes in Pixel (Bildpunkten)",
	"Using textFont() with createFont(), it's possible to change the font of text drawn.":
		"Lädt einen Zeichensatz, der mit textFont() angezeigt werden kann.",
	"name: A font name, either \"sans-serif\", \"serif\", \"monospace\", \"fantasy\", or \"cursive\"":
		"name: Name eines Zeichensatzes, entweder \"sans-serif\", \"serif\", \"monospace\", \"fantasy\", oder \"cursive\"",
	"size: (Optional) The size of the font, in pixels":
		"size: (optional) Die Größe des Zeichensatzes in Pixel (Bildpunkten)",
	"Changes the size of text being drawn.":
		"Verändert die Größe der nach den Aufruf dieses Befehls ausgegebenen Texte.",
	"size: The size of the text, in pixels":
		"size: Die Größe des Textes in Pixel (Bildpunkten)",
	"Calculates and returns the width of any string.":
		"Gibt die Breite einer Zeichenkette (string) zurück.",
	"str: The string to calculate the width of":
		"Die Zeichenkette (string), deren Breite berechnet werden soll.",
	"Returns the ascent of the current font at its current size. This information is useful for determining the height of the font above the baseline. For example, adding the textAscent() and textDescent() values will give you the total height of the line.":
		"Gibt die Höhe des aktuellen Fonts von der Basislinie aus zurück. Zusammen mit der Tiefe, die textDescent() zurückgibt, ergibt das die Gesamthöhe des Fonts.",
	"Returns descent of the current font at its current size. This information is useful for determining the height of the font below the baseline. For example, adding the textAscent() and textDescent() values will give you the total height of the line.":
		"Gibt die Tiefe des aktuellen Fonts unterhalb der Basislinie zurück. Zusammen mit der Höhe, die textAscent() zurückgibt, ergibt das die Gesamthöhe des Fonts.",
	"Sets the spacing between lines of text in units of pixels. This setting will be used in all subsequent calls to the text() function.":
		"Setzt den Zeilenabstand von Text in Pixeln.",
	"dist: The size in pixels for spacing between lines":
		"dist: Zeilenabstand in Pixeln",
	"Sets the current alignment for drawing text. The first parameter is used to set the display characteristics of the letters in relation to the values for the x and y parameters of the text() function.  The second parameter is used to vertically align the text. BASELINE is the default setting, if textAlign is not used. The TOP and CENTER parameters are straightforward. The BOTTOM parameter offsets the line based on the current textDescent(). For multiple lines, the final line will be aligned to the bottom, with the previous lines appearing above it.":
		"Bestimmt die Ausrichtung von Text. Der erste Parameter in horizontaler Richtung, der zweite in vertikaler. BASELINE ist dabei der Standardwert. TOP rückt den Text nach oben, CENTER in die Mitte und BOTTOM nach unten.",
	"ALIGN: Horizontal alignment, either LEFT, CENTER, or RIGHT":
		"Horizontale Ausrichtung, entweder LEFT (links), CENTER (mittig) oder RIGHT (rechts)",
	"YALIGN: Vertical alignment, either TOP, BOTTOM, CENTER, or BASELINE":
		"Vertikale Ausrichtung, entweder TOP (oben), BOTTOM (unten), CENTER (mittig) oder BASELINE (Grundlinie)",
	"Sets the rotation angle for any shapes drawn after the command. If called multiple times, the angle will be added to the previous angle (accumulative effect). To stop rotation, use pushMatrix()/popMatrix().":
		"Bestimmt den Rotationswinkel für alle folgenden Zeichen-Kommandos",
	"angle: The number of degrees to rotate by. To specify in radians, use the angleMode() function.":
		"angle: Drehung in Grad (0 bis 360). Mit angleMode() kann man den Modus auf Bogenmaß (radians) setzen.",
	"Increases the size of shapes drawn after the command, by expanding and contracting vertices. For example, scale(2) makes it increase in size by 200%. If called multiple times, the sizes will multiply (accumulative effect). It can be called with one parameter to resize the same in both dimensions, or with two parameters to size differently in each dimension.  To stop resizing shapes, use pushMatrix()/popMatrix().":
		"Verändert die Größe für alle folgenden Zeichenkommandos.",
	"amount: The amount to scale object in \"x\" and \"y\" axis":
		"amount: Der Faktor, um den die Größe in x- und y-Richtung verändert werden soll.",
	"amountY: (Optional) The amount to scale object in \"y\" axis":
		"amountY: Der Faktor, um den die Größe nur in y-Richtung verändert werden soll. Der erste Parameter ist in diesem Fall die x-Richtung.",
	"Displaces the drawn shapes by a given amount in the x/y directions. If called multiple times, the offsets will be added to each other (accumulative effect). To stop translating shapes, use pushMatrix()/popMatrix().":
		"Verschiebt die Position aller folgender Zeichen-Kommandos in x- und y-Richtung",
	"x: The amount to translate left/right.":
		"x: Der Wert, um den in x-Richtung verschoben werden soll.",
	"y: The amount to translate up/down.":
		"y: Der Wert, um den in y-Richtung verschoben werden soll.",
	"Remembers the current coordinate system (in the \"matrix stack\").":
		"Speichert das aktuelle Koordinatensystem zwischen. (Im \"Matrix Stack\")",
	"Restores the previous coordinate system (from the \"matrix stack\") - whatever was most recently pushed.":
		"Stellt das vorangegangene Koordinatensystem wieder her.",
	"Replaces the current transformation matrix with the identity matrix. This effectively clears all transformation functions set before it.":
		"Setzt das Koordinatensystem wieder auf den Ursprungszustand.",
	"Prints the current transformation matrix to the console.":
		"Gibt das aktuelle Koordinatensystem aus.",
	"Specifies the number of frames to be displayed every second. If the processor is not fast enough to maintain the specified rate, it will not be achieved. For fluid animation, at least 24 frames per second is recommended.":
		"Bestimmt wie oft die draw()-Funktion pro Sekunde aufgerufen wird. Wenn der Prozessor nicht schnell genug ist, für die gewünschte Wiederholfrequenz ist, wird sie nicht erreicht werden. Für eine flüssige Animation sind mindestens 24 Wiederholungen pro Sekunde (frame/seconds) nötig." ,
	"fps: A whole number, number of frames per second":
		"fps: Eine ganze Zahl. Anzahl der Wiederholungen pro Sekunde.",
	"Causes the program to continuously execute the code within draw(). If noLoop() is called, the code in draw() stops executing.":
		"Bewirkt, dass die draw()-Funktion immer wieder aufgerufen wird.",
	"Stops the program from continuously executing the code within draw(). If loop() is called, the code in draw() begin to run continuously again.":
		"Bewirkt, dass die draw()-Funktion nicht immer wieder aufgerufen wird.",
	"Returns a random number between low and high.":
		"Eine Zufallszahl zwischen den beiden angegebenen Werten.",
	"low: the lowest possible number returned":
		"Die niedrigsmögliche Zahl",
	"high: the highest possible number returned":
		"Die höchstmögliche Zahl",
	"Calculates the distance between two points, (x1, y1) and (x2, y2).":
		"Berechnet die Entfernung zwischen zwei Punkten.",
	"x1: the x-coordinate of the first point":
		"x1: Die x-Koordinate des ersten Punkts",
	"y1: the y-coordinate of the first point":
		"y1: Die y-Koordinate des ersten Punkts",
	"x2: the x-coordinate of the second point":
		"x2: Die x-Koordinate des zweiten Punkts",
	"y2: the y-coordinate of the second point":
		"y2: Die y-Koordinate des zweiten Punkts",
	"Constrains a value to not exceed a maximum and minimum value.":
		"Grenzt den angegebenen Wert zwischem einem Minimum und einem Maximum ein. (min() und max() kombiniert)",
	"value: The value to constrain":
		"value: Der Wert, der eingegrenzt werden soll.",
	"min: The minimum limit":
		"min: Das Minimum",
	"max: The maximum limit":
		"max: Das Maximum",
	"Returns the smallest value of all values passed in.":
		"Gibt den niedrigsten Wert von allen übergebenen Werten zurück.",
	"num1: The first value to compare, any number.":
		"num1: Der erste Wert, irgendeine Zahl",
	"num2: The second value to compare, any number.":
		"num2: Der zweite Wert, irgendeine Zahl",
	"Returns the greatest value of all values passed in.":
		"Gibt den höchsten Wert von allen übergebenen Werten zurück.",
	"num1: The first value to compare, any number.":
		"num1: Der erste Wert, irgendeine Zahl",
	"num2: The second value to compare, any number.":
		"num2: Der zweite Wert, irgendeine Zahl",
	"Returns the absolute value of a number":
		"Gibt den absoluten Wert einer Zahl zurück.",
	"num: The number to take the absolute value of":
		"num: Wert. Eine Zahl.",
	"Returns the the natural logarithm (base-e) of a number.":
		"Gibt den natürlichen Logarithmus (base-e) einer Zahl zurück.",
	"num: The number to take the log of":
		"num: Wert. Eine Zahl.",
	"Returns a number raised to an exponential power.":
		"Gibt die Potenz einer Zahl zurück.",
	"num: The base of the exponential expression":
		"num: Der Basiswert der Potenz",
	"exponent: The power to which the num is raised":
		"exponent: Der Exponent der Potenz",
	"Squares a number (multiplies a number by itself). The result is always a positive number, as multiplying two negative numbers always yields a positive result. For example, -1 * -1 = 1":
		"Gibt das Quadrat einer Zahl zurück.",
	"num: Any numeric value":
		"num: Wert. Eine Zahl.",
	"Calculates the square root of a number. The square root of a number is always positive, even though there may be a valid negative root. The square root s of number a is such that s*s = a. It is the opposite of squaring.":
		"Gibt die Quadratwurzel einer Zahl zurück.",
	"num: Any numeric value":
		"num: Wert. Eine Zahl.",
	"Calculates the closest whole number that is closest to the value of the parameter.":
		"Rundet eine Zahl auf oder ab",
	"num: Any numeric value":
		"num: Wert. Eine Zahl.",
	"Calculates the closest whole number that is greater than or equal to the value of the parameter.":
		"Rundet eine Zahl auf",
	"num: Any numeric value":
		"num: Wert. Eine Zahl.",
	"Calculates the closest whole number that is less than or equal to the value of the parameter.":
		"Rundet eine Zahl ab",
	"num: Any numeric value":
		"num: Wert. Eine Zahl.",
	"Calculates the magnitude (or length) of a vector. A vector is a direction in space commonly used in computer graphics and linear algebra. Because it has no \"start\" position, the magnitude of a vector can be thought of as the distance from coordinate (0,0) to its (x,y) value. Therefore, mag() is a shortcut for writing dist(0, 0, x, y).":
		"Bestimmt die Größe (magnitude) einer Position. (das Gleiche wie dist(0, 0, x, y )",
	"x: the x component":
		"x: Die x-Koordinate",
	"y: the y component":
		"y: Die y-Koordinate",
	"Returns Euler's number e (2.71828...) raised to the power of the value parameter.":
		"Gibt die Eulersche Zahl (e) potenziert mit einem Wert zurück.",
	"num: Any numeric value":
		"num: Wert. Eine Zahl.",
	"Re-maps a number from one range to another. Numbers outside the range are not clamped to 0 and 1, because out-of-range values are often intentional and useful.":
		"Transponiert (re-map) eine Zahl von einem Bereich in einen anderen. Zahlen können außerhalb des angegebenen Bereichs liegen.",
	"num: The incoming value to be converted":
		"num: Wert, der transponiert werden soll",
	"low1: Lower bound of the value's current range":
		"Untere Grenze des ersten Bereichs",
	"high1: Upper bound of the value's current range":
		"Obere Grenze des ersten Bereichs",
	"low2: Lower bound of the value's target range":
		"Untere Grenze des Ziel-Bereichs",
	"high2: Upper bound of the value's target range":
		"Obere Grenze des Zielbereichs",
	"Normalizes a number from another range into a value between 0 and 1. This is the same as using the map function with the last two parameters set to 0 and 1, i.e: map(value, low, high, 0, 1); Numbers outside the range are not clamped to 0 and 1, because out-of-range values are often intentional and useful.":
		"Normalisiert eine Zahl innerhalb eines Bereichs",
	"num: The incoming value to be converted":
		"num: Der Wert, der normalisiert werden soll",
	"low1: Lower bound of the value's current range":
		"low1: Die untere Grenze des Bereichs (0)",
	"high1: Upper bound of the value's current range":
		"high1: Die obere Grenze des Bereichs (1)",
	"Calculates a number between two numbers at a specific increment.":
		"Gibt einen bestimmten Wert zwischen zwei Zahlen zurück.",
	"num1: The first number":
		"num1: Die erste Zahl",
	"num2: The second number":
		"num2: Die zweite Zahl",
	"amount: A value between 0.0 and 1.0":
		"amount: Ein Wert zwischen 0 und 1",
	"Returns the Perlin noise value at specified coordinates. The resulting value will always be between 0.0 and 1.0":
		"Gibt den Perlin noise Wert an den angegebenen Koordinaten zurück.",
	"x: the x-coordinate in noise space":
		"x: Die x-Koordinate im noise-Raum",
	"y: the y-coordinate in noise space (optional)":
		"y: Die y-Koordinate im noise-Raum",
	"Adjusts the character and level of detail produced by the Perlin noise function.":
		"Stellt den Charakter und Detaillevel der Werte ein, die durch die Perlin noise-Funktion zurückgegeben werden.",
	"octaves: The number of octaves to be used by the noise() function":
		"octaves: Die Anzahl an Oktaven, die verwendet werden sollen",
	"falloff: The falloff factor for each octave":
		"falloff: Der falloff-Faktor für jede Oktave",
	"Return the sine of an angle.":
		"Gibt den Sinus-Wert eines Winkels zurück.",
	"deg: The angle, in degrees":
		"deg: Der Winkel (0 bis 360)",
	"Return the cosine of an angle.":
		"Gibt den Cosinus-Wert eines Winkels zurück.",
	"deg: The angle, in degrees":
		"deg: Der Winkel (0 bis 360)",
	"Return the tangent of an angle":
		"Gibt die Tangente eines Winkels zurück.",
	"deg: The angle, in degrees":
		"deg: Der Winkel (0 bis 360)",
	"Returns the arc cosine (inverse cosine) of a value. Depending on the angle mode, it returns values from 0-180 or 0-PI.":
		"Gibt den Arkus-Cosinus-Wert eines Winkels zurück.",
	"val: The value whose arc cosine is to be returned.":
		"deg: Der Winkel (0 bis 360)",
	"Returns the arc sine (inverse sine) of a value. Depending on the angle mode, it returns values from -90 to 90 or -PI/2 to PI/2.":
		"Gibt den Arkus-Sinus-Wert eines Winkels zurück.",
	"val: The value whose arc sine is to be returned.":
		"deg: Der Winkel (0 bis 360)",
	"Returns the arc tangent (inverse tangent) of a value. Depending on the angle mode, it returns values from -90 to 90 or -PI/2 to PI/2.":
		"Gibt den Arkus-Tangens-Wert eines Winkels zurück.",
	"val: The value whose arc tangent is to be returned":
		"deg: Der Winkel (0 bis 360)",
	"Converts a degree measurement to its corresponding value in radians.":
		"Wandelt eine Grad-Angabe in ein Bogenmaß (radians) um",
	"angle: The angle in degrees":
		"angle: Der Winkel in Grad.",
	"Converts a radians measurement to its corresponding value in degrees.":
		"Wandelt eine Bogenmaß-Angabe (radians) in einen Winkel um",
	"angle: The angle in radians":
		"angle: Der Winkel in Grad.",
	"Returns the current day of the month, between 1 and 31, according to the clock on the user's computer.":
		"Gibt den Tag des aktuellen Datums zurück",
	"Returns the current month of the year, between 1-12, according to the clock on the user's computer.":
		"Gibt den Monat des aktuellen Datums zurück",
	"Returns the current year according to the clock on the user's computer.":
		"Gibt das Jahr des aktuellen Datums zurück",
	"Returns the current hour as a value from 0 - 23, based on the user's computer clock.":
		"Gibt die aktuelle Stunde zurück",
	"Returns the current minute as a value from 0 - 59, based on the user's computer clock.":
		"Gibt die aktuelle Minute zurück",
	"Returns the current second as a value from 0 - 59, based on the user's computer clock.":
		"Gibt die aktuelle Sekunde zurück",
	"Returns the number of milliseconds (thousandths of a second) since starting the program. Useful for cyclic animations.":
		"Gibt die aktuelle Millesekunde zurück",
	"Log out any number of values to the browser console.":
		"Gebe Texte und Werte auf der Console des Browsers aus.",
	"arg: The first value to log":
		"arg: Der erste Wert",
	"...: (Optional)* any amount of extra arguments":
		"...: (optional)* So viele weitere Parameter wie gewünscht.",
	"Prints a line of data to the console that pops up over the canvas. Click the X to close the console.":
		"Gibt eine Zeile mit Daten auf der Konsole aus, die am unteren Rand der Leinwand (canvas) erscheint.",
	"data: The data to print":
		"data: Die Daten, die man ausgeben will",
	"Prints data to the console that pops up over the canvas, without creating a new line (like println does).":
		"Gibt Daten auf der Konsole aus, die am unteren Rand der Leinwand (canvas) erscheint.",
	"data: The data to print":
		"data: Die Daten, die man ausgeben will",
	"object constructor":
		"Objekt-Konstruktor (object constructor)",
	"object":
		"Objekt",
	"variable":
		"Variable",
	"callback":
		"Callback",
	"Enter an image URL.":
		"Gib eine Bild-URL ein",
	"Sorry! That server is not permitted.":
		"Entschuldige, aber das darf der Server nicht machen!",
	"That is not a valid image URL.":
		"Das ist keine gültige Bild-URL",
	"Invalid sound file.":
		"Das ist keine gültige Sound-Datei.",
}

if( typeof i18n === "undefined" ) {
	var i18n = {};
}

var i18n = { 
    interpolateStringToArray: function(str, options) {
        options = options || {};

        // Split the string into its language fragments and substitutions
        var split = str.split(/%\(([\w_]+)\)s/g);

        // Replace the substitutions with the appropriate option
        for (var i = 1; i < split.length; i += 2) {
            var replaceWith = options[split[i]];
            split[i] = _.isUndefined(replaceWith) ? "%(" + split[i] + ")s" : replaceWith;
        }
        return split;
    },

    _ : function (str, options) {
		if( !translations[ str ] ) {
			//console.log( "Translation of '" + str + "' is not available."); 
			return this.interpolateStringToArray( str, options).join("");;
		}

        return this.interpolateStringToArray( translations[ str ], options).join("");
    },

	ngettext: function( singular, plural, count, options ) {
		if( count === 1 ) return this._( singular, options );
		else return this._( plural, options );
	},
};


