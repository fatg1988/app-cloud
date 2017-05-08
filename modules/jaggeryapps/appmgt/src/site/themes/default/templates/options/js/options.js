/*
 *
 *   Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *   WSO2 Inc. licenses this file to you under the Apache License,
 *   Version 2.0 (the "License"); you may not use this file except
 *   in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

$(document).ready(function () {
});


 function loadCreateApp(appTypeName) {

     fileFrom = $(".radio-inline input[type='radio']:checked").val();

     if (fileFrom == 'cloud'){
        window.location.href ='application.jag?appTypeName=' + appTypeName + '&option=upload-from-cloud';
     } else if (fileFrom == 'local') {
        window.location.href ='application.jag?appTypeName=' + appTypeName + '&option=upload-from-file';
     } else if (fileFrom == 'url') {
        window.location.href ='application.jag?appTypeName=' + appTypeName + '&option=upload-from-url';
     } else if (fileFrom == 'github') {
        window.location.href ='application.jag?appTypeName=' + appTypeName + '&option=github-repo-url';
     }
 }


 function continueSample() {
     window.location = "application.jag?appTypeName=" + appTypeName + "&option=deploy-sample";
 }

function continueCreateNew() {
    window.location = "application.jag?appTypeName=" + appTypeName + "&option=start-from-scratch";
}