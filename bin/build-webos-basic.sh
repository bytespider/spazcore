#!/bin/bash
# run this from the base dir of SpazCore

YUICOMPRESSOR_JAR="/Users/coj/Library/Application Support/TextMate/Bundles/javascript-tools.tmbundle/Support/bin/yuicompressor.jar"

BUILD_FILE='builds/spazcore-webos-basic.js'
MIN_FILE='builds/spazcore-webos-basic.min.js'
BUILD_DATE=`date "+%Y-%m-%d %H:%M:%S %Z"`

echo "/*********** Built ${BUILD_DATE} ***********/" > $BUILD_FILE


cat libs/spazcore.js \
	vendors/date.js \
	vendors/json2.js \
	vendors/underscore.js \
	vendors/sha1.js \
	vendors/oauth.js \
	helpers/datetime.js \
	helpers/event.js \
	helpers/hash.js \
	helpers/javascript.js \
	helpers/json.js \
	helpers/location.js \
	helpers/string.js \
	helpers/sys.js \
	helpers/view.js \
	helpers/xml.js \
	platforms/webOS/helpers/location.js \
	platforms/webOS/helpers/network.js \
	platforms/webOS/helpers/sys.js \
	>> $BUILD_FILE

# test if file exists before running min
`test -f "${YUICOMPRESSOR_JAR}"`
if [ "$?" = "0" ]
then 
	java -jar "${YUICOMPRESSOR_JAR}" --charset utf8 --preserve-semi $BUILD_FILE -o $MIN_FILE
else
	echo "YUICOMPRESSOR not found at ${YUICOMPRESSOR_JAR}; skipping minimization"
fi
