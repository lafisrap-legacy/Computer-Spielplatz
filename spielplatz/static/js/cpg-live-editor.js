/////////////////////////////////////////////////////////////////////////////////////////////////
// Live Editor page logic currently with Processing/Javascript ( Khan-Flavour ) and HTML ( also Khan )
$( function fn( ) {

/////////////////////////////////////////////////////////////////
// Initiate the live editor that fits to the current page ( tab )
var CPG_page = sessionStorage[ "CPG_page" ] || "pjs",  
	CPG_options = {
		el: $( "#cpg-live-editor-pages" ),
		page: CPG_page
	},

CPG_liveEditor =( CPG_page === "pjs" ) ? new window.LiveEditorFramePjs( CPG_options ) : 
				( CPG_page === "html" ) ? new window.LiveEditorFrameHTML( CPG_options ) :

				console.error ( "No valid CPG_page specified" );

CPG_projectControlBar = new window.ProjectControlBar( {
								el: $( "#project-button-group" ),
								userName: window.CPG.UserName, 
								fileType: CPG_page,
								editor: CPG_liveEditor,
								wsAddress: window.CPG.WebsocketsAddress, 
								xsrfdata: window.CPG.xsrfdata,
								newFile: window.CPG.ProjectBarNewFile + "." + CPG_page,
								modalContainer: $( ".container" ),
							} );


// Start integration functions AFTER live-editor has loaded
$( window ).trigger( "live-editor-late-integration" );

CPG_liveEditor.refreshSession( window.CPG.LoginTime );

window.onbeforeunload = function( ) {
	//storeCurrentCodeFile( );
	if( CPG_liveEditor.modified() ) return window.CPG.ControlBarModalFileChanged;
}

$( window ).blur( function( e ) {
	//console.log( "Going away to next tab" );
	// Do Blur Actions Here
} );

$( window ).on( 'hashchange', function( e ){
	console.log( "URL changed." );
	// do something...
} );

setInterval( CPG_liveEditor.storeCurrentCodeFile, 30000 )

} );