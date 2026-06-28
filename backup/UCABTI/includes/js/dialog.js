/**
 * Provides Confluence-specific overrides of AJS.Dialog defaults
 */
AJS.ConfluenceDialog = function(options) {
    var dialog;
    options = options || {};
    options = jQuery.extend({}, options, {
        keypressListener: function(e) {
            if (e.keyCode === 27) {
                // if dropdown is currently showing, leave the dialog and let the dropdown close itself
                if (!jQuery(".aui-dropdown", dialog.popup.element).is(":visible")) {
                    if (typeof options.onCancel == "function") {
                        options.onCancel();
                    } else {
                        dialog.hide();
                    }
                }
            }
            else if (e.keyCode === 13) {
                // Enter key pressed
                if (!jQuery(".aui-dropdown", dialog.popup.element).is(":visible")) {
                    // No dropdown showing - enter is on dialog.
                    var nodeName = e.target.nodeName && e.target.nodeName.toLowerCase();
                    if (nodeName != "textarea" && typeof options.onSubmit == "function") {
                        options.onSubmit();
                    }
                }
            }
        }
    });
    dialog = new AJS.Dialog(options);
    return dialog;
};
