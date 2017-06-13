/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
// page initialization
var timerId;
var rcCount;
$(document).ready(function() {
    // add upload app icon listener
    $("#change_app_icon").change(function(event) {
        submitChangeAppIcon(this);
    });

    initPageView();
    var uploadRevisionUrl = appCreationPageBaseUrl+"?appTypeName="+application.applicationType +
                            "&applicationName="+applicationName + "&encodedLabels="+encodedLabels + "&encodedEnvs="
                                    + encodedEnvs + "&newVersion=true&conSpecCpu=" + conSpecCpu + "&conSpecMemory="
                                    + conSpecMemory + "&versionArray=" + encodeURI(versionArray);
    $('#upload-revision').attr("href", uploadRevisionUrl);

    if(selectedApplicationRevision.status==APPLICATION_INACTIVE){
        displayApplicationInactiveMessage();
    }
    loadEndpointView();
    loadDashboards();
    loadReplicas();
    rcCount = replicaCount;
});

function loadReplicas() {
    $("#replica-data").html('');
    var replicaInfo = null;
    var replicaCount = 0;

    // get running replica info from k8s cluster
    jagg.post("../blocks/application/application.jag", {
        action: "getReplicaInfo",
        appType: application.applicationType,
        applicationName: applicationName,
        versionName: selectedRevision
    }, function(result) {
        replicaInfo = JSON.parse(result);

        // get replica count per version
        jagg.post("../blocks/settings/settings.jag", {
            action: "getReplicaCountForVersion",
            applicationName: applicationName,
            versionName: selectedRevision
        },function (result) {
            replicaCount = JSON.parse(result);

            var diff = replicaCount - replicaInfo.length;
            var replicas_html = "";

            for (var i = 0; i < replicaInfo.length; i++) {
                replicas_html += '<div class="block-replicas">' +
                    '<figure class="node-cicle" data-percent="100">' +
                    '<figcaption>' +
                    '<span>' + (i + 1) + '</span>' +
                    '</figcaption>';

                replicas_html += '<svg width="100" height="100">' +
                    '<circle class="outer" cx="142" cy="48" r="42" transform="rotate(-90, 95, 95)"></circle>' +
                    '</svg>';
                if (parseInt(replicaInfo[i].restartCount) > 0) {
                    replicas_html += '<span href="#" onclick="displayRestartCountMessage();"><span class="restart-count">Restarts : ' + replicaInfo[i].restartCount + '</span></span>';
                }
                replicas_html += '<a href="/appmgt/site/pages/runtimeLogs.jag?applicationKey=' + applicationKey + '&selectedRevision=' + selectedRevision + '&selectedReplica=Replica_' + (i+1) + '_' + replicaInfo[i].podName + '" title="View Logs"><i class="fw fw-hdd"></i></a>' +
                    ' <a target="_blank" href="' + dataAnalyticsServerUrl + '/portal/t/' + tenantDomain + '/dashboards/operational-dashboard/?shared=true&id=' + applicationName + '_' + selectedRevision + '_' + replicaInfo[i].podName + '" title="View Operational Dashboard"><i class="fw fw-dashboard"></i></a>';

                replicas_html += '</figure>' +
                    '</div>';
            }

            if (diff > 0) {
                for (var i = 0; i < diff; i++) {
                    replicas_html += '<div class="block-replicas">' +
                        '<figure class="node-cicle" data-percent="100">' +
                        '<figcaption>' +
                        '<span>' + (i + 1) + '</span>' +
                        '</figcaption>';
                    replicas_html += '<svg width="100" height="100">' +
                        '<circle class="outer" style="stroke: #ACAFAD;" cx="142" cy="48" r="42" transform="rotate(-90, 95, 95)"/>' +
                        '</svg>';
                    replicas_html += '</figure>' +
                        '</div>';
                }
            }

            $("#replica-data").html(replicas_html);
        },function (jqXHR, textStatus, errorThrown) {

        });
    }, function(jqXHR, data, errorThrown) {

    });
}

