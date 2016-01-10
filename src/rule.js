"use strict";
var Money = require('./money.js');

function Rule() {
    this.rules = [];
}

Rule.prototype.execute = function(command) {
    var parkCommand = command.ParkCommand;
    var rule = _ruleFor(this.rules, parkCommand.spot);
    function _totalForParking(rates, start, duration) {
        for (var rate )
    }

    var currentRate = _totalForParking(rule.rates, command.startTime, command.duration);
    var money = new Money(command.duration/60
        *currentRate.ratePerHour);
    return { approvedEvent: {
        version: "1.0.0",
        totalCharge: money
        }
    }
};

Rule.prototype.hydrate = function (event) {
    console.log('event being pushed:');
    console.log(event);
    console.log('event type:'); // best way I know of getting the type
    console.log(event.constructor.name);
    this.rules.push(event);
};

function _ruleFor(rules, spot) {
    var resultRule = null;

    /**
     * @return {boolean}
     */
    function IfInRange(lotRange, spot) {
        var startEnd = lotRange.split('-');
        var start = startEnd[0];
        var end = startEnd[1];
        return spot >= Number(start) && spot <= Number(end);
    }

    console.log(rules);
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

module.exports = Rule;