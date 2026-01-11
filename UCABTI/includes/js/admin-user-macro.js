AJS.toInit(function ($) {
   $("#user-macro-body input").click(function (){
        $("#user-macro-body-type")[0].disabled = !this.checked;
   });
});