// wrapping functions
function initPageView() {
    loadAppIcon();
    var deploymentURL = selectedApplicationRevision.deploymentURL;
    var repoUrlHtml = generateLunchUrl(deploymentURL, selectedApplicationRevision.status);
    $("#version-url-link").html(repoUrlHtml);
    $('#appVersionList li').click(function() {
        var newRevision = this.textContent.trim();
        if (newRevision != '+ Add') {
            changeSelectedRevision(newRevision);
        }
    });

    $('body').on('click', '#btn-launchApp', launchApp);
    $('body').on('click', '#launch-version-url-a', displayMessage);
    $('body').on('click', '#launch-default-url-a', displayMessage);

    listTags();
    listEnvs();
}

function generateDefaultLaunchUrl() {
    var defaultAppLaunchURL = selectedApplicationRevision.deploymentURL;
    if (application.defaultVersion == selectedRevision) {
        if (application.customURL != null) {
            defaultAppLaunchURL = application.customURL;
        } else if (application.defaultURL != null) {
            defaultAppLaunchURL = application.defaultURL;
        }
    }

    return defaultAppLaunchURL;
}

function launchApp() {
    if(selectedApplicationRevision.status == APPLICATION_RUNNING){
        var appUrl = $('#btn-launchApp').attr("url");
        var newWindow = window.open('','_blank');
        newWindow.location = appUrl;
    } else {
        displayMessage();
    }
}

function displayMessage() {
    if (selectedApplicationRevision.status != APPLICATION_RUNNING) {
        if (selectedApplicationRevision.status == APPLICATION_STOPPED) {
            jagg.message({
                modalStatus: true,
                type: 'warning',
                timeout: 3000,
                content: "<b>The " + cloudSpecificApplicationRepresentation.toLowerCase() + " has been stopped. Start the " + cloudSpecificApplicationRepresentation.toLowerCase() + " before launching it.</b>"
            });
        } else if (selectedApplicationRevision.status == APPLICATION_INACTIVE) {
            jagg.message({
                modalStatus: true,
                type: 'warning',
                timeout: 3000,
                content: "<b>The " + cloudSpecificApplicationRepresentation.toLowerCase() + " has been stopped due to inactivity. Start the " + cloudSpecificApplicationRepresentation.toLowerCase() + " before launching it.</b>"
            });
        } else {
            jagg.message({
                modalStatus: true,
                type: 'error',
                timeout: 3000,
                content: "<b>Error has occurred while " + cloudSpecificApplicationRepresentation.toLowerCase() + " creation. If the problem persists please contact system administrator.</b>"
            });
        }
    }
}
/**
 * This function is to display a message to user to inform that the application is stopped due to
 * being idle for longer period.
 */
function displayApplicationInactiveMessage() {
    jagg.message({
                     modalStatus: true,
                     type: 'warning',
                     timeout: 15000,
                     content: "<b>This " + cloudSpecificApplicationRepresentation.toLowerCase() + " is stopped because 9 hours have passed after it was last started.</b></br>" +
                              "This is a limitation of free accounts in " + pageTitle + "</br> To restart, click the <b>Start</b>. button.</br>" +
                              "<a href='"+requestNewAppTypeURL+"' target='_blank'>Contact us</a> if you need any help."
                 });
}

function requestToExtend() {
    $("<a>").attr("href", requestNewAppTypeURL).attr("target", "_blank")[0].click();
}
function displayRestartCountMessage() {
    jagg.message({
        modalStatus: false,
        type: 'warning',
        timeout: 20000,
        content: "One or more of your replicas have a higher restart count than expected. Possible reasons are high usage of memory and / or cpu. " +
        "Please try using bigger containers if the problem persists."
    });
}

