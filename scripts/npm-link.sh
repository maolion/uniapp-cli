#!/bin/sh

echo "npm linking ..."

cp -fr ./bin/ ./dist/bin/
cp -f ./uniapp-conf.json ./dist
cp -f ./package.json ./dist

perl -pi -w -e 's/"prepublish": "exit 1"/"prepublish": ""/g;' ./dist/package.json

cd ./dist
npm link