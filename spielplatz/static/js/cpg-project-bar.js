/////////////////////////////////////////////////////////////////////////////////////////////////
// Project-Control-Bar

( function( ) {

window.ProjectControlBar = Backbone.Model.extend( {
	userName: null,			// Logged in user, or ""
	editor: null,			// Live editor, graphics editor, sound editor
	buttonGroup: null,		// The bootstrap button group belonging to the project bar
	fileType: null,			// pjs, html, paper, go, svg, ani ...
	newFile: null,			// Filename if non is specified

	codeFileList: null,		// A list of all currently loaded files
	allFilesList: null,		// A list of all files available from the user account
	currentCodeFile: null,	// File that is currently worked on
    codeFiles: {},			// Loaded files, key is filename

	initialize: function( options ) {
		options.projectBar = this;
		this.buttonGroup = new ButtonGroup( options );
		this.el = options.el;
		this.userName = options.userName || "";
		this.editor = options.editor;
		this.fileType = options.fileType || "pjs";
		this.newFile = options.newFile || "noname.pjs";

		console.assert( this.editor && 
						typeof this.editor.text === "function" &&
						typeof this.editor.reset === "function" &&
						typeof this.editor.getScreenshot === "function" &&
						typeof this.editor.restart === "function" , 
						"The project controller needs text(), reset(), getScreenshot() and restart() methods of an editor." );

		//////////////////////////////////////////
		// Fill in the globals form session storage
		this.codeFileList = sessionStorage[ this.fileType + "CodeFileList" ] && JSON.parse( sessionStorage[ this.fileType + "CodeFileList" ] ) || [ ],
		this.allFilesList = sessionStorage[ this.fileType + "AllFilesList" ] && JSON.parse( sessionStorage[ this.fileType + "AllFilesList" ] ) || [ ],
		this.currentCodeFile = sessionStorage[ this.fileType + "CurrentCodeFile" ] || this.newFile;
        this.codeFiles = {};

		for( var i = 0 ; i < this.codeFileList.length ; i++ ) {
			this.codeFiles[ this.codeFileList[ i ] ] = sessionStorage[ this.codeFileList[ i ] ] && JSON.parse( sessionStorage[ this.codeFileList[ i ] ] ) || {};
		}
		this.codeFiles[ this.newFile ] = sessionStorage[ this.newFile ] && JSON.parse( sessionStorage[ this.newFile ] ) || { code: "" };

		//////////////////////////////////////////////
		// Connect to websocket server and load file info
		this.connect( options.wsAdress, options.xsrfdata );
	},

	/////////////////////////////////////////////////////////////
	// Connect to the WebSockets server
	connect: function( wsAddress, xsrfdata ) {
		var self = this;

	    $WS.connect( window.CPG.WebsocketsAddress, window.CPG.xsrfdata, function( ) {

            if( self.userName === "" ) {
                
                self.editor.reset( self.codeFiles[ self.newFile ].code || "" );

            } else if( !sessionStorage[ self.fileType + "CodeFileList" ] ) {

                $WS.sendMessage( {
                    Command: "readDir",
                    FileType: self.fileType
                }, function( message ) {

                    self.codeFileList = [ ];

                    var files=[ ];
                    for( file in message.Files ) {
                    	var f = message.Files[ file ]
                        files.push( { name: file, project: f.Project, timeStamp: f.TimeStamp } );
                    }

                    files.sort( function( a, b ) {
                        if( a.timeStamp < b.timeStamp ) return 1;
                        else return -1;
                    } );

                    self.allFilesList = files;
                    sessionStorage[ self.fileType + "AllFilesList" ] = JSON.stringify( self.allFilesList );

                    for( var i=0, codeFilesToRead = [], projects = [] ; i < 5 && i < files.length ; i++ ) {
                        codeFilesToRead.push( files[ i ].name );
                        projects.push( files[ i ].project );
                    }

                    if( codeFilesToRead.length ) {
                        $WS.sendMessage( {
                            command: "readSourceFiles",
                            FileNames: codeFilesToRead,
                            FileProjects: projects,
                            FileType: self.fileType
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
                            sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
                            sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = self.codeFileList[ 0 ];
                            $( "#control-bar-input input" ).val( self.currentCodeFile );
                            self.buttonGroup.fillButtonControl( this );

                            self.editor.reset( self.codeFiles[ self.currentCodeFile ].code );
                        } );
                    } else {
                        self.currentCodeFile = window.CPG.ControlBarNewFile;
                        self.codeFileList = [ ];
                        self.codeFiles[ self.currentCodeFile ] = { code: "", timeStamp: null };

                        sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
                        sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile;
                        sessionStorage[ self.currentCodeFile ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] );

                        $( "#control-bar-input input" ).val( self.currentCodeFile );
                        self.buttonGroup.fillButtonControl( );
                        self.editor.reset( "" );
                        self._dirty = false;
                    }
                } );
            } else {

                self.buttonGroup.fillButtonControl( );
                
                self.editor.reset( self.codeFiles[ self.currentCodeFile ]? self.codeFiles[ self.currentCodeFile ].code : "" );
                self._dirty = false;
            }
        });
	},

    new: function( ) {
    	var self = this;

        var newFile = function( ) {
            sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = window.CPG.ControlBarNewFile + "." + self.fileType;

            self.buttonGroup.showFilename( self.currentCodeFile );
            self.editor.reset( "" );

            self.storeCurrentCodeFile( );	        
        };

        if( this.editor.modified() && self.currentCodeFile !== window.CPG.ControlBarNewFile + "." + this.fileType ) {
        self.showModalYesNo( window.CPG.ProjectBarModalFileChanged, window.CPG.ProjectBarModalFileChanged2, function( yes ) {
	            if( yes ) {
	                self.saveCodeFile( this.projectBar.currentCodeFile, function( ) { newFile( ); } ); 
	            } else {
	                newFile( );
	            }
	        } );

            return false;
        }

        newFile( );
    },

    open: function( codeFile ) {
    	var self = this;

		if( this.currentCodeFile !== this.newFile ) {
			this.storeCurrentCodeFile( );
		}
 
		if( codeFile !== "all" ) {

			sessionStorage[ self.currentCodeFile ] = self.currentCodeFile = codeFile;

			self.editor.reset( self.codeFiles[ self.currentCodeFile ].code );
			self.buttonGroup.showFilename( self.currentCodeFile );
		} else {
			self.buttonGroup.showModalCodeFiles( function( button, selFiles, selProjects ) {
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
								command: "readSourceFiles",
								FileNames: selFiles,
								FileProjects: selProjects,
								FileType: self.fileType,
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
								sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
								sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = selFiles[ 0 ];
								$( "#control-bar-input input" ).val( self.currentCodeFile );
								self.buttonGroup.fillButtonControl( );

								self.editor.reset( self.codeFiles[ self.currentCodeFile ].code );
							} );
						}
					}

					if( openFiles.length ) {
						self.buttonGroup.showModalYesNo( openFiles.join( " " ), openFiles.length === 1? window.CPG.ProjectBarModalAlreadyOpenS : window.CPG.ProjectBarModalAlreadyOpenP, function( yes ) {
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
	},

   	////////////////////////////////////////////
	// storeCurrentCodeFile syncs the current code file with the global variable and the local storage
	storeCurrentCodeFile: function( ) {
		if( this.currentCodeFile ) {
			this.codeFiles[ this.currentCodeFile ].code = this.editor.text( );
			sessionStorage[ this.fileType + this.currentCodeFile ] = JSON.stringify( this.codeFiles[ this.currentCodeFile ] );		 
		}
	},

} );


var ButtonGroup = Backbone.View.extend( {
	projectBar: null,
	codeFileModal: null,
	yesNoModal: null,

	initialize: function( options ) {
		var self = this;

		this.el = options.el;
		this.projectBar = options.projectBar;

		this.fillDomElements( options.modalContainer );

		$( "#project-bar-new" ).on( 'click', function() { 
			self.projectBar.new(); 
		} );

	},

	fillDomElements: function( container ) {

		this.el.html(
			"<div class='btn-group'>" +
				"<button id='project-bar-new' type='button' class='btn btn-primary'>" + window.CPG.ProjectBarNew + "</button>" +
				"<div class='btn-group dropup'>" +
					"<button id='project-bar-open' class='btn btn-primary dropdown-toggle btn-md' type='button' data-toggle='dropdown'>" +
						"<span class='title'>" + window.CPG.ProjectBarOpen + " </span>" +
						"<span class='caret'></span>" +
					"</button>" +
					"<ul id= 'project-bar-open-files' class='dropdown-menu'>" +
					"</ul>" +
				"</div>" +
				"<button id='project-bar-save' type='button' class='btn btn-primary'>" + window.CPG.ProjectBarSave + "</button>" +
				"<div class='btn-group dropup'>" +
					"<button type='button' class='btn btn-primary dropup-toggle' data-toggle='dropdown'>" +
						"<span class='title'>" + window.CPG.ProjectBarAdministrate + " </span>" +
						"<span class='caret'></span>" +
					"</button>" +
					"<ul class='dropdown-menu' role='menu'>" +
						"<li id='project-bar-disinvite'>" + window.CPG.ProjectBarDisinvite + "</li>" +
						"<li id='project-bar-transfer'>" + window.CPG.ProjectBarTransfer + "</li>" +
						"<li id='project-bar-rename'>" + window.CPG.ProjectBarRename + "</li>" +
						"<hr>" +
						"<li id='project-bar-organize'>" + window.CPG.ProjectBarOrganize + "</li>" +
						"<li id='project-bar-save-template'>" + window.CPG.ProjectBarSaveTemplate + "</li>" +
						"<hr>" +
						"<li id='project-bar-message'>" + window.CPG.ProjectBarMessage + "</li>" +
						"<li id='project-bar-invite'>" + window.CPG.ProjectBarInvite + "</li>" +
						"<li id='project-bar-gallery'>" + window.CPG.ProjectBarGalleryOn + "</li>" +
					"</ul>" +
				"</div>" +
				"<div class='btn-group dropup'>" +
					"<button id='project-bar-mail' type='button' class='btn btn-primary dropup-toggle' data-toggle='dropdown'>" +
						"<span class='title'>" + window.CPG.ProjectBarMail +
						" <span class='badge'>0</span>" +
						" <span class='caret'></span>" +
					"</button>" +
					"<ul class='dropdown-menu' role='menu'>" +
				"</div>" +
				"<button id='project-bar-new' type='button' class='btn btn-primary'>" +
					"<span class='glyphicon glyphicon-star'><span class='badge'>0</span>" +
					" <span class='glyphicon glyphicon-share'></span><span class='badge'>0</span>" +
				"</button>" +
				"<div class='big-filename'></div>" +
			"</div>"
		);

		container.append(
			"<div id='project-bar-codefile-modal' class='modal fade'>" +
				"<div class='modal-dialog modal-lg'>" +
				"<div class='modal-content'>" +
					"<div class='modal-header'>" +
					"<button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times,</span></button>" +
					"<h4 class='modal-title'>" + window.CPG.ProjectBarModalCodefileTitle + "</h4>" +
					"</div>" +
					"<div class='modal-body'>" +
					"</div>" +
					"<div class='clearfix'></div>" +
					"<div class='modal-footer'>" +
					"<button type='button' class='modal-cancel pull-right btn btn-primary' data-dismiss='modal'>" + window.CPG.ProjectBarModalCancel + "</button>" +
					"</div>" +
				"</div><!-- /.modal-content -->" +
				"</div><!-- /.modal-dialog -->" +
			"</div><!-- /.modal -->	"
		);
		this.codeFileModal = $( "#project-bar-codefile-modal" );

		container.append(
			"<div id='project-bar-yes-no-modal' class='modal fade'>" +
				"<div class='modal-dialog'>" +
				"<div class='modal-content'>" +
					"<div class='modal-header'>" +
					"<button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times,</span></button>" +
					"<h4 class='modal-title'>You forgot to set the title!</h4>" +
					"</div>" +
					"<div class='modal-body'>" +
					"<p>You forgot to set the body text&hellip,</p>" +
					"</div>" +
					"<div class='modal-footer'>" +
					"<button type='button' class='modal-yes btn btn-default' data-dismiss='modal'>" + window.CPG.ProjectBarModalYes + "</button>" +
					"<button type='button' class='modal-no btn btn-primary' data-dismiss='modal'>" + window.CPG.ProjectBarModalNo + "</button>" +
					"</div>" +
				"</div><!-- /.modal-content -->" +
				"</div><!-- /.modal-dialog -->" +
			"</div><!-- /.modal -->	"
		);
		this.yesNoModal = $( "#project-bar-yes-no-modal" );
	},

	/////////////////////////////////////////////
	// fillButtonControl fills the file select button with current files
	fillButtonControl: function( ) {

        var self = this;

		// create file list for button control
		var fileList = [ ];
		for( var i=0 ; i<this.projectBar.codeFileList.length ; i++ ) {
			fileList.push( {
				fileName: this.projectBar.codeFileList[ i ],
				timeStamp: this.projectBar.codeFiles[ this.projectBar.codeFileList[ i ] ].timeStamp
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

		if( this.projectBar.allFilesList.length >= 2 ) {
			cbf.append( '<hr><li class="project-bar-open-file" codefile="all"><span>' + window.CPG.ControlBarAllFiles + '</span></li>' );
		}

		$( "#control-bar-current-file" ).text( this.projectBar.currentCodeFile );
		$( "#control-bar-input input" ).val( this.projectBar.currentCodeFile );
		$( ".project-bar-open-file" ).on( 'click', function( e ) { 
			
			self.projectBar.open( $( this ).attr( "codeFile" ) ); 
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

	///////////////////////////////////////////
	// showModalCodeFiles shows the code file info and modification dialog
	showModalCodeFiles: function( cb ) {
		var modal = this.codeFileModal;

		var afl = this.projectBar.allFilesList,
			files = $( "<div id='modal-codefiles'>" ),
			row = null;

		for( var i=0 ; i<afl.length ; i++ ) {
			files.append( 
				"<div class='file file" + i+" pull-left'>" + 
				" <div class='top'>" + 
				" </div>" + 
				" <div class='middle' filename='" + afl[ i ].name + "' project='" + afl[ i ].project + "'>" + 
				"	<img src='static/userdata/" + this.projectBar.userName + "/" +
						( afl[ i ].project !== "" ? "projects/" + afl[ i ].project + "/" : "") + this.projectBar.fileType + "/" +
						( afl[ i ].name.slice( 0, -this.projectBar.fileType.length - 1 ) + ".png" ) + "'>" +
				" </div>" +
				" <div class='bottom'>" +
				"	<span class='filename text-center'>" + afl[ i ].name + "</span>" + 
				"	<span class='timestamp pull-left vbottom'>" + this.getFormatedDate( afl[ i ].timeStamp ) + "</span>" +
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

		$( ".file .middle", modal ).on( "click", function( e ) {

			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );

			//if( !lcb ) debugger;
			if( lcb ) lcb( "open", [$( this ).attr( "filename" )], [$( this ).attr( "project" )] );
		} );
		
		$( ".modal-cancel", modal ).off( "click" ).one( "click", function( e ) {
			modal.modal( 'hide' );
		} );

		modal.one( 'hidden.bs.modal', function( e ) {
			if( cb ) cb( "cancel" );
		} );

		modal.modal( 'show' );
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// showModalYesNo displays a modal dialog with answers yes and no
	showModalYesNo: function( title, body, cb ) {
		var modal = this.yesNoModal;

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


    showFilename: function( filename ) {
        $( ".big-filename", this.el ).text( filename );
    },

});


} )( );