function listTags(){
    var tags = selectedApplicationRevision.tags;
    var tagListLength;
    if(tags) {
        tagListLength = tags.length;
    }
    var tagString = '';
    var tagTitleString = '';
    for(var i = 0; i < tagListLength; i++){
        if(i >= 3){
            break;
        }
        tagString += tags[i].labelName + " : " + tags[i].labelValue + "</br>";
        tagTitleString += tags[i].labelName + " : " + tags[i].labelValue + "\n";
    }
    if(tagListLength > 3) {
        tagString += "</br><a class='view-tag' href='/appmgt/site/pages/tags.jag?applicationKey=" + applicationKey
                             + "&versionKey=" + selectedApplicationRevision.hashId + "' title='View All envs'>View All Tags</a>";
    }

    $('#tag-list').html(tagString);
    $('#tag-list').prop('title', tagTitleString);
}

function listEnvs(){
    var envs = selectedApplicationRevision.runtimeProperties;
    var envListLength;
    if(envs) {
        envListLength = envs.length;
    }
    var envString = '';
    var envTitleString = '';
    for(var i = 0; i < envListLength; i++){
        if(i >= 3){
            break;
        }
        envString += envs[i].propertyName + " : " + envs[i].propertyValue + "</br>";
        envTitleString += envs[i].propertyName + " : " + envs[i].propertyValue + "\n";
    }
    if(envListLength > 3) {
        envString += "</br><a class='view-tag' href='/appmgt/site/pages/envs.jag?applicationKey=" + applicationKey
                             + "&versionKey=" + selectedApplicationRevision.hashId + "' title='View All envs'>View All envs</a>";
    }

    $('#env-list').html(envString);
    $('#env-list').prop('title', envTitleString);
}

// Icon initialization
function loadAppIcon() {

    application = getIconDetail(application);

    var iconDiv;
    if(application.icon){
        iconDiv = '<img id="app-icon"  src="data:image/bmp;base64,' + application.icon + '" width="100px"/>'
    } else {
        iconDiv = '<div class="app-icon" style="background:' + application.uniqueColor + '">' +
                  '<i class="fw ' + application.appTypeIcon + ' fw-4x" data-toggle="tooltip" ></i>' +
                  '</div>';
    }

    $("#app-icon").html(iconDiv);
}

