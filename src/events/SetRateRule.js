"use strict";

function SetRateRule(objectGraph) {
    this.version = "1.0.0";
    this.lotRange = objectGraph.SetRateRule.lotRange;
    this.rates = [];
    for (var rate in objectGraph.SetRateRule.rates) {
        rates.push(new Rate(objectGraph.SetRateRule.rates[rate]));
    }
}

function Rate() {

}

function Restriction() {

}

module.exports = SetRateRule()