/**
 * Starts sending heartbeat requests to the server. The responses are ignored.
 * This is purely to keep the session alive.
 *
 * @class Heartbeat
 * @namespace AJS.Confluence
 */
AJS.Confluence.Heartbeat = function() {
    var sendHeartbeat = function (){
        AJS.$.ajax({
            type: "POST",
            dataType: "json",
            global: false,
            timeout: 5000,
            data: {},
            url: AJS.Confluence.getContextPath() + "/json/heartbeat.action",
            success: function (json) {
                AJS.log("sendHeartbeat result: " + json.success);
            },
            error: function (xml, status) {
                AJS.log("sendHeartbeat error: " + status);
            }
        });
    };

    if(this.timer) return;
    AJS.log("Starting confluence heartbeat");
    sendHeartbeat();
    this.timer = setTimeout(function () {
        sendHeartbeat();
    }, 60000);
};