function changeSelectedRevision(newRevision){
    // change app description
    //Changing revision dropdown
    putSelectedRevisionToSession(applicationKey, newRevision);
    $('#selected-version').html(newRevision+" ");
    $("#selectedRevision").val(newRevision);
    selectedRevision = newRevision;
    selectedApplicationRevision = application.versions[newRevision];

    //Changing deploymentURL
    var deploymentURL = selectedApplicationRevision.deploymentURL;
    var repoUrlHtml = generateLunchUrl(deploymentURL);
    $("#version-url-link").html(repoUrlHtml);
    $('#btn-launchApp').attr({url:deploymentURL});

    // Changing default launch URL
    var defaultAppLaunchURL = generateDefaultLaunchUrl();
    loadEndpointView();

    //changing app description
    $("#app-description").text(application.description?application.description:'');

    //changing runtime
    $("#runtime").html(selectedApplicationRevision.runtimeName);
    $("#memory").html(selectedApplicationRevision.conSpecMemory);
    $("#cpu").html(selectedApplicationRevision.conSpecCpu/1000);

    //change icon
    loadAppIcon();

    // Change replica status
    $("#tableStatus").html(selectedApplicationRevision.status);

    //Change Env Variables
    $("#leftMenuEnvVars").attr('href',"/appmgt/site/pages/envs.jag?applicationKey=" + applicationKey + "&versionKey=" + selectedApplicationRevision.hashId);
    $("#envVars").attr('href',"/appmgt/site/pages/envs.jag?applicationKey=" + applicationKey + "&versionKey=" + selectedApplicationRevision.hashId);
    $("#envVarsAdd").attr('href',"/appmgt/site/pages/envs.jag?applicationKey=" + applicationKey + "&versionKey=" + selectedApplicationRevision.hashId);
    $("#runtimePropCount").text(selectedApplicationRevision.runtimeProperties.length.toString());

    //Change Tags
    $("#leftMenuTagSet").attr('href',"/appmgt/site/pages/tags.jag?applicationKey=" + applicationKey + "&versionKey=" + selectedApplicationRevision.hashId);
    $("#tagSet").attr('href',"/appmgt/site/pages/tags.jag?applicationKey=" + applicationKey + "&versionKey=" + selectedApplicationRevision.hashId);
    $("#tagSetAdd").attr('href',"/appmgt/site/pages/tags.jag?applicationKey=" + applicationKey + "&versionKey=" + selectedApplicationRevision.hashId);
    $("#tagCount").text(selectedApplicationRevision.tags.length.toString());
    listTags();
    listEnvs();

    // Change version status in UI
    if(selectedApplicationRevision.status == APPLICATION_RUNNING){
        $(".overview-version-btn").empty();
        if (application.applicationType == BALLERINA && selectedApplicationRevision.sourceLocation != null) {
            $(".overview-version-btn").html(
                "<a id='update' onclick='updateVersionPopUp();'>" +
                "<div class='btn-create-version'>" +
                "<span class='fw-stack fw-lg btn-action-ico'>" +
                "<i class='fw fw-circle-outline fw-stack-2x'></i>" +
                "<i class='fw fw-refresh fw-stack-1x'></i>" +
                "</span> Deploy Latest Code" +
                "</div>" +
                "</a>" +
                "<a id='edit-code' onclick='openTool();'>" +
                "<div class='btn-create-version'>" +
                "<span class='fw-stack fw-lg btn-action-ico'>" +
                "<i class='fw fw-circle-outline fw-stack-2x'></i>" +
                "<i class='fw fw-edit fw-stack-1x'></i>" +
                "</span> Open Ballerina Composer" +
                "</div>" +
                "</a>");
        }

        $('#launch-default-url-block').empty();
        $('#launch-default-url-block').html('<a id="launch-default-url-a" target="_blank" href="' + defaultAppLaunchURL + '">' + defaultAppLaunchURL + '</a>' +
            '<a href="/appmgt/site/pages/customurl.jag?applicationKey=' + applicationKey + '&selectedRevision='+ newRevision+ '"><i class="fw fw-settings"></i></a>');

        $('#version-url-link').empty();
        $('#version-url-link').html('<a id="launch-version-url-a" href="' + deploymentURL + '" target="_blank"><span>' + deploymentURL + '</span></a>');

        $('#version-app-launch-block').empty();
        $('#version-app-launch-block').html(
                '<div class="btn-group ctrl-edit-button btn-edit-code"><a type="button" ' +
                'class="btn cu-btn cu-btn-md cu-btn-red" onclick="stopApplicationPopUp();">Stop' +
                '<span id="stop-in-progress"><span></a></div><div class="btn-group ctrl-edit-button btn-edit-code">' +
                '<a type="button" class="btn cu-btn cu-btn-md cu-btn-gray" onclick="redeployApplicationPopUp();">' +
                'Redeploy<span id="redeploy-in-progress"><span></a></div>');

    } else if(selectedApplicationRevision.status == APPLICATION_STOPPED || selectedApplicationRevision.status == APPLICATION_INACTIVE){
        $(".overview-version-btn").empty();
        if (application.applicationType == BALLERINA && selectedApplicationRevision.sourceLocation != null) {
            $(".overview-version-btn").html(
                "<a id='update' onclick='updateVersionPopUp()'>" +
                "<div class='btn-create-version'>" +
                "<span class='fw-stack fw-lg btn-action-ico'>" +
                "<i class='fw fw-circle-outline fw-stack-2x'></i>" +
                "<i class='fw fw-refresh fw-stack-1x'></i>" +
                "</span> Deploy Latest Code" +
                "</div>" +
                "</a>" +
                "<a id='edit-code' onclick='openTool();'>" +
                "<div class='btn-create-version'>" +
                "<span class='fw-stack fw-lg btn-action-ico'>" +
                "<i class='fw fw-circle-outline fw-stack-2x'></i>" +
                "<i class='fw fw-edit fw-stack-1x'></i>" +
                "</span> Open Ballerina Composer" +
                "</div>" +
                "</a>");
        }

        $('#launch-default-url-block').empty();
        $('#launch-default-url-block').html('<a id="launch-default-url-a" target="_blank">' + defaultAppLaunchURL + '</a>');

        $('#version-url-link').empty();
        $('#version-url-link').html('<a id="launch-version-url-a" target="_blank"><span>' + deploymentURL + '</span></a>');

        $('#version-app-launch-block').empty();
        $('#version-app-launch-block').html(
                '<div class="btn-group ctrl-edit-button btn-edit-code"><a type="button" ' +
                'class="btn cu-btn cu-btn-md cu-btn-blue" onclick="startApplication();">Start</a></div>');
    } else {

        $(".overview-version-btn").empty();

        $('#launch-default-url-block').empty();
        $('#launch-default-url-block').html('<a id="launch-default-url-a" target="_blank">' + defaultAppLaunchURL + '</a>');

        $('#version-url-link').empty();
        $('#version-url-link').html('<a id="launch-version-url-a" target="_blank"><span>' + deploymentURL + '</span></a>');

        $('#version-app-launch-block').empty();
        $('#version-app-launch-block').html('<div class="btn-group ctrl-edit-button btn-edit-code">' +
            '<a type="button" class="btn cu-btn cu-btn-md cu-btn-red" ' +
            'href="#yourlink">Error has occurred.</a></div>');
    }

    loadReplicas();

    // Set upload revision btn
    var uploadRevisionUrl = appCreationPageBaseUrl+"?appTypeName="+application.applicationType +
        "&applicationName="+applicationName + "&encodedLabels="+encodedLabels + "&encodedEnvs="
        + encodedEnvs + "&newVersion=true" + "&versionArray=" + encodeURI(versionArray);
    $('#upload-revision').attr("href", uploadRevisionUrl);

    changeRuntimeProps(selectedApplicationRevision);
    changeLabels(selectedApplicationRevision);
}

