/**
 * A collection of reusable Confluence UI Components.
 * @module Components
 */

/**
 * Generic Confluence helper functions.
 *
 * @static
 * @since 3.3
 * @class Confluence
 * @namespace AJS
 * @requires AJS, jQuery
 */
AJS.Confluence = {
    /**
     * Returns the context path defined in the 'confluence-context-path' meta tag.
     * @method getContextPath
     * @return {String}
     */
    getContextPath : function() {
        return AJS.$("#confluence-context-path").attr('content') || "";
    },

    /**
     * Binder components, in the AJS.Confluence.Binder namespace are executed.
     * This can be called when new elements are added to the page after page load
     * (e.g. dialog is created) and the components need to bound to the new elements.
     *
     * @method initBinderComponents
     */
    runBinderComponents: function () {
        for (var i in AJS.Confluence.Binder) {
            if (AJS.Confluence.Binder.hasOwnProperty(i)) {
                try {
                    AJS.Confluence.Binder[i]();
                } catch(e) {
                    AJS.log("Exception in initialising of component '" + i + "': " + e.message);
                }
            }
        }
    },

    /**
     * Automatically place the focus on an input field marked with 'data-focus'.  The element
     * with the lowest value wins.  If more than one index has the same value, one will be picked
     * indeterminately.
     *
     * @method placeFocus
     */
    placeFocus: function () {
        var element,max = -1;
        AJS.$("input[data-focus]").each(function() {
            var $this = AJS.$(this),
                thisFocus = $this.attr("data-focus");
            if (thisFocus > max) {
                max = thisFocus;
                element = $this;
            }
        });
        element && element.focus();
    }
};

/**
 * Objects added to the AJS.Confluence.Binder namespace must be
 * functions which can be executed several times on a page.
 * 
 * @class Binder
 * @namespace AJS.Confluence
 */
AJS.Confluence.Binder = {};

AJS.toInit(function () {
    AJS.Confluence.runBinderComponents();
    AJS.Confluence.placeFocus();
});