var pollEventsOfToolKey = null;
var toolVersionHashId = null;
var checkEndpointExistTimer = 0;

$(document).ready(function() {
    openEditor();
});

function executeAsync(func) {
    setTimeout(func, 0);
}

function showProgresMessage(message) {
    $('#editor-events').html(message);
}

function showErrorMessage() {
    var contactUsURL = cloudMgtURL + '/site/pages/contact-us.jag?cloud-type=integration_cloud';
    var errorMessage = '<span class="error"><i class="fw fw-error icon">' +
        '</i> Something went wrong! ' +
        'Please <a onclick="reloadPage()">Try again</a> or ' +
        '<a target="_blank" href="' + contactUsURL + '">Report</a> an Issue ... </span>';
    showProgresMessage(errorMessage);
    $('.blob').fadeOut();
//    clearInterval(pollEventsOfToolKey);
}

function showProgressOfEditor() {
    pollEventsOfToolKey = setInterval(pollEvents, 2000);
}

function constructEditorURL() {
    var editorURL = 'http://' + toolVersionHashId.trim() + '.bcu.' + domainURL + '/';
    return editorURL;
}

function loadEditorToTheBrowser() {
    window.location.replace(constructEditorURL());
}

function reloadPage(){
    location.reload();
}

function openEditor() {

    var applicationNameOfTool = applicationName;
    var versionOfTool = BALLERINA_COMPOSER;


    executeAsync(showProgressOfEditor());
//    var table = "<tr class='success'><td>Starting Ballerina Composer ... </td>" +
//        "<td></td>" +
//        "<td><i class=\"fw fw-check\"></i></td></tr>";

    showProgresMessage("Starting Ballerina Composer ...");

    // check whether ballerina-composer version is created already
    jagg.post("../blocks/application/application.jag", {
        action:"getVersionByHashId",
        applicationName:applicationNameOfTool,
        applicationRevision:versionOfTool
    },function (result) {
        var version = JSON.parse(result);
        if (version != null && version.hashId != null) {
            toolVersionHashId = version.hashId;
            // check whether it is already started
            if (version.status == "running") {
                loadEditorToTheBrowser();
            } else if (version.status == "stopped" || version.status == "inactive") {
                // throttle
                // start the tool
                // open in new tab
                // composer will load by polling
//                executeAsync(showProgressOfEditor());
                jagg.post("../blocks/application/application.jag", {
                    action: "startApplication",
                    applicationName: applicationNameOfTool,
                    applicationRevision: versionOfTool
                }, function(result) {

                },function(jqXHR, data, errorThrown) {
                    alert("start app failed");
                    showErrorMessage();

                });
            } else {
                // version.status == "error"
                // delete and recreate
//                executeAsync(showProgressOfEditor());
                jagg.post("../blocks/application/application.jag", {
                    action:"deleteVersion",
                    versionName:BALLERINA_COMPOSER,
                    applicationName:applicationName
                },function (result) {
                    jagg.post("../blocks/application/application.jag", {
                        action:"createApplication",
                        applicationName:applicationNameOfTool,
                        runtime:21,
                        appTypeName:BALLERINA_COMPOSER,
                        applicationRevision:BALLERINA_COMPOSER,
                        conSpec:4,
                        isNewVersion:true,
                        appCreationMethod:"custom",
                        imageId:ballerinaComposerImage
                    },function (result) {

                    },function (jqXHR, textStatus, errorThrown) {
                        alert("delete app create failed");
                        showErrorMessage();
                    });
                },function (jqXHR, textStatus, errorThrown) {
                    alert("delete app failed");
                    showErrorMessage();
                });
            }
        } else {
            // specific version is not exist
            // create version
//            executeAsync(showProgressOfEditor());
            jagg.post("../blocks/application/application.jag", {
                action:"createApplication",
                applicationName:applicationNameOfTool,
                runtime:21,
                appTypeName:BALLERINA_COMPOSER,
                applicationRevision:BALLERINA_COMPOSER,
                conSpec:4,
                isNewVersion:true,
                appCreationMethod:"custom",
                imageId:ballerinaComposerImage
            },function (result) {

            },function (jqXHR, textStatus, errorThrown) {
                alert("create app failed");
                showErrorMessage();
            });
        }

    },function (jqXHR, textStatus, errorThrown) {
        alert("get version by hash id failed");
        showErrorMessage();
    });

}

