var Parking = require('../src/parking');
var AddSession = require('../src/commands/AddSession');
var SessionAdded = require('../src/events/SessionAdded');

module.exports = {
  setUp: function(cb) {
    this.parking = new Parking();
    cb();
  },
  'Test Adding a session': function(test) {
    test.expect(6);
    var command = new AddSession({
      spot: '1234',
      startTime: new Date(),
      durationInMinutes: 60,
      vehicle: 'ABC123'
    });
    var event = this.parking.execute(command);
    if (!event) {
      test.ok(event, "No event.");
      return test.done();
    }
    test.ok(event instanceof SessionAdded, "Expected SessionAdded event, got " + event.constructor.name);
    ["sessionId", "spot", "startTime", "durationInMinutes", "vehicles"].forEach(function(key) {
      test.ok(event[key] === command[key], "event " + key + " is different from command " + key);
    });
    test.done();
  }
};
