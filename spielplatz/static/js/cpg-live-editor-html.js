( function( ) {

window.LiveEditorFrameHTML = window.LiveEditorFrame.extend ( {

    imagesRegex: /getImage\(\s*\"([^\"]+)/g,
    soundsRegex: /getSound\(\s*\"([^\"]+)/g,
    projectRegex: /\"\s*[^\/]+/g,

	initialize: function( options ) {
		window.LiveEditorFrame.prototype.initialize.call( this, options );

		this.liveEditor = new LiveEditor( {
			editorType: "ace_webpage",
			outputType: "webpage",
			el: $( "#cpg-live-editor-html" ),
			code: "<!DOCTYPE html>\n<body>\n<strong>Hello</strong>, world!\n</body>",
			width: 400,
			height: 568,
			editorHeight: "568px",
			autoFocus: true,
			workersDir: "../build/workers/",
			externalsDir: "../build/external/",
			imagesDir: "static/userdata/"+window.CPG.UserNameForImages+"/images/",
			execFile: "external/output_webpage.html",
            newErrorExperience: true,
		} );

        this.liveEditor.editor.on( "change", function ( ) {
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

        // resouces returns a list of all images, sounds and other resources used in the code file
    resources: function() {
        var t = this.text(),
            res = [];

        while( match = this.imagesRegex.exec( t ) ) {
            res.push( match[ 1 ] + ".png" );
        };

        while( match = this.soundsRegex.exec( t ) ) {
            res.push( match[ 1 ] + ".mp3" );
        };

        return res;
    },

    // moveResouces moves all resources to the project directory and returns the code file 
    // (doesn't change it in the editor though)
    moveResources: function( projectName ) {
        var self = this,
            code = this.text();

        code = code.replace( this.imagesRegex, function( match, group ) {
            return match.replace( self.projectRegex, "\""+projectName );
        } );
        code = code.replace( this.soundsRegex, function( match, group ) {
            return match.replace( self.projectRegex, "\""+projectName );
        } );

        return code;
    },
} );

} )( );