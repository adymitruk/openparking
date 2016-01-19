/*jslint node:true */
"use strict";

var uuid = require('uuid');

function ParkingChargeRejected(command, restriction) {
    this.version = "1.0.0";
    this.id = uuid.v4();
    this.reason = restriction.name;
    this.start = command.startTime;
    this.durationInMinutes = command.durationInMinutes;
}

module.exports = ParkingChargeRejected;