function generateLunchUrl(appURL, status) {
    var message = "";
    if(appURL) {
        if(status && status == APPLICATION_RUNNING) {
            message += "<a id='launch-version-url-a' target='_blank' href='" + appURL + "' >";
        } else {
            message += "<a id='launch-version-url-a' target='_blank' >";
        }
        message += "<span>";
        message += appURL;
        message += "</span>";
        message += "</a>";
    } else {
        message += "<i class='fw fw-deploy fw-1x'></i><span>" + cloudSpecificApplicationRepresentation + " is still deploying</span>";
    }
    return message;
}

function putSelectedRevisionToSession(applicationKey, selectedRevision){
    jagg.post("../blocks/home/ajax/get.jag", {
        action: "putSelectedRevisionToSession",
        applicationKey: applicationKey,
        selectedRevision: selectedRevision
    });
}

function changeRuntimeProps(selectedApplicationRevision){
    $('#runtimePropCount').html(selectedApplicationRevision.runtimeProperties.length);
}

function changeLabels(selectedApplicationRevision){
    $('#labelCount').html(selectedApplicationRevision.tags.length);
}

// Uploading application icon
function submitChangeAppIcon(newIconObj) {
    var validated = validateIconImage(newIconObj.value, newIconObj.files[0].size);
    if(validated) {
        $('#changeAppIcon').submit();
    } else {
        jagg.message({content: "Only .jpg and .png file types are allowed for the the " + cloudSpecificApplicationRepresentation.toLowerCase() + "'s icon.", type: 'error', id:'notification'});
    }
}