function pollEvents() {
    jagg.post("../blocks/application/application.jag", {
        action:"getApplicationCreationEvents",
        applicationName:applicationName,
        applicationRevision:BALLERINA_COMPOSER

    },function (result) {
        var result = jQuery.parseJSON(result);
        if (result.length > 0) {
            for(var i = 0; i < result.length; i++){
                var table = '';
                var statusStyle;
                var event = result[i];
                var message = '';
                if(event.status == "success"){
                    statusStyle = "success";
                    if (event.name === "Status") {
                        showProgresMessage("Container status " + event.description.toLowerCase() + " ...");
                    } else {
                        showProgresMessage(event.name + " ...");
                    }
                } else if (event.status == "failed") {
                    statusStyle = "danger";
                    if (event.name === "Status") {
                        showErrorMessage();
                    } else {
                        showErrorMessage();
                    }
                } else if (event.status == "pending"){
                    if (event.name === "Status") {
                        showProgresMessage("Container status " + event.description.toLowerCase() + " ...");
                    } else {
                        showProgresMessage(event.name + " ...");
                    }
                }
            }
        }
        if (result.length > 0) {
            for(var i = 0; i < result.length; i++){
//                var statusStyle;
                var event = result[i];
                if (event.name === "Status" && event.status === "success") {
                    clearInterval(pollEventsOfToolKey);
                    setTimeout(loadEditor, 4250);
                    function loadEditor(){
                        deleteAppCreationEvents(BALLERINA_COMPOSER);

                        jagg.post("../blocks/application/application.jag", {
                            action:"getVersionHashId",
                            applicationName:applicationName,
                            applicationRevision:BALLERINA_COMPOSER
                        },function (result) {
                            if (result != null) {
                                toolVersionHashId = result;

//                                var timer = null;
//                                timer = setInterval(function() {
//                                    //alert("load endpoints");
//                                    jagg.post("../blocks/application/application.jag", {
//                                        action: "loadEndpoints",
//                                        appType: BALLERINA_COMPOSER,
//                                        deploymentURL: constructEditorURL(),
//                                        versionId: ''
//                                    }, function(result) {
//
//                                        var endpoints = JSON.parse(result);
//                                        alert(endpoints);
//                                        if (endpoints == null) {
//
//                                        } else {
//                                            clearInterval(timer);
//                                            loadEditorToTheBrowser();
//                                        }
//                                    }, function(jqXHR, data, errorThrown) {
//
//                                    });
//                                }, 3000);
                                loadEditorToTheBrowser();
                            }
                        }, function (jqXHR, textStatus, errorThrown) {

                        });

                    }
                } else if(event.status == "failed") {
                    //When redeploying an application the associated pod is deleted and an event with the name
                    //"Stopping Containers" is persisted in the database. Due to the pod not getting deleted within the
                    //specified time period the "Stopping Containers" event gets a status of "failed". Since only
                    //application deletion is involved with the "Stopping Containers" event if the event name is
                    //"Stopping Containers" the following message is not displayed
                    if (event.name !== "Stopping Containers") {
                        alert("stopping container");
                        showErrorMessage();
                    }
//                    setTimeout(redirectEditor, 5000);
//                    function redirectEditor() {
//                        alert("amalka");
//                        window.location.replace("editor.jag?applicationName=" + applicationName);
//                    }
                }
            }

        }
    }, function (jqXHR, textStatus, errorThrown) {
        showErrorMessage();
    });
}

//deleting redeploying events
function deleteAppCreationEvents() {
    jagg.post("../blocks/application/application.jag", {
        action:"deleteAppCreationEvents",
        applicationName: applicationName,
        applicationRevision: BALLERINA_COMPOSER
    }, function (result) {
        //This just return a boolean from backend
    }, function(jqXHR, textStatus, errorThrown) {
        //do not interrupt the application creation process even deletion of events fails.
    });
}

function checkEndpointExist() {
    jagg.post("../blocks/application/application.jag", {
        action: "loadEndpoints",
        appType: BALLERINA_COMPOSER,
        deploymentURL: constructEditorURL(),
        versionId: ''
    }, function(result) {
        var endpoints = JSON.parse(result);
        //alert(endpoints);
        if (endpoints == null) {
            return false;
        } else {
            return true;
        }
    }, function(jqXHR, data, errorThrown) {

    });
}