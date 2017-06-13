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


var dirList = [];
$(document).ready(function () {
    var balFiles = JSON.parse(listOfBalFiles);
    //showLoadingView();
    if (Object.keys(balFiles).length == 1) {
        buildAndDeploy(balFiles[0].key);
    } else {
        $('#fileList').html('');
        $.each(balFiles, function(key, val) {
            $('#fileList').append('<div class="radio"><label><input type="radio" name="filePath" value="' + balFiles[key].key + '">' + balFiles[key].value + '</label></div>' );
        });
    }
});

function showLoadingView() {
    $("#fileList").html('<div><span><i class="fw fw-loader2 fw-spin fw-2x"></i></span></div>');
}

function goBack() {
    window.history.back();
}

function deployServiceBalFile() {
    var selectedOption = getSelectedOption();
    buildAndDeploy(selectedOption);
}

function getSelectedOption() {
    return $('input[type=radio]:checked', '#fileList').val();
}

function executeAsync(func) {
    setTimeout(func, 0);
}

function buildAndDeploy(selectedOption) {
    executeAsync(drawProgressWindow("Deploying latest code..."));
    jagg.post("../blocks/application/application.jag", {
        action:"buildAndDeploy",
        appType:appTypeName,
        applicationName:applicationName,
        versionKey:versionKey,
        applicationHashId:applicationHashId,
        versionName:versionName,
        conSpecCpu:conSpecCpu,
        conSpecMemory:conSpecMemory,
        replicas:replicas,
        selectedOption: selectedOption,
        sourceLocation:sourceLocation,
        runtimeProperties:runtimeProperties,
        runtimeId:runtimeId
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

function drawProgressWindow(heading){
    $('#app_creation_progress_modal').modal({ backdrop: 'static', keyboard: false});
    $("#app_creation_progress_modal").show();
    $("#modal-title").text(heading);
    pollEventsKey = setInterval(pollEvents, 5000);
}

function pollEvents(){
    jagg.post("../blocks/application/application.jag", {
        action:"getApplicationCreationEvents",
        applicationName:applicationName,
        applicationRevision:versionName

    },function (result) {
        var result = jQuery.parseJSON(result);
        if (result.length > 0) {
            $("#progress_table").html("");
            $("#app-creation-header-loader").html("");
            var table = "<table class='table' style='width:100%; color:black'>" ;
            for(var i = 0; i < result.length; i++){
                var statusStyle;
                var event = result[i];
                if(event.status == "success"){
                    statusStyle = "success";
                    if (event.name === "Status") {
                        table = table + "<tr class='" + statusStyle + "'><td>Container status</td>" +
                            "<td>" + event.description + "</td>" +
                            "<td><i class=\"fw fw-check\"></i></td></tr>";
                    } else {
                        table = table + "<tr class='" + statusStyle + "'><td>" + event.name + "</td>" +
                            "<td></td>" +
                            "<td><i class=\"fw fw-check\"></i></td></tr>";
                    }
                } else if (event.status == "failed") {
                    statusStyle = "danger";
                    if (event.name === "Status") {
                        table = table + "<tr class='" + statusStyle + "'><td>Container status</td>" +
                            "<td>" + event.description + "</td>" +
                            "<td><i class=\"fw fw-error\"></i></td></tr>";
                    } else {
                        table = table + "<tr class='" + statusStyle + "'><td>" + event.name + "</td>" +
                            "<td></td>" +
                            "<td><i class=\"fw fw-error\"></i></td></tr>";
                    }
                } else if (event.status == "pending"){
                    if (event.name === "Status") {
                        statusStyle = "active";
                        table = table + "<tr class='" + statusStyle + "'><td>Container status</td>" +
                            "<td>" + event.description + "</td>" +
                            "<td><i class=\"fw fw-loader2 fw-spin\"></i></td></tr>";
                    } else {
                        statusStyle = "active";
                        table = table + "<tr class='" + statusStyle + "'><td>" + event.name + "</td>" +
                            "<td></td>" +
                            "<td><i class=\"fw fw-loader2 fw-spin\"></i></td></tr>";
                    }
                }
            }
            table = table + "</table>";
            $("#progress_table").html(table);

            for(var i = 0; i < result.length; i++){
                var statusStyle;
                var event = result[i];
                if (event.name === "Status" && event.status === "success") {
                    setTimeout(redirectAppHome, 4250);
                    function redirectAppHome(){
                        deleteAppCreationEvents(versionName);
                        window.location.replace("home.jag?applicationKey=" + applicationHashId);
                    }
                } else if(event.status == "failed") {
                    //When redeploying an application the associated pod is deleted and an event with the name
                    //"Stopping Containers" is persisted in the database. Due to the pod not getting deleted within the
                    //specified time period the "Stopping Containers" event gets a status of "failed". Since only
                    //application deletion is involved with the "Stopping Containers" event if the event name is
                    //"Stopping Containers" the following message is not displayed
                    if (event.name !== "Stopping Containers") {
                        jagg.message({content: "Error occurred while updating " + cloudSpecificApplicationRepresentation.toLowerCase() + ".", type: 'error'});
                    }
                    setTimeout(reloadPage, 5000);
//                    function redirectAppListing(){
//                        window.location.replace("index.jag");
//                    }
                }
            }

        }
    },function (jqXHR, textStatus, errorThrown) {
        jagg.message({content: "Error occurred while restarting " + cloudSpecificApplicationRepresentation.toLowerCase() + ".", type: 'error'});
    });
}

function reloadPage(){
    location.reload();
}

//deleting redeploying events
function deleteAppCreationEvents() {
    jagg.post("../blocks/application/application.jag", {
        action:"deleteAppCreationEvents",
        applicationName: applicationName,
        applicationRevision: versionName
    }, function (result) {
        //This just return a boolean from backend
    }, function(jqXHR, textStatus, errorThrown) {
        //do not interrupt the application creation process even deletion of events fails.
    });
}



