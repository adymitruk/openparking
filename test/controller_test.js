var uuid = require('uuid');
var createController = require('../src/controller');

var SetRateRule = require('../src/events/SetRateRule');
var SetUpPayment = require('../src/events/SetUpPayment');

function GoesReaderStub(eventsPerDate) {
  this.getAllForDate = function(date, cb) {
    var events = eventsPerDate[date] || [];
    cb(null, events);
  }
}

function GoesClientStub() {
  this.events = {};
  this.registerTypes = function() {};
  this.readStream = function(aggregateId, cb) {
    var events = this.events[aggregateId] || [];

    if (cb)
      cb(null, events);
  };
  this.addEvent = function(aggregateId, event, cb) {
    var stream = this.events[aggregateId];
    if (!stream) {
      stream = [];
      this.events[aggregateId] = stream;
    }
    stream.push(event);

    if (cb)
      cb(null, event);
  };
}

function StripeStub() {
  this._transactions = {};
  this.hasTransaction = function(trx) {
    return this._transactions[trx.transactionId] !== undefined;
  };

  var self = this;
  this.registerTransaction = function(trx, cb) {
    self._transactions[trx.transactionId] = [trx, cb];
  };
  this.createPaymentUrl = function() {
    return "Stripe";
  }
}

module.exports = {
  setUp: function(cb) {
    this.eventsPerDate = {};
    this.goesReader = new GoesReaderStub(this.eventsPerDate);
    this.goesClient = new GoesClientStub();
    this.stripe = new StripeStub();
    this.paymentProviders = {'stripe': this.stripe};
    this.config = {ruleId: uuid.v4(), parkingId: uuid.v4(), paymentId: uuid.v4()};
    this.controller = createController(this.goesClient, this.goesReader, this.paymentProviders, this.config);
    cb();
  },
  'Test Park When It\'s Free': function(test) {
    //Arrange
    test.expect(5);
    //Act
    var req = {
      $type: 'park',
      spot: '1234',
      duration: '15',
      durationUnit: 'm',
      licensePlate: 'ABC123'
    };
    this.controller.handleRequest(req, function(err, res) {
      test.ok(err === null, "There was en error. " + err);
      test.ok(res, "There was no response.");
      if (!res) return test.done();
      var expected = "Parking Is Free Currently";
      test.ok(res.reason === expected, "Expected reason \"" + expected + "\", got \"" + res.reason  + "\".");
      test.ok(!res.link, "There was a link.");
      test.ok(!res.trx, "There was a trx.");
      test.done();
    });
  },
  'Test Park Happy Path': function(test) {
    //Arrange
    test.expect(6);
    var rateRule = new SetRateRule({
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
    );
    this.goesClient.addEvent(this.config.ruleId, rateRule);
    var setUpPayment = new SetUpPayment({providerName: 'stripe', currency: 'CAD', merchantId: 'merchantId'});
    this.goesClient.addEvent(this.config.paymentId, setUpPayment);
    //Act
    var req = {
      $type: 'park',
      spot: '1234',
      duration: '15',
      durationUnit: 'm',
      licensePlate: 'ABC123'
    };
    var self = this;
    this.controller.handleRequest(req, function(err, res) {
      //Assert
      test.ok(err === null, "There was en error. " + err);
      test.ok(res, "There was no response.");
      if (!res) return test.done();
      test.ok(!res.reason, "There was a reason. " + res.reason);
      test.ok(res.link === "Stripe", "Expected Stripe stub link, got " + res.link);
      test.ok(res.trx, "There was no trx.");
      test.ok(self.stripe.hasTransaction(res.trx), "Transaction was not registered with Stripe stub.");
      test.done();
    });
  },
  'Test Enforce Request With No Parking Today': function(test) {
    //Arrange
    test.expect(4);
    //Act
    var req = {
      $type: 'enforce',
      spot: '1234',
      date: new Date(2016,1,1)
    };
    this.controller.handleRequest(req, function(err, res) {
      //Assert
      test.ok(err === null, "There was en error. " + err);
      test.ok(res, "There was no response.");
      if (res) {
        test.ok(res.spot === 1234, "Response spot doesn't match request.");
        test.ok(res.sessions.length === 0, "Expected 0 parking sessions, got " + res.sessions.length);
      }
      test.done();
    });
  },
  'Test Enforce Request With Parking': function(test) {
    //Arrange
    test.expect(4);
    var date = new Date(2016,1,2);
    this.eventsPerDate[date] = [
      {typeId: 'SessionAdded', payload: {spot: 1234}}
    ];
    //Act
    var req = {
      $type: 'enforce',
      spot: '1234',
      date: date
    };
    this.controller.handleRequest(req, function(err, res) {
      //Assert
      test.ok(err === null, "There was an error. " + err);
      test.ok(res, "There was no response.");
      if (res) {
        test.ok(res.spot === 1234, "Response spot doesn't match request.");
        test.ok(res.sessions.length === 1, "Expected 1 parking sessions, got " + res.sessions.length);
      }
      test.done();
    });
  }
};