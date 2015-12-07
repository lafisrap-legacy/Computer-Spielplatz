$(function fn() {
    fn.paper = {
      init: function() {
      }
    };

    fn.animation = {
      init: function() {
        
      }
    };

    var CPG_currentPage = sessionStorage["currentPage"] || "paper";
    $(".page").hide();
    $("#nav-bar-"+CPG_currentPage).addClass("active");
    $("#page-"+CPG_currentPage).show();
    fn[CPG_currentPage].init();

    var pages = ["paper", "animation"];
    for( pid in pages) {
        var page = pages[pid]; 
        $("#nav-bar-"+page).on("click tap", function(e) {
            var page = $(this).attr("rel").substr(5);
            sessionStorage["currentPage"] = CPG_currentPage;
            $(".nav-bar-page").removeClass("active");
            $(this).addClass("active");
            $(".page").hide();
            $("#page-"+page).show();
            fn[page].init();
        }); 
    }
});
