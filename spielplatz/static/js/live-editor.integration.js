(function() {

var errMsg = "Khan Live-Editor, integration problem: "

///////////////////////////////////////////////////////////
// Default sound file
//
if( !TooltipEngine.classes.soundModal.prototype.defaultFile ) 
	console.error( errMsg + "Default sound file is not in place." );
TooltipEngine.classes.soundModal.prototype.defaultFile = "\"Spielplatz/Glas\"";

///////////////////////////////////////////////////////////
// Exchange sound modal
//
if( !TooltipEngine.classes.soundModal.prototype.render ) 
	console.error( errMsg + "Render method of soundModal is not in place." );

var oldRender = TooltipEngine.classes.soundModal.prototype.render;
TooltipEngine.classes.soundModal.prototype.render = function render() {
	var self = this;

	oldRender.call(this);

	this.$("button").off("click");
	this.$("button").on("click", function () {
		if( window.showModalSound ) {
			window.showModalSound(function(sound) {
				if( sound ) {
					self.updateText('"'+sound+'"');
					self.updateTooltip('"'+sound+'"');							  
				}
			});
		}
	});
};

///////////////////////////////////////////////////////////
// Empty image file
//
if( !TooltipEngine.classes.imagePicker.prototype.defaultImage ) 
	console.error( errMsg + "Default image file is not in place." );
TooltipEngine.classes.imagePicker.prototype.defaultImage = "Spielplatz/Leer";

if( !TooltipEngine.classes.imageModal.prototype.updateTooltip ) 
	console.error( errMsg + "updateTooltip mothod of image Modal is not in place." );

TooltipEngine.classes.imageModal.prototype.updateTooltip = function updateTooltip(url) {
    if (url !== this.currentUrl) {
        this.currentUrl = url.trim();
        if (url === "") {
            this.$(".thumb").hide();
            this.$(".thumb-throbber").hide();
            this.$(".thumb-error").text(i18n._("Enter an image URL.")).show();
            return;
        }
        //var allowedHosts = /(\.|^)?(khanacademy\.org|kastatic\.org|kasandbox\.org|ka-perseus-images\.s3\.amazonaws\.com|wikimedia\.org|localhost:\d+)$/i;
        var allowedHosts = /(\.|^)?(localhost:\d+|192.168.178.177:8080|lafisrap.in-berlin.de:8080)$/i;
        var match = /\/\/([^\/]*)(?:\/|\?|#|$)/.exec(url);
        var host = match ? match[1] : "";
        if (!host || allowedHosts.test(host)) {
            if (url !== this.$(".thumb").attr("src")) {
                this.$(".thumb").attr("src", url);
                this.$(".thumb-throbber").show();
            }
            if (this.$(".thumb-error").hasClass("domainError")) {
                this.$(".thumb-error").removeClass("domainError").hide();
                this.$(".thumb").show();
            }
        } else {
            this.$(".thumb").hide();
            this.$(".thumb-error").text(i18n._("Sorry! That server is not permitted.")).addClass("domainError").show();
            this.$(".thumb-throbber").hide();
        }
    }
};

///////////////////////////////////////////////////////////
// Late integration functions
//
$( window ).on("live-editor-late-integration", function( e ) {

	///////////////////////////////////////////////////////////
	// Replace blank image file
	//
	var src = $(".mediapicker .current-media img").attr("src");

	if( src ) {
		src.replace(/cute\/Blank.png/g, "Spielplatz/KeinBild.png");
		$(".mediapicker .current-media img").attr( "src", src );
	}

	///////////////////////////////////////////////////////////
	// Replace tipbar strings
	//
	$( ".tipbar .oh-no" ).text( "Oh! Nein!" );
	$( ".tipbar .show-me a" ).text( "Zeig mir wo ..." );
	$( ".tipbar .tipnav .prev" ).html( "<span>&#8592;</span>" );
	$( ".tipbar .tipnav .next" ).html( "<span>&#8594;</span>" );

	///////////////////////////////////////////////////////////
	// Replace throbber
	var elem = [ ".scratchpad-editor-bigplay-loading img", ".scratchpad-canvas-loading img" ];
	for( e in elem ) {
		var src = $( elem[ e ] ).attr( "src" );
		src = src.substr( 0, src.search( "/static/userdata") ) + "/static/img/live-editor-throbber-full.gif";
		$( elem[ e ] ).attr( "src", src ); 		
	}
});
	
})();

