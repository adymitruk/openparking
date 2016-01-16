"use strict";
var ApprovedForCharge = require('./events/ApprovedForCharge');

function Rule() {
    this.rules = [];
}

Rule.prototype.execute = function(command) {
    var parkCommand = command.ParkCommand;
    var rule = _ruleForSpot(this.rules, parkCommand.spot);
    var currentRate = _applicableRate(rule.rates, parkCommand.startTime, parkCommand.duration);
    var amountToCharge = parkCommand.durationInMinutes / 60 * currentRate;
    return new ApprovedForCharge({
        version: "1.0.0",
        totalCharge: amountToCharge.toFixed(2)
    });
};

Rule.prototype.hydrate = function (event) {
    this.rules.push(event);
};

function _ruleForSpot(rules, spot) {
    var resultRule = null;

    /**
     * @return {boolean}
     */
    function IfInRange(lotRange, spot) {
        var startEnd = lotRange.split('-');
        var start = startEnd[0];
        var end = startEnd[1];
        var isInRange = spot >= Number(start) && spot <= Number(end);
        return isInRange;
    }

    for (var rule in rules) {
        if (!rules.hasOwnProperty(rule)) continue;
        var currentRule = rules[rule];
        var lotRange = currentRule.lotRange;
        if (IfInRange(lotRange,spot)) {
            resultRule = rules[rule];
            break;
        }
    }
    return resultRule;
}
function _applicableRate(rates, start, duration) {
    function _rateInRange(timeRange) {
        var regex = /^([A-Z][a-z]{2})-([A-Z][a-z]{2}), ([0-9]{4})h-([0-9]{4})h$/;
        var result = timeRange.match(regex);
        var startDay = result[1];
        var endDay = result[2];
        var startHour = result[3];
        var endHour = result[4];
        var parkingDate = new Date(start);
        var startTime = parkingDate.getHours()*100 + parkingDate.getMinutes();
        var bottomOfRange = startTime >= Number(startHour);
        var topOfRange = startTime <= Number(endHour);
        return bottomOfRange && topOfRange;
    }
    for (var rate in rates) {
        var currentRate = rates[rate];
        if (_rateInRange(currentRate.timeRange)) {
            return currentRate.ratePerHour;
        }
    }
}

module.exports = Rule;