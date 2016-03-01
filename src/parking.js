var uuid = require('uuid');

var AddSession = require('./commands/AddSession'),
    SessionAdded = require('./events/SessionAdded');

function objTypeName(obj) {
  if (typeof obj === 'object' && typeof obj.constructor === 'function')
    return obj.constructor.name;
  return typeof obj;
}

function Parking() {
  this.hydrate = function(ev){
  };
  this.execute = function(command){
    if (command instanceof AddSession)
        return _addSession(command);
    throw new Error('Invalid parking command ' + objTypeName(command))
  };
  function _addSession(command){
    return new SessionAdded({
      sessionId: command.sessionId,
      spot: command.spot,
      startTime: command.startTime,
      durationInMinutes: command.durationInMinutes,
      vehicle: command.vehicle
    });
  }
}

module.exports = Parking;