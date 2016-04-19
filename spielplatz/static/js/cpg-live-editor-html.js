( function( ) {

window.LiveEditorFrameHTML = window.LiveEditorFrame.extend ( {

	initialize: function( options ) {
		window.LiveEditorFrame.prototype.initialize.call( this, options );

		this.liveEditor = new LiveEditor( {
			editorType: "ace_webpage",
			outputType: "webpage",
			el: $( "#cpg-live-editor-html" ),
			code: window.localStorage[ "test-code" ] || "<!DOCTYPE html>\n<strong>Hello</strong>, world!",
			width: 480,
			height: 800,
			editorHeight: "800px",
			autoFocus: true,
			workersDir: "../build/workers/",
			externalsDir: "../build/external/",
			imagesDir: "static/userdata/"+window.CPG.UserNameForImages+"/images/",
			execFile: "external/output_webpage.html",
		} );

		this.liveEditor.editor.on( "change", function( ) {
			this._dirty = true;
		} );

		// We have an own toolbar ...
		$( ".scratchpad-toolbar" ).hide( );
	},

    //////////////////////////////////////////////////////////////
    // Following methods have to be implemented by every editor type
    //
    // text: Return the current code
    text: function( ) {
        return this.liveEditor.editor.text( );
    },

    // reset: Reset the editor with code
    reset: function( code ) {        
        this.liveEditor.editor.reset( code );
    },

    // restart: Restarts the code
    restart: function() {
        this.liveEditor.restartCode( );
    },

    // getScreenShot takes the current canvas and passes it as first parameter to a call back function
    getScreenshot: function( cb ) {
        this.liveEditor.getScreenshot( cb );
    },
} );

} )( );