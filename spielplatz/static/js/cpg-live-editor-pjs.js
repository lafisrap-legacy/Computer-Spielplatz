// Weiter mit save file 
//        var self = this;

( function( ) {

window.LiveEditorFrame = Backbone.View.extend ( {
	LiveEditor: null,

	page: null,
	codeFileList: null,
	allFileList: null,
	currentCodeFile: null,
	codeFiles: {},

	_dirty: false,

	initialize: function initialize ( options ) {

        var self = this;
		this.page = options.page || "page-pjs";

		$( ".page" ).hide( );
		$( "#nav-bar-" + this.page ).addClass( "active" );
		$( "#" + this.page ).show( );

		$( ".nav-bar-page" ).on( "click tap ", function( e ) {
			sessionStorage.CPG_page = $( this ).attr( "rel" );

			location.reload( );
		} );

		//////////////////////////////////////////
		// Fill in the globals form session storage
		this.codeFileList = sessionStorage[ this.page + "CodeFileList" ] && JSON.parse( sessionStorage[ this.page + "CodeFileList" ] ) || [ ],
		this.allFilesList = sessionStorage[ this.page + "AllFilesList" ] && JSON.parse( sessionStorage[ this.page + "AllFilesList" ] ) || [ ],
		this.currentCodeFile = sessionStorage[ this.page + "CurrentCodeFile" ] || window.CPG.ControlBarNewFile;
        this.codeFiles = {};

		for( var i = 0 ; i < this.codeFileList.length ; i++ ) {
			this.codeFiles[ this.codeFileList[ i ] ] = sessionStorage[ this.codeFileList[ i ] ] && JSON.parse( sessionStorage[ this.codeFileList[ i ] ] ) || {};
		}
		this.codeFiles[ window.CPG.ControlBarNewFile ] = sessionStorage[ window.CPG.ControlBarNewFile ] && JSON.parse( sessionStorage[ window.CPG.ControlBarNewFile ] ) || { code: "" };


        //////////////////////////////////////////
        // WS.connect connects to server and loads code files
        $WS.connect( window.CPG.WebsocketsAddress, window.CPG.xsrfdata, function( ) {

            if( window.CPG.UserName === "" ) {
                
                self.reset( self.codeFiles[ window.CPG.ControlBarNewFile ].code || "" );
                self._dirty = false;

            } else if( !sessionStorage[ self.page + "CodeFileList" ] ) {
                $WS.sendMessage( {
                    Command: "readJSDir"
                }, function( message ) {
                    self.codeFileList = [ ];

                    var files=[ ];
                    for( file in message.Files ) {
                         files.push( { name: file, timeStamp: message.Files[ file ].TimeStamp } );
                    }

                    files.sort( function( a, b ) {
                        if( a.timeStamp < b.timeStamp ) return 1;
                        else return -1;
                    } );

                    self.allFilesList = files;
                    sessionStorage[ self.page + "AllFilesList" ] = JSON.stringify( self.allFilesList );

                    for( var i=0, codeFilesToRead=[ ] ; i<5 && i<files.length ; i++ ) {
                        codeFilesToRead.push( files[ i ].name );
                    }

                    if( codeFilesToRead.length ) {
                        $WS.sendMessage( {
                            command: "readJSFiles",
                            FileNames: codeFilesToRead,
                        }, function( message ) {
                            for( var i=0 ; i<codeFilesToRead.length ; i++ ) {
                                var fileName = codeFilesToRead[ i ],
                                    codeFile = message.CodeFiles[ fileName ];
                                if( codeFile ) {
                                    self.codeFiles[ fileName ] = {
                                        code: codeFile.Code,
                                        timeStamp: codeFile.TimeStamp,
                                    }
                                    sessionStorage[ fileName ] = JSON.stringify( self.codeFiles[ fileName ] );
                                    self.codeFileList.push( fileName );                          
                                }
                            }
                            sessionStorage[ self.page + "CodeFileList" ] = JSON.stringify( self.codeFileList );

                            sessionStorage[ self.page + "CurrentCodeFile" ] = self.currentCodeFile = self.codeFileList[ 0 ];
                            $( "#control-bar-input input" ).val( self.currentCodeFile );
                            self.fillButtonControl( );

                            self.reset( self.codeFiles[ self.currentCodeFile ].code );
                            self._dirty = false;
                        } );
                    } else {
                        self.currentCodeFile = window.CPG.ControlBarNewFile;
                        self.codeFileList = [ ];
                        self.codeFiles[ self.currentCodeFile ] = { code: "", timeStamp: null };

                        sessionStorage[ self.page + "CodeFileList" ] = JSON.stringify( self.codeFileList );
                        sessionStorage[ self.page + "CurrentCodeFile" ] = self.currentCodeFile;
                        sessionStorage[ self.currentCodeFile ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] );

                        $( "#control-bar-input input" ).val( self.currentCodeFile );
                        self.fillButtonControl( );
                        self.reset( "" );
                        self._dirty = false;
                    }
                } );
            } else {

                self.fillButtonControl( );
                
                self.reset( self.codeFiles[ self.currentCodeFile ]? self.codeFiles[ self.currentCodeFile ].code : "" );
                self._dirty = false;
            }

            console.log( "Websockets connected!" );
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

        $( "#control-bar-new" ).on( 'click', function( ) {
            var newFile = function( ) {
                sessionStorage[ self.page + "CurrentCodeFile" ] = self.currentCodeFile = window.CPG.ControlBarNewFile;

                $( "#control-bar-current-file" ).text( self.currentCodeFile );
                $( "#control-bar-input input" ).val( self.currentCodeFile );
                self.reset( "" );
                self._dirty = false;

                self.storeCurrentCodeFile( );        
            };

            if( self._dirty && self.currentCodeFile !== window.CPG.ControlBarNewFile ) {
             self.showModalYesNo( window.CPG.ControlBarModalFileChanged, window.CPG.ControlBarModalFileChanged2, function( yes ) {
                    if( yes ) {
                        self.saveCodeFile( this.currentCodeFile, function( ) { newFile( ); } ); 
                    } else {
                        newFile( );
                    }
                } );

                return false;
            }

            newFile( );
        } );

        $( "#control-bar-save" ).on( 'click', function( e ) {
            var input = $( "#control-bar-input input" ),
                filename = input.val( );

            if( filename === window.CPG.ControlBarNewFile ) {
                self.selectFilename( input );
            } else {
                if( filename.slice( -3 ) != ".js" ) {
                    filename += ".js";
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

                if( filename.slice( -3 ) != ".js" ) {
                    filename += ".js"
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

	////////////////////////////////////////////
	// storeCurrentCodeFile syncs the current code file with the global variable and the local storage
	storeCurrentCodeFile: function( ) {
		if( this.currentCodeFile ) {
			this.codeFiles[ this.currentCodeFile ].code = this.text( );
			sessionStorage[ this.page + this.currentCodeFile ] = JSON.stringify( this.codeFiles[ this.currentCodeFile ] );		 
		}
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// showModalYesNo displays a modal dialog with answers yes and no
	showModalYesNo: function( title, body, cb ) {
		var modal = $( "#control-bar-yes-no-modal" );

		$( ".modal-title", modal ).text( title );
		$( ".modal-body p", modal ).text( body );
		$( ".modal-yes", modal ).off( "click" ).one( "click", function( e ) {
			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );
			if( lcb ) lcb( true );
		} );
		$( ".modal-no", modal ).off( "click" ).one( "click", function( e ) {
			// cb is called on hide event
			modal.modal( 'hide' );
		} );

		modal.modal( 'show' );
		modal.one( 'hidden.bs.modal', function( e ) {
			if( cb ) cb( false );
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

	///////////////////////////////////////////
	// showModalCodeFiles shows the code file info and modification dialog
	showModalCodeFiles: function( cb ) {
		var modal = $( "#control-bar-codefile-modal" );

		var afl = this.allFilesList,
			files = $( "<div id='modal-codefiles'>" ),
			row = null;

		for( var i=0 ; i<afl.length ; i++ ) {
			files.append( 
				"<div class='file file" + i+" pull-left' filename='" + afl[ i ].name + "'>" + 
				" <div class='top'>" + 
				" </div>" + 
				" <div class='middle'>" + 
				"	<img src='static/userdata/" + window.CPG.UserName + "/pjs/" + ( afl[ i ].name.slice( 0,-3 ) + ".png" ) + "'>" + 
				" </div>" + 
				" <div class='bottom'>" + 
				"	<span class='filename text-center'>" + afl[ i ].name + "</span>" + 
				"	<span class='timestamp pull-left vbottom'>" + this.getFormatedDate( afl[ i ].timeStamp ) + "</span>" + 
				"	<input type='checkbox' class='checkbox large pull-right' value=''>" + 
				" </div>" + 
				"</div>"
			 );
		}
		
		// Correct font size of filenames
		$( ".modal-body", modal ).html( files );
		modal.one( 'shown.bs.modal', function( ) {

			for( var i=0 ; i<afl.length ; i++ ) {
				var filename = $( ".file" + i+" .filename", files ),
					maxWidth = filename.width( ),
					realWidth = filename[ 0 ].scrollWidth;

				if( realWidth > maxWidth ) {
					var fontSize = parseFloat( filename.css( "font-size" ) );

					for( var j=1 ; j<10 ; j++ ) {
						filename.css( "font-size", ( fontSize - j ) );
						if( filename[ 0 ].scrollWidth <= maxWidth ) break;
					}
				}
			}
		} );

		/*
		$( ".file .middle", modal ).one( "dblclick", function( e ) {
			cb( "open", [ $( this ).parent( ).attr( "filename" ) ] );
			cb = null;
			modal.modal( 'hide' );
		} );
		*/

		$( ".file .middle", modal ).on( "click", function( e ) {
			var checkbox = $( ".checkbox", $( this ).parent( ) ); 
			checkbox.prop( "checked", !checkbox.prop( "checked" ) );
		} );

		var getCheckedFilenames = function( ) { 
			var filenames = [ ];
			$.each( $( ".file", modal ), function( index, file ) {
				var checkbox = $( ".checkbox", $( this ) )
				if( checkbox.is( ':checked' ) ) {
					filenames.push( $( this ).attr( "filename" ) );
				}
			} );
			return filenames;
		}

		$( ".modal-open", modal ).off( "click" ).one( "click", function( e ) {

			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );

			//if( !lcb ) debugger;
			if( lcb ) lcb( "open", getCheckedFilenames( ) );
		} );

		$( ".modal-cancel", modal ).off( "click" ).one( "click", function( e ) {
			modal.modal( 'hide' );
		} );

		$( ".modal-delete", modal ).off( "click" ).one( "click", function( e ) {
			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );

			//if( !lcb ) debugger;
			if( lcb ) lcb( "delete", getCheckedFilenames( ) );
		} );

		modal.one( 'hidden.bs.modal', function( e ) {
			if( cb ) cb( "cancel" );
		} );

		modal.modal( 'show' );
	},

	/////////////////////////////////////////////
	// fillButtonControl fills the file select button with current files
	fillButtonControl: function( ) {

        var self = this;

		// create file list for button control
		var fileList = [ ];
		for( var i=0 ; i<this.codeFileList.length ; i++ ) {
			fileList.push( {
				fileName: this.codeFileList[ i ],
				timeStamp: this.codeFiles[ this.codeFileList[ i ] ].timeStamp
			} );
		}

		fileList.sort( function( a,b ) {
			if( a.timeStamp > b.timeStamp ) return -1;
			else return 1;
		} );

		var cbf = $( "#project-bar-open-files" ),
			width = cbf.width( );

		cbf.html( "" );
		for( var i=0 ; i<fileList.length ; i++ ) {

			cbf.append( '<li class="project-bar-open-file" codefile="' + fileList[ i ].fileName + '">' +
                    '<span>' + fileList[ i ].fileName + '</span>' +
                    '<span class="timestamp">' + this.getFormatedDate( fileList[ i ].timeStamp ) + '</span>' +
                '</li>' ).width( width + 20 ); 
		}

		if( this.allFilesList.length >= 2 ) {
			cbf.append( '<hr><li class="project-bar-open-file" codefile="all"><span>' + window.CPG.ControlBarAllFiles + '</span></li>' );
		}

		$( "#control-bar-current-file" ).text( this.currentCodeFile );
		$( "#control-bar-input input" ).val( this.currentCodeFile );

		$( ".project-bar-open-file" ).on( 'click', function( e ) {
			if( self.currentCodeFile !== window.CPG.ControlBarNewFile ) {
				self.storeCurrentCodeFile( );
			}

			var codeFile = $( this ).attr( "codeFile" );
	 
			if( codeFile !== "all" ) {
				sessionStorage[ self.currentCodeFile ] = self.currentCodeFile = codeFile;
				$( "#control-bar-current-file" ).text( self.currentCodeFile );
				$( "#control-bar-input input" ).val( self.currentCodeFile )
				self.reset( self.codeFiles[ self.currentCodeFile ].code );
				self._dirty = false;
			} else {
				self.showModalCodeFiles( function( button, selFiles ) {
					switch( button ) {

					/////////////////////////////////////////////////
					// User selected "open"
					case "open":
						for( var i=0, openFiles=[ ] ; i<selFiles.length ; i++ ) {
							if( self.codeFileList.indexOf( selFiles[ i ] ) !== -1 ) openFiles.push( selFiles[ i ] );
						}

						var readFiles = function( ) {
							if( selFiles.length ) {
								$WS.sendMessage( {
									command: "readJSFiles",
									FileNames: selFiles,
								}, function( message ) {
									for( var i=0 ; i<selFiles.length ; i++ ) {
										var fileName = selFiles[ i ],
											codeFile = message.CodeFiles[ fileName ];
										if( codeFile ) {
											self.codeFiles[ fileName ] = {
												code: codeFile.Code,
												timeStamp: codeFile.TimeStamp,
											}
											sessionStorage[ fileName ] = JSON.stringify( self.codeFiles[ fileName ] );
											if( self.codeFileList.indexOf( fileName ) === -1 ) self.codeFileList.push( fileName );
										}
									}
									sessionStorage[ self.page + "CodeFileList" ] = JSON.stringify( self.codeFileList );
									sessionStorage[ self.page + "CurrentCodeFile" ] = self.currentCodeFile = selFiles[ 0 ];
									$( "#control-bar-input input" ).val( self.currentCodeFile );
									self.fillButtonControl( );

									self.reset( self.codeFiles[ self.currentCodeFile ].code );
									self._dirty = false;
								} );
							}
						}

						if( openFiles.length ) {
							self.showModalYesNo( openFiles.join( " " ), openFiles.length === 1? window.CPG.ControlBarModalAlreadyOpenS : window.CPG.ControlBarModalAlreadyOpenP, function( yes ) {
								if( !yes ) {
									for( var i=openFiles.length-1 ; i>=0 ; i-- ) selFiles.splice( selFiles.indexOf( openFiles[ i ] ),1 );
								}

								readFiles( );
							} );
						} else {
							readFiles( );
						}
						break;

					/////////////////////////////////////////////////
					// User selected "cancel" or closed the dialog
					case "cancel":
						break;

					/////////////////////////////////////////////////
					// User selected "delete"
					case "delete":
						if( selFiles.length ) {
							self.showModalYesNo( selFiles.join( " " ), selFiles.length === 1? window.CPG.ControlBarModalFileDeleteS : window.CPG.ControlBarModalFileDeleteP, function( yes ) {
								if( yes ) {
									$WS.sendMessage( {
										command: "deleteJSFiles",
										FileNames: selFiles,
									}, function( message ) {

										// Todo: Error message
										//if( message.Error ) return;

										for( var i=selFiles.length-1 ; i>=0 ; i-- ) {
											// hier wird ab und zu ein Wort nicht aus allFiles gelöscht ... ( step debug!! )

											self.codeFileList.splice( self.codeFileList.indexOf( selFiles[ i ] ),1 );
											for( var afl=self.allFilesList, j=afl.length-1 ; j>=0 ; j-- ) {
												if( afl[ j ].name === selFiles[ i ] ) {
													afl.splice( j,1 );
													break;
												}
											} 
											self.codeFiles[ selFiles[ i ] ] = null;

											if( selFiles[ i ] === self.currentCodeFile ) sessionStorage[ self.page + "CurrentCodeFile" ] = self.currentCodeFile = self.codeFileList[ 0 ] || window.CPG.ControlBarNewFile
										}
										sessionStorage[ self.page + "AllFilesList" ] = JSON.stringify( self.allFilesList );
										sessionStorage[ self.page + "CodeFileList" ] = JSON.stringify( self.codeFileList );
										sessionStorage[ self.page + "CurrentCodeFile" ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] || { code: "" } );

										self.fillButtonControl( );
										self.reset( self.codeFiles[ self.currentCodeFile ]? self.codeFiles[ self.currentCodeFile ].code : "" );
										self._dirty = false;
									} );
								}
							} );
							return;

						}
						break;
					}
				} );
			}
		} );
	},

    ///////////////////////////////////////////
    // getFormatedDate returns a neatly formated date or time
    getFormatedDate: function( time ) {
        if( !time ) return "";

        var monthNames = [ "Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez." ];

        var date = new Date( ),
            today = date.toDateString( ),
            yearNow = date.getFullYear( ),
            yesterday = date.setDate( date.getDate( )-1 );
        yesterday = date.toDateString( );

        date.setTime( time );
        var day = date.getDate( ),
            monthIndex = date.getMonth( ),
            year = date.getFullYear( ),
            hour = date.getHours( ),
            minute = date.getMinutes( );
        if( today == date.toDateString( ) ) var dateString = hour+":"+( minute<10?"0":"" )+minute;
        else if( yesterday == date.toDateString( ) ) var dateString = "Gestern";
        else {
            var dateString = day+". "+monthNames[ monthIndex ];
            if( year != yearNow ) {
                dateString += " "+year;
            }
        }

        return dateString;
    },

    /////////////////////////////////////////
    // selectFilename displays a filename input and selects the js filename
    selectFilename: function( input ) {

        input.fadeIn( );
        input.focus( );
        var filename = input.val( );

        if( filename.slice( -3 ) != ".js" ) {
            filename += ".js";
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
			jshintFile: "../build/external/jshint/jshint.js"
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
