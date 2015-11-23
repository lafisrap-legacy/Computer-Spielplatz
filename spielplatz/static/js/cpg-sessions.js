
var refreshSession = function(loginTime) {
	// If User changed: clear everything from localStorage
	if( sessionStorage.loginTime !== loginTime) {
	    var fileList = sessionStorage.codeFileList && JSON.parse(sessionStorage.codeFileList) || [];
	    for( var i=0 ; i<fileList.length ; i++ ) sessionStorage.removeItem(fileList[i]);
	    sessionStorage.removeItem("codeFileList");
	    sessionStorage.removeItem("allFilesList");
	    sessionStorage.removeItem("currentCodeFile");
	    localStorage.loginTime = sessionStorage.loginTime = loginTime;
	}

	$(window).focus(function(e) {
	    // Look if another Tab or window logged out (and maybe in again) in the meantime
	    if( sessionStorage.loginTime !== localStorage.loginTime ) location.reload(); 
	});	
};
