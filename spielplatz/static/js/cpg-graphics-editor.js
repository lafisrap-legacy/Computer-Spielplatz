/////////////////////////////////////////////////////////////////////////////////////////////////
// Live Editor page logic currently with Processing/Javascript ( Khan-Flavour ) and HTML ( also Khan )
$( function fn( ) {


	/////////////////////////////////////////////////////////////////
	// Initiate the live editor that fits to the current page ( tab )
	var CPG_page = sessionStorage[ "CPG_page" ] || "paper",  
		CPG_options = {
			el: $( "#cpg-graphics-editor-pages" ),
			page: CPG_page
		};

	// Wait till paper page is loaded
	$( "#page-" + CPG_page ).one( "paper-loaded", function() {

		CPG_graphicsEditor =( CPG_page === "paper" ) ? new window.GraphicsEditorFramePaper( CPG_options ) : 
							( CPG_page === "anim" ) ? new window.GraphicsEditorFrameAnim( CPG_options ) :

							console.error ( "No valid CPG_page specified" );


		var projectControlBar = window.ProjectControlBar.extend( {

			openNewProject: function( projectName, cb ) {

				this.readSourceFiles( [ projectName + "." + this.fileType ], [ projectName ], function() {
					if( cb ) cb()
				} );
			},
		} );

		if( $( "#project-button-group" ).length ) {
			CPG_projectControlBar = new projectControlBar( {
											el: $( "#project-button-group" ),
											userName: window.CPG.UserName, 
											fileType: CPG_page,
											editor: CPG_graphicsEditor,
											wsAddress: window.CPG.WebSocketsAddress, 
											wsToken: window.CPG.WebSocketsToken,
											newFile: window.CPG.ProjectBarNewFile + "." + CPG_page,
											modalContainer: $( ".container" ),
											disableProjectInit: true,
										} );		

			CPG_projectControlBar.refreshSession( window.CPG.LoginTime );
		}
	});

	window.onbeforeunload = function() {
		if( window.CPG_projectControlBar ) {
			console.log( "Storing code file in project control bar!" );
			CPG_projectControlBar.storeCurrentCodeFile();			
		}

		if( window.CPG_graphicsEditor.modified() ) return window.CPG.ProjectBarFileChanged;
	}

	$( window ).blur( function( e ) {
		//console.log( "Going away to next tab" );
		// Do Blur Actions Here
	} );

	$( window ).on( 'hashchange', function( e ){
		console.log( "URL changed." );
		// do something...
	} );
} );
