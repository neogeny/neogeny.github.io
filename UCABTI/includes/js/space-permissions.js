AJS.Confluence.SpacePermissions = {

    updateField: function(id, valueToAdd) {
        var input = AJS.$("#" + id);
        if (valueToAdd != ""){
            var val = input.val();
            input.val(val == "" ? valueToAdd : val + ", " + valueToAdd);
        }
    },
    updateGroupsField: function(groups) {
        AJS.Confluence.SpacePermissions.updateField("groups-to-add", groups);
    },
    updateUsersField: function(users) {
        AJS.Confluence.SpacePermissions.updateField("users-to-add-autocomplete", users);
    }
};