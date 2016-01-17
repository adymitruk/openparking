/*jslint node:true */
"use strict";

var uuid = require('uuid');

function ApprovedForCharge(objectGraph) {
    this.version = '1.0.0';
    this.id = uuid.v4();
    this.totalCharge = objectGraph.totalCharge;
}

module.exports = ApprovedForCharge;