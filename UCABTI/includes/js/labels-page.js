AJS.toInit(function ($) {
    if (!$("#add-labels-form").length) {
        return;
    }

    $(".show-labels-editor").click(function () {
        AJS.safe.ajax({
            url: AJS.params.contextPath + "/json/suggestlabelsactivity.action",
            data: {entityIdString: AJS.params.pageId},
            success: AJS.Labels.suggestedLabelsCallback,
            error: AJS.Labels.suggestedLabelsErrorHandler,
            dataType: "json"
        });
        // reset the value of this field, just in case the browser wants to become helpful and insert the old value
        $("#labelsString").val("");
        $("#labels-section").addClass("open");

        // update the links
        AJS.setVisible(".show-labels-editor", false);
        AJS.setVisible("a.hide-labels-editor", true);
        AJS.setVisible("#labels-section-title", true);

        $("#labelsString").get(0).focus();
        return false;
    });
    $(".hide-labels-editor").click(function () {
        // clear out any error messages
        AJS.Labels.labelOperationError("");
        $("#errorSpan").html("");
        $("#labels-section").removeClass("open");

        // update the links
        AJS.setVisible("a.hide-labels-editor", false);
        AJS.setVisible(".show-labels-editor", true);
        if ($("#labelsList").children().length == 0 && $("#labelsString").val() == "") { // no labels
            $(".show-labels-editor").addClass("add").text(AJS.params.addLabel);
            AJS.setVisible("#labels-section-title", false);
        }
        else {
            $(".show-labels-editor").removeClass("add").text(AJS.params.editLabel);
            AJS.setVisible("#labels-section-title", true);
        }

        // add label if any user input
        AJS.Labels.addLabelFromInput();
        return false;
    });

    $("#add-labels-form").submit(AJS.Labels.addLabelFromInput);
    $(".labels-editor .add-labels").click(AJS.Labels.addLabelFromInput);
    $(".labels-editor .remove-label").click(AJS.Labels.removeLabel);

    // add return key handling to the label field
    $("#labelsString").keydown(function (event) {
        if (event.which == 13 && !AJS.dropDown.current) {
            AJS.Labels.addLabelFromInput();
            return AJS.stopEvent(event);
        }
    });
});

