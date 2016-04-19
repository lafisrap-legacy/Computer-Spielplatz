/////////////////////////////////////////////////////////////////////////////////////////////////
// Project-Control-Bar

( function( ) {

window.ProjectControlBar = Backbone.Model.extend( {

	initialize: function( options ) {
		this.buttonGroup = new ButtonGroup( options );
	},

} );


var ButtonGroup = Backbone.View.extend( {

	initialize: function( options ) {
		this.el = options.el;

		this.fillDomElement( );
	},

	fillDomElement: function( ) {

		this.el.html(
			"<button id='project-bar-new' type='button' class='btn btn-primary'>" + window.CPG.ProjectBarNew + "</button>" +
			"<div class='btn-group dropup'>" +
				"<button id='project-bar-open' class='btn btn-primary dropdown-toggle btn-md' type='button' data-toggle='dropdown'>" +
					"<span class='title'>" + window.CPG.ProjectBarOpen + "</span>" +
					"<span class='caret'></span>" +
				"</button>" +
				"<ul id= 'project-bar-open-files' class='dropdown-menu'>" +
				"</ul>" +
			"</div>" +
			"<button id='project-bar-save' type='button' class='btn btn-primary'>" + window.CPG.ProjectBarSave + "</button>" +
			"<div class='btn-group dropup'>" +
				"<button type='button' class='btn btn-primary dropup-toggle' data-toggle='dropdown'>" +
					"<span class='title'>" + window.CPG.ProjectBarAdministrate + "</span>" +
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
					"<span class='badge'>0</span>" +
					"<span class='caret'></span>" +
				"</button>" +
				"<ul class='dropdown-menu' role='menu'>" +
			"</div>" +
			"<button id='project-bar-new' type='button' class='btn btn-primary'>" +
				"<span class='glyphicon glyphicon-star'><span class='badge'>0</span>" +
				"<span class='glyphicon glyphicon-share'></span><span class='badge'>0</span></button>" 
		).addClass( "btn-group" );
	},
});


} )( );
