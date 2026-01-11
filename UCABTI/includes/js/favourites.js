/*

This js file allows to mark a space as a favourite (global or personal) by clicking the star icon.
Since this function is used in a couple places, the code was moved into a seperate include file.

NOTE: When using this javascript include, you will have to make sure that the context fullfills the following requirements:

- contextPath variable has to be set (otherwise the action can not be found).

*/

var operationInProgressArray = new Array(); // use this array to prevent the user from triggering off another labelling operation when one is in progress

function toggleStar(imgElement)
{
   var $icon = AJS.$(imgElement),
       spaceKey = imgElement.id,
       spacesMode = false,
       spaceName = null;
   if (spaceKey != null && spaceKey.substring(0, 14) == "spacelink-fav-") {
       spaceKey = spaceKey.substring(14);
       spacesMode = true;
       spaceName = AJS.$("#spacelink-" + spaceKey).text();
   }
   if ($icon.hasClass("icon-add-fav")) {
       $icon.removeClass("icon-add-fav").addClass("icon-remove-fav");
       if (spacesMode) {
           $icon.attr("title", AJS.$("#i18n-favourite-remove-space").val());
           $icon.text(AJS.$("#i18n-favourite-remove-space-short").val().replace("{0}", spaceName));
       }
   }
   else {
       $icon.removeClass("icon-remove-fav").addClass("icon-add-fav");
       if (spacesMode) {
           $icon.attr("title", AJS.$("#i18n-favourite-add-space").val());
           $icon.text(AJS.$("#i18n-favourite-add-space-short").val().replace("{0}", spaceName));
       }
   }
}

/**
 * Add/Remove a space from the user's favourites. This is used when displaying spaces on the dashboard (in dash macros).
 * @param spaceKey - The space key of the space to add as favourite
 * @param imgElement - The img element (containing star) to update
 */
function addOrRemoveFromFavourites(spaceKey, imgElement)
{
   if (operationInProgressArray[imgElement.id] == null) {

       operationInProgressArray[imgElement.id] = true;

       var url,
           $icon = AJS.$(imgElement);

       if ($icon.hasClass("icon-remove-fav")) { // if on
           url = contextPath + "/json/removespacefromfavourites.action";
       }
       else {
           url = contextPath + "/json/addspacetofavourites.action";
       }

       AJS.safe.ajax({
           url: url,
           type: "POST",
           data: { "key" : spaceKey },
           success: function() {
               toggleStar(imgElement);
               operationInProgressArray[imgElement.id] = null;
           },
           error: function(xhr, text, error) {
               alert("Error : " + text);
               operationInProgressArray[imgElement.id] = null;
            }
       });
   }
}

// if the user switches tabs while spaces are still being labelled, this function will prevent this from happening.
// allowing a location change in the middle of xmlhttp requests causes exceptions to be thrown in firefox (although, they seem to be ignored by ie).
// this is important in high latency environments where users may get impatient.
function gotoUrl(url)
{
   for (var elementId in operationInProgressArray)
   {
       if (operationInProgressArray[elementId] == true)
           return;
   }
   window.location = url;
}
