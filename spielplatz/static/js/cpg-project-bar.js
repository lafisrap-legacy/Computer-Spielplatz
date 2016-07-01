/////////////////////////////////////////////////////////////////////////////////////////////////
// Project-Control-Bar

( function( ) {

window.ProjectControlBar = Backbone.Model.extend( {
	userName: null,				// Logged in user, or ""
	editor: null,				// Live editor, graphics editor, sound editor
	buttonGroup: null,			// The bootstrap button group belonging to the project bar
	fileType: null,				// pjs, html, paper, go, svg, ani ...
	newFile: null,				// Filename if non is specified

	codeFileList: null,			// A list of all currently loaded files
	allFilesList: null,			// A list of all files available from the user account
	currentCodeFile: null,		// File that is currently worked on
	codeFiles: {},				// Loaded files, key is filename
	messages: [],				// List of messages that the user received

	wsAdress: null,				// Websockets address
	wsToken: null,				// Token used to authenticate with the server
	reconnectInterval: null,	// Interval id of reconnection interval
	reconnectCbs: [],			// Callbacks that should be called after connection is back

	disableProjectInit: null,	// Some editors need to disable the project init

	// Message constants
	MSG_INVITE: 0,
	MSG_ACCEPT: 1,
	MSG_CHANGE: 2,

	// Status constants
    STATUS_OK: 0,
    STATUS_UNCOMMITTED: 1,

	initialize: function( options ) {
		var self = this;

		options.projectBar = this;
		this.buttonGroup = new ButtonGroup( options );
		this.el = options.el;
		this.userName = options.userName || "";
		this.editor = options.editor;
		this.fileType = options.fileType || "pjs";
		this.newFile = options.newFile || "noname.pjs";
		this.disableProjectInit = options.disableProjectInit;

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
		this.allProjects = sessionStorage[ "allProjects" ] && JSON.parse( sessionStorage[ "allProjects" ] ) || [ ],
		this.currentCodeFile = sessionStorage[ this.fileType + "CurrentCodeFile" ] || this.newFile;
		this.codeFiles = {};
        this.messages = [];

		for( var i = 0 ; i < this.codeFileList.length ; i++ ) {
			this.codeFiles[ this.codeFileList[ i ] ] = sessionStorage[ this.codeFileList[ i ] ] && JSON.parse( sessionStorage[ this.codeFileList[ i ] ] ) || {};
		}
		this.codeFiles[ this.newFile ] = sessionStorage[ this.newFile ] && JSON.parse( sessionStorage[ this.newFile ] ) || { code: "", name: this.newFile };

		//////////////////////////////////////////////
		// Connect to websocket server and load file info
		if( this.userName && this.userName != "" ) {
			this.wsAddress = options.wsAddress;
			this.wsToken = options.wsToken;
			this.connect( );
		} else {
			this.editor.reset( this.codeFiles[ this.newFile ].code || "" );
		}

		//////////////////////////////////////////////////
		// For testing
		$("#project-button-textarea-for-testing").css( "height", 0 )
		.on("set-live-editor", function(e) {
			self.editor.reset( $(this).val() );
		})
		.on("get-live-editor", function(e) {
			$(this).val( self.editor.text() );
		});
	},

	/////////////////////////////////////////////////////////////
	// Connect to the WebSockets server
	connect: function( ) {
		var self = this;

		$WS.connect( this.wsAddress, this.wsToken, function( cb ) { self.reconnect( cb ) }, function( ) {

			if( !sessionStorage[ self.fileType + "CodeFileList" ] ) {

				self.refreshMails();

				$WS.sendMessage( {
					Command: "readDir",
					FileType: self.fileType
				}, function( message ) {
					if( message.Error ) {
						console.error("WebSockets connection error:", message.Error);
						return
					}

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

					self.allProjects = message.Projects;
					if( self.allProjects ) sessionStorage[ "allProjects" ] = JSON.stringify( self.allProjects );

					for( var i=0, codeFilesToRead = [], projects = [] ; i < 5 && i < files.length ; i++ ) {
						codeFilesToRead.push( files[ i ].name );
						projects.push( files[ i ].project );
					}

					if( codeFilesToRead.length ) {
						self.readSourceFiles( codeFilesToRead, projects );
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

						self.buttonGroup.showFilename();
					}
				} );
			} else {

				self.buttonGroup.fillOpenControl( );
				
				self.editor.reset( self.codeFiles[ self.currentCodeFile ]? self.codeFiles[ self.currentCodeFile ].code : "" );
				self.buttonGroup.showFilename();
			}
		});
	},

	reconnect: function( cb ) {
		var self = this;

		if( cb === false ) {
			this.buttonGroup.hideModalWaiting();
			return;
		}

		if( this.reconnectInterval ) {
			// An interval is already running
			this.reconnectCbs.push( cb );
		}

		this.buttonGroup.showModalWaiting( window.CPG.ProjectBarModalBadConnection, window.CPG.ProjectBarModalBadConnection2, function( ok ) {
			console.log("Clearing reconnection interval after user cancel:", self.reconnectInterval);
			clearInterval( self.reconnectInterval );
			self.reconnectInterval = null;
			cb( false );
			return;
		} );

		this.reconnectInterval = setInterval( function() {
			if( !$WS.isConnected() ) {

				$WS.connect( self.wsAddress, self.wsToken, function( cb ) { self.reconnect( cb ) }, function( ) {

					console.log("Clearing reconnection interval after connection is back.", self.reconnectInterval);
					clearInterval( self.reconnectInterval );
					self.reconnectInterval = null;

					$WS.sendMessage( {
						Command: "getStatus",
						FileType: self.fileType
					}, function( message ) {
						if( message.Error === "no connection" ) {
							self.buttonGroup.hideModalWaiting();
							console.error("WebSockets connection error:", message.Error);
							self.reconnect( cb );
							return
						} else if( message.Error ) {
							console.error("Unknown error after getStatus call.");
						}

						if( message.Status === "Ok" ) {
							self.buttonGroup.hideModalWaiting();
							cb( true );
							for( var i = 0; i < self.reconnectCbs.length; i++ ) {
								self.reconnectCbs[i]( true );
							}
							self.reconnectCbs = [];

						} else if( message.Status === "no session" ) {
							self.codeFiles[ self.currentCodeFile ].code = self.editor.text();
							sessionStorage[ self.currentCodeFile ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] );
							sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile;
							self.editor.setClean();

							setTimeout( function() {
								self.buttonGroup.hideModalWaiting();
								var href = window.location.href;
								window.location.href = href.substr( 0, href.search( "\\?" ) ) + "?wstoken=" + self.wsToken;								
							}, 5000);
						} else {
							console.error( "Illegal state after calling getStatus." );
						}
					});
				} );
			}
		}, 5000);
		console.log("Setting reconnection interval.", self.reconnectInterval);
	},

	new: function( ) {
		var self = this;

		var newFile = function( ) {

			// Set the current code file name and the list entry of all currently loaded code files
			sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = self.newFile;
			self.codeFiles[ self.newFile ] = { code: "", name: self.newFile };
			sessionStorage[ self.newFile ] = JSON.stringify( self.codeFiles[ self.newFile ] );

			self.buttonGroup.showFilename();
			self.editor.reset( "" );
		};

		if( this.editor.modified() && self.currentCodeFile !== self.newFile ) {
			self.buttonGroup.showModalYesNo( window.CPG.ProjectBarModalFileChanged, window.CPG.ProjectBarModalFileChanged2, false, function( res ) {
				if( res === "yes" ) {
					self.saveSourceFile( self.currentCodeFile, self.codeFiles[ self.currentCodeFile ].project, false, function( ) { newFile( ); } ); 
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
			self.codeFiles[ self.currentCodeFile ].code = self.editor.text();
			sessionStorage[ self.currentCodeFile ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] );
		}
 
		if( codeFile !== "all" ) {

			sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = codeFile;

			self.editor.reset( self.codeFiles[ self.currentCodeFile ].code );
			self.buttonGroup.showFilename();
		} else {
			self.buttonGroup.showModalCodeFiles( function( button, selFiles, selProjects ) {
				switch( button ) {

				/////////////////////////////////////////////////
				// User selected "open"
				case "open":
					for( var i=0, openFiles=[ ] ; i<selFiles.length ; i++ ) {
						if( self.codeFileList.indexOf( selFiles[ i ] ) !== -1 ) openFiles.push( selFiles[ i ] );
					}

					if( openFiles.length ) {
						self.buttonGroup.showModalYesNo( 	openFiles.join( " " ),
															openFiles.length === 1? window.CPG.ProjectBarModalAlreadyOpenS : window.CPG.ProjectBarModalAlreadyOpenP,
															false,
															function( res ) {
							if( res === "no" ) {
								for( var i=openFiles.length-1 ; i>=0 ; i-- ) selFiles.splice( selFiles.indexOf( openFiles[ i ] ),1 );
							}

							if( selFiles.length ) self.readSourceFiles( selFiles, selProjects );
						} );
					} else {
						self.readSourceFiles( selFiles, selProjects );
						$("#project-button-textarea-for-testing").trigger("get-live-editor");
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

	save: function( saveAs ) {

		var self = this,
			fileName = this.currentCodeFile,
			selProjects = this.disableProjectInit;	// If project init is disabled allow project selection

		if( saveAs || fileName === this.newFile ) {
			this.buttonGroup.showModalStringInput(
				window.CPG.ProjectBarModalSaveFilename, 
				window.CPG.ProjectBarModalSaveFilename2, 
				"", 
				window.CPG.ProjectBarModalSave,
				selProjects? window.CPG.ProjectBarModalProjects : null, 
				selProjects? this.allProjects : [],
				function( fileName, projectName ) {
					if( !fileName ) return;

					if( fileName !== "" ) {
						if( fileName.slice( -self.fileType.length - 1 ) != "." + self.fileType ) {
							fileName += "." + self.fileType;
						}

						if( fileName !== self.newFile && (!self.checkCodeFile( fileName ) || !self.checkCodeFile( fileName ).project) ) {
							self.saveSourceFile( fileName, projectName );
						} else {
							self.buttonGroup.showModalOk( window.CPG.ProjectBarModalFileExists, window.CPG.ProjectBarModalFileExists2, function() {
								self.isSaving = false;
								self.saveAs();
							} );
						}
					}
				} 
			);
		} else {
			self.saveSourceFile( fileName, self.codeFiles[ fileName ].project );
		}
	},

	saveAs: function( ) {
		this.save( true );
	},

	saveProject: function( ) {
		var self = this;

		if( !this.isSaving ) {

			this.isSaving = true;
			this.editor.getScreenshot( function ( data ) {

				// remove BASE64-HTML header
				var image = data.substr( data.search( "," )+1 ),
				projectName = self.codeFiles[ self.currentCodeFile ] && self.codeFiles[ self.currentCodeFile ].project || "";
				fileName = self.currentCodeFile !== self.newFile ? self.currentCodeFile : "";

				if( projectName === "" ) {
					projectName = fileName.substr( 0, fileName.length - self.fileType.length - 1 );

					self.buttonGroup.showModalStringInput( window.CPG.ProjectBarModalProjectInit , window.CPG.ProjectBarModalProjectInit2, projectName, window.CPG.ProjectBarModalProjectInitOk, null, [], function( name ) {

						if( !name || name === "" ) {
							self.isSaving = false;
							self.buttonGroup.showSaving( false, true );
							return;
						}

						var res = self.editor.moveResources( name ),
							code = res.code;

						// Look if the selected name is already used (and not the current one)
						var fileExists = false;
						if( name !== self.currentCodeFile.substr( 0, self.currentCodeFile.length - self.fileType.length - 1 )) {
							for( var i = 0; i < self.allFilesList.length ; i++ ) {
								if( self.allFilesList[i].name === name + "." + self.fileType ) {
									fileExists = true;
									break;
								}
							}
						}

						if( fileExists ) {
							self.buttonGroup.showModalOk( window.CPG.ProjectBarModalFileExists, window.CPG.ProjectBarModalFileExists2, function() {
								self.isSaving = false;
								self.saveProject();
							} );

							self.isSaving = false;
							return
						} else if( name && name !== self.newFile.substr( 0, self.newFile.length - self.fileType.length - 1 ) ) {

							self.buttonGroup.showSaving( "...", true );

							// Initialize new project
							$WS.sendMessage( {
								Command: 		"initProject",
								ProjectName: 	name,
								FileType: 		self.fileType,
								FileName: 		fileName,
								CodeFile: 		code,
								ResourceFiles: 	self.editor.resources(),
			 					Image: 			image, 
							}, function( message ) {
								if( message.Error ) {
									if( message.Error === "project exists" ) {
										self.buttonGroup.showModalOk( window.CPG.ProjectBarModalProjectExists, window.CPG.ProjectBarModalProjectExists2, function() {
											self.isSaving = false;
											self.saveProject();
										} );
									} else if( message.Error === "no connection" ) {
										console.error("WebSockets connection error:", message.Error);
										self.isSaving = false;
										self.buttonGroup.showSaving( false, true );
										return
									} else {
										console.error("Unknown error after getStatus call:", message.Error);
									}
								} else {
									// Success: Project was created
									var newCodeFile = name + "." + self.fileType;

									self.codeFiles[ newCodeFile ] = {
										name: newCodeFile,
										code: code,
										project: name,
										timeStamp: message.SavedTimeStamp,
										rights: message.Rights,
										users: message.Users,
										status: message.Status
									};

									self.editor.reset( code );

									self.codeFileList.unshift( newCodeFile );
									self.allFilesList.unshift( {
										name: self.codeFiles[ newCodeFile ].name,
										timeStamp: self.codeFiles[ newCodeFile ].timeStamp,
										project: self.codeFiles[ newCodeFile ].project 
									} );

									if( newCodeFile !== self.currentCodeFile ) {
										if( self.currentCodeFile !== self.newFile ) {
											delete self.codeFiles[ self.currentCodeFile ];
											self.codeFileList.splice( self.codeFileList.indexOf( self.currentCodeFile ), 1 );
											self.allFilesList.splice( self.allFilesList.indexOf( self.checkCodeFile( self.currentCodeFile ) ), 1 );
										}
										
										self.currentCodeFile = newCodeFile;
									}

									sessionStorage[ self.currentCodeFile ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] );
									sessionStorage[ self.fileType + "AllFilesList" ] = JSON.stringify( self.allFilesList );
									sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
									sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile;
									self.buttonGroup.fillOpenControl( );

									self.buttonGroup.showSaving( "success", true );
									self.buttonGroup.showFilename();

									if( res.changed ) {
										self.buttonGroup.showModalOk( window.CPG.ProjectBarModalRestartEditor, window.CPG.ProjectBarModalRestartEditor2, function() {
											location.reload( );
										} );
									}
									self.isSaving = false;
								}
							} );																	
						} else {
							self.isSaving = false;
							return
						}
					} );

				} else {
					self.buttonGroup.showModalStringInput( window.CPG.ProjectBarModalProjectSave, window.CPG.ProjectBarModalProjectSave2, "", window.CPG.ProjectBarModalProjectSaveOk, null, [], function( commit ) {
						if( commit ) {
							self.buttonGroup.showSaving( "...", true );

							var projectName = self.codeFiles[ self.currentCodeFile ].project,
								alternate = self.editor.alternateType(),
								res = self.editor.moveResources( projectName ),
								code = res? res.code : self.editor.text();

							(function sendWriteProject( ) {

								// Save project
								$WS.sendMessage( {
									Command: 		"writeProject",
									ProjectName: 	projectName,
									FileType: 		self.fileType,
									FileName: 		fileName,
									CodeFile: 		code,
									TimeStamp: 		self.codeFiles[ fileName ] && self.codeFiles[ fileName ].timeStamp || null,
									ResourceFiles: 	self.editor.resources(),
									Image: 			image,
									AlternateFile:	alternate? alternate.file.substr( data.search( "," )+1 ) : undefined,
									AlternateType:	alternate? alternate.type : "",
									Commit: 		commit
								}, function( message ) {
									if( message.Error ) {
										self.isSaving = false;
										self.buttonGroup.showSaving( false, true );
										console.log( "Error writing project: ", message.Error );

									} else if( message.OutdatedTimeStamp ) {

										self.buttonGroup.showModalYesNo( fileName, window.CPG.ProjectBarModalFileOutdated, false, function( res ) {
											if( res === "yes" ) {
												self.codeFiles[ fileName ].timeStamp = message.OutdatedTimeStamp 
												sendWriteProject();
											} else {
												self.buttonGroup.showSaving( false, true );
												self.isSaving = false;
											}
										} );
									} else if( message.Conflicts ) {
										self.buttonGroup.showModalOk( window.CPG.ProjectBarModalConflicts, window.CPG.ProjectBarModalConflicts2, function() {
											self.readSourceFiles( [ fileName ], [ projectName ], function() {
												self.buttonGroup.showSaving( "warning", true );
												self.isSaving = false;
											} );
										} );
									} else {
										self.readSourceFiles( [ fileName ], [ projectName ], function() {
											self.buttonGroup.showSaving( "success", true );
											self.isSaving = false;
											if( res.changed ) {
												self.buttonGroup.showModalOk( window.CPG.ProjectBarModalRestartEditor, window.CPG.ProjectBarModalRestartEditor2, function() {
													location.reload( );
												} );
											}
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
			if( message.Error ) {
				console.error("WebSockets connection error:", message.Error);
				return
			}
			var users = self.codeFiles[ self.currentCodeFile ].users;

			for( var i = 0 ; users && i < users.length ; i++ ) {
				for( g in message.Pals ) {
					var group = message.Pals[ g ],
						id = group.indexOf( users[i] );
					if( id !== -1 ) group.splice( id, 1 );
				}
			}

			self.buttonGroup.showModalInvite( message.Pals, function( userNames ) {
				if( userNames && userNames.length ) {
					$WS.sendMessage( {
						Command: "sendInvitations",
						UserNames: userNames,
						ProjectName: self.codeFiles[ self.currentCodeFile ].project,
					}, function( message ) {
						if( message.Error ) {
							console.error("WebSockets connection error:", message.Error);
							return
						}
					} );
				}
			});
		} );
	},

	readSourceFiles: function( fileNames, projectNames, cb ) {
		var self = this;

		if( fileNames.length ) {
			$WS.sendMessage( {
				command: "readSourceFiles",
				FileNames: fileNames,
				ProjectNames: projectNames,
				FileType: self.fileType,
			}, function( message ) {
				if( message.Error ) {
					console.error("WebSockets connection error:", message.Error);
					return
				}

				for( var i=0 ; i<fileNames.length ; i++ ) {
					var fileName = fileNames[ i ],
						codeFile = message.CodeFiles[ fileName ];
					if( codeFile ) {
						self.codeFiles[ fileName ] = {
							name: fileName,
							code: codeFile.Code,
							timeStamp: codeFile.TimeStamp,
							project: codeFile.Project,
							rights: codeFile.Rights,
							users: codeFile.Users,
							status: codeFile.Status,
						}
						sessionStorage[ fileName ] = JSON.stringify( self.codeFiles[ fileName ] );
						if( self.codeFileList.indexOf( fileName ) === -1 ) self.codeFileList.push( fileName );

						for( var i = 0, found = false; i < self.allFilesList.length; i++ ) {
							if( self.allFilesList[i].name === fileName ) {
								found = true;
								break;
							}
						}
						if( !found ) self.allFilesList.unshift( {
							name: fileName,
							timeStamp: codeFile.TimeStamp,
							project: codeFile.Project,
						} );
					}
				}
				sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
				sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = fileNames[ 0 ];
				self.buttonGroup.fillOpenControl( );

				self.editor.reset( self.codeFiles[ self.currentCodeFile ].code );
				self.buttonGroup.showFilename();
				if( cb ) cb();
			} );
		} else {
			if( cb ) cb();
		}
	},

	saveSourceFile: function( fileName, project, overwrite, cb ) {

		var self = this;

		this.buttonGroup.showSaving( "..." );
		var code = this.editor.text( );

		this.editor.getScreenshot( function ( data ) {

			// remove BASE64-HTML header
			var image = data.substr( data.search( "," )+1 ),
				alternate = self.editor.alternateType();

			$WS.sendMessage( {
				Command:		"writeSourceFile",
				FileName:		fileName,
				ProjectName:	project || "",
				FileType:		self.fileType,
				TimeStamp:		self.codeFiles[ fileName ] && self.codeFiles[ fileName ].timeStamp || null,
				CodeFile:		code,
				Overwrite:		self.currentCodeFile === fileName || overwrite,
				Image :			image,
				AlternateFile:	alternate? alternate.file.substr( data.search( "," )+1 ) : undefined,
				AlternateType:	alternate? alternate.type : ""
			}, function( message ) {

				var codeFile = self.codeFiles[ self.currentCodeFile ];

				if( message.Error === "no connection" ) {
					console.error("WebSockets connection error:", message.Error);
					self.buttonGroup.showSaving( false );
					if( cb ) cb( false );
					return
				} else if ( message.Error ) {
					self.buttonGroup.showModalYesNo( window.CPG.ProjectBarModalFileExists, message.Error, false, function( res ) {
						if( res === "yes" ) {
							self.saveSourceFile( fileName, project, true );
						} else {
							self.buttonGroup.showSaving( false );
							if( cb ) cb( false );
						}
					} );
					return false;

				} else if( message.OutdatedTimeStamp ) {

					self.buttonGroup.showModalYesNo( fileName, window.CPG.ProjectBarModalFileOutdated, false, function( res ) {
						if( res === "yes" ) {
							self.codeFiles[ fileName ].timeStamp = message.OutdatedTimeStamp 
							self.saveSourceFile( fileName, project );
						} else {
							self.buttonGroup.showSaving( false );
							if( cb ) cb( false );
						}
					} );
					return false;
				
				} else if( self.currentCodeFile !== fileName ) {

					self.codeFiles[ fileName ] = {
						name: fileName,
						project: project,
						rights: message.Rights,
						users: message.Users
					};

					if( !self.checkCodeFile( fileName ) ) {

						self.allFilesList.push( {
							name: fileName,
							timeStamp: message.SavedTimeStamp,
						} );
						self.codeFileList.push( fileName );
					}

					sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
					sessionStorage[ self.fileType + "AllFilesList" ] = JSON.stringify( self.allFilesList );
					sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = fileName;
					sessionStorage[ self.currentCodeFile ] = JSON.stringify( self.codeFiles[ self.currentCodeFile ] );
				} 

				self.codeFiles[ fileName ].code = self.editor.text( );
				self.codeFiles[ fileName ].timeStamp = message.SavedTimeStamp;
				sessionStorage[ fileName ] = JSON.stringify( self.codeFiles[ fileName ] );

				self.buttonGroup.fillOpenControl( );
				self.editor.setClean();
				self.buttonGroup.showSaving( "success" );
				self.buttonGroup.showFilename();
				
				if( cb ) cb( true );
		   } );
		} );
	},

	renameSourceFile: function( oldFileName, newFileName, cb ) {
		var self = this;

		if( oldFileName !== "" && newFileName !== "" ) {
			$WS.sendMessage( {
				command: "renameSourceFile",
				FileNames: [oldFileName, newFileName],
				FileType: self.fileType,
			}, function( message ) {
				if( message.Error ) {
					console.error( "Error while trying to rename '" + oldFileName + "' to '" + newFileName + "'.");
					if( cb ) cb( false );
					return
				} 

				self.codeFiles[ newFileName ] = self.codeFiles[ oldFileName ];
				self.codeFiles[ newFileName ].name = newFileName;
				delete self.codeFiles[ oldFileName ];

				var i = self.codeFileList.indexOf( oldFileName );
				if( i > -1 ) self.codeFileList[ i ] = newFileName;

				for( var i=0 ; i<self.allFilesList.length ; i++ ) {
					if( self.allFilesList[i].name === oldFileName ) {
						self.allFilesList[i].name = newFileName;
						break;
					}
				}
				
				sessionStorage[ newFileName ] = JSON.stringify( self.codeFiles[ newFileName ] );
				sessionStorage.removeItem( oldFileName );
				sessionStorage[ self.fileType + "AllFilesList" ] = JSON.stringify( self.codeFileList );
				sessionStorage[ self.fileType + "CodeFileList" ] = JSON.stringify( self.codeFileList );
				sessionStorage[ self.fileType + "CurrentCodeFile" ] = self.currentCodeFile = newFileName;
				self.buttonGroup.fillOpenControl( );

				self.buttonGroup.showFilename();
				if( cb ) cb( newFileName );
			} );
		} else {
			if( cb ) cb();
		}
	},

	////////////////////////////////////////////
	// refreshSession takes care of the sessionStore when user changes
	refreshSession: function( loginTime ) {

		// If User changed: clear everything from sessionStorage
		var recover = window.location.href.search("wstoken=") >= 0;

		if( sessionStorage.ĈPG_loginTime !== loginTime && !recover ) {
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

	refreshMails: function refreshMails() {
		var self = this,
			messages = [];

			_.each( this.messages, function( element, index, list ) { messages.push( element.Id ); } );

		$WS.sendMessage( {
			Command: "readNewMessages",
			MessageIds: messages,
		}, function( message ) {
			if( message.Error === "no connection" ) {
				console.error("WebSockets connection error:", message.Error);
				return
			}

			var m = message.Messages;
			for( var i=0 ; i<m.length ; i++ ) {
	            self.buttonGroup.addMessage( m[i] );
			}
            self.messages = self.messages.concat( m );
		}, true);

		if( this.refreshMailsTimeout ) clearTimeout( this.refreshMailsTimeout );

		this.refreshMailsTimeout = setTimeout( function() {
			refreshMails.call( self );
		}, 30000 ); 
	},

	openMail: function( mail ) {
		var self = this,
			id = parseInt( mail.attr( "message-id" ) );

		_.each( this.messages, function( element, index, list ) {
			if( element.Id === id ) {
				switch( element.Action ) {
				case self.MSG_INVITE: 

					// Check if project is in the AllFilesList
					var file = self.checkCodeFile( element.ProjectName );
					if( file && file.project && file.project.length ) {
						self.buttonGroup.showModalOk( window.CPG.ProjectBarModalAlreadyMember, window.CPG.ProjectBarModalAlreadyMember2, function() {
							self.removeMessage( id, index );							
						} );
					} else {

						self.buttonGroup.showModalYesNo( element.Subject, element.Text, true, function( res ) {
							if( !res ) return
							else if( res === "yes" ) {

								$WS.sendMessage( {
									Command: "cloneProject",
									ProjectName: element.ProjectName,
								}, function( message ) {
									if( message.Error === "no connection" ) {
										console.error("WebSockets connection error:", message.Error);
										return
									}

									// Look if a filename with the new project name already exists
									var fileExists = false,
										fileName = element.ProjectName;
									for( var i = 0; i < self.allFilesList.length ; i++ ) {
										if( self.allFilesList[i].name === fileName + "." + self.fileType ) {
											fileExists = true;
											fileName = fileName + ".";
											i = -1; // Search through all files again for the new name
										}
									}

									if( fileExists ) {
										self.renameSourceFile( element.ProjectName + "." + self.fileType, fileName + "." + self.fileType, function() {
											self.openNewProject( element.ProjectName );
										} );
									} else {
										self.openNewProject( element.ProjectName );
									}
								} );
							}

							self.removeMessage( id, index );
						} );

					}	

				}
			}
		} )
	},

	openNewProject: function( projectName ) {
		// This may be overwritten by the project bar client (live-editor, graphics-editor ...)
	},

	removeMessage: function( id, index ) {
		this.buttonGroup.removeMessage( id );
		this.messages.splice( index, 1 );

		$WS.sendMessage( {
			Command: "deleteMessage",
			MessageId: id,
		}, function( message ) {
			if( message.Error === "no connection" ) {
				console.error("WebSockets connection error:", message.Error);
				return
			}
		} );		
	},

	checkRights: function( ) {
		var rights = this.codeFiles[ this.currentCodeFile ] && this.codeFiles[ this.currentCodeFile ].rights,
			res = false;

		for( var i = 0; rights && i < arguments.length; i++ ) if( rights.indexOf( arguments[i] ) !== -1 ) res = true;

		return res; 
	},

	checkCodeFile: function( fileName ) {

		if( fileName.substr( fileName.length - this.fileType.length - 1 , this.fileType.length + 1 ) !== "." + this.fileType ) fileName += "." + this.fileType;
		
		for( var i = 0; i < this.allFilesList.length ; i++ ) {
			if( this.allFilesList[i].name === fileName ) {
				return this.allFilesList[i];
			}
		}

		return false;
	},

	getCurrentCodeFile: function() {
		return this.codeFiles[ this.currentCodeFile ];
	},

	storeCurrentCodeFile: function() {
		this.codeFiles[ this.currentCodeFile ].code = this.editor.text();
		sessionStorage[ this.currentCodeFile ] = JSON.stringify( this.codeFiles[ this.currentCodeFile ] );
	}
} );


var ButtonGroup = Backbone.View.extend( {
	projectBar:			null,
	codeFileModal:		null,
	yesNoModal:			null,
	stringInputModal:	null,
	disableProjectInit:	null,

	initialize: function( options ) {
		var self = this;

		this.el = options.el;
		this.projectBar = options.projectBar;

		this.fillDomElements( options );

		$( "#project-bar-new" ).on( 'click', function() { self.projectBar.new(); } );
		$( "#project-bar-save" ).on( 'click', function() { self.projectBar.save(); } );
		$( "#project-bar-save-as" ).on( 'click', function() { self.projectBar.saveAs(); } );
		$( "#project-bar-save-project" ).on( 'click', function() { self.projectBar.saveProject(); } );
		$( "#project-bar-invite" ).on( 'click', function() { self.projectBar.inviteToProject(); } );
		$( "#project-bar-mail" ).on( 'click', function() { self.projectBar.refreshMails(); } );

		this.disableProjectInit = options.disableProjectInit;
	},

	fillDomElements: function( options ) {

		var container = options.modalContainer;

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
				"<div id='project-bar-save-as-up' class='btn-group dropup'>" +
					"<button type='button' class='btn btn-primary dropup-toggle' data-toggle='dropdown'>" +
						"<span class='caret'></span>" +
					"</button>" +
					"<ul class='dropdown-menu' role='menu'>" +
						"<li id='project-bar-save-as'>" + window.CPG.ProjectBarSaveAs + "</li>" +
					"</ul>" +
				"</div>" +
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
						"<li id='project-bar-gallery'>" + window.CPG.ProjectBarGalleryOn + "</li>" +
						"<li id='project-bar-invite'>" + window.CPG.ProjectBarInvite + "</li>" +
					"</ul>" +
				"</div>" +
				"<div id='project-bar-mail-menu' class='btn-group dropup'>" +
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
					"<button type='button' class='modal-ok btn btn-primary' data-dismiss='modal'>" + window.CPG.ProjectBarModalOk + "</button>" +
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
						  "<input type='text' class='form-control' id='project-bar-input' name='string-input'>" +
						  "<p id='project-bar-select-list-label' class='hide'></p>" +
						  "<select class='form-control hide' id='project-bar-select-list'></select>" +
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

		container.append(
			"<div id='project-bar-waiting-modal' class='modal fade'>" +
				"<div class='modal-dialog'>" +
				"<div class='modal-content'>" +
					"<div class='modal-header'>" +
					"<button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times,</span></button>" +
					"<h4 class='modal-title'>Title was not set.</h4>" +
					"</div>" +
					"<div class='modal-body'>" +
						"<p>Body text was not set.</p>" +
						"<span class='glyphicon glyphicon-cd'></span>" +
					"</div>" +
					"<div class='modal-footer'>" +
					"<button type='button' class='modal-cancel btn btn-default pull-left' data-dismiss='modal'>" + window.CPG.ProjectBarModalCancel + "</button>" +
					"<button type='button' class='modal-ok btn btn-primary pull-left' data-dismiss='modal'>" + window.CPG.ProjectBarModalCancel + "</button>" +
					"</div>" +
				"</div><!-- /.modal-content -->" +
				"</div><!-- /.modal-dialog -->" +
			"</div><!-- /.modal -->	"
		);
		this.waitingModal = $( "#project-bar-waiting-modal" );
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

        var self = this,
        	button = $( "#project-bar-mail-menu" );
        
        $( ".dropdown-menu", button ).append( "<li message-id='" + message.Id + "' project-name='" + message.ProjectName + "'>" + message.Subject + "</li>" );
		$( "ul li", button ).on( 'click', function() { self.projectBar.openMail( $( this ) ); } );
        $( ".badge", button ).text( $( ".dropdown-menu li", button ).length );
    },

    /////////////////////////////////////////////
    // removeMessage removes one message from the messages list
    removeMessage: function( messageId ) {

        var button = $( "#project-bar-mail-menu" );
        
        $( ".dropdown-menu [message-id='" + messageId + "']", button ).remove();
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

		modal.off( 'hidden.bs.modal' ).one( 'hidden.bs.modal', function( e ) {
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
		modal.off( 'hidden.bs.modal' ).one( 'hidden.bs.modal', function( e ) {
			if( cb ) cb( null );
		} );
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// showModalYesNo displays a modal dialog with answers yes and no
	showModalYesNo: function( title, body, primaryYes, cb ) {
		var modal = this.yesNoModal;

		if( primaryYes ) {
			$( ".modal-yes", modal ).removeClass( "btn-default" ).addClass( "btn-primary" ).addClass( "pull-right" );
			$( ".modal-no", modal ).removeClass( "btn-primary" ).addClass( "btn-default" ).removeClass( "pull-right" );
		} else {
			$( ".modal-no", modal ).removeClass( "btn-default" ).addClass( "btn-primary" ).addClass( "pull-right" );
			$( ".modal-yes", modal ).removeClass( "btn-primary" ).addClass( "btn-default" ).removeClass( "pull-right" );			
		}

		$( ".modal-title", modal ).text( title );
		$( ".modal-body p", modal ).text( body );
		$( ".modal-yes", modal ).off( "click" ).one( "click", function( e ) {
			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );
			if( lcb ) lcb( "yes" );
		} );
		$( ".modal-no", modal ).off( "click" ).one( "click", function( e ) {
			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );
			if( lcb ) lcb( "no" );
		} );

		modal.modal( 'show' );
		modal.off( 'hidden.bs.modal' ).one( 'hidden.bs.modal', function( e ) {
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
		modal.off( 'hidden.bs.modal' ).one( 'hidden.bs.modal', function( e ) {
			if( cb ) cb( );
		} );

		modal.keypress( function( e ) {
			if(e.which == 13) {
				$( ".modal-ok", modal ).trigger( "click" );
				e.stopPropagation();
			}
		})
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// showModalStringInput displays a modal dialog for string input
	showModalStringInput: function( title, body, value, action, listLabel, list, cb ) {
		var modal = this.stringInputModal,
			input = modal.find( "input" );

		$( ".modal-title", modal ).text( title );
		$( ".modal-body p", modal ).text( body );
		$( ".modal-action", modal ).text( action );

		var lel = $( "#project-bar-select-list", modal ).html("");
		if( listLabel ) {

			if( list && list.length ) {
				for( var i = 0 ; i < list.length ; i++ ) {
					lel.append("<option value='" + list[ i ] + "'>" + list[ i ] + "</option>");
				}

				lel.removeClass( "hide" );
				$( "#project-bar-select-list-label", modal ).removeClass( "hide" ).text( listLabel );				
			}
		} else {
			lel.addClass( "hide" );
		}

		input.val( value );

		$( ".modal-action", modal ).off( "click" ).on( "click", function( e ) {

			var value = input.val(),
				filteredValue = value.replace(/[^a-z0-9äöüß\ \.\,\!\+\-\(\)]/gi, "");

			if( value === "" || value !== filteredValue ) {
				input.val( filteredValue ).focus();
				e.stopPropagation();
				return
			}

			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );
			if( lcb ) lcb( filteredValue, $( "#project-bar-select-list" ).val() );
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
				e.stopPropagation();
			}
		})

		modal.modal( 'show' );
		modal.off( 'hidden.bs.modal' ).one( 'hidden.bs.modal', function( e ) {
			if( cb ) cb( false );
		} );
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// showModalWaiting displays a waiting dialog
	showModalWaiting: function( title, body, cb ) {
		var self = this,
			modal = this.waitingModal;

		$( ".modal-title", modal ).text( title );
		$( ".modal-body p", modal ).text( body );
		$( ".modal-ok", modal ).hide();
		$( ".modal-cancel", modal ).show().off( "click" ).one( "click", function( e ) {
			if( this.waitingModal.interval ) {
				clearInterval( this.waitingModal.interval );
				this.waitingModal.interval = null;
			}

			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );
			if( lcb ) lcb( false );
		} );

		modal.off( 'hidden.bs.modal' ).one( 'hidden.bs.modal', function( e ) {
			if( self.waitingModal.interval ) {
				clearInterval( self.waitingModal.interval );
				self.waitingModal.interval = null;
			}
			if( cb ) cb( false );
		} );

		this.waitingModal.interval = setInterval( function() {
			$( ".glyphicon-cd", modal ).css( {
				textIndent: 0,
				transform: "rotate(0deg)"
			}).animate( {  textIndent: 1 }, {
				step: function(now,fx) {
					$(this).css('transform','rotate('+(now*720)+'deg)');
				},
				duration: 1200
			}, 'linear' );
		}, 1250);

		modal.modal( "show" );
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// showModalWaiting displays a waiting dialog
	showModalWaitingOk: function( title, body, cb ) {
		var self = this,
			modal = this.waitingModal;

		$( ".modal-title", modal ).text( title );
		$( ".modal-body p", modal ).text( body );
		$( ".modal-cancel", modal ).hide();
		$( ".glyphicon-cd", modal ).hide();
		$( ".modal-ok", modal ).show().off( "click" ).one( "click", function( e ) {

			var lcb = cb;
			cb = null;
			modal.modal( 'hide' );
			if( lcb ) lcb( true );
		} );

		modal.off( 'hidden.bs.modal' ).one( 'hidden.bs.modal', function( e ) {
			if( cb ) cb( false );
		} );

		modal.modal( "show" );
	},

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// hideModalWaiting closes the current waiting dialog
	hideModalWaiting: function( ) {
		var modal = this.waitingModal;

		if( this.waitingModal.interval ) {
			clearInterval( this.waitingModal.interval );
			this.waitingModal.interval = null;
		}

		modal.modal( "hide" );
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

	showFilename: function( ) {
		var codeFile = this.projectBar.getCurrentCodeFile(),
			fileName = codeFile.name,
			projectMembers = codeFile.users && codeFile.users.length || 0,
			projectStatus = codeFile.status;

		$( ".big-filename .name", this.el ).text( fileName );
		if( projectMembers ) {
			for( var i = 0, points = "" ; i < projectMembers ; i++ ) points += ".";
			$( ".big-filename .project", this.el ).text( window.CPG.ProjectBarProject );
			$( ".big-filename .points", this.el ).text( points );
			if( projectStatus !== 0 )	$( ".big-filename", this.el ).addClass("uncommitted");
			else 						$( ".big-filename", this.el ).removeClass("uncommitted");

			if( this.disableProjectInit ) {
				$( "#project-bar-save-project" ).prop( "disabled", false );
			}
		} else {
			$( ".big-filename .project", this.el ).text( "" );
			$( ".big-filename .points", this.el ).text( "" );			

			if( this.disableProjectInit ) {
				$( "#project-bar-save-project" ).prop( "disabled", true );
			}
		}

		this.activateProjectMenu( );
	},

	activateProjectMenu: function( ) {

		if( this.projectBar.checkRights( "Invite", "Publish", "Reverse", "Cleanup", "Rename", "Disinvite", "Administer", "Delete" ) )
				$( "#project-bar-admin").removeAttr( "disabled" );
		else 	$( "#project-bar-admin").attr( "disabled", "" );

		if( this.projectBar.checkRights( "Invite" ) ) 	$( "#project-bar-invite").removeAttr( "disabled" );
		else 											$( "#project-bar-invite").attr( "disabled", "" );

		if( this.projectBar.checkRights( "Publish" ) ) 	$( "#project-bar-gallery").removeAttr( "disabled" );
		else 											$( "#project-bar-gallery").attr( "disabled", "" );

		if( this.projectBar.checkRights( "Reverse" ) ) 	$( "#project-bar-other-version").removeAttr( "disabled" );
		else 											$( "#project-bar-other-version").attr( "disabled", "" );

		if( this.projectBar.checkRights( "Cleanup" ) ) 	$( "#project-bar-organize").removeAttr( "disabled" );
		else 											$( "#project-bar-organize").attr( "disabled", "" );

		if( this.projectBar.checkRights( "Rename" ) ) 	$( "#project-bar-rename").removeAttr( "disabled" );
		else 											$( "#project-bar-rename").attr( "disabled", "" );

		if( this.projectBar.checkRights( "Disinvite" ) ) 	$( "#project-bar-disinvite").removeAttr( "disabled" );
		else 												$( "#project-bar-disinvite").attr( "disabled", "" );

		if( this.projectBar.checkRights( "Administer" ) ) 	$( "#project-bar-transfer").removeAttr( "disabled" );
		else 												$( "#project-bar-transfer").attr( "disabled", "" );
	},
});


} )( );
