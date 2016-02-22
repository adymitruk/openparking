/*jslint node: true */
"use strict";

var ApprovedForCharge = require('./events/approvedForCharge');
var ParkingChargeRejected = require('./events/parkingChargeRejected');

function Rule() {
    var rules = [];
    this.execute = function (command) {
        var rule = _ruleForSpot(rules, command);
        if (!rule) {
            return new ParkingChargeRejected(command, {name: "Parking Is Free Currently"});
        }
        var activeRestriction = _restrictionOverlapsRequestedTime(command, rule);
        if (activeRestriction) {
            return new ParkingChargeRejected(command, activeRestriction);
        }
        var currentRate = _applicableRate(rule.rates, command.startTime, command.duration);
        var amountToCharge = command.durationInMinutes / 60 * currentRate;
        return new ApprovedForCharge(amountToCharge.toFixed(2));
    };
    this.hydrate = function (event) {
        rules.push(event);
    };
    function _addTime(time, minutesToAdd) {
        return Date(Math.floor(time/100) + time.toString().substr(time.length()-2));
    }

    function _restrictionOverlapsRequestedTime(command, rule) {
        var restrictions = rule.restrictions;
        for (var restriction in restrictions) {
            if (restrictions.hasOwnProperty(restriction)) {
                var currentRestriction = restrictions[restriction];
                if (_isInTimeRange(currentRestriction.timeRange, command.startTime ||
                    _isInTimeRange(currentRestriction.timeRange,
                        _addTime(command.startTime, command.durationInMinutes)))) {
                    return currentRestriction;
                }
            }
        }
    }
    function _ruleForSpot(rules, command) {
        function _ifInRange(lotRange, spot) {
            var startEnd = lotRange.split('-');
            return spot >= Number(startEnd[0]) && spot <= Number(startEnd[1]);
        }

        for (var rule in rules) {
            if (rules.hasOwnProperty(rule)) {
                var currentRule = rules[rule];
                var lotRange = currentRule.lotRange;
                if (_ifInRange(lotRange, command.spot)) {
                    var rates = currentRule.rates;
                    for (var rate in rates) {
                        if (rates.hasOwnProperty(rate)) {
                            var currentRate = rates[rate];
                            if (_isInTimeRange(currentRate.timeRange, command.startTime)) {
                                return currentRule;
                            }
                        }
                    }
                }
            }
        }
    }
    function _applicableRate(rates, start, duration) {
        for (var rate in rates) {
            if (rates.hasOwnProperty(rate)) {
                var currentRate = rates[rate];
                if (_isInTimeRange(currentRate.timeRange, start)) {
                    return currentRate.ratePerHour;
                }
            }
        }
    }
    function _isInTimeRange(timeRange, time) {
        var regex = /^([A-Z][a-z]{2})-([A-Z][a-z]{2}), ([0-9]{4})h-([0-9]{4})h$/;
        var result = timeRange.match(regex);
        var startDay = result[1];
        var endDay = result[2];
        var startHour = result[3];
        var endHour = result[4];
        var parkingDate = new Date(time);
        var startTime = parkingDate.getHours() * 100 + parkingDate.getMinutes();
        var bottomOfRange = startTime >= Number(startHour);
        var topOfRange = startTime <= Number(endHour);
        return bottomOfRange && topOfRange;
    }
}

module.exports = Rule;