// check the file is an image file
function validateIconImage(filename, fileSize) {
    var ext = getFileExtension(filename);
    var extStatus = false;
    var fileSizeStatus = true;
    switch (ext.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'bmp':
        case 'png':
            extStatus = true;
            break;
        default:
            jagg.message({content: "Only jpg and png file types are allowed for the the " + cloudSpecificApplicationRepresentation.toLowerCase() + "'s icon.", type: 'error', id:'notification'});
            break;
    }

    if((fileSize/1024) > 51200 && extStatus == true) {
        fileSizeStatus = false;
        jagg.message({content: "Image file size should be less than 5MB", type: 'error', id:'notification'});
    }
    if(extStatus == true && fileSizeStatus == true) {
        return true;
    }
    return false;
}

// Utility Functions Goes Here
// extract file extension
function getFileExtension(filename) {
    var parts = filename.split('.');
    return parts[parts.length - 1];
}

// Delete version
function deleteApplication(version){

    $('#app_creation_progress_modal').modal({ backdrop: 'static', keyboard: false});
    $("#app_creation_progress_modal").show();
    $("#modal-title").text("Deleting the " + cloudSpecificApplicationRepresentation.toLowerCase() + " version...");
    jagg.post("../blocks/application/application.jag", {
        action:"deleteVersion",
        versionName:version,
        applicationName:applicationName
    },function (result) {
        jagg.message({content: "Version: " + version + " was successfully deleted.", type: 'success', id:'view_log'});
        var versionCount = getVersionCount();
        if(versionCount == 1){
            setTimeout(redirectAppListing, 2000);
        } else {
            setTimeout(redirectAppHome, 2000);
        }
    },function (jqXHR, textStatus, errorThrown) {
        jagg.message({content: "Error occurred while deleting the selected " + cloudSpecificApplicationRepresentation.toLowerCase() + " version", type: 'error', id:'view_log'});
    });
}

function deleteAllVersions() {

    $('#app_creation_progress_modal').modal({ backdrop: 'static', keyboard: false});
    $("#app_creation_progress_modal").show();
    $("#modal-title").text("Deleting the " + cloudSpecificApplicationRepresentation.toLowerCase() + " version...");

    jagg.post("../blocks/application/application.jag", {
        action:"deleteApplication",
        applicationKey:applicationKey
    },function (result) {
        jagg.message({content: cloudSpecificApplicationRepresentation + ': ' + applicationName + ' was deleted successfully.', type: 'success', id:'view_log'});
        setTimeout(redirectAppListing, 2000);
    },function (jqXHR, textStatus, errorThrown) {
        jagg.message({content: "An error occurred while deleting the " + cloudSpecificApplicationRepresentation.toLowerCase() + " : " + applicationName, type: 'error', id:'view_log'});
    });
}

function deleteApplicationPopUp(version){
    var versionCount = versionArray.length;
    if(versionCount == 1 ){
        jagg.popMessage({type:'confirm', modalStatus: true, title:'Delete ' + cloudSpecificApplicationRepresentation + ' Version',content:'You are about to delete the only available version of your ' + cloudSpecificApplicationRepresentation.toLowerCase() + ', are you sure you want to delete this "' + version + '" version ?',
            yesCallback:function(){
                if(isBallerinaComposerAvailable != null) {
                    deleteAllVersions(version);
                } else {
                    deleteApplication(version);
                }
            }
        });
    } else if (versionCount > 1 && (version == application.defaultVersion)) {
        jagg.message({
            type:'warning', modalStatus: true, title:'Delete ' + cloudSpecificApplicationRepresentation + ' Version',
            content:'This version:' + version + ' is set as the default version of the ' + cloudSpecificApplicationRepresentation.toLowerCase() + '. If you '
            + 'want to delete this particular version, please select some other version as the default version',
            timeout: 8000
        });
    } else {
        jagg.popMessage({type:'confirm', modalStatus: true, title:'Delete ' + cloudSpecificApplicationRepresentation + ' Version',content:'Are you sure you want to delete this version: ' + version + ' ?',
            yesCallback:function(){
                deleteApplication(version);
            }, noCallback:function(){}
        });
    }
}

