/*jslint node:true */
"use strict";

var uuid = require('uuid');

function Park(objectGraph) {
    this.version = "1.0.0";
    this.id = uuid.v4();
    this.previousParking = objectGraph.previousParking;
    this.spot = objectGraph.spot;
    this.startTime = objectGraph.startTime;
    this.durationInMinutes = objectGraph.durationInMinutes;
}

module.exports = Park;