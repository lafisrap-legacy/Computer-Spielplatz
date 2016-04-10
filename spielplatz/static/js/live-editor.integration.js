(function() {

var errMsg = "Khan Live-Editor, integration problem: "

///////////////////////////////////////////////////////////
// Default sound file
//
if( !TooltipEngine.classes.soundModal.prototype.defaultFile ) 
	console.error( errMsg + "Default sound file is not in place." );
TooltipEngine.classes.soundModal.prototype.defaultFile = "\"Spielplatz/Glas\"";

///////////////////////////////////////////////////////////
// Exchange sound modal
//
if( !TooltipEngine.classes.soundModal.prototype.render ) 
	console.error( errMsg + "Render method of soundModal is not in place." );

var oldRender = TooltipEngine.classes.soundModal.prototype.render;
TooltipEngine.classes.soundModal.prototype.render = function render() {
	var self = this;

	oldRender.call(this);

	this.$("button").off("click");
	this.$("button").on("click", function () {
		if( window.showModalSound ) {
			window.showModalSound(function(sound) {
				if( sound ) {
					self.updateText('"'+sound+'"');
					self.updateTooltip('"'+sound+'"');							  
				}
			});
		}
	});
};

///////////////////////////////////////////////////////////
// Empty image file
//
if( !TooltipEngine.classes.imagePicker.prototype.defaultImage ) 
	console.error( errMsg + "Default image file is not in place." );
TooltipEngine.classes.imagePicker.prototype.defaultImage = "Spielplatz/Leer";

///////////////////////////////////////////////////////////
// Deactivate maybeShowErrors
//
//if( !window.LiveEditor.prototype.maybeShowErrors ) 
//	console.error( errMsg + "maybeShowErrors method is not available." );
//window.LiveEditor.prototype.maybeShowErrors = function maybeShowErrors() {
//
//	return;
//};


///////////////////////////////////////////////////////////
// Late integration functions
//
$( window ).on("live-editor-late-integration", function( e ) {

	///////////////////////////////////////////////////////////
	// Replace blank image file
	//
	var src = $(".mediapicker .current-media img").attr("src").replace(/cute\/Blank.png/g, "Spielplatz/KeinBild.png");
	$(".mediapicker .current-media img").attr( "src", src );

	///////////////////////////////////////////////////////////
	// Replace tipbar strings
	//
	$( ".tipbar .oh-no" ).text( "Oh! Nein!" );
	$( ".tipbar .show-me a" ).text( "Zeig mir wo ..." );
	$( ".tipbar .tipnav .prev" ).html( "<span>&#8592;</span>" );
	$( ".tipbar .tipnav .next" ).html( "<span>&#8594;</span>" );

});
	
})();