function updateVersionPopUp() {
    jagg.popMessage({
        type: 'confirm',
        modalStatus: true,
        title: 'Deploy Latest Code of  ' + cloudSpecificApplicationRepresentation + ' Version',
        content: 'Do you want to build and deploy the latest code in ' + cloudSpecificApplicationRepresentation.toLowerCase() + ' version 1.0.0? ' +
        'If you want to keep the current version as it is, click No and then create a new version to deploy the latest code.?',
        yesCallback: function() {
            getUserInputToBuildAndDeploy();
        }
    });
}

function stopApplicationPopUp(){
    jagg.popMessage({type:'confirm', modalStatus: true, title:'Stop ' + cloudSpecificApplicationRepresentation + ' Version',content:'Are your sure you want to stop ' +  selectedRevision + ' version of this ' + cloudSpecificApplicationRepresentation.toLowerCase() + ' ?',
        yesCallback:function(){
            stopApplication();
        }
    });
}

function redeployApplicationPopUp(){
    jagg.popMessage({type:'confirm', modalStatus: true, title:'Redeploy ' + cloudSpecificApplicationRepresentation + ' Version',content:'Are your sure you want to redeploy ' +  selectedRevision + ' version of this ' + cloudSpecificApplicationRepresentation.toLowerCase() + ' ?',
        yesCallback:function(){
            redeployApplication();
        }
    });
}

function redirectAppListing() {
    window.location.replace("index.jag");
}

function redirectAppHome() {
    window.location.replace("home.jag?applicationKey=" + applicationKey);
}

function getVersionCount(){
    return Object.keys(application.versions).length;

}

function getUserInputToBuildAndDeploy() {
    jagg.post("../blocks/buildAndDeploy/buildAndDeploy.jag", {
        action:"listSourceDirs",
        sourceLocation:sourceLocation
    },function (result) {
        var dirList = JSON.parse(result);
        if (Object.keys(dirList).length == 1) {
            buildAndDeploy();
        } else {
            var buildAndDeployRevisionUrl = "buildAndDeploy.jag?appTypeName=" + application.applicationType +
                "&applicationName=" + applicationName +
                "&encodedLabels=" + encodedLabels +
                "&encodedEnvs=" + encodedEnvs +
                "&newVersion=true" +
                //"&versionArray=" + encodeURI(versionArray) +
                "&versionKey=" + selectedApplicationRevision.hashId +
                "&applicationHashId=" + applicationKey +
                "&versionName=" + selectedRevision +
                "&conSpecCpu=" + conSpecCpu +
                "&conSpecMemory=" + conSpecMemory +
                "&replicas=" + replicaCount +
                "&sourceLocation=" + sourceLocation +
                "&runtimeId=" + selectedApplicationRevision.runtimeId;

            window.location.replace(buildAndDeployRevisionUrl);
        }
    },function (jqXHR, textStatus, errorThrown) {

    });
}

function buildAndDeploy(){

    executeAsync(drawProgressWindow("Deploying latest code..."));
    jagg.post("../blocks/application/application.jag", {
        action:"buildAndDeploy",
        appType:application.applicationType,
        applicationName:applicationName,
        versionKey:selectedApplicationRevision.hashId,
        applicationHashId:applicationKey,
        versionName:selectedRevision,
        conSpecCpu:conSpecCpu,
        conSpecMemory:conSpecMemory,
        replicas:replicaCount,
        sourceLocation:sourceLocation,
        runtimeProperties:runtimeProperties,
        runtimeId:selectedApplicationRevision.runtimeId
    },function (result) {
        var status = JSON.parse(result);
        if (status) {
            jagg.message({content: "Application successfully updated", type: 'success', id:'view_log'});
        } else  {
            jagg.message({content: "Error occurred while updating the application", type: 'error', id:'view_log'});
            clearInterval(pollEventsKey);
            $("#app_creation_progress_modal").modal('hide');
        }

    },function (jqXHR, textStatus, errorThrown) {
        jagg.message({content: "Error occurred while updating runtime", type: 'error', id:'view_log'});
        clearInterval(pollEventsKey);
        $("#app_creation_progress_modal").modal('hide');

    });
}