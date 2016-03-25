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
// Bugfix: Oh noes timing
//
if( !window.LiveEditor.prototype.maybeShowErrors ) 
	console.error( errMsg + "maybeShowErrors method is not available." );
window.LiveEditor.prototype.maybeShowErrors = function maybeShowErrors() {

	if (!this.hasErrors() || !this.editor || !this.editor.getCursor()) {
		return;
	}

	this.setThinkingState();
	// Make doubly sure that we clear the timeout
	window.clearTimeout(this.errorTimeout);
	this.errorTimeout = setTimeout((function () {
		if (this.hasErrors()) {
			this.setErrorState();
		}
	}).bind(this), 60000);
};

///////////////////////////////////////////////////////////
// Late integration functions
//
$( window ).on("live-editor-late-integration", function( e ) {

	///////////////////////////////////////////////////////////
	// Replace blank image file
	//
	var src = $(".mediapicker .current-media img").attr("src").replace(/cute\/Blank.png/g, "Spielplatz/KeinBild.png");
	$(".mediapicker .current-media img").attr( "src", src )
});

	
})();

