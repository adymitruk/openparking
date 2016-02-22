/*jslint node:true */
"use strict";

var uuid = require('uuid');

function SetRateRule(sourceEvent) {
    this.version = '1.0.0';
    this.id = uuid.v4();
    this.lotRange = sourceEvent.lotRange;
    this.rates = sourceEvent.rates;
    this.restrictions = sourceEvent.restrictions;
}

module.exports = SetRateRule;