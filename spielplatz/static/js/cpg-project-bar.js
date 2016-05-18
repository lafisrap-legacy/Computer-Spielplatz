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
	messages: [],			// List of messages that the user received

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
        this.messages = [];

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
							ProjectNames: projects,
							FileType: self.fileType
						}, function( message ) {
							for( var i=0 ; i<codeFilesToRead.length ; i++ ) {
								var fileName = codeFilesToRead[ i ],
									codeFile = message.CodeFiles[ fileName ];
								if( codeFile ) {
									self.codeFiles[ fileName ] = {
										code: codeFile.Code,
										timeStamp: codeFile.TimeStamp,
										project: codeFile.Project
									}
									sessionStorage[ fileName ] = JSON.stringify( self.codeFiles[ fileName ] );
									self.codeFileList.push( fileName );						  
								}
							}
							sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
							sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = self.codeFileList[ 0 ];
							self.buttonGroup.fillOpenControl( this );

							self.editor.reset( self.codeFiles[ self.currentCodeFile ].code );

							self.buttonGroup.showFilename( self.currentCodeFile, self.codeFiles[ self.currentCodeFile ].project !== "" ? 1 : 0 );
						} );
					} else {
						self.currentCodeFile = self.newFile;
						self.codeFileList = [ ];
						self.codeFiles[ self.currentCodeFile ] = { code: "", timeStamp: null };

						sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
						sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile;
						sessionStorage[ self.currentCodeFile ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] );

						self.buttonGroup.fillOpenControl( );
						self.editor.reset( "" );
						self._dirty = false;

						self.buttonGroup.showFilename( self.currentCodeFile, self.codeFiles[ self.currentCodeFile ].project !== "" ? 1 : 0 );
					}
				} );
			} else {

				self.buttonGroup.fillOpenControl( );
				
				self.editor.reset( self.codeFiles[ self.currentCodeFile ]? self.codeFiles[ self.currentCodeFile ].code : "" );
				self.buttonGroup.showFilename( self.currentCodeFile, self.codeFiles[ self.currentCodeFile ].project !== "" ? 1 : 0 );
			}
		});
	},

	new: function( ) {
		var self = this;

		var newFile = function( ) {
			sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = self.newFile;

			self.buttonGroup.showFilename( self.currentCodeFile, false );
			self.editor.reset( "" );

			self.storeCurrentCodeFile( );			
		};

		if( this.editor.modified() && self.currentCodeFile !== self.newFile ) {
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
			self.buttonGroup.showFilename( self.currentCodeFile, self.codeFiles[ self.currentCodeFile ].project !== "" );
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
								ProjectNames: selProjects,
								FileType: self.fileType,
							}, function( message ) {
								for( var i=0 ; i<selFiles.length ; i++ ) {
									var fileName = selFiles[ i ],
										codeFile = message.CodeFiles[ fileName ];
									if( codeFile ) {
										self.codeFiles[ fileName ] = {
											code: codeFile.Code,
											timeStamp: codeFile.TimeStamp,
											project: codeFile.Project
										}
										sessionStorage[ fileName ] = JSON.stringify( self.codeFiles[ fileName ] );
										if( self.codeFileList.indexOf( fileName ) === -1 ) self.codeFileList.push( fileName );
									}
								}
								sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
								sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = selFiles[ 0 ];
								self.buttonGroup.fillOpenControl( );

								self.editor.reset( self.codeFiles[ self.currentCodeFile ].code );
								self.buttonGroup.showFilename( self.currentCodeFile, self.codeFiles[ self.currentCodeFile ].project !== "" ? 1 : 0 );
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
				}
			} );
		}
	},

	save: function( ) {

		var self = this,
			fileName = this.currentCodeFile;

		if( fileName === this.newFile ) {
			this.buttonGroup.showModalStringInput(
				window.CPG.ProjectBarModalSaveFilename, 
				window.CPG.ProjectBarModalSaveFilename2, 
				"", 
				window.CPG.ProjectBarModalSave, 
				function( fileName ) {
					if( fileName && fileName !== "" ) {
						if( fileName.slice( -self.fileType.length - 1 ) != "." + self.fileType ) {
							fileName += "." + self.fileType;
						}
						self.saveSourceFile( fileName );
					}
				} 
			);
		} else {
			self.saveSourceFile( fileName, self.codeFiles[ fileName ].project );
		}
	},

	saveProject: function( ) {
		var self = this;

		console.log( "saveProject! " + this.isSaving );

		if( !this.isSaving ) {

			this.isSaving = true;
			this.editor.getScreenshot( function ( data ) {

				// remove BASE64-HTML header
				var image = data.substr( data.search( "," )+1 ),
				projectName = self.codeFiles[ self.currentCodeFile ] && self.codeFiles[ self.currentCodeFile ].project || "";
				fileName = self.currentCodeFile !== self.newFile ? self.currentCodeFile : "";

				if(  projectName === "" ) {
					projectName = self.currentCodeFile.substr( 0, self.currentCodeFile.length - self.fileType.length - 1 );

					self.buttonGroup.showModalStringInput( window.CPG.ProjectBarModalProjectInit , window.CPG.ProjectBarModalProjectInit2, projectName, window.CPG.ProjectBarModalProjectInitOk, function( name ) {

						var code = self.editor.moveResources( name );
						if( name ) {

							self.buttonGroup.showSaving( "...", true );

							// Initialize new project
							$WS.sendMessage( {
								Command: "initProject",
								ProjectName: name,
								FileType: self.fileType,
								FileNames: [ fileName ],
								CodeFiles: [ code ],
								ResourceFiles: self.editor.resources(),
			 					Images : [ image ], 
							}, function( message ) {
								if( message.Error ) {
									self.isSaving = false;

									self.saveProject();
								} else {
									// Success: Project was created
									var newCodeFile = name + "." + self.fileType;

									self.codeFiles[ newCodeFile ] = {
										code: code,
										project: name,
										timeStamp: message.SavedTimeStamps[0]
									};

									if( newCodeFile !== self.currentCodeFile ) {
										self.codeFileList.unshift( newCodeFile );
										self.allFilesList.unshift( self.codeFiles[ newCodeFile ] );

										if( self.currentCodeFile !== self.newFile ) {
											delete self.codeFiles[ self.currentCodeFile ];
											self.codeFileList.splice( self.codeFileList.indexOf( self.currentCodeFile ), 1 );
											self.allFileList.splice( self.allFileList.indexOf( self.codeFiles[ self.currentCodeFile ] ), 1 );
										}
										
										self.currentCodeFile = newCodeFile;
									}

									sessionStorage[ self.currentCodeFile ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] );
									sessionStorage[ self.fileType + "AllFilesList" ] = JSON.stringify( self.allFilesList );
									sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
									sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile;
									self.buttonGroup.fillOpenControl( );

									self.buttonGroup.showSaving( "success", true );
									self.buttonGroup.showFilename( self.currentCodeFile, self.codeFiles[ self.currentCodeFile ].project !== "" );

									self.isSaving = false;
								}
							} );																	
						} else {
							self.isSaving = false;
							return
						}
					} );

				} else {
					self.buttonGroup.showModalStringInput( window.CPG.ProjectBarModalProjectSave, window.CPG.ProjectBarModalProjectSave2, "", window.CPG.ProjectBarModalProjectSaveOk, function( commit ) {
						if( commit ) {
							self.buttonGroup.showSaving( "...", true );

							var projectName = self.codeFiles[ self.currentCodeFile ].project,
								code = self.editor.moveResources( projectName );

							(function sendWriteProject( ) {

								// Save project
								$WS.sendMessage( {
									Command: "writeProject",
									ProjectName: projectName,
									FileType: self.fileType,
									FileNames: [ fileName ],
									CodeFiles: [ code ],
									TimeStamps: self.codeFiles[ fileName ] && [ self.codeFiles[ fileName ].timeStamp ] || null,
									ResourceFiles: self.editor.resources(),
									Images : [ image ],
									Commit: commit
								}, function( message ) {
									if( message.Error ) {
										self.isSaving = false;

										console.log( "Error writing project: ", message.Error );

									} else if( message.OutdatedTimeStamps.length > 0 ) {

										self.buttonGroup.showModalYesNo( fileName, window.CPG.ProjectBarModalFileOutdated, function( yes ) {
											if( yes ) {
												self.codeFiles[ fileName ].timeStamp = message.OutdatedTimeStamps[ 0 ] 
												sendWriteProject();
											} else {
												self.buttonGroup.showSaving( false, true );
											}
										} );
									} else if( message.Conflicts ) {
										self.buttonGroup.showModalOk( window.CPG.ProjectBarModalConflicts, window.CPG.ProjectBarModalConflicts2, function() {
											self.readSourceFiles( fileName, projectName, function() {
												self.buttonGroup.showSaving( "warning", true );
												self.isSaving = false;
											} );
										} );
									} else {
										self.readSourceFiles( fileName, projectName, function() {
											self.buttonGroup.showSaving( "success", true );
											self.isSaving = false;
										} );
									}
								} );
							})();
						} else {
							self.isSaving = false;
						}
					});
				}
			});
		}
	},

	inviteToProject: function() {
		var self = this;

		// Save project
		$WS.sendMessage( {
			Command: "readPals",
		}, function( message ) {
			self.buttonGroup.showModalInvite( message.Pals, function( userNames ) {
				if( userNames ) {
					$WS.sendMessage( {
						Command: "sendInvitations",
						UserNames: userNames,
						ProjectName: self.codeFiles[ self.currentCodeFile ].project,
					}, function( message ) {
						// Fehlerbehandlung hinzufügen
					} );
				}
			});
		} );
	},

	readSourceFiles: function( fileName, projectName, cb ) {

		var self = this;

		$WS.sendMessage( {
			command: "readSourceFiles",
			FileNames: [ fileName ],
			ProjectNames: [ projectName ],
			FileType: this.fileType,
		}, function( message ) {
			var codeFile = message.CodeFiles[ fileName ];
			if( codeFile ) {
				self.codeFiles[ fileName ] = {
					code: codeFile.Code,
					timeStamp: codeFile.TimeStamp,
					project: codeFile.Project
				}
				sessionStorage[ fileName ] = JSON.stringify( self.codeFiles[ fileName ] );
			}

			self.editor.reset( self.codeFiles[ self.currentCodeFile ].code );
			if( cb ) cb();
		} );
	},

	saveSourceFile: function( fileName, project, cb ) {

		var self = this;

		this.buttonGroup.showSaving( "..." );
		var code = this.editor.text( );

		this.editor.getScreenshot( function ( data ) {

			// remove BASE64-HTML header
			var image = data.substr( data.search( "," )+1 );

			$WS.sendMessage( {
				Command: "writeSourceFiles",
				FileNames: [ fileName ],
				ProjectName: project || "",
				FileType: self.fileType,
				TimeStamps: self.codeFiles[ fileName ] && [ self.codeFiles[ fileName ].timeStamp ] || null,
				CodeFiles: [ code ],
				Overwrite: self.currentCodeFile === fileName,
				Images : [ image ], 
			}, function( message ) {

				if( message.Error ) {
					self.buttonGroup.showModalYesNo( window.CPG.ProjectBarModalFileExists, message.Error, function( yes ) {
						if( yes ) {
							self.currentCodeFile = fileName;
							self.saveSourceFile( fileName, project );
						} else {
							self.buttonGroup.showSaving( false );
							cb( false );
						}
					} );
					return false;

				} else if( self.currentCodeFile !== fileName ) {

					self.codeFiles[ self.currentCodeFile ].code = self.editor.text( );
					self.codeFileList.push( fileName );

					for( var i=0, filenameExists=false, afl=self.allFilesList ; i<afl.length ; i++ ) {
						if( afl[ i ].name === fileName ) {
							filenameExists = true;
							break;
						}
					}

					if( !filenameExists ) self.allFilesList.push( {
						name: fileName,
						timeStamp: self.codeFiles[ self.currentCodeFile ].timeStamp,
						project: self.codeFiles[ self.currentCodeFile ].Project
					} );
					sessionStorage[ self.currentCodeFile ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] );
					sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
					sessionStorage[ self.fileType + "AllFilesList" ] = JSON.stringify( self.allFilesList );
					sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = fileName;

					self.buttonGroup.showFilename( self.currentCodeFile, self.codeFiles[ self.currentCodeFile ].project !== "" ? 1 : 0 );

				} else if( message.OutdatedTimeStamps.length > 0 ) {

					self.buttonGroup.showModalYesNo( fileName, window.CPG.ProjectBarModalFileOutdated, function( yes ) {
						if( yes ) {
							self.codeFiles[ fileName ].timeStamp = message.OutdatedTimeStamps[ 0 ] 
							self.saveSourceFile( fileName, project );
						} else {
							self.buttonGroup.showSaving( false );
							cb( false );
						}
					} );
					return false;
				} 

				self.codeFiles[ fileName ] = { 
					code: code,
					timeStamp: message.SavedTimeStamps[ 0 ],
					project: project
				};
				sessionStorage[ fileName ] = JSON.stringify( self.codeFiles[ fileName ] );
				self.buttonGroup.fillOpenControl( );
				self.editor.setClean();
				self.buttonGroup.showSaving( "success" );
				self.buttonGroup.showFilename( self.currentCodeFile, self.codeFiles[ self.currentCodeFile ].project !== "" );
				
				if( cb ) cb( true );
		   } );
		} );
	},

   	////////////////////////////////////////////
	// storeCurrentCodeFile syncs the current code file with the global variable and the local storage
	storeCurrentCodeFile: function( ) {
		if( this.currentCodeFile ) {
			this.codeFiles[ this.currentCodeFile ].code = this.editor.text( );
			sessionStorage[ this.fileType + this.currentCodeFile ] = JSON.stringify( this.codeFiles[ this.currentCodeFile ] );		 
		}
	},

	////////////////////////////////////////////
	// refreshSession takes care of the sessionStore when user changes
	refreshSession: function( loginTime ) {

		// If User changed: clear everything from sessionStorage
		if( sessionStorage.ĈPG_loginTime !== loginTime ) {
			var fileList = sessionStorage[ this.fileType + "CodeFileList" ] && JSON.parse( sessionStorage[ this.fileType + "CodeFileList" ] ) || [ ];
			for( var i=0 ; i<fileList.length ; i++ ) sessionStorage.removeItem( fileList[ i ] );
			sessionStorage.removeItem( this.fileType + "CodeFileList" );
			sessionStorage.removeItem( this.fileType + "AllFilesList" );
			sessionStorage.removeItem( this.fileType + "CurrentCodeFile" );
			localStorage.ĈPG_loginTime = sessionStorage.ĈPG_loginTime = loginTime;
		}

		// Look if another Tab or window logged out ( and maybe in again ) in the meantime
		$( window ).focus( function( e ) {
			if( sessionStorage.ĈPG_loginTime !== localStorage.ĈPG_loginTime ) location.reload( ); 
		} ); 
	},

	refreshMails: function() {
		var self = this;

		$WS.sendMessage( {
			Command: "readNewMessages",
			MessageIds: this.messages,
		}, function( message ) {
			var m = message.Messages;
			for( var i=0 ; i<m.length ; i++ ) {
	            self.buttonGroup.addMessage( m[i] );
			}
		});
	},
} );


