var uuid = require('uuid'),
    createGoesReader = require('../../src/integrations/goesReader');

module.exports = {
  setUp: function(cb) {
    //TODO: how do we get path for events
    this.reader = createGoesReader('c:/tmp/parkingevents');
    cb();
  },
  'Test Get All Events For Date When No Events Returns Empty Array': function(test) {
    this.reader.getAllForDate(new Date(1980,1,1), function(err, storedEvents) {
      test.ok(err === null, "getAllForDate failed. Error: " + err);
      if (storedEvents)
        test.ok(storedEvents.length === 0, "getAllForDate returned " + storedEvents.length + " events, expected 0");
      test.done();
    });
  },
  'Test Get All Events For Date DOES Returns Array Of StoredEvents': function(test) {
    this.reader.getAllForDate(new Date(), function(err, storedEvents){
      test.ok(err === null, "getAllForDate failed. Error: " + err);
      if (storedEvents)
        test.ok(storedEvents.length > 0, "getAllForDate returned 0 events, expected at least 1.");
      if (storedEvents && storedEvents.length) {
        for(var i = 0; i < storedEvents.length; i++) {
          test.ok(storedEvents[i].hasOwnProperty('streamId'));
          test.ok(storedEvents[i].hasOwnProperty('creationTime'));
          test.ok(storedEvents[i].hasOwnProperty('typeId'));
          test.ok(storedEvents[i].hasOwnProperty('payload'));
        }
      }
      test.done();
    });
  }
};