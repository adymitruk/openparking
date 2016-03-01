var uuid = require('uuid'),
    goesClient = require('../../src/integrations/goesClient'),
    goesAddr = 'tcp://127.0.0.1:12345';

function AnEvent(a, b) {
  this.a = a;
  this.b = b;
}

module.exports = {
  setUp: function(cb){
    try {
      this.goesClient = goesClient(goesAddr);
      this.goesClient.registerTypes(AnEvent);
    } catch(e) {
      return cb(e);
    }
    cb();
  },
  tearDown: function(cb) {
    this.goesClient.close();
    cb();
  },
  'Test Adding Event Succeeds': function (test) {
    test.expect(1);

    this.goesClient.addEvent(uuid.v4(), new AnEvent(123, 'Hello'), function (err) {
      test.ok(err === undefined, "addEvent returned an error: " + err);
      test.done();
    });
  },
  'Test Retrieving Events for a non-existing aggregate': function(test) {
    this.goesClient.readStream(uuid.v4(), function(err, events) {
      test.ok(err != null, "readStream expected to fail but did not.");
      test.done();
    });
  },
  'Test Retrieving Events for Aggregate Succeeds': function (test) {
    test.expect(4);

    var aggregateId = uuid.v4();
    this.goesClient.addEvent(aggregateId, new AnEvent(123, 'Hello'), function(err) {
      test.ok(err === undefined, "addEvent for first event returned an error: " + err);
    });
    this.goesClient.addEvent(aggregateId, new AnEvent(456, 'World'), function(err) {
      test.ok(err === undefined, "addEvent for second event returned an error: " + err);
    });
    this.goesClient.readStream(aggregateId, function(err, events) {
      test.ok(err === null, "readStream failed. " + err);
      events = events || [];
      test.ok(events.length === 2, "invalid number of events. should be 2 but was " + events.length);
      test.done();
    });
  },
  'Test Retrieving All Events Succeeds': function (test) {
    test.expect(2);
    this.goesClient.readAll(function(err, events) {
      test.ok(err === null, "readAll failed. " + err);
      events = events || [];
      test.ok(events.length >= 3, "invalid number of events. expected at least 3 but was " + events.length);
      test.done();
    });
  },
  // Performance test, should be in another file/folder so they don't normally run
  'Test Adding 1000 events in same aggregate': function(test) {
    test.expect(1002);
    var aggregateId = uuid.v4();
    for(var i = 0; i < 1000; i++) {
      this.goesClient.addEvent(aggregateId, new AnEvent(i, 'hello-'+i), function(err) {
        test.ok(err === undefined, "addEvent " + i + " failed. " + err);
      });
    }
    this.goesClient.readStream(aggregateId, function(err, events) {
      test.ok(err === null, "readStream failed. " + err);
      events = events || [];
      test.ok(events.length === 1000, "invalid number of events. should be 1000 but was " + events.length);
      test.done();
    });
  }
};