var ButtonGroup = Backbone.View.extend( {
	projectBar: null,
	codeFileModal: null,
	yesNoModal: null,
	stringInputModal: null,

	initialize: function( options ) {
		var self = this;

		this.el = options.el;
		this.projectBar = options.projectBar;

		this.fillDomElements( options.modalContainer );

		$( "#project-bar-new" ).on( 'click', function() { self.projectBar.new(); } );
		$( "#project-bar-save" ).on( 'click', function() { self.projectBar.save(); } );
		$( "#project-bar-save-as" ).on( 'click', function() { self.projectBar.saveAs(); } );
		$( "#project-bar-save-project" ).on( 'click', function() { self.projectBar.saveProject(); } );
		$( "#project-bar-invite" ).on( 'click', function() { self.projectBar.inviteToProject(); } );
		$( "#project-bar-mail" ).on( 'click', function() { self.projectBar.refreshMails(); } );
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
				"<button id='project-bar-save-project' type='button' class='btn btn-primary'>" + window.CPG.ProjectBarSaveProject + "</button>" +
				"<div class='btn-group dropup'>" +
					"<button id='project-bar-admin' type='button' class='btn btn-primary dropup-toggle' data-toggle='dropdown' disabled>" +
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
						"<li id='project-bar-other-version'>" + window.CPG.ProjectBarOtherVersion + "</li>" +
						"<hr>" +
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
				"<button id='project-bar-display' type='button' class='btn btn-primary'>" +
					"<span class='glyphicon glyphicon-star'><span class='badge'>0</span>" +
					" <span class='glyphicon glyphicon-share'></span><span class='badge'>0</span>" +
				"</button>" +
				"<div class='big-filename'>" +
					"<span class='name'></span>" +
					"<span class='project'></span>" +
					"<span class='points'></span>" +
				"</div>" +
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

		container.append(
			"<div id='project-bar-ok-modal' class='modal fade'>" +
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
					"<button type='button' class='modal-ok btn btn-default' data-dismiss='modal'>" + window.CPG.ProjectBarModalOk + "</button>" +
					"</div>" +
				"</div><!-- /.modal-content -->" +
				"</div><!-- /.modal-dialog -->" +
			"</div><!-- /.modal --> "
		);
		this.okModal = $( "#project-bar-ok-modal" );

		container.append(
			"<div id='project-bar-string-input-modal' class='modal fade'>" +
				"<div class='modal-dialog'>" +
				"<div class='modal-content'>" +
					"<div class='modal-header'>" +
					"<button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times,</span></button>" +
					"<h4 class='modal-title'>You forgot to set the title!</h4>" +
					"</div>" +
					"<div class='modal-body'>" +
						"<p>You forgot to set the body text&hellip,</p>" +
						"<div class='form-group'>" +
						  "<label class='input-label' for='project-bar-input'></label>" +
						  "<input type='text' class='form-control' id='project-bar-input'>" +
						"</div>" +
					"</div>" +
					"<div class='modal-footer'>" +
						"<button type='button' class='modal-cancel btn btn-default' data-dismiss='modal'>" + window.CPG.ProjectBarModalCancel + "</button>" +
						"<button type='submit' class='modal-action btn btn-primary' data-dismiss='modal'></button>" +
					"</div>" +
				"</div><!-- /.modal-content -->" +
				"</div><!-- /.modal-dialog -->" +
			"</div><!-- /.modal --> "
		);
		this.stringInputModal = $( "#project-bar-string-input-modal" );

   		container.append(
			"<div id='project-bar-invite-modal' class='modal fade'>" +
				"<div class='modal-dialog'>" +
				"<div class='modal-content'>" +
					"<div class='modal-header'>" +
					"<button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times,</span></button>" +
					"<h4 class='modal-title'>" + window.CPG.ProjectBarModalInvite + "</h4>" +
					"</div>" +
					"<div class='modal-body'>" +
						"<p>" + window.CPG.ProjectBarModalInvite2 + "</p>" +
						"<div class='invitees'></div>" +
					"</div>" +
					"<div class='modal-footer'>" +
					"<button type='button' class='modal-invite btn btn-primary' data-dismiss='modal'>" + window.CPG.ProjectBarModalInviteOk + "</button>" +
					"<button type='button' class='modal-cancel btn btn-default pull-left' data-dismiss='modal'>" + window.CPG.ProjectBarModalCancel + "</button>" +
					"</div>" +
				"</div><!-- /.modal-content -->" +
				"</div><!-- /.modal-dialog -->" +
			"</div><!-- /.modal -->	"
		);
		this.inviteModal = $( "#project-bar-invite-modal" );
	},

	/////////////////////////////////////////////
	// fillOpenControl fills the file select button with current files
	fillOpenControl: function( ) {

		var self = this;

		// create file list for button control
		var fileList = [ ];
		for( var i=0 ; i<this.projectBar.codeFileList.length ; i++ ) {
			fileList.push( {
				fileName: this.projectBar.codeFileList[ i ],
				timeStamp: this.projectBar.codeFiles[ this.projectBar.codeFileList[ i ] ].timeStamp,
				project: this.projectBar.codeFiles[ this.projectBar.codeFileList[ i ] ].project
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
			cbf.append( '<hr><li class="project-bar-open-file" codefile="all"><span>' + window.CPG.ProjectBarAllFiles + '</span></li>' );
		}

		$( "#control-bar-current-file" ).text( this.projectBar.currentCodeFile );
		$( "#control-bar-input input" ).val( this.projectBar.currentCodeFile );
		$( ".project-bar-open-file" ).on( 'click', function( e ) { 
			
			self.projectBar.open( $( this ).attr( "codeFile" ) ); 
		} );
	},


    /////////////////////////////////////////////
    // addMessage add one message to the messages list
    addMessage: function( message ) {
        var button = $( "#project-bar-mail" ).parent();
        $( ".dropdown-menu", button ).append( "<li message-id='" + message.Id + "'>" + message.Subject + "</li>" );

        $( ".badge", button ).text( $( ".dropdown-menu li", button ).length );
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
				var fileName = $( ".file" + i+" .filename", files ),
					maxWidth = fileName.width( ),
					realWidth = fileName[ 0 ].scrollWidth;

				if( realWidth > maxWidth ) {
					var fontSize = parseFloat( fileName.css( "font-size" ) );

					for( var j=1 ; j<10 ; j++ ) {
						fileName.css( "font-size", ( fontSize - j ) );
						if( fileName[ 0 ].scrollWidth <= maxWidth ) break;
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
	// showModalInvite displays a modal dialog with a list of all group members of a user
	showModalInvite: function( pals, cb ) {
		var modal = this.inviteModal,
			invitees = $( ".invitees", modal ).html( "" );

		for( p in pals ) {
			var pal = pals[p];

			invitees.append( "<div class='group-name'>" + p + "</div>" );

			for( var i = 0 ; i < pal.length ; i++ ) {
				invitees.append( "<span class='user'>" +
						"<span class='username'>" + pal[i] + "</span>" + 
						"<label><input type='checkbox' value='' user='" + pal[i] + "'></label>" +
					"</span>"
				);
			}
		}

		$( ".modal-invite", modal ).off( "click" ).one( "click", function( e ) {
			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );

			// Retrieve checked users
			var userNames = [];
			$( "[type=checkbox]", modal ).each( function() {
				var user = $( this ).attr( "user" );

				if( $(this).prop('checked') && userNames.indexOf( user ) === -1 ) {
					userNames.push( user );
				}
			});

			if( lcb ) lcb( userNames );
		} );
		$( ".modal-cancel", modal ).off( "click" ).one( "click", function( e ) {
			// cb is called on hide event
			modal.modal( 'hide' );
		} );

		$( "[type=checkbox]", modal ).change( function() {
			var user = $( this ).attr( "user" ),
				checked = $(this).prop('checked');

			$( "[user='" + user + "']", modal ).each(function(){
				$( this ).prop( 'checked', checked );
			});
		});

		modal.modal( 'show' );
		modal.one( 'hidden.bs.modal', function( e ) {
			if( cb ) cb( null );
		} );
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

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// showModalOk displays a modal dialog with only an ok button
	showModalOk: function( title, body, cb ) {
		var modal = this.okModal;

		$( ".modal-title", modal ).text( title );
		$( ".modal-body p", modal ).text( body );
		$( ".modal-ok", modal ).off( "click" ).one( "click", function( e ) {
			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );
			if( lcb ) lcb( );
		} );

		modal.modal( 'show' );
		modal.one( 'hidden.bs.modal', function( e ) {
			if( cb ) cb( );
		} );
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// showModalStringInput displays a modal dialog for string input
	showModalStringInput: function( title, body, value, action, cb ) {
		var modal = this.stringInputModal,
			input = modal.find( "input" );

		$( ".modal-title", modal ).text( title );
		$( ".modal-body p", modal ).text( body );
		$( ".modal-action", modal ).text( action );

		input.val( value );

		$( ".modal-action", modal ).off( "click" ).one( "click", function( e ) {
			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );
			if( lcb ) lcb( input.val() );
		} );

		$( ".modal-cancel", modal ).off( "click" ).one( "click", function( e ) {
			// cb is called on hide event
			modal.modal( 'hide' );
		} );

		modal.one( "shown.bs.modal", function () {
			input.focus();
		});

		modal.keypress( function( e ) {
			if(e.which == 13) {
				$( ".modal-action", modal ).trigger( "click" );
			}
		})

		modal.modal( 'show' );
		modal.one( 'hidden.bs.modal', function( e ) {
			if( cb ) cb( false );
		} );
	},

	showSaving: function( show, project ) {
		var button = $( project ? "#project-bar-save-project" : "#project-bar-save" ),
			text = project ? window.CPG.ProjectBarSaveProject : window.CPG.ProjectBarSave;

		if( !show ) {
			button.text( text );
		} else if( show === "..." ) {
			button.text( "..." );
		} else if( show === "success" || show === "warning" ) {
			button.text( window.CPG.ProjectBarSaved )
					.removeClass( "btn-primary" ).addClass( "btn-" + show );
			setTimeout( function( ) { 
				button.text( text )
					.addClass( "btn-primary" ).removeClass( "btn-" + show );
			}, 2000 );
		}
 	},

	showFilename: function( fileName, projectMembers ) {
		$( ".big-filename .name", this.el ).text( fileName );
		if( projectMembers ) {
			for( var i = 0, points = "" ; i < projectMembers ; i++ ) points += ".";
			$( ".big-filename .project", this.el ).text( window.CPG.ProjectBarProject );
			$( ".big-filename .points", this.el ).text( points );

			this.activateProject( true );
		} else {
			$( ".big-filename .project", this.el ).text( "" );
			$( ".big-filename .points", this.el ).text( "" );			

			this.activateProject( false );
		}
	},

	activateProject: function( activate ) {

		if( activate )  $( "#project-bar-admin").removeAttr( "disabled" );
		else			$( "#project-bar-admin").attr( "disabled", "" );
	},
});


} )( );
