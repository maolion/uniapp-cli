#!/bin/sh

echo "deploying ..."

echo "cleaning previouse build files ..."
rm -rf ./dist

echo "building ..."
npm run build || exit 0

echo "copying ..."

cp ./uniapp-conf.json ./dist/uniapp-conf.json
cp ./package.json ./dist/package.json
cp ./._npmignore ./dist/.npmignor
cp -r ./bin ./dist/bin

perl -pi -w -e 's/"prepublishOnly": "exit 1"/"prepublishOnly": ""/g;' ./dist/package.json

cd ./dist

echo "publishing ..."

if ! [ -z "$1" ]
then
    npm publish --tag $1
else
    npm publish
fi
