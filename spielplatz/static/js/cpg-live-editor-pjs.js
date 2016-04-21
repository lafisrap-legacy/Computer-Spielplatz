// Weiter mit save file 
//        var self = this;

( function( ) {

window.LiveEditorFrame = Backbone.View.extend ( {
	liveEditor: null,

	page: null,
	codeFileList: null,
	allFileList: null,
	currentCodeFile: null,
	codeFiles: {},

	_dirty: false,

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
 
        ///////////////////////////////////////////
        // Delete button
        $( "#control-bar-delete" ).on( 'click', function( ) {
            if( self.currentCodeFile !== window.CPG.ControlBarNewFile ) {
                self.showModalYesNo( self.currentCodeFile, window.CPG.ControlBarModalFileDeleteS, function( yes ) {
                    if( yes ) {
                        $WS.sendMessage( {
                            command: "deleteJSFiles",
                            FileNames: [ self.currentCodeFile ],
                        }, function( message ) {

                            // weiter mit go command deleteJSFiles
                            self.codeFileList.splice( self.codeFileList.indexOf( self.currentCodeFile ),1 );
                            for( var i=0, afl=self.allFilesList ; i<afl.length ; i++ ) {
                                if( afl[ i ].name === self.currentCodeFile ) afl.splice( i,1 );
                                break;
                            } 
                            self.codeFiles[ self.currentCodeFile ] = null;

                            sessionStorage[ self.page + "CurrentCodeFile" ] = self.currentCodeFile = self.codeFileList[ 0 ] || window.CPG.ControlBarNewFile
                            sessionStorage[ self.page + "CodeFileList" ] = JSON.stringify( self.codeFileList );
                            sessionStorage[ self.page + "AllFilesList" ] = JSON.stringify( self.allFilesList );
                            sessionStorage[ self.currentCodeFile ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] || { code: "" } );

                            self.fillButtonControl( );
                            self.reset( self.codeFiles[ self.currentCodeFile ]? self.codeFiles[ self.currentCodeFile ].code : "" );
                            self._dirty = false;
                        } );
                    }
                } );
                return;
            }
        } );

        $( "#control-bar-save" ).on( 'click', function( e ) {
            var input = $( "#control-bar-input input" ),
                filename = input.val( );

            if( filename === window.CPG.ControlBarNewFile ) {
                self.selectFilename( input );
            } else {
                if( filename.slice( -4 ) != ".pjs" ) {
                    filename += ".pjs";
                    input.val( filename );
                }

                self.saveCodeFile( filename );
                input.fadeOut( );
            }

            return false;
        } );

        $( "#control-bar-label" ).on( 'click', function( e ) {
            $( "#control-bar-save" ).trigger( "click" );
            e.stopPropagation( )
        } );

        $( "#control-bar-saveas" ).on( 'click', function( ) {
            var input = $( "#control-bar-input input" );
            self.selectFilename( input );
        } );

        $( "#control-bar-input" ).submit( function( e ) {
            var input = $( "#control-bar-input input" ),
                filename = input.val( );

            if( filename === window.CPG.ControlBarNewFile ) {
                self.selectFilename( input );
            } else {

                if( filename.slice( -3 ) != ".pjs" ) {
                    filename += ".pjs"
                    input.val( filename );
                }

                self.saveCodeFile( filename );
                input.fadeOut( );
            }

            return false;
        } );


        $( "#control-bar-restart" ).on( "click", function( e ) {
            self.restart( );
        } );

        $( "#logout-button" ).on( "click", function( e ) {
            localStorage.ĈPG_loginTime = 0;
        } );

        $( ".kuenste a" ).on( "click tap", function( e ) {
            self.storeCurrentCodeFile( );
            self._dirty = false;
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
        cb( "Each editor has to reset in it's own way." );
    },

    restart: function() {
        return "Each editor has to restart in it's own way."        
    },


    // End of interface methods
    ////////////////////////////////////////////////////////////////////////

	modified: function( ) {
		return this._dirty;
	},

	setClean: function( ) {
		this._dirty = false;
	},

	refreshSession: function( loginTime ) {

		// If User changed: clear everything from sessionStorage
		if( sessionStorage.ĈPG_loginTime !== loginTime ) {
			var fileList = sessionStorage.codeFileList && JSON.parse( sessionStorage.codeFileList ) || [ ];
			for( var i=0 ; i<fileList.length ; i++ ) sessionStorage.removeItem( fileList[ i ] );
			sessionStorage.removeItem( "codeFileList" );
			sessionStorage.removeItem( "allFilesList" );
			sessionStorage.removeItem( "currentCodeFile" );
			localStorage.ĈPG_loginTime = sessionStorage.ĈPG_loginTime = loginTime;
		}

		// Look if another Tab or window logged out ( and maybe in again ) in the meantime
		$( window ).focus( function( e ) {
			if( sessionStorage.ĈPG_loginTime !== localStorage.ĈPG_loginTime ) location.reload( ); 
		} ); 
	},


	///////////////////////////////////////////
	// showModalSound displays a modal dialog to select sounds
	showModalSound: function( cb ) {
		var modal = $( "#control-bar-sound-modal" ),
			soundGroups = window.CPG.OutputSounds[ 0 ].groups,
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

    /////////////////////////////////////////
    // selectFilename displays a filename input and selects the js filename
    selectFilename: function( input ) {

        input.fadeIn( );
        input.focus( );
        var filename = input.val( );

        if( filename.slice( -3 ) != ".pjs" ) {
            filename += ".pjs";
            input.val( filename );
        }

        var startPos = 0,
            endPos = filename.length-3;

        if ( typeof input[ 0 ].selectionStart != "undefined" ) {
            input[ 0 ].selectionStart = startPos;
            input[ 0 ].selectionEnd = endPos;
        }
    },

    saveCodeFile: function( filename, cb ) {

        var self = this;

        $( "#control-bar-label" ).text( "..." );
        var code = this.text( );
        // Unbind any handlers this function may have set for previous
        // screenshots

        this.getScreenshot( function ( data ) {

            // remove BASE64-HTML header
            var image = data.substr( data.search( "," )+1 );

            $WS.sendMessage( {
                Command: "writeJSFiles",
                FileNames: [ filename ],
                TimeStamps: self.codeFiles[ filename ] && [ self.codeFiles[ filename ].timeStamp ] || null,
                CodeFiles: [ code ],
                Overwrite: self.currentCodeFile === filename,
                Images : [ image ], 
            }, function( message ) {
                if( message.Error ) {
                    self.showModalYesNo( window.CPG.ControlBarModalFileExists, message.Error, function( yes ) {
                        if( yes ) {
                            self.currentCodeFile = filename;
                            self.saveCodeFile( filename );
                        } else {
                            $( "#control-bar-label" ).text( window.CPG.ControlBarLabel );
                        }
                    } );
                    return false;
                } else if( self.currentCodeFile !== filename ) {

                    self.codeFiles[ self.currentCodeFile ].code = self.currentCodeFile !== window.CPG.ControlBarNewFile? self.text( ) : "";
                    
                    self.codeFileList.push( filename );
                    for( var i=0, filenameExists=false, afl=self.allFilesList ; i<afl.length ; i++ ) {
                        if( afl[ i ].name === filename ) {
                            filenameExists = true;
                            break;
                        }
                    }
                    if( !filenameExists ) self.allFilesList.push( {
                        name: filename,
                        timeStamp: self.codeFiles[ self.currentCodeFile ].timeStamp
                    } );
                    sessionStorage[ self.currentCodeFile ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] );
                    sessionStorage[ self.page + "CodeFileList" ] = JSON.stringify( self.codeFileList );
                    sessionStorage[ self.page + "AllFilesList" ] = JSON.stringify( self.allFilesList );
                    sessionStorage[ self.page + "CurrentCodeFile" ] = self.currentCodeFile = filename;

                } else if( message.OutdatedTimeStamps.length > 0 ) {
                    self.showModalYesNo( filename, window.CPG.ControlBarModalFileOutdated, function( yes ) {
                        if( yes ) {
                            self.codeFiles[ filename ].timeStamp = message.OutdatedTimeStamps[ 0 ] 
                            self.saveCodeFile( filename );
                        } else {
                            $( "#control-bar-label" ).text( window.CPG.ControlBarLabel );
                        }
                    } );
                    return false;
                } 

                self.codeFiles[ filename ] = { 
                    code: self.text( ),
                    timeStamp: message.SavedTimeStamps[ 0 ]
                };
                sessionStorage[ filename ] = JSON.stringify( self.codeFiles[ filename ] );
                self.fillButtonControl( );
                self.modified = false;
                if( cb ) cb( ); // call callback function after saving the file
                $( "#control-bar-label" ).text( window.CPG.ControlBarSaved ).parent( ).removeClass( "btn-primary" ).addClass( "btn-success" );
                $
                setTimeout( function( ) { 
                    $( "#control-bar-label" ).text( window.CPG.ControlBarLabel )
                        .parent( ).addClass( "btn-primary" )
                        .removeClass( "btn-success" ); 
                }, 2000 );
            } );
        } );
    },


} );

//////////////////////////////////////////////////////////////////////////
// PJS specific live editor functionality
//
window.LiveEditorFramePjs = window.LiveEditorFrame.extend ( {

	initialize: function( options ) {
		window.LiveEditorFrame.prototype.initialize.call( this, options );

		this.liveEditor = new LiveEditor ( {
			el: $( "#cpg-live-editor-pjs" ),
			code: window.localStorage[ "test-code-pjs" ] || "ellipse( 100, 100, 100, 100 );",
			width: 480,
			height: 800,
			editorHeight: "800px",
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
            this._dirty = true;
        } );

        // Patch for changing the width, bug in live-editor as of April 2016
        // Right and bottom border still missing ... 
        $( "#output-frame" ).width( 480 );

        // We have an own toolbar ...
		$( ".scratchpad-toolbar" ).hide( );

		// Store sound modal address in global variable for editor integration
		window.showModalSound = this.showModalSound;
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
} );

} )( );
