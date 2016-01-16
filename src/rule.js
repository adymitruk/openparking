"use strict";
var ApprovedForCharge = require('./events/ApprovedForCharge');

function Rule() {
    this.rules = [];
}

Rule.prototype.execute = function(command) {
    var parkCommand = command.ParkCommand;
    console.log('Command:');
    console.log(parkCommand);
    var rule = _ruleForSpot(this.rules, parkCommand.spot);
    var currentRate = _applicableRate(rule.rates, parkCommand.startTime, parkCommand.duration);
    console.log('current rate: ' + currentRate);
    var amountToCharge = parkCommand.durationInMinutes / 60 * currentRate;
    console.log("amount to charge: " + amountToCharge.toFixed(2));
    return new ApprovedForCharge({
        version: "1.0.0",
        totalCharge: amountToCharge.toFixed(2)

    });
};

Rule.prototype.hydrate = function (event) {
    console.log('event being pushed:');
    console.log(event);
    console.log('event type:'); // best way I know of getting the type
    console.log(event.constructor.name);
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
        console.log('lot range: %s start: %s end: %s spot: %s', lotRange, start, end, spot);
        var isInRange = spot >= Number(start) && spot <= Number(end);
        console.log(isInRange ? 'is in range' : 'is not in range');
        return isInRange;
    }

    console.log(rules);
    for (var rule in rules) {
        if (!rules.hasOwnProperty(rule)) continue;
        var currentRule = rules[rule];
        var lotRange = currentRule.lotRange;
        if (IfInRange(lotRange,spot)) {
            resultRule = rules[rule];
            console.log('found rule for lot range: ' + resultRule.lotRange);
            break;
        }
    }
    return resultRule;
}
function _applicableRate(rates, start, duration) {
    function _rateInRange(timeRange) {
        console.log('searching for valid range in ' + timeRange);
        var regex = /^([A-Z][a-z]{2})-([A-Z][a-z]{2}), ([0-9]{4})h-([0-9]{4})h$/;
        var result = timeRange.match(regex);
        var startDay = result[1];
        var endDay = result[2];
        var startHour = result[3];
        var endHour = result[4];
        console.log('matched start day: %s end day: %s start hour: %d end hour %d',
            startDay, endDay, startHour, endHour);
        var parkingDate = new Date(start);
        console.log('start of parking session: ' + parkingDate);
        var startTime = parkingDate.getHours()*100 + parkingDate.getMinutes();
        console.log('hours and minutes start time: ' + startTime);
        console.log('range bottom: ' + startHour);
        console.log('range top: ' + endHour);
        var bottomOfRange = startTime >= Number(startHour);
        console.log('is above or equal to bottom of range: ' + bottomOfRange);
        var topOfRange = startTime <= Number(endHour);
        console.log('is below or equal to top of range: ' + topOfRange);
        return bottomOfRange && topOfRange;
    }
    for (var rate in rates) {
        var currentRate = rates[rate];
        if (_rateInRange(currentRate.timeRange)) {
            console.log('rate ' + currentRate.ratePerHour);
            return currentRate.ratePerHour;
        }
    }
}

module.exports = Rule;