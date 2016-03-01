var uuid = require('uuid');

function AddSession(parkingSession) {
  this.sessionId = uuid.v4();
  this.spot = parkingSession.spot;
  this.startTime = parkingSession.startTime;
  this.durationInMinutes = parkingSession.durationInMinutes;
  this.vehicle = parkingSession.vehicle;
}

module.exports = AddSession;