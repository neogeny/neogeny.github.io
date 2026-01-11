AJS.toInit(function ($) {
    $("#contentOptionAll").change(contentOptionChangeHandler);
    $("#contentOptionVisible").change(contentOptionChangeHandler);
    $("#checkAllLink").click(function () {
        $(".exportContentTreeCheckbox").attr("checked", "checked");
        return false;
    });
    $("#clearAllLink").click(function () {
        $(".exportContentTreeCheckbox").attr("checked", "");
        return false;
    });    
    
    function contentOptionChangeHandler()
    {
        var isDisabled = !!$("#contentOptionAll:checked").length;
        $(".exportContentTreeCheckbox").each(function () {
            this.disabled = isDisabled;
        });
    }    

    function toggleChildren(checkboxElement) {
        var jqCheckbox = $(checkboxElement);
        var checked = jqCheckbox.attr("checked") || "";
        
        jqCheckbox.parent().find("input,.exportContentTreeCheckbox").attr(
                "checked", checked);
    }
    
    $(".exportContentTreeCheckbox").click( function() {
        toggleChildren(this);
    });
    
    // Single node select functionality
    //
    
    $(".togglemeonlytreenode").each( function(index) {
                    $(this).click( function(event) {
                        var inputCheckbox = $($(this).siblings(".exportContentTreeCheckbox").get(0));
                        if (inputCheckbox.attr("checked"))
                            inputCheckbox.attr("checked",false);
                        else
                            inputCheckbox.attr("checked", true);
                        
                        event.preventDefault();
                        }
                    );
    }); 
});