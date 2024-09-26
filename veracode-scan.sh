PLUGIN=org.apache.maven.plugins:maven-help-plugin:3.2.0:evaluate
CARPETA_ACTUAL=$(pwd)
echo CARPETA_ACTUAL = $CARPETA_ACTUAL
NOMBRE=$(mvn $PLUGIN -DforceStdout -q -Dexpression=project.artifactId)
echo NOMBRE = $NOMBRE
VERSION=$(mvn $PLUGIN -DforceStdout -q -Dexpression=project.version)
echo VERSION = $VERSION
FINAL_NAME=$(mvn $PLUGIN -DforceStdout -q -Dexpression=project.build.finalName)
echo FINAL_NAME = $FINAL_NAME
VERSION_STR="${VERSION}-${DRONE_COMMIT_BRANCH}-build-no-${DRONE_BUILD_NUMBER}"
echo VERSION_STR = $VERSION_STR

#The business criticality can be set to one of "VeryHigh" (default), "High", "Medium", "Low",
# or "VeryLow". Enclose the value in quotes if it includes spaces.
# Value Data Type -> String

# vosp-api-wrappers-java-21.9.8.2.jar ~ veracode.jar
java -jar veracode.jar \
-action=UploadAndScan -createprofile=true \
-criticality="VeryHigh" -appname="${NOMBRE}" -filepath="${CARPETA_ACTUAL}/target/${FINAL_NAME}.jar" \
-vid="${VERACODE_ID}" -vkey="${VERACODE_SECRET}" \
-version="${VERSION_STR}"