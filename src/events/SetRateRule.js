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

//function Rate(rate) {
//    this.name = rate.name;
//    this.timeRange = rate.timeRange;
//    this.ratePerHour = rate.ratePerHour;
//    this.granularity = rate.granularity;
//    this.limitStayInHours = rate.limitStayInHours;
//    this.limitResetInMins = rate.limitResetInMins;
//}
//
//function Restriction() {
//
//}

module.exports = SetRateRule;