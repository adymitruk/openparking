/*jslint node:true */
"use strict";

var Rule = require('../src/rule.js');
var SetRateRule = require('../src/events/SetRateRule.js');
var Park = require('../src/commands/Park.js');

var vancouverRateRule = new SetRateRule({
    SetRateRule: {
        lotRange: "1000-2000",
        rates: [
            {
                name: "Everyday",
                timeRange: "Mon-Sun, 0900h-2200h",
                ratePerHour: 2,
                granularity: "minutes",
                limitStayInHours: 2,
                limitResetInMins: 30
            }
        ],
        restrictions: [
            {
                name: "Morning Rush Hour",
                timeRange: "Mon-Fri, 0700h-1000h"
            },
            {
                name: "Evening Rush Hour",
                timeRange: "Mon-Fri, 1500h-1800h"
            }
        ]
    }
});
module.exports = {
    'Test Parking Sunny Path': function (test) {
        test.expect(1);
        var rule = new Rule();

        // GIVEN: a parking spot is setup
        rule.hydrate(vancouverRateRule);

        // WHEN: a user asks to park
        var parkingChargeApprovedEvent = rule.execute({
            ParkCommand: {
                version: "1.0.0",
                previousParking: null,
                spot: 1234,
                startTime: "Jan 7 2016 18:10:00 PST",
                durationInMinutes: 40
            }
        });

        // THEN: the appropriate charge is calculated
        var expectedMoneyRoundedToPennies = (40.0 / 60.0 * 2.0).toFixed(2);
        var actual = parkingChargeApprovedEvent.totalCharge;
        test.ok(actual === expectedMoneyRoundedToPennies,
            "rate should be " + expectedMoneyRoundedToPennies + " but was " + actual);
        test.done();
    },
    'Test Parking Rejected Due to restriction': function (test) {
        test.expect(1);
        var rule = new Rule();

        // GIVEN: a parking spot is setup
        rule.hydrate(vancouverRateRule);

        // WHEN: a user asks to park
        var parkingChargeRejectedEvent = rule.execute({
            ParkCommand: {
                version: "1.0.0",
                previousParking: null,
                spot: 1234,
                startTime: "Jan 7 2016 15:10:00 PST",
                durationInMinutes: 40
            }
        });

        // THEN
        test.ok(parkingChargeRejectedEvent.Reason === "Afternoon Rush Hour", "rejected reason was supposed to be 'Afternoon Rush Hour'");
        test.done();
    }
}