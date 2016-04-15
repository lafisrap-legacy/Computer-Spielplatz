(function() {

window.LiveEditorFrameHTML = window.LiveEditorFrame.extend ( {

    initialize: function( options ) {
    	window.LiveEditorFrame.prototype.initialize.call( this, options );

        this.liveEditor = new LiveEditor({
            editorType: "ace_webpage",
            outputType: "webpage",
            el: $("#cpg-live-editor-html"),
            code: window.localStorage["test-code"] || "<!DOCTYPE html>\n<strong>Hello</strong>, world!",
            width: 480,
            height: 800,
            editorHeight: "800px",
            autoFocus: true,
            workersDir: "../build/workers/",
            externalsDir: "../build/external/",
            imagesDir: "static/userdata/"+window.CPG.UserNameForImages+"/images/",
            execFile: "external/output_webpage.html",
        });

        this.liveEditor.editor.on("change", function() {
        	this._dirty = true;
        });
    }
} );

})();