#!/usr/bin/env node

var bones = require('bones');

bones.load(__dirname);

if (!module.parent) {
    bones.start();
}
