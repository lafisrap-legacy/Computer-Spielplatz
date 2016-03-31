var translations = {
	"No sound file provided." : "Du hast keine Sound-Datei angegeben.",
	"Unexpected character." : "Unerwartetes Zeichen.",
	"Parser error." : "Fehler beim Interpretieren des Programms.",
	"This program uses capabilities we've turned off for security reasons. Khan Academy prohibits showing external images, playing external sounds, or displaying pop-ups." :
		"Dieses Programm verwendet Funktionen, die wir aus Sicherheitsgründen abgteschaltet haben. Khan Academy verbietet die Anzeige von externen Bildern, extermem Sound und von Pop-Ups.",
	"Expected function call to '%(name)s' was not made." : "Ich habe einen Funktionsaufruf von '%(name)s' erwartet, der nicht stattgefunden hat.",
	"Correct function call made to %(name)s." : "Die Funktion %(name)s wurde korrekt aufgerufen.",
	"Expected '%(name)s' to be a valid variable name." : "Ich habe erwartet, dass '%(name)s' ein gültiger Variablenname ist.",
	"Expected either '%(first)s' or '%(second)s' to be a valid variable name." : "Ich habe erwartet, dass entweder '%(first)s' oder '%(second)s' ein gültiger Variablenname ist.",
	"Syntax error!" : "Syntaxfehler!",
	"If you want to define a function, you should use \"var %(name)s = function() {}; \" instead!" :
		"Wenn du eine Funktion definieren willst, solltest du \"var %(name)s = function() {}; \" schreiben!",
	"%(word)s is a reserved word." : "%(word)s ist ein reserviertes Wort.",
	"Did you mean to type \"%(keyword)s\" instead of \"%(word)s\"?" : "Wolltest du \"%(keyword)s\" anstatt \"%(word)s\" schreiben?",
	"In case you forgot, you can use it like \"%(usage)s\"" : "Falls du das vergessen hast, du kannst es auch so verwenden: \"%(usage)s\"",
	"Did you forget a space between \"var\" and \"%(variable)s\"?" : "Hast du ein Leerzeichen zwischen \"var\" und \"%(variable)s\" vergessen?",
	"You can't end a line with \"=\"" : "Du kannst eine Zeile nicht mit \"=\" enden lassen.",
	"It looks like you have an extra \")\"" : "Es sieht so aus, als hättest du eine \")\" zuviel.",
	"It looks like you are missing a \")\" - does every \"(\" have a corresponding closing \")\"?" :
		"Es sieht so aus, als würde eine \")\" fehlen - hat jede \"(\" eine passende \")\"?",
	"%(name)s takes 1 parameter, not %(given)s!" : "%(name)s benötigt einen Parameter, nicht %(given)s!", 
	"%(name)s takes %(num)s parameters, not %(given)s!" : "%(name)s benötigt %(num)s Parameter, nicht %(given)s!",
	"or" : "oder",
	"%(name)s takes %(list)s parameters, not %(given)s!" : "%(name)s benötigt %(list)s Parameter, nicht %(given)s!",
	"It looks like you're trying to use %(name)s. In case you forgot, you can use it like: %(usage)s" :
		"Es sieht so aus, als wolltest du %(name)s verwenden. Falls du vergessen hast, du kannst das so verwenden: %(usage)s",
	"Image '%(file)s' was not found." : "Ich kann das Bild '%(file)s' nicht finden.",
	"Sound '%(file)s' was not found." : "Ich kann den Sound '%(file)s' nicht finden.",
	"\"%(word)s\" is not defined. Maybe you meant to type \"%(keyword)s\"" :
		"\"%(word)s\" ist nicht definiert. Wolltest du \"%(keyword)s\" schreiben?",
	"Error: %(message)s" : "Fehler: %(message)s",
	"A critical problem occurred in your program making it unable to run." : "Es ist ein Problem aufgetreten, dein Programm kann nicht starten."
}

if( typeof i18n === "undefined" ) {
	var i18n = {};
}

var i18n = { 
    interpolateStringToArray: function(str, options) {
        options = options || {};

        // Split the string into its language fragments and substitutions
        var split = str.split(/%\(([\w_]+)\)s/g);

        // Replace the substitutions with the appropriate option
        for (var i = 1; i < split.length; i += 2) {
            var replaceWith = options[split[i]];
            split[i] = _.isUndefined(replaceWith) ? "%(" + split[i] + ")s" : replaceWith;
        }
        return split;
    },

    _ : function (str, options) {
		if( !translations[ str ] ) {
			console.log( "Translation of '" + str + "' is not available."); 
			return str;
		}

        return this.interpolateStringToArray( translations[ str ], options).join("");
    },

	ngettext: function( singular, plural, count, options ) {
		if( count === 1 ) return this._( singular, options );
		else return this._( plural, options );
	},
};


