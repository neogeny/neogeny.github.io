AJS.toInit(function($) {
    $("a#websudo-drop.drop-passive").click(function()
    {
        $.get($(this).attr("href"), function() {
            $("li#confluence-message-websudo-message").slideUp();
        });
        return false;
    });
});