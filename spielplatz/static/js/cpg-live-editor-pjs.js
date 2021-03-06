// Weiter mit save file 
//		var self = this;

( function( ) {

window.LiveEditorFrame = Backbone.View.extend ( {
	liveEditor: null,

	page: null,
	codeFileList: null,
	allFileList: null,
	currentCodeFile: null,
	codeFiles: {},

	_dirty: false,
	_onChangeCallback: null,

	initialize: function initialize ( options ) {

		var self = this;
		this.page = options.page || "pjs";

		$( ".page" ).hide( );
		$( "#nav-bar-page-" + this.page ).addClass( "active" );
		$( "#page-" + this.page ).show( );

		$( ".nav-bar-page" ).on( "click tap ", function( e ) {
			sessionStorage.CPG_page = $( this ).attr( "rel" );

			location.reload( );
		} );
 
		$( "#control-bar-restart" ).on( "click", function( e ) {
			self.restart( );
		} );
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
		return "Each editor has to restart in it's own way."		
	},

	resources: function() {
		return "Each editor has it's own way to return resources."		
	},

	moveResources: function( projectName ) {
		return "Each editor has it's own way to move resources into a project environment."		
	},

	alternateType: function() {
		return "Editors may have alternate file types (paper/png, sounds/mp3)."				
	},

	modified: function( ) {
		return this._dirty;
	},

	setClean: function( ) {
		this._dirty = false;
	},

    setOnChangeCallback: function( cb ) {
        this._onChangeCallback = cb;
    },

	// End of interface methods
	////////////////////////////////////////////////////////////////////////


	///////////////////////////////////////////
	// showModalSound displays a modal dialog to select sounds
	showModalSound: function( cb ) {
		var modal = $( "#control-bar-sound-modal" ),
			soundGroups = window.OutputSounds[ 0 ].groups,
			groups = $( "<div id='modal-sound-groups'>" );

		for( var i=0 ; i<soundGroups.length ; i++ ) {

			var gr = soundGroups[ i ],
				sounds = $( "<div class='soundgroup'>" );
			sounds.append( "<div class='title'>" + gr.groupName + "</div>" );
			for( var j=0 ; j<gr.sounds.length ; j++ ) {
				sound = gr.sounds[ j ];
				sounds.append( 
					"<div class='sound'>" + 
					" <audio src='static/userdata/" + window.CPG.UserNameForImages + "+/sounds/" + gr.groupName + "/" + sound + ".mp3' controls></audio>" + 
					" <span class='sound-name' path='" + gr.groupName + "/" + sound + "'>" + sound + "</span>" + 
					"</div>"
				 );
			}

			groups.append( sounds );
		}

		$( ".modal-body", modal ).html( groups );

		$( ".modal-open", modal ).off( "click" ).one( "click", function( e ) {
			modal.modal( 'hide' );
			if( cb ) cb( $( ".sound-name.selected" ).attr( "path" ) );
		} );

		$( ".modal-cancel", modal ).off( "click" ).one( "click", function( e ) {
			// cb is called on hide event
			modal.modal( 'hide' );
		} );

		$( ".sound-name", modal ).hover( function( e ) {
			$( this ).addClass( "active" );
		}, function( e ) {
			$( this ).removeClass( "active" ); 
		} ).on( "click", function( e ) {
			if( $( this ).hasClass( "selected" ) ) {
				$( ".modal-open", modal ).trigger( "click" );
			}
			$( ".sound-name", modal ).removeClass( "selected" );
			$( this ).addClass( "selected" );
		} );

		modal.modal( 'show' );

		modal.one( 'hidden.bs.modal', function( e ) {
			if( cb ) cb( );
		} );
	},
} );

//////////////////////////////////////////////////////////////////////////
// PJS specific live editor functionality
//
window.LiveEditorFramePjs = window.LiveEditorFrame.extend ( {

	imagesRegex: /getImage\(\s*\"([^\"]+)/g,
	soundsRegex: /getSound\(\s*\"([^\"]+)/g,
	projectRegex: /\"\s*[^\/]+|\"\s*\//,

	initialize: function( options ) {
        var self = this;

		window.LiveEditorFrame.prototype.initialize.call( this, options );

		this.liveEditor = new LiveEditor ( {
			el: $( "#cpg-live-editor-pjs" ),
			code: "// Live-Editor, Processing / Javascript\n",
			width: 320,
			height: 568,
			editorHeight: "568px",
			autoFocus: true,
			workersDir: "../build/workers/",
			execFile: "external/output.html",
			externalsDir: "../build/external/",
			imagesDir: "static/userdata/" + window.CPG.UserNameForImages + "/images/",
			soundsDir: "../static/userdata/" + window.CPG.UserNameForImages + "/sounds/",
			jshintFile: "../build/external/jshint/jshint.js",
			newErrorExperience: true,
		} );

		this.liveEditor.editor.on( "change", function ( ) {
			self._dirty = true;

			if( self._onChangeCallback ) self._onChangeCallback();
		} );

		// Patch for changing the width, bug in live-editor as of April 2016
		// Right and bottom border still missing ... 
		$( "#output-frame" ).width( 320 );

		// We have an own toolbar ...
		$( ".scratchpad-toolbar" ).hide( );

		// Store sound modal address in global variable for editor integration
		window.showModalSound = this.showModalSound;
	},

	setOnChangeCallback: function( cb ) {
		this._onChangeCallback = cb;
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
		this._dirty = false;
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
	resources: function( ) {
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
			code = this.text(),
            newCode;

		newCode = code.replace( this.imagesRegex, function( match, group ) {
			return match.replace( self.projectRegex, "\""+projectName );
		} );
		newCode = newCode.replace( this.soundsRegex, function( match, group ) {
			return match.replace( self.projectRegex, "\""+projectName );
		} );

		return { 
            code: newCode,
            changed: code !== newCode
        };
	},

	alternateType: function() {
		// No alternate file types for live editor"
		return null;
	},

} );

} )( );