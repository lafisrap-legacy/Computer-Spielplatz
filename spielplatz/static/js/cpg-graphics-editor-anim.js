// Weiter mit save file 
//		var self = this;

( function( ) {


//////////////////////////////////////////////////////////////////////////
// Anim specific graphics editor functionality
//
window.GraphicsEditorFrameAnim = window.GraphicsEditorFrame.extend ( {

	initialize: function( options ) {
        var self = this;

		window.GraphicsEditorFrame.prototype.initialize.call( this, options );

		$( "#page-anim" ).on( "change", function ( ) {
			self._dirty = true;
		} );
	},

	//////////////////////////////////////////////////////////////
	// Following methods have to be implemented by every editor type
	//
	// text: Return the current code
	text: function( ) {
		// Add something here;
	},

	// reset: Reset the editor with code
	reset: function( code ) {
		// Add something here;
		this._dirty = false;
	},

	// restart: Restarts the code
	restart: function() {
		// Nothing to restart (no live editor)
	},

	// getScreenShot takes the current canvas and passes it as first parameter to a call back function
	getScreenshot: function( cb ) {
		// Add something here;
	},

	// resouces returns a list of all images, sounds and other resources used in the code file
	resources: function( ) {
		// No resources (no live editor)
	},

	// moveResouces moves all resources to the project directory and returns the code file 
	// (doesn't change it in the editor though)
	moveResources: function( projectName ) {
		// No resources (no live editor)
	},
} );

} )( );