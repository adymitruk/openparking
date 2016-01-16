"use strict";
var uuid = require('uuid');

function SetRateRule(objectGraph) {
    this.version = '1.0.0';
    this.id = uuid.v4();
    this.lotRange = objectGraph.SetRateRule.lotRange;
    this.rates = [];
    for (var rate in objectGraph.SetRateRule.rates) {
        var currentRate = objectGraph.SetRateRule.rates[rate];
        this.rates.push(new Rate(currentRate));
    }
}

function Rate(rate) {
    this.name = rate.name;
    this.timeRange = rate.timeRange;
    this.ratePerHour = rate.ratePerHour;
    this.granularity = rate.granularity;
    this.limitStayInHours = rate.limitStayInHours;
    this.limitResetInMins = rate.limitResetInMins;
}

function Restriction() {

}

module.exports = SetRateRule;