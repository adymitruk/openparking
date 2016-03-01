var uuid = require('uuid');

function SessionAdded(sourceEvent) {
  this.id = uuid.v4();
  this.version = '1.0.0';
  this.sessionId = sourceEvent.sessionId;
  this.spot = sourceEvent.spot;
  this.startTime = sourceEvent.startTime;
  this.durationInMinutes = sourceEvent.durationInMinutes;
  this.vehicle = sourceEvent.vehicle;
}

module.exports = SessionAdded;