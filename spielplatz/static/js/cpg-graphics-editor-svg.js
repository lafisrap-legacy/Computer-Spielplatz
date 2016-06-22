// Weiter mit save file 
//		var self = this;

( function( ) {

window.GraphicsEditorFrame = Backbone.View.extend ( {
	graphicsEditor: null,

	page: null,
	codeFileList: null,
	allFileList: null,
	currentCodeFile: null,
	codeFiles: {},

	_dirty: false,

	initialize: function initialize ( options ) {

		var self = this;
		this.page = options.page || "svg";

		$( ".page" ).hide( );
		$( "#nav-bar-page-" + this.page ).addClass( "active" );
		$( "#page-" + this.page ).show( );

		$( ".nav-bar-page" ).on( "click tap ", function( e ) {
			sessionStorage.CPG_page = $( this ).attr( "rel" );

			location.reload( );
		} );
 
		$( "#logout-button" ).on( "click", function( e ) {
			localStorage.ĈPG_loginTime = 0;
		} );

		$( ".kuenste a" ).on( "click tap", function( e ) {
			self.storeCurrentCodeFile( );
			self._dirty = false;
		} );

		this.graphicsEditor = paper;
	},

	////////////////////////////////////////////////////////////////////////
	// Methods to be overwritten by each editor type
	//
	// text: Return the current code
	text: function() {
		return "Each editor has to return it's own code.";
	},

	reset: function( code ) {		
		return "Each editor has to reset in it's own way."
	},

	getScreenshot: function( cb ) {
		cb( "Each editor has to getScreenshot in it's own way." );
	},

	restart: function() {
		return "Each editor has to restart in it's own way (only live editors)."		
	},

	resources: function() {
		return "Each editor has it's own way to return connected resources (only live editors)."		
	},

	moveResources: function( projectName ) {
		return "Each editor has it's own way to move resources into a project environment (only live editors)."		
	},


	// End of interface methods
	////////////////////////////////////////////////////////////////////////

	modified: function( ) {
		return this._dirty;
	},

	setClean: function( ) {
		this._dirty = false;
	},


} );

//////////////////////////////////////////////////////////////////////////
// PJS specific live editor functionality
//
window.GraphicsEditorFrameSvg = window.GraphicsEditorFrame.extend ( {

	initialize: function( options ) {
        var self = this;

		window.GraphicsEditorFrame.prototype.initialize.call( this, options );

		$( "#page-svg" ).on( "change", function ( ) {
			self._dirty = true;
		} );
	},

	//////////////////////////////////////////////////////////////
	// Following methods have to be implemented by every editor type
	//
	// text: Return the current code
	text: function( ) {
		return this.graphicsEditor.EditorAPI.text( );
	},

	// reset: Reset the editor with code
	reset: function( code ) {
		this.graphicsEditor.EditorAPI.reset( code );
		this._dirty = false;
	},

	// restart: Restarts the code
	restart: function() {
		// Nothing to restart (no live editor)
	},

	// getScreenShot takes the current canvas and passes it as first parameter to a call back function
	getScreenshot: function( cb ) {
		this.graphicsEditor.EditorAPI.getScreenshot( cb );
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