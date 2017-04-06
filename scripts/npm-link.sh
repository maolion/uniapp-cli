#!/bin/sh

echo "npm linking ..."

cp -fr ./bin/ ./dist/bin/
cp -f ./uniapp-conf.json ./dist
cp -f ./package.json ./dist

perl -pi -w -e 's/"prepublishOnly": "exit 1"/"prepublishOnly": ""/g;' ./dist/package.json

cd ./dist
npm link
