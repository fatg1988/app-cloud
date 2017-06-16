/*
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *   WSO2 Inc. licenses this file to you under the Apache License,
 *   Version 2.0 (the "License"); you may not use this file except
 *   in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing,
 *   software distributed under the License is distributed on an
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *   KIND, either express or implied.  See the License for the
 *   specific language governing permissions and limitations
 *   under the License.
 */

var pollEventsOfToolKey = null;
var toolVersionHashId = null;

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
    clearInterval(pollEventsOfToolKey);
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
                jagg.post("../blocks/application/application.jag", {
                    action: "startApplication",
                    applicationName: applicationNameOfTool,
                    applicationRevision: versionOfTool
                }, function(result) {

                },function(jqXHR, data, errorThrown) {
                    showErrorMessage();

                });
            } else {
                // version.status == "error"
                // delete and recreate
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
                        showErrorMessage();
                    });
                },function (jqXHR, textStatus, errorThrown) {
                    showErrorMessage();
                });
            }
        } else {
            // specific version is not exist
            // create version
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
                showErrorMessage();
            });
        }

    },function (jqXHR, textStatus, errorThrown) {
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
                var event = result[i];
                if(event.status == "success"){
                    if (event.name === "Status") {
                        showProgresMessage("Container status " + event.description.toLowerCase() + " ...");
                    } else {
                        showProgresMessage(event.name + " ...");
                    }
                } else if (event.status == "failed") {
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
                var event = result[i];
                if (event.name === "Status" && event.status === "success") {
                    clearInterval(pollEventsOfToolKey);

                    jagg.post("../blocks/application/application.jag", {
                        action:"getVersionHashId",
                        applicationName:applicationName,
                        applicationRevision:BALLERINA_COMPOSER
                    },function (result) {
                        if (result != null) {
                            toolVersionHashId = result;
                            var timerId;
                            timerId = setInterval(function () {
                                jagg.post("../blocks/application/application.jag", {
                                    action: "loadEndpoints",
                                    appType: BALLERINA_COMPOSER,
                                    deploymentURL: constructEditorURL(),
                                    versionId: BALLERINA_COMPOSER
                                }, function(result) {
                                    var isAccessible =  JSON.parse(result) != undefined;
                                    if (isAccessible) {
                                        clearInterval(timerId);
                                        deleteAppCreationEvents(BALLERINA_COMPOSER);
                                        loadEditorToTheBrowser();
                                    }
                                }, function(jqXHR, data, errorThrown) {

                                });
                            }, 5000);
                        }
                    }, function (jqXHR, textStatus, errorThrown) {

                    });
                } else if(event.status == "failed") {
                    //When redeploying an application the associated pod is deleted and an event with the name
                    //"Stopping Containers" is persisted in the database. Due to the pod not getting deleted within the
                    //specified time period the "Stopping Containers" event gets a status of "failed". Since only
                    //application deletion is involved with the "Stopping Containers" event if the event name is
                    //"Stopping Containers" the following message is not displayed
                    if (event.name !== "Stopping Containers") {
                        showErrorMessage();
                    }
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
