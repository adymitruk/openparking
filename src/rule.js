"use strict";
var Money = require('./money.js');

function Rule() {
    this.rules = [];
}

Rule.prototype.execute = function(command) {
    console.log(command);
    var parkCommand = command.ParkCommand;
    var rule = _ruleFor(this.rules, parkCommand.spot);
    console.log("rule " + rule);
    function _rateFor(rates, start, duration) {
        r
    }

    var currentRate = _rateFor(rule.rates, command.startTime, command.duration);
    var money = new Money(command.duration/60
        *currentRate.ratePerHour);
    return { approvedEvent: {
        version: "1.0.0",
        totalCharge: money
        }
    }
};

Rule.prototype.hydrate = function (event) {
    this.rules.push(event);
};

function _ruleFor(rules, spot) {
    console.log("rules: ");
    console.log(rules);
    var resultRule = null;

    /**
     * @return {boolean}
     */
    function IfInRange(lotRange, spot) {
        var startEnd = lotRange.split('-');
        console.log(startEnd);
        var start = startEnd[0];
        console.log(start);
        var end = startEnd[1];
        console.log(end);
        console.log(spot);
        return spot >= Number(start) && spot <= Number(end);
    }

    for (var rule in rules) {
        if (!rules.hasOwnProperty(rule)) continue;
        console.log("looking at rule:");
        var currentRule = rules[rule];
        console.log(currentRule);
        var lotRange = currentRule.lotRange;
        console.log(lotRange);
        if (IfInRange(lotRange,spot)) {
            resultRule = rules[rule];
            break;
        }
    }
    console.log("found rule: ");
    console.log(resultRule);
    return resultRule;
};

module.exports = Rule;