/*jslint node:true */
"use strict";

var uuid = require('uuid');

function ApprovedForCharge(charge) {
    this.version = '1.0.0';
    this.id = uuid.v4();
    this.totalCharge = charge;
}

module.exports = ApprovedForCharge;