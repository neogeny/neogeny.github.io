/**
 * Returns an object wrapper for a parameter-div jQuery object and the input in
 * that div that stores the internal parameter value (as opposed to the display
 * field, although they may be the same).
 */
AJS.MacroBrowser.Field = function (paramDiv, input, options) {
    options = options || {};

    var setValue = options.setValue || function (value) {
        input.val(value);
    };

    var getValue = options.getValue || function () {
        return input.val();
    };
    
    input.change(options.onchange || AJS.MacroBrowser.paramChanged);

    return {
        paramDiv : paramDiv,
        input : input,
        setValue : setValue,
        getValue : getValue
    };
};

/**
 * ParameterFields defines default "type" logic for fields in the Macro
 * Browser's Insert/Edit Macro form.
 * 
 * Each method in this object corresponds to a parameter type as defined in the
 * MacroParameterType enum.
 */
AJS.MacroBrowser.ParameterFields = (function ($) { 

    /*
     * The underlying AJS dropDown component takes options and this function
     * is responsible for creating the standard options the parameter fields
     * specified in this file need.
     * 
     * In this case, the 'standardOptions' are the selectionHandler handler
     * the dropDown component will use when items are selected. This is set
     * to be the onselect function passed.
     */
    var createStandardDropDownOptions = function (onselect) {
        return {
                selectionHandler: function (e, selection) {
                    onselect(selection);
                    this.hide();   
                    e.preventDefault();
                }
           };
    };
        
    /**
     * Quick search drop down post processor that will handle the case when there are no
     * matches
     */
    var handleNoMatches = function (list) {
        // remove the "search for" at the bottom of the list
        $("ol.last", list).remove();

        // check if there are items in the drop down. If none then display a
        // message telling the user this
        if ($("ol", list).length == 0) {
            var noSuggestions = AJS.clone("#macro-param-smartfield-no-suggestion-template");
            list.append(noSuggestions.find("ol"));
        }
    };     
    
    /**
     * Standard function to place the drop down.
     */
    var dropDownPlacer = function (input) {
        return function(dropDown) {
            var placer = AJS("div");
            placer.addClass("macro-param-dropdown-wrapper aui-dd-parent");
            placer.append(dropDown);
            input.after(placer);
            // dropDownEscapeHandler(input, dropDown);
        };
    };
    
    /**
     * Standard function that will ensure the 'escape' keypress closes the drop down and
     * not the Macro Browser dialog itself.
     * 
     * TODO - doesn't work - the dropdown.js has already seen the escape key and has hidden
     */
    var dropDownEscapeHandler = function (input, dropDown) {
        // escape key handling for the drop down - we want the drop down to be dismissed and not the whole dialog
        input.keyup(function (e) {
            if (e.keyCode == 27)  {
                var parent = input.parent();
                if (!parent) {
                    return;
                }
                
                // if the drop down is visible then hide it on escape
                if ($(".aui-dropdown:not(.hidden)", parent).length) {
                    dropDown.hide();
                    return AJS.stopEvent(e);
                }
                
                // otherwise don't use the escape keyup event
                return;
            }
        });        
    };
    
    
    /**
     * This is not used by any of the current field implementation. However, we have big plans for this function
     * once we support multi-valued fields.
     */
    var makeAutoListField = function (param, value, options, queryParams, makeListItem, setValue) {
        options = options || {}; 

        /*
         * Search for pages/blog-posts by au
         */
        var paramDiv = AJS.clone("#macro-param-hidden-text-template");
        var autocomplete = AJS.$("input[type='text']", paramDiv);
        var input = AJS.$("input[type='hidden']", paramDiv);

        var list = makeItemList(param, input, autocomplete, options.onchange);

        var onselect = function(selection) {
            // User makes selection from the search drop-down.
            var span = $("span", selection);
            var props = AJS.$.data(span[0], "properties");
            var item = makeListItem(props);
            addItemToList(list, item.value, item.display);
            autocomplete.focus();
        };

        /**
         * Needs to be changed so that the query parameter is appended in quicksearch
         */
        autocomplete.quicksearch("/json/contentnamesearch.action?" + queryParams(), function(dd) {
            $("ol.last", dd).remove();  // no need for "Search for" at bottom.
            $("a", dd).click(function(e) {
                e.preventDefault();
                (options.onselect || onselect)(e.target);
            });
        });

        if (value) {
            (options.setValue || setValue)(value, list);
        }

        return AJS.MacroBrowser.Field(paramDiv, input);
    };

    /**
     * Update the dependencies of the identified parameter with the supplied value.
     */
    var updateDependencies = function (paramName, dependencies, value) {
        if (dependencies && dependencies.length) {
            for ( var i = 0, length = dependencies.length; i < length; i++) {
                AJS.MacroBrowser.fields[dependencies[i]].dependencyUpdated(paramName, value);                        
            }
        }
    };

    return {
      "updateDependencies" : updateDependencies,
    	
      "username" : function(param, options) {
            if (param.multiple) {
                return AJS.MacroBrowser.ParameterFields.string(param, options);
            }
        
            options = options || {};

            options.queryParams = options.queryParams || function () {
                return "/json/contentnamesearch.action?type=userinfo";
            };        
        
            var paramDiv = AJS.clone("#macro-param-template");
            var input = AJS.$("input[type='text']", paramDiv);

            // CONF-16859 - check if mandatory params are now filled
            if (param.required) {
                input.keyup(AJS.MacroBrowser.processRequiredParameters);
            }
            
            options.setValue = options.setValue || function (value) {
                input.val(value);
                updateDependencies(param.name, options.dependencies, input.val());                
                (typeof options.onchange == "function") && options.onchange.apply(input);
            };
        
            var onselect = options.onselect || function(selection) {
                // if the user selected the "no matches" message then do nothing
                if (!selection.hasClass("message")) {
                    var span = $("span", selection);
                    var contentProps = $.data(span[0], "properties");
                    var username = contentProps.href.substr(contentProps.href.lastIndexOf("/") + 2);  // HACK- should include username in result? dT
                    options.setValue(unescape(username));
                }
            };
        
            input.quicksearch(options.queryParams(), null, 
                { 
                    dropdownPostprocess : handleNoMatches,
                    dropdownPlacement : dropDownPlacer(input),
                    ajsDropDownOptions : createStandardDropDownOptions(onselect)
                } 
            );
            
            return AJS.MacroBrowser.Field(paramDiv, input);
        },        
        
      "spacekey" : function(param, options) {
        // for multple space keys just use a String field at the moment
        if (param.multiple) {
            return AJS.MacroBrowser.ParameterFields["string"](param, options);
        }
        
        options = options || {};

        options.queryParams = options.queryParams || function() {
            return "/json/contentnamesearch.action?type=spacedesc&type=personalspacedesc";
        };        
    
        var paramDiv = AJS.clone("#macro-param-template");
        var input = AJS.$("input[type='text']", paramDiv);
        
        // CONF-16859 - check if mandatory params are now filled
        if (param.required) {
            input.keyup(AJS.MacroBrowser.processRequiredParameters);
        } 
        
        options.setValue = options.setValue || function (value) {
            input.val(value);
            updateDependencies(param.name, options.dependencies, input.val());                
            (typeof options.onchange == "function") && options.onchange.apply(input);
        };
    
        var onselect = options.onselect || function(selection) {
            // if the user selected the "no matches" message then do nothing
            if (!selection.hasClass("message")) {
                // User makes selection from the search drop-down.
                var span = $("span", selection);
                var contentProps = $.data(span[0], "properties");
                options.setValue(contentProps.spaceKey);
            }
        };
    
        input.quicksearch(options.queryParams(), null, 
            { 
                dropdownPostprocess : handleNoMatches,
                dropdownPlacement : dropDownPlacer(input),
                ajsDropDownOptions : createStandardDropDownOptions(onselect)            
            }
        );
        
        return AJS.MacroBrowser.Field(paramDiv, input);
      },         

    "attachment" : function (param, options) {
            if (param.multiple) {
                return AJS.MacroBrowser.ParameterFields["string"](param,
                        options);
            }

            var paramDiv = AJS.clone("#macro-param-select-template");
            var input = AJS.$("select", paramDiv);

            options = options || {};
            options.setValue = options.setValue || function(value) {
                // check if the value being set is in the list of options
                // if not then add it as a new option - with an indication that
                // it is not a valid choice for this select box
                var foundOption = false;
                input.find("option").filter("[value=" + value + "]").each(function() {
                    foundOption = true;
                });

                if (!foundOption) {
                    input.append(AJS.$("<option/>").attr("value", value).html(value + " (" + AJS.params.notFound + ")"));
                    input.tempValue = value;
                } else {
                    delete input.tempValue;
                }
                
                // CONF-15415 : Spurious error thrown in IE6
                try {
                    input.val(value);
                } catch (err) {
                    AJS.log(err);
                }

                input.change();
            };

            var field = AJS.MacroBrowser.Field(paramDiv, input, options);
            field.updateDependencies = updateDependencies;
            field.getData = function(req) {
            	if (!((req.title && req.spaceKey) || req.pageId || req.draftId)) {
            		AJS.log("Not enough parameters to send attachmentsearch request");
                    return;	// not enough content info to get attachments
            	}

                var currentValue = input.tempValue || input.val();

                if (options.fileTypes) {
                    req.fileTypes = options.fileTypes;
                }
                
                var url = AJS.params.contextPath + (req.draftId ? "/json/draftattachmentsearch.action" : "/json/attachmentsearch.action");
                $.getJSON(url, req, function(data) {
                    if (data.error) {
                        return;
                    }

                    $("option", input).remove();
                    var attachments = data.attachments;
                    
                    // if there are no attachments on the page then populate the options with 
                    // a message stating this
                    if (!attachments.length) {
                        // AJS.log("attachment - No attachments so creating message. tempValue = " + input.tempValue);
                        input.append(AJS.$("<option/>").attr("value", "").html(AJS.params.noAppropriateAttachments));

                        if (input.tempValue) {
                            options.setValue(input.tempValue);
                        }
                    } else {
                        for (var i = 0, length = attachments.length; i < length; i++) {
                            input.append(AJS.$("<option/>").attr("value", attachments[i].fileName).html(attachments[i].fileName));
                        }
                        
                        currentValue = currentValue || input.tempValue;
                        options.setValue(currentValue || attachments[0].fileName);
                    }
                });
            };

            return field;
        },

    "confluence-content" : function (param, options) {
    
        // If multiple confluence-content field then only return a String at the moment
        if (param.multiple) {
            return AJS.MacroBrowser.ParameterFields["string"](param, options);
        }
        
        options = options || {};
        param.options = param.options || {};

        options.queryParams = function() {
            // Allow type override from XML descriptor
            var types = (param.options.type || "page,blogpost").split(",");
            for (var i = 0, len = types.length; i < len; i++) {
                types[i] = "type=" + types[i];
            }
            var typeStr = types.join("&");

            // Allow space override from XML descriptor
            var spaceStr = "";
            if (param.options.spaceKey) {
                if (param.options.spaceKey.toLowerCase() == "@self") {
                    param.options.spaceKey = AJS.params.spaceKey;
                }
                spaceStr = "&spaceKey=" + param.options.spaceKey;
            }

            return "/json/contentnamesearch.action?" + typeStr + spaceStr;
        };
    
        var makeContentLink = function (contentProps) {
    
            var spaceKey = contentProps.spaceKey;
            var pageTitle = contentProps.name;
            var href = contentProps.href;
            // HACK - blogpost may have something like href
            // "/confluence/display/ds/2009/04/23/Neewws"
            // This is the only reference to the date of the blogpost so it
            // needs processing.
            // TODO - ContentNameSearch should include pageId in contentProps
            // returned. dT
            if (contentProps.className == "content-type-blogpost") {
                var path = href.substr(AJS.params.contextPath.length + 1);
                var spaceIndex = path.indexOf("/" + spaceKey + "/");
                if (spaceIndex > -1) {
                    // has URL-friendly blogpost title, set to be like -
                    // ds:/2009/04/23/Neewws
                    var dateStart = spaceIndex + spaceKey.length + 1;
                    pageTitle = path.substring(dateStart);
                }
                else {
                    // TODO - if we have content id, use it! dT
                }
            }
            pageTitle = pageTitle.replace(/\+/g, " ");  // TODO - should do complete URL decode?
            return ((spaceKey && spaceKey != AJS.params.spaceKey) ? (spaceKey + ":") : "") + pageTitle;
        };
    
        var paramDiv = AJS.clone("#macro-param-template");
        var input = AJS.$("input[type='text']", paramDiv);
        
        // CONF-16859 - check if mandatory params are filled on keypresses in this field.
        if (param.required) {
            input.keyup(AJS.MacroBrowser.processRequiredParameters);
        }

        
        options.setValue = options.setValue || function (value) {
            input.val(value);
            // input.change();
            (typeof options.onchange == "function") && options.onchange.apply(input);
        };
    
        var onselect = options.onselect || function(selection) {
            // if the user selected the "no matches" message then do nothing
            if (!selection.hasClass("message")) {
                // User makes selection from the search drop-down.
                var span = $("span", selection);
                var contentProps = $.data(span[0], "properties");
                var contentLink = makeContentLink(contentProps);
                options.setValue(contentLink, input);
            }
        };
        
        // CONF-15438 - update any dependencies of the field when it is changed
        options.onchange = options.onchange || function (e) {
        	var val = input.val();
        	updateDependencies(param.name, options.dependencies, val);
        };
        
        /**
         * Function to add a tooltip with the space name to all items.
         * 
         * This function is also responsible for removing the 'Search For'
         * item that is returned last in the list by the content name search
         * backend.
         */
        var spaceDifferentiation = function (list) {
             // remove the "search for" at the bottom of the list
            $("ol.last", list).remove();

             // check if there are items in the drop down. If none then display a message telling the user this
            if ($("ol", list).length == 0) {
                var noSuggestions = AJS.clone("#macro-param-smartfield-no-suggestion-template");
                list.append(noSuggestions.find("ol"));
            } else {
                // Add a tooltip with the space name and content title
                $("a", list).each(function () {
                    var $a = $(this);
                    var $span = $a.find("span");
                    $a.attr("title", "(" + AJS.dropDown.getAdditionalPropertyValue($span, "spaceName") + ") " + $span.text());
                });
            }
        };

        input.quicksearch(options.queryParams(), null, 
            { 
                dropdownPostprocess : spaceDifferentiation,
                dropdownPlacement : dropDownPlacer(input),
                ajsDropDownOptions : createStandardDropDownOptions(onselect)
            } 
        );
    
        return AJS.MacroBrowser.Field(paramDiv, input, options);
    },     
    
    /**
     * Default field for all unknown types.
     */
    "string" : function (param, options) {

        var paramDiv = AJS.clone("#macro-param-template");
        var input = $("input", paramDiv);

        if (param.required) {
            input.keyup(AJS.MacroBrowser.processRequiredParameters);
        }
        
        return AJS.MacroBrowser.Field(paramDiv, input, options);
    },

    /**
     * A checkbox - assumes not true means false, not null.
     */
    "boolean" : function (param, options) {

        var paramDiv = AJS.clone("#macro-param-checkbox-template");
        var input = $("input", paramDiv);

        options = options || {};
        options.setValue = options.setValue || function (value) {
            if (/true/i.test(value) ||
                (/true/i.test(param.defaultValue) && !(/false/i).test(value))) {
                input.attr("checked", "checked");
            }
        };

        return AJS.MacroBrowser.Field(paramDiv, input, options);
    },

    "enum" : function (param, options) {
        if (param.multiple) {
            return AJS.MacroBrowser.ParameterFields["string"](param, options);
        }

        var paramDiv = AJS.clone("#macro-param-select-template");
        var input = $("select", paramDiv);
        if (!(param.required || param.defaultValue)) {
            input.append(AJS.$("<option/>").attr("value", ""));
        }
        $(param.enumValues).each(function() {
            input.append(AJS.$("<option/>").attr("value", this).html("" + this));
        });

        return AJS.MacroBrowser.Field(paramDiv, input, options);
    },
    
    /**
     * Like a "string" field but hidden.
     */
    "_hidden" : function (param, options) {

        var paramDiv = AJS.clone("#macro-param-hidden-template").hide();
        var input = $("input", paramDiv);

        return AJS.MacroBrowser.Field(paramDiv, input, options);
    }    
    
}; })(AJS.$);