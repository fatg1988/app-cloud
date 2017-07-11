#!/bin/bash
# ------------------------------------------------------------------------
#
# Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
#
#   WSO2 Inc. licenses this file to you under the Apache License,
#   Version 2.0 (the "License"); you may not use this file except
#   in compliance with the License.
#   You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing,
#   software distributed under the License is distributed on an
#   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#   KIND, either express or implied.  See the License for the
#   specific language governing permissions and limitations
#   under the License.
#
# ------------------------------------------------------------------------
# This is a basic script to get a developer setup done with multi-tenancy and sso
#  
source `pwd`/setup.conf 
AS_VERSION=wso2as-5.2.1
SS_VERSION=wso2ss-1.1.0
AS_NODE=wso2as-5.2.1_AC

LIB_LOCATION=$ARTIFACT_HOME/modules/resources/lib
PATCH_LOCATION=$ARTIFACT_HOME/modules/resources/patches
CONF_LOCATION=$APPCLOUD_HOME/modules/setup-scripts/conf

MYSQL=`which mysql`

# Setting up app cloud database
Q2="DROP DATABASE IF EXISTS AppCloudDB;"
SQL1="${Q2}"
$MYSQL -uroot -proot -A -e "$SQL1";
$MYSQL -uroot -proot < $APPCLOUD_HOME/modules/dbscripts/appcloud.sql

# Setting up storage server databases
Q3="DROP DATABASE IF EXISTS rss_db;"
Q4="CREATE DATABASE rss_db;"
#for windows and mac users
#Q4="CREATE DATABASE rss_db character set latin1;"
SQL2="${Q3}${Q4}"
$MYSQL -uroot -proot -A -e "$SQL2";

