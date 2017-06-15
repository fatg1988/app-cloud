<?php
/*
* Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

//Database health check
$servername = getenv('DB_HOSTNAME');
$username = getenv('DB_USERNAME');
$password = getenv('DB_PASSWORD');
$dbname = getenv('DB_NAME');

$time_start = microtime();

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
	http_response_code(500);
    die("Connection failed: " . $conn->connect_error);
} 

$sql = "SELECT * FROM I_CLOUD_LAUNCH_URLS";
$result = $conn->query($sql);

$time_end = microtime();

$timeInterval = $time_end - $time_start;

// set the json header content-type
header('Content-Type: application/json');

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        $array = array(
	        "id" => $row["ID"],
	        "launch_url" => $row["LAUNCH_URL"],
	        "description" => $row["DESCRIPTION"],
	        "time" => $timeInterval . 'ms'
		);
		// convert the above array to json string using json_encode()
		$json = json_encode($array);
		echo $json;
    }
} else {
	http_response_code(500);
    echo "0 results";
}

$conn->close();
?>
