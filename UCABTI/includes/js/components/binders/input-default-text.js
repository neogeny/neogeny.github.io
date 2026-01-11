/**
 * Displays default text in the input field when its value is empty.
 *
 * Usage:
 * <pre>
 * <input class="default-text" data-default-text="Some default text">
 * </pre>
 */
AJS.Confluence.Binder.inputDefaultText = function() {
    var $ = AJS.$;
    $("input.default-text[data-processed!=true]").each(function() {

        var $this = $(this).attr("data-processed", "true"),
            defaultText = $this.attr("data-default-text"),
            applyDefaultText = function() {
                if(!$.trim($this.val()).length) {
                    $this.val(defaultText);
                    $this.addClass("placeholded");
                    $this.trigger("reset.default-text");
                }
            };

        applyDefaultText();
        $this.blur(applyDefaultText).focus(function() {
            if($this.hasClass("placeholded")) {
                $this.val("");
                $this.removeClass("placeholded");
            }
        });
    });
};