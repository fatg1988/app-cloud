//Regex patterns
var ALPHA_NUMERIC_PLUS_UNDERSCORE_REGEX = "^[A-Za-z0-9_]+$";
var ALPHA_NUMERIC_PLUS_UNDERSCORE_REGEX_NOT_STARTING_WITH_NUMBER = "^[A-Za-z_][A-Za-z0-9_]+$";
var VERSION_REGEX = "^[A-Za-z0-9_.-]+$";

//Environment key validation
function validateEnvKey(envKey){
    var envKeyRegex = new RegExp(ALPHA_NUMERIC_PLUS_UNDERSCORE_REGEX_NOT_STARTING_WITH_NUMBER);
    var validator;
    if (!envKeyRegex.test(envKey)) {
        validator = {
            status: false,
            msg: "Only alphanumeric characters and underscore are allowed for Environmental Variable key. And cannot start with a number."
        }
    } else {
        validator = {
            status: true,
            msg: "Environment variable key is successfully added."
        }
    }
    return validator;
}

/**
 * Method to validate database name
 *
 * @param databaseName database name
 * @returns {if database name is valid or not}
 */
function validateDbName(databaseName) {
    var databaseNameRegex = new RegExp(ALPHA_NUMERIC_PLUS_UNDERSCORE_REGEX);
    var validator;
    if (!databaseNameRegex.test(databaseName)) {
        validator = {
            status: false,
            msg: "Only alphanumeric characters and underscore are allowed."
        }
    } else {
        validator = {
            status: true,
            msg: "Database name is valid."
        }
    }
    return validator;
}

//Validated the application version provided by user
function validateApplicationVersion(version) {
    var versionRegex = new RegExp(VERSION_REGEX);
    var validator;
    if (!versionRegex.test(version)) {
        validator = {
            status: false,
            msg: "Invalid characters found for application version. Valid char set [a-z, A-Z, 0-9, -, _, .]"
        }
    } else if (version.toLowerCase() == "ballerina-composer".toLowerCase())  {
        validator = {
            status: false,
            msg: "Version cannot be 'ballerina-composer'."
        }
    } else {
        validator = {
            status: true,
            msg: "Version validation is successful."
        }
    }
    return validator;
}

// validate the application name provided by user
function validateAlphaNumeric(value) {
    var validator;
    var NonAlphaNumRegex = new RegExp(ALPHA_NUMERIC_PLUS_UNDERSCORE_REGEX);
    if (value == null || value.trim().length == 0) {
        validator = {
            status: false,
            msg: "Application name cannot be empty"
        }
    } else if (!isNaN(value)) {
        validator = {
            status: false,
            msg: "Non-alphanumeric characters are not allowed for Application Name"
        }
    } else if (!NonAlphaNumRegex.test(value)) {
        validator = {
            status: false,
            msg: "Non-alphanumeric characters are not allowed for Application Name"
        }
    } else {
        validator = {
            status: true,
        }
    }
    return validator;
}
