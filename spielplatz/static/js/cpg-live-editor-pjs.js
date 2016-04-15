
(function() {

window.LiveEditorFrame = Backbone.View.extend ( {
    LiveEditor: null,

    _dirty: false,

    initialize: function initialize ( options ) {

        this.page = options.page || "page-pjs";

		$( ".page" ).hide();
		$( "#nav-bar-" + this.page ).addClass( "active" );
		$( "#" + this.page ).show();

		$( ".nav-bar-page" ).on( "click tap ", function( e ) {
			sessionStorage.CPG_page = $( this ).attr( "rel" );

			location.reload();
		});
    },

    modified: function() {
        return this._dirty;
    },

    setClean: function() {
        this._dirty = false;
    }
} );


window.LiveEditorFramePjs = window.LiveEditorFrame.extend ( {

    initialize: function( options ) {
    	window.LiveEditorFrame.prototype.initialize.call( this, options );

		this.liveEditor = new LiveEditor ( {
            el: $("#cpg-live-editor-pjs"),
            code: window.localStorage["test-code-pjs"] || "ellipse(100, 100, 100, 100);",
            width: 480,
            height: 800,
            editorHeight: "800px",
            autoFocus: true,
            workersDir: "../build/workers/",
            execFile: "external/output.html",
            externalsDir: "../build/external/",
            imagesDir: "static/userdata/"+window.CPG.UserNameForImages+"/images/",
            soundsDir: "../static/userdata/"+window.CPG.UserNameForImages+"/sounds/",
            jshintFile: "../build/external/jshint/jshint.js"
        });

        this.liveEditor.editor.on("change", function () {
            this._dirty = true;
        });

        // We have an own toolbar ...
        $( ".scratchpad-toolbar" ).hide();
    },
} );

})();