# Unzip default wso2carbon product packs and configure
mkdir -p $SETUP_DIR/$AS_NODE
unzip -q $PACK_DIR/$AS_VERSION.zip -d $SETUP_DIR/$AS_NODE
mv $SETUP_DIR/$AS_NODE/$AS_VERSION/* $SETUP_DIR/$AS_NODE/ && rm -rf $SETUP_DIR/$AS_NODE/$AS_VERSION

unzip -q $PACK_DIR/$SS_VERSION.zip -d $SETUP_DIR/

AS_HOME=$SETUP_DIR/$AS_NODE
IS_HOME=$SETUP_DIR/$IS_VERSION/
SS_HOME=$SETUP_DIR/$SS_VERSION/
DAS_HOME=$SETUP_DIR/$DAS_VERSION/

function as_setup(){
    mkdir -p $AS_HOME/repository/deployment/server/jaggeryapps/appmgt/
    unzip -q $APPCLOUD_HOME/modules/jaggeryapps/appmgt/target/appmgt-3.0.0-SNAPSHOT.zip -d $AS_HOME/repository/deployment/server/jaggeryapps/appmgt/
    sed -e "s@AS_HOME@$AS_HOME@g" $APPCLOUD_HOME/modules/setup-scripts/jaggery/site.json > $AS_HOME/repository/deployment/server/jaggeryapps/appmgt/site/conf/site.json

    cp -R $APPCLOUD_HOME/modules/resources/dockerfiles $AS_HOME/repository/deployment/server/jaggeryapps/appmgt/
    cp -r $APPCLOUD_HOME/modules/setup-scripts/jaggery/modules/* $AS_HOME/modules/

    cp $LIB_LOCATION/org.wso2.carbon.hostobjects.sso_4.2.1.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/nimbus-jose-jwt_2.26.1.wso2v2.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/commons-codec-1.10.0.wso2v1.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/commons-compress-1.9.0.wso2v1.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/docker-client-1.0.10.wso2v1.jar $AS_HOME/repository/components/dropins/

    cp $SS_HOME/repository/components/plugins/org.wso2.carbon.rssmanager.common_4.2.0.jar $AS_HOME/repository/components/dropins/

    cp $LIB_LOCATION/jackson-annotations-2.7.5.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/jackson-core-2.7.5.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/jackson-databind-2.7.5.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/jackson-dataformat-yaml-2.7.5.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/slf4j-api-1.7.13.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/snakeyaml-1.17.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/mysql-connector-java-5.1.27-bin.jar $AS_HOME/repository/components/lib/
    cp $LIB_LOCATION/junixsocket-common-2.0.4.wso2v1.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/logging-interceptor-2.7.5.wso2v1.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/okhttp-2.7.5.wso2v1.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/okhttp-ws-2.7.5.wso2v1.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/okio-1.6.0.wso2v1.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/validation-api-1.1.0.Final.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/kubernetes-client-1.3.104.wso2v1.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/dnsjava-2.1.7.wso2v1.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/json-20160212.jar $AS_HOME/repository/components/dropins/
    cp $LIB_LOCATION/fabric8-utils-2.2.144.jar $AS_HOME/repository/components/dropins/

    cp $CONF_LOCATION/$AS_VERSION/repository/conf/datasources/master-datasources.xml $AS_HOME/repository/conf/datasources/
    cp $CONF_LOCATION/$AS_VERSION/repository/conf/datasources/appcloud-datasources.xml $AS_HOME/repository/conf/datasources/
    cp $CONF_LOCATION/$AS_VERSION/repository/conf/user-mgt.xml $AS_HOME/repository/conf/
    cp $CONF_LOCATION/$AS_VERSION/repository/conf/tenant-mgt.xml $AS_HOME/repository/conf/
    cp $CONF_LOCATION/$AS_VERSION/repository/conf/registry.xml $AS_HOME/repository/conf/
    mkdir -p $AS_HOME/repository/conf/appcloud
    cp $CONF_LOCATION/$AS_VERSION/repository/conf/appcloud/appcloud.properties $AS_HOME/repository/conf/appcloud/
    cp $CONF_LOCATION/$AS_VERSION/repository/conf/carbon.xml $AS_HOME/repository/conf/
    cp $CONF_LOCATION/$AS_VERSION/bin/wso2server.sh $AS_HOME/bin/


    cp $APPCLOUD_HOME/modules/components/org.wso2.appcloud.core/target/org.wso2.appcloud.core-3.0.0-SNAPSHOT.jar $AS_HOME/repository/components/dropins/
    cp $APPCLOUD_HOME/modules/components/org.wso2.appcloud.provisioning.runtime/target/org.wso2.appcloud.provisioning.runtime-3.0.0-SNAPSHOT.jar $AS_HOME/repository/components/dropins/
    cp $APPCLOUD_HOME/modules/components/org.wso2.appcloud.common/target/org.wso2.appcloud.common-3.0.0-SNAPSHOT.jar $AS_HOME/repository/components/dropins/
    cp -r $PATCH_LOCATION/wso2as-5.2.1/* $AS_HOME/repository/components/patches/
    cp -r $APPCLOUD_HOME/modules/webapps/appCloudTierapi/target/tierapi.war $AS_HOME/repository/deployment/server/webapps/
    sed -i -e "s|AS_HOME|$AS_HOME|g" $AS_HOME/repository/conf/appcloud/appcloud.properties
    sed -i -e "s|DOCKER_REGISTRY_NAME|$DOCKER_REGISTRY_URL|g" $AS_HOME/repository/conf/appcloud/appcloud.properties
    sed -i -e "s|DOCKER_REGISTRY_PASSWORD|$BASE64_OF_GCLOUD_SERVICE_ACCOUNT_JSON_FILE|g" $AS_HOME/repository/conf/appcloud/appcloud.properties

    cp $CLOUD_HOME/cloud-backends/components/user-store/org.wso2.carbon.cloud.userstore/target/org.wso2.carbon.cloud.userstore-1.0.0.jar $AS_HOME/repository/components/dropins/
}

function as_non_cluster_setup(){
    AS_HOME=$SETUP_DIR/$AS_NODE

    as_setup $AS_HOME
    echo "AS non cluster setup successfully done!"
}

echo "Updaing AS node with new configurations"
as_non_cluster_setup;

echo "Updating SS node with new configurations"
cp $LIB_LOCATION/mysql-connector-java-5.1.27-bin.jar $SS_HOME/repository/components/lib/
cp $LIB_LOCATION/nimbus-jose-jwt_2.26.1.wso2v2.jar $SS_HOME/repository/components/dropins/
cp $LIB_LOCATION/signedjwt-authenticator_4.3.3.jar $SS_HOME/repository/components/dropins/
cp $CONF_LOCATION/$SS_VERSION/repository/conf/datasources/master-datasources.xml $SS_HOME/repository/conf/datasources/
cp $CONF_LOCATION/$SS_VERSION/repository/conf/user-mgt.xml $SS_HOME/repository/conf/
cp $CONF_LOCATION/$SS_VERSION/repository/conf/tenant-mgt.xml $SS_HOME/repository/conf/
cp $CONF_LOCATION/$SS_VERSION/repository/conf/identity.xml $SS_HOME/repository/conf/
cp $CONF_LOCATION/$SS_VERSION/repository/conf/carbon.xml $SS_HOME/repository/conf/
cp $CONF_LOCATION/$SS_VERSION/repository/conf/etc/* $SS_HOME/repository/conf/etc/
cp -r $PATCH_LOCATION/$SS_VERSION/* $SS_HOME/repository/components/patches/
cp $CLOUD_HOME/cloud-backends/components/user-store/org.wso2.carbon.cloud.userstore/target/org.wso2.carbon.cloud.userstore-1.0.0.jar $SS_HOME/repository/components/dropins/

echo "Set up is completed."

