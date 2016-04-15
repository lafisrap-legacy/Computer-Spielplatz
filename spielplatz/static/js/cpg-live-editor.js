////////////////////////////////////////////////////////////////////////////////////////////////
// Live-Editor-Modul, currently with Processing/Javascript (Khan-Flavour)
$(function fn() {

//////////////////////////////////////////
// Initiate the live editor that fits to the current page (tab)
var CPG_page = sessionStorage["CPG_page"] || "page-pjs",
    
    CPG_options = {
        el: $("#cpg-live-editor-pages"),
        page: CPG_page
    },

    CPG_liveEditor =( CPG_page === "page-pjs") ? new window.LiveEditorFramePjs( CPG_options ) : 
                    ( CPG_page === "page-html" ) ? new window.LiveEditorFrameHTML( CPG_options ) :

                    console.error ( "No valid CPG_page specified" );

window.onbeforeunload = function() {
	for( pid in pages) {
		var page = pages[pid]; 
		if( window[page+"Onbeforeunload"] ) window[page+"Onbeforeunload"]();
	}
}



$( window ).trigger( "live-editor-late-integration" );

$( ".scratchpad-toolbar" ).hide();

/////////////////////////////////////////////////////////////////////////////////////////////////
// Live Editor page logic
//
refreshSession( window.CPG.LoginTime );

//////////////////////////////////////////
// Fill in the globals form local storage
var CPG_codeFileList = sessionStorage.codeFileList && JSON.parse(sessionStorage.codeFileList) || [],
	CPG_allFilesList = sessionStorage.allFilesList && JSON.parse(sessionStorage.allFilesList) || [],
	CPG_currentCodeFile = sessionStorage.currentCodeFile || window.CPG.ControlBarNewFile;
	CPG_codeFiles = {},
	CPG_modified = false;

for( var i=0 ; i<CPG_codeFileList.length ; i++ ) CPG_codeFiles[CPG_codeFileList[i]] = sessionStorage[CPG_codeFileList[i]] && JSON.parse(sessionStorage[CPG_codeFileList[i]]) || {};
CPG_codeFiles[window.CPG.ControlBarNewFile] = sessionStorage[window.CPG.ControlBarNewFile] && JSON.parse(sessionStorage[window.CPG.ControlBarNewFile]) || { code: "" };

///////////////////////////////////////////
// showModalYesNo displays a modal dialog with answers yes and no
var showModalYesNo = function(title, body, cb) {
	var modal = $("#control-bar-yes-no-modal");

	$(".modal-title", modal).text(title);
	$(".modal-body p", modal).text(body);
	$(".modal-yes", modal).off("click").one("click", function(e) {
		var lcb = cb;
		cb = null;
		modal.modal('hide');
		if( lcb ) lcb(true);
	});
	$(".modal-no", modal).off("click").one("click", function(e) {
		// cb is called on hide event
		modal.modal('hide');
	});

	modal.modal('show');
	modal.one('hidden.bs.modal', function(e) {
		if( cb ) cb(false);
	});
};


///////////////////////////////////////////
// showModalSound displays a modal dialog to select sounds
var showModalSound = window.showModalSound = function(cb) {
	var modal = $("#control-bar-sound-modal");

	var soundGroups = window.CPG.OutputSounds[0].groups,
		groups = $("<div id='modal-sound-groups'>");

	for( var i=0 ; i<soundGroups.length ; i++ ) {
		var gr = soundGroups[i],
			sounds = $("<div class='soundgroup'>");
		sounds.append("<div class='title'>"+gr.groupName+"</div>");
		for( var j=0 ; j<gr.sounds.length ; j++ ) {
			sound = gr.sounds[j];
			sounds.append(
				"<div class='sound'>"+
				" <audio src='static/userdata/"+window.CPG.UserNameForImages+"+/sounds/"+gr.groupName+"/"+sound+".mp3' controls></audio>"+
				" <span class='sound-name' path='"+gr.groupName+"/"+sound+"'>"+sound+"</span>"+
				"</div>"
			);
		}

		groups.append(sounds);
	}

	$(".modal-body", modal).html(groups);

	$(".modal-open", modal).off("click").one("click", function(e) {
		modal.modal('hide');
		if( cb ) cb($(".sound-name.selected").attr("path"));
	});

	$(".modal-cancel", modal).off("click").one("click", function(e) {
		// cb is called on hide event
		modal.modal('hide');
	});

	$(".sound-name", modal).hover(function(e) {
		$(this).addClass("active");
	}, function(e) {
		$(this).removeClass("active"); 
	}).on("click", function(e) {
		if( $(this).hasClass("selected") ) {
			$(".modal-open", modal).trigger("click");
		}
		$(".sound-name", modal).removeClass("selected");
		$(this).addClass("selected");
	});

	modal.modal('show');

	modal.one('hidden.bs.modal', function(e) {
		if( cb ) cb();
	});
};


///////////////////////////////////////////
// showModalCodeFiles shows the code file info and modification dialog
var showModalCodeFiles = function(cb) {
	var modal = $("#control-bar-codefile-modal");

	var afl = CPG_allFilesList,
		files = $("<div id='modal-codefiles'>"),
		row = null;

	for( var i=0 ; i<afl.length ; i++ ) {
		files.append(
			"<div class='file file"+i+" pull-left' filename='"+afl[i].name+"'>"+
			" <div class='top'>"+
			" </div>"+
			" <div class='middle'>"+
			"	 <img src='static/userdata/"+window.CPG.UserName+"/pjs/"+(afl[i].name.slice(0,-3)+".png")+"'>"+
			" </div>"+
			" <div class='bottom'>"+
			"	 <span class='filename text-center'>"+afl[i].name+"</span>"+
			"	 <span class='timestamp pull-left vbottom'>"+getFormatedDate(afl[i].timeStamp)+"</span>"+
			"	 <input type='checkbox' class='checkbox large pull-right' value=''>"+
			" </div>"+
			"</div>"
		);
	}
	
	// Correct font size of filenames
	$(".modal-body", modal ).html(files);
	modal.one('shown.bs.modal', function() {

		for( var i=0 ; i<afl.length ; i++ ) {
			var filename = $(".file"+i+" .filename", files),
				maxWidth = filename.width(),
				realWidth = filename[0].scrollWidth;

			if( realWidth > maxWidth ) {
				var fontSize = parseFloat(filename.css("font-size"));

				for( var j=1 ; j<10 ; j++ ) {
					filename.css("font-size", (fontSize - j));
					if( filename[0].scrollWidth <= maxWidth ) break;
				}
			}
		}
	});

	/*
	$(".file .middle", modal).one("dblclick", function(e) {
		cb("open", [$(this).parent().attr("filename")]);
		cb = null;
		modal.modal('hide');
	});
	*/

	$(".file .middle", modal).on("click", function(e) {
		var checkbox = $(".checkbox", $(this).parent()); 
		checkbox.prop("checked", !checkbox.prop("checked"));
	});

	var getCheckedFilenames = function() { 
		var filenames = [];
		$.each($(".file", modal), function( index, file ) {
			var checkbox = $(".checkbox", $(this))
			if( checkbox.is(':checked')) {
				filenames.push($(this).attr("filename"));
			}
		});
		return filenames;
	}

	$(".modal-open", modal).off("click").one("click", function(e) {

		var lcb = cb;
		cb = null;
		modal.modal('hide');

		//if( !lcb ) debugger;
		if( lcb ) lcb("open", getCheckedFilenames());
	});

	$(".modal-cancel", modal).off("click").one("click", function(e) {
		modal.modal('hide');
	});

	$(".modal-delete", modal).off("click").one("click", function(e) {
		var lcb = cb;
		cb = null;
		modal.modal('hide');

		//if( !lcb ) debugger;
		if( lcb ) lcb("delete", getCheckedFilenames());
	});

	modal.one('hidden.bs.modal', function(e) {
		if( cb ) cb("cancel");
	});

	modal.modal('show');
};

////////////////////////////////////////////
// storeCurrentCodeFile syncs the current code file with the global variable and the local storage
var storeCurrentCodeFile = function() {
	if( CPG_currentCodeFile ) {
		CPG_codeFiles[CPG_currentCodeFile].code = liveEditor.editor.text();
		sessionStorage[CPG_currentCodeFile] = JSON.stringify(CPG_codeFiles[CPG_currentCodeFile]);			
	}
};

/////////////////////////////////////////////
// fillButtonControl fills the file select button with current files
var fillButtonControl = function() {

	// create file list for button control
	var fileList = [];
	for( var i=0 ; i<CPG_codeFileList.length ; i++ ) {
		fileList.push({
			fileName: CPG_codeFileList[i],
			timeStamp: CPG_codeFiles[CPG_codeFileList[i]].timeStamp
		});
	}

	fileList.sort(function(a,b) {
		if( a.timeStamp > b.timeStamp ) return -1;
		else return 1;
	});

	var cbf = $("#control-bar-files"),
		width = cbf.width();

	cbf.html("");
	for( var i=0 ; i<fileList.length ; i++ ) {

		cbf.append('<li class="control-bar-file" codefile="'+fileList[i].fileName+'"><span>'+fileList[i].fileName+'</span><span class="timestamp">'+getFormatedDate(fileList[i].timeStamp)+'</span></li>')
			.width(width + 20); 
	}

	if( CPG_allFilesList.length >= 2 ) {
		cbf.append('<li class="border-top control-bar-file" codefile="all"><span>'+window.CPG.ControlBarAllFiles+'</span></li>')
	}

	$("#control-bar-current-file").text(CPG_currentCodeFile);
	$("#control-bar-input input").val(CPG_currentCodeFile);

	$(".control-bar-file").on('click', function(e) {
		if( CPG_currentCodeFile !== window.CPG.ControlBarNewFile ) {
			storeCurrentCodeFile();
		}

		var codeFile = $(this).attr("codeFile");
 
		if( codeFile !== "all" ) {
			sessionStorage.currentCodeFile = CPG_currentCodeFile = codeFile;
			$("#control-bar-current-file").text(CPG_currentCodeFile);
			$("#control-bar-input input").val(CPG_currentCodeFile)
			liveEditor.editor.reset(CPG_codeFiles[CPG_currentCodeFile].code);
			CPG_modified = false;
		} else {
			showModalCodeFiles(function(button, selFiles) {
				switch( button ) {
					/////////////////////////////////////////////////
					// User selected "open"
					case "open":
						for( var i=0, openFiles=[] ; i<selFiles.length ; i++ ) {
							if( CPG_codeFileList.indexOf(selFiles[i]) !== -1 ) openFiles.push(selFiles[i]);
						}

						var readFiles = function() {
							if( selFiles.length ) {
								$WS.sendMessage({
									command: "readJSFiles",
									FileNames: selFiles,
								}, function(message) {
									for( var i=0 ; i<selFiles.length ; i++ ) {
										var fileName = selFiles[i],
											codeFile = message.CodeFiles[fileName];
										if( codeFile ) {
											CPG_codeFiles[fileName] = {
												code: codeFile.Code,
												timeStamp: codeFile.TimeStamp,
											}
											sessionStorage[fileName] = JSON.stringify(CPG_codeFiles[fileName]);
											if( CPG_codeFileList.indexOf(fileName) === -1 ) CPG_codeFileList.push(fileName);
										}
									}
									sessionStorage.codeFileList = JSON.stringify(CPG_codeFileList);

									sessionStorage.currentCodeFile = CPG_currentCodeFile = selFiles[0];
									$("#control-bar-input input").val(CPG_currentCodeFile);
									fillButtonControl();

									liveEditor.editor.reset(CPG_codeFiles[CPG_currentCodeFile].code);
									CPG_modified = false;
								});
							}
						}

						if( openFiles.length ) {
							showModalYesNo(openFiles.join(" "), openFiles.length === 1?window.CPG.ControlBarModalAlreadyOpenS:window.CPG.ControlBarModalAlreadyOpenP, function(yes) {
								if( !yes ) {
									for( var i=openFiles.length-1 ; i>=0 ; i-- ) selFiles.splice(selFiles.indexOf(openFiles[i]),1);
								}

								readFiles();
							});
						} else {
							readFiles();
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
							showModalYesNo(selFiles.join(" "), selFiles.length === 1? window.CPG.ControlBarModalFileDeleteS : window.CPG.ControlBarModalFileDeleteP, function(yes) {
								if( yes ) {
									$WS.sendMessage({
										command: "deleteJSFiles",
										FileNames: selFiles,
									}, function(message) {

										// Todo: Error message
										//if( message.Error ) return;

										for( var i=selFiles.length-1 ; i>=0 ; i-- ) {
											// hier wird ab und zu ein Wort nicht aus allFiles gelöscht ... (step debug!!)

											CPG_codeFileList.splice(CPG_codeFileList.indexOf(selFiles[i]),1);
											for( var afl=CPG_allFilesList, j=afl.length-1 ; j>=0 ; j-- ) {
												if( afl[j].name === selFiles[i] ) {
													afl.splice(j,1);
													break;
												}
											} 
											CPG_codeFiles[selFiles[i]] = null;

											if( selFiles[i] === CPG_currentCodeFile ) sessionStorage.currentCodeFile = CPG_currentCodeFile = CPG_codeFileList[0] || window.CPG.ControlBarNewFile
										}
										sessionStorage.allFilesList = JSON.stringify(CPG_allFilesList);
										sessionStorage.codeFileList = JSON.stringify(CPG_codeFileList);
										sessionStorage[CPG_currentCodeFile] = JSON.stringify(CPG_codeFiles[CPG_currentCodeFile] || { code: "" });

										fillButtonControl();
										liveEditor.editor.reset(CPG_codeFiles[CPG_currentCodeFile]? CPG_codeFiles[CPG_currentCodeFile].code : "");
										CPG_modified = false;
									});
								}
							});
							return;

						}
						break;
				}
			});
		}
	});
};

///////////////////////////////////////////
// getFormatedDate returns a neatly formated date or time
var getFormatedDate = function(time) {
	if( !time ) return "";

	var monthNames = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];

	var date = new Date(),
		today = date.toDateString(),
		yearNow = date.getFullYear(),
		yesterday = date.setDate(date.getDate()-1);
	yesterday = date.toDateString();

	date.setTime(time);
	var day = date.getDate(),
		monthIndex = date.getMonth(),
		year = date.getFullYear(),
		hour = date.getHours(),
		minute = date.getMinutes();
	if( today == date.toDateString() ) var dateString = hour+":"+(minute<10?"0":"")+minute;
	else if( yesterday == date.toDateString() ) var dateString = "Gestern";
	else {
		var dateString = day+". "+monthNames[monthIndex];
		if( year != yearNow ) {
			dateString += " "+year;
		}
	}

	return dateString;
};

/////////////////////////////////////////
// selectFilename displays a filename input and selects the js filename
var selectFilename = function(input) {

	input.fadeIn();
	input.focus();
	var filename = input.val();

	if( filename.slice(-3) != ".js" ) {
		filename += ".js";
		input.val(filename);
	}

	var startPos = 0,
		endPos = filename.length-3;

	if (typeof input[0].selectionStart != "undefined") {
		input[0].selectionStart = startPos;
		input[0].selectionEnd = endPos;
	}
}

//////////////////////////////////////////
// WS.connect connects to server and loads code files
//$WS.connect("ws://192.168.0.177:8081/socket", "{{ .xsrfdata }}", function() {
//$WS.connect("ws://192.168.13.182:8081/socket", "{{ .xsrfdata }}", function() {
//$WS.connect("ws://localhost:8081/socket", "{{ .xsrfdata }}", function() {
$WS.connect(window.CPG.WebsocketsAddress, window.CPG.xsrfdata, function() {

	if( window.CPG.UserName === "" ) {
		
		liveEditor.editor.reset(CPG_codeFiles[window.CPG.ControlBarNewFile].code || "");
		CPG_modified = false;

	} else if( !sessionStorage.codeFileList || !sessionStorage.codeFileList.length) {
		$WS.sendMessage({
			Command: "readJSDir"
		}, function(message) {
			CPG_codeFileList = [];

			var files=[];
			for( file in message.Files ) {
				 files.push({ name: file, timeStamp: message.Files[file].TimeStamp });
			}

			files.sort(function(a, b) {
				if( a.timeStamp < b.timeStamp ) return 1;
				else return -1;
			});

			CPG_allFilesList = files;
			sessionStorage.allFilesList = JSON.stringify(CPG_allFilesList);

			for( var i=0, codeFilesToRead=[] ; i<5 && i<files.length ; i++ ) {
				codeFilesToRead.push(files[i].name);
			}

			if( codeFilesToRead.length ) {
				$WS.sendMessage({
					command: "readJSFiles",
					FileNames: codeFilesToRead,
				}, function(message) {
					for( var i=0 ; i<codeFilesToRead.length ; i++ ) {
						var fileName = codeFilesToRead[i],
							codeFile = message.CodeFiles[fileName];
						if( codeFile ) {
							CPG_codeFiles[fileName] = {
								code: codeFile.Code,
								timeStamp: codeFile.TimeStamp,
							}
							sessionStorage[fileName] = JSON.stringify(CPG_codeFiles[fileName]);
							CPG_codeFileList.push(fileName);							
						}
					}
					sessionStorage.codeFileList = JSON.stringify(CPG_codeFileList);

					sessionStorage.currentCodeFile = CPG_currentCodeFile = CPG_codeFileList[0];
					$("#control-bar-input input").val(CPG_currentCodeFile);
					fillButtonControl();

					liveEditor.editor.reset(CPG_codeFiles[CPG_currentCodeFile].code);
					CPG_modified = false;
				});
			} else {
				CPG_currentCodeFile = window.CPG.ControlBarNewFile;
				CPG_codeFileList = [];
				CPG_codeFiles[CPG_currentCodeFile] = { code: "", timeStamp: null };

				sessionStorage.codeFileList = JSON.stringify(CPG_codeFileList);
				sessionStorage.currentCodeFile = CPG_currentCodeFile;
				sessionStorage[CPG_currentCodeFile] = JSON.stringify(CPG_codeFiles[CPG_currentCodeFile]);

				$("#control-bar-input input").val(CPG_currentCodeFile);
				fillButtonControl();
				liveEditor.editor.reset("");
				CPG_modified = false;
			}
		});
	} else {

		fillButtonControl();
		
		liveEditor.editor.reset(CPG_codeFiles[CPG_currentCodeFile]? CPG_codeFiles[CPG_currentCodeFile].code : "");
		CPG_modified = false;
	}

	console.log("Websockets connected!");
});

///////////////////////////////////////////
// Delete button
$("#control-bar-delete").on('click', function() {
	if( CPG_currentCodeFile !== window.CPG.ControlBarNewFile ) {
		showModalYesNo(CPG_currentCodeFile, window.CPG.ControlBarModalFileDeleteS, function(yes) {
			if( yes ) {
				$WS.sendMessage({
					command: "deleteJSFiles",
					FileNames: [CPG_currentCodeFile],
				}, function(message) {

					// weiter mit go command deleteJSFiles
					CPG_codeFileList.splice(CPG_codeFileList.indexOf(CPG_currentCodeFile),1);
					for( var i=0, afl=CPG_allFilesList ; i<afl.length ; i++ ) {
						if( afl[i].name === CPG_currentCodeFile ) afl.splice(i,1);
						break;
					} 
					CPG_codeFiles[CPG_currentCodeFile] = null;

					sessionStorage.currentCodeFile = CPG_currentCodeFile = CPG_codeFileList[0] || window.CPG.ControlBarNewFile
					sessionStorage.codeFileList = JSON.stringify(CPG_codeFileList);
					sessionStorage.allFilesList = JSON.stringify(CPG_allFilesList);
					sessionStorage[CPG_currentCodeFile] = JSON.stringify(CPG_codeFiles[CPG_currentCodeFile] || { code: "" });

					fillButtonControl();
					liveEditor.editor.reset(CPG_codeFiles[CPG_currentCodeFile]? CPG_codeFiles[CPG_currentCodeFile].code : "");
					CPG_modified = false;
				});
			}
		});
		return;
	}
});

$("#control-bar-new").on('click', function() {

	var newFile = function() {
		sessionStorage.currentCodeFile = CPG_currentCodeFile = window.CPG.ControlBarNewFile;

		$("#control-bar-current-file").text(CPG_currentCodeFile);
		$("#control-bar-input input").val(CPG_currentCodeFile);
		liveEditor.editor.reset("");
		CPG_modified = false;

		storeCurrentCodeFile();		
	};

	if( CPG_modified && CPG_currentCodeFile !== window.CPG.ControlBarNewFile ) {
	 showModalYesNo(window.CPG.ControlBarModalFileChanged, window.CPG.ControlBarModalFileChanged2, function(yes) {
			if( yes ) {
				saveCodeFile(CPG_currentCodeFile, function() { newFile(); } ); 
			} else {
				newFile();
			}
		});

		return false;
	}

	newFile();
});

var saveCodeFile = function(filename, cb) {
	$("#control-bar-label").text("...");
	var code = liveEditor.editor.text();
	// Unbind any handlers this function may have set for previous
	// screenshots

	window.liveEditor.getScreenshot(function (data) {

		// remove BASE64-HTML header
		image = data.substr(data.search(",")+1);

		$WS.sendMessage({
			Command: "writeJSFiles",
			FileNames: [filename],
			TimeStamps: CPG_codeFiles[filename] && [CPG_codeFiles[filename].timeStamp] || null,
			CodeFiles: [code],
			Overwrite: CPG_currentCodeFile === filename,
			Images : [image], 
		}, function(message) {
			if( message.Error ) {
				showModalYesNo(window.CPG.ControlBarModalFileExists, message.Error, function(yes) {
					if( yes ) {
						CPG_currentCodeFile = filename;
						saveCodeFile(filename);
					} else {
						$("#control-bar-label").text(window.CPG.ControlBarLabel);
					}
				});
				return false;
			} else if( CPG_currentCodeFile !== filename ) {

				CPG_codeFiles[CPG_currentCodeFile].code = CPG_currentCodeFile !== window.CPG.ControlBarNewFile? liveEditor.editor.text() : "";
				
				CPG_codeFileList.push(filename);
				for( var i=0, filenameExists=false, afl=CPG_allFilesList ; i<afl.length ; i++ ) {
					if( afl[i].name === filename ) {
						filenameExists = true;
						break;
					}
				}
				if( !filenameExists ) CPG_allFilesList.push({
					name: filename,
					timeStamp: CPG_codeFiles[CPG_currentCodeFile].timeStamp
				});
				sessionStorage[CPG_currentCodeFile] = JSON.stringify( CPG_codeFiles[CPG_currentCodeFile] );
				sessionStorage.codeFileList = JSON.stringify(CPG_codeFileList);
				sessionStorage.allFilesList = JSON.stringify(CPG_allFilesList);
				sessionStorage.currentCodeFile = CPG_currentCodeFile = filename;

			} else if(message.OutdatedTimeStamps.length > 0) {
				showModalYesNo(filename, window.CPG.ControlBarModalFileOutdated, function(yes) {
					if( yes ) {
						CPG_codeFiles[filename].timeStamp = message.OutdatedTimeStamps[0] 
						saveCodeFile(filename);
					} else {
						$("#control-bar-label").text(window.CPG.ControlBarLabel);
					}
				});
				return false;
			} 

			CPG_codeFiles[filename] = { 
				code: liveEditor.editor.text(),
				timeStamp: message.SavedTimeStamps[0]
			};
			sessionStorage[filename] = JSON.stringify(CPG_codeFiles[filename]);
			fillButtonControl();
			CPG_modified = false;
			if( cb ) cb(); // call callback function after saving the file
			$("#control-bar-label").text(window.CPG.ControlBarSaved).parent().removeClass("btn-primary").addClass("btn-success");
			$
			setTimeout(function() { 
				$("#control-bar-label").text(window.CPG.ControlBarLabel)
					.parent().addClass("btn-primary")
					.removeClass("btn-success"); 
			}, 2000);
		});
	});
};

$("#control-bar-save").on('click', function(e) {
	var input = $("#control-bar-input input"),
		filename = input.val();

	if( filename === window.CPG.ControlBarNewFile) {
		selectFilename(input);
	} else {
		if( filename.slice(-3) != ".js" ) {
			filename += ".js";
			input.val(filename);
		}

		saveCodeFile(filename);
		input.fadeOut();
	}

	return false;
});

$("#control-bar-label").on('click', function(e) {
	$("#control-bar-save").trigger("click");
	e.stopPropagation()
});

$("#control-bar-saveas").on('click', function() {
	var input = $("#control-bar-input input");
	selectFilename(input);
});

$("#control-bar-input").submit(function(e) {
	var input = $("#control-bar-input input"),
		filename = input.val();

	if( filename === window.CPG.ControlBarNewFile) {
		selectFilename(input);
	} else {

		if( filename.slice(-3) != ".js" ) {
			filename += ".js"
			input.val(filename);
		}

		saveCodeFile(filename);
		input.fadeOut();
	}

	return false;
});


$("#control-bar-restart").on("click", function(e) {
	window.liveEditor.restartCode();
});

$("#logout-button").on("click", function(e) {
	localStorage.loginTime = 0;
});

$(".kuenste a").on("click tap", function(e) {
	storeCurrentCodeFile();
	CPG_modified = false;
});

window.onbeforeunload = function() {
	//storeCurrentCodeFile();
	if( CPG_modified ) return window.CPG.ControlBarModalFileChanged;
}

$(window).blur(function(e) {
	//console.log("Going away to next tab");
	// Do Blur Actions Here
});

$(window).on('hashchange', function(e){
	console.log("URL changed.");
	// do something...
});

setInterval(storeCurrentCodeFile, 30000)

});