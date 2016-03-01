var when = require('when');

var Payment = require('./payment'),
    InitiatePayment = require('./commands/InitiatePayment'),
    ConfirmPayment = require('./commands/ConfirmPayment'),
    SetUpPayment = require('./events/SetUpPayment'),
    PaymentInitiated = require('./events/PaymentInitiated'),
    PaymentFailed = require('./events/PaymentFailed'),
    PaymentSucceeded = require('./events/PaymentSucceeded');

var Rule = require('./rule'),
    Park = require('./commands/Park'),
    SetRateRule = require('./events/SetRateRule'),
    ApprovedForCharge = require('./events/ApprovedForCharge'),
    ParkingChargeRejected = require('./events/ParkingChargeRejected');

var Parking = require('./parking'),
    AddSession = require('./commands/AddSession'),
    SetUpParking = require('./events/SetUpParking'),
    SessionAdded = require('./events/SessionAdded');

function trxCallback(source, handler) {
  return function(trxId, success, cb) {
    handler(trxId, success)
        .then(function(response) {
          if (response.reason) {
            source.sendMessage(['Parking session at', response.spot, 'IS NOT started. Reason:', response.reason].join(' '));
          }
          else if (response.validUntil) {
            source.sendMessage(['Parking session at', response.spot, 'IS started and is valid until', response.validUntil].join(' '));
          }
          cb(null, response);
        })
        .catch(function(err) {
          source.sendError(err);
          cb(err);
        });
  }
}

function ParkingController(goesClient, goesReader, paymentProviders, config) {
  goesClient.registerTypes(SetUpPayment, PaymentInitiated, PaymentFailed, PaymentSucceeded);
  goesClient.registerTypes(SetRateRule, ApprovedForCharge, ParkingChargeRejected);
  goesClient.registerTypes(SetUpParking, SessionAdded);

  this._paymentProviders = paymentProviders;
  this._config = config;

  this._readStream = function(aggregateId) {
    return when.promise(function(resolve, reject) {
      goesClient.readStream(aggregateId, function(err, events) {
        if (err) return reject(err);
        //console.log('readStream', aggregateId, events);
        resolve(events);
      });
    })
  };

  this._addEvent = function(aggregateId, event) {
    return when.promise(function(resolve, reject) {
      goesClient.addEvent(aggregateId, event, function(err) {
        if (err) return reject(err);
        //console.log('addEvent', aggregateId, event);
        resolve(event);
      })
    })
  };

  this._getAllForDate = function(date) {
    return when.promise(function(resolve, reject) {
      goesReader.getAllForDate(date, function(err, events) {
        if (err) return reject(err);
        resolve(events);
      })
    });
  };
}

ParkingController.prototype.handlePark = function(parkingRequest) {
  var self = this;
  var spot = parseInt(parkingRequest.spot);
  var startTime = new Date();
  var durationInMinutes = parseInt(parkingRequest.duration);
  if (parkingRequest.durationUnit === 'h')
    durationInMinutes *= 60;
  var licensePlate = parkingRequest.licensePlate;

  var ruleId = this._config.ruleId;
  var paymentId = this._config.paymentId;
  var parkingId = this._config.parkingId;

  function startSession() {
    console.log('startSession');
    var parking = new Parking();
    return self._readStream(parkingId)
        .then(function(events) {
          events.forEach(parking.hydrate);
          var sessionEvent = parking.execute(new AddSession({
            spot: spot,
            startTime: startTime,
            durationInMinutes: durationInMinutes,
            vehicle: licensePlate
          }));
          return self._addEvent(parkingId, sessionEvent);
        })
        .then(function(sessionAdded) {
          var validUntil = new Date(startTime.getTime() + (1000*60*durationInMinutes));
          return {validUntil: validUntil, spot: sessionAdded.spot};
        })
  }

  function confirmPayment(transactionId, success) {
    console.log('confirmPayment');
    var payment = new Payment();
    return self._readStream(paymentId)
        .then(function(paymentEvents) {
          paymentEvents.forEach(payment.hydrate);
          var confirmPaymentResult = payment.execute(new ConfirmPayment(transactionId, success));
          return self._addEvent(paymentId, confirmPaymentResult);
        })
        .then(function(event) {
          if (event instanceof PaymentFailed) {
            var paymentProvider = self._paymentProviders[event.providerName];
            paymentProvider.unregisterTransaction(event.transactionId);
            return {reason: 'Payment failed.', spot: spot};
          }
          if (event instanceof PaymentSucceeded) {
            var paymentProvider = self._paymentProviders[event.providerName];
            paymentProvider.unregisterTransaction(event.transactionId);
            return startSession();
          }
        });
  }

  function charge(totalCharge) {
    console.log('charge', totalCharge);
    return self._readStream(paymentId)
        .then(function(paymentEvents) {
          if (paymentEvents === undefined) return;

          var payment = new Payment();
          console.log(paymentEvents);
          paymentEvents.forEach(payment.hydrate);

          var initiatePaymentResult = payment.execute(new InitiatePayment({
            id: spot,
            description: ['Parking ', durationInMinutes, 'm at ', spot].join(''),
            cost: totalCharge
          }));

          return self._addEvent(paymentId, initiatePaymentResult);
        })
        .then(function (paymentEvent) {
          var paymentProvider = self._paymentProviders[paymentEvent.providerName];
          var trx = {
            transactionId: paymentEvent.transactionId,
            amount: paymentEvent.itemCost,
            currency: paymentEvent.currency,
            description: paymentEvent.itemDescription
          };
          paymentProvider.registerTransaction(trx, trxCallback(parkingRequest.$source, confirmPayment));

          var paymentUrl = paymentProvider.createPaymentUrl(paymentEvent.transactionId);
          return {trx: trx, link: paymentUrl};
        });
  }

  function validateRule() {
    console.log('validateRule');
    return self._readStream(ruleId)
        .then(function (ruleEvents) {
          var rule = new Rule();
          ruleEvents.forEach(rule.hydrate);

          var parkResult = rule.execute(new Park({
            previousParking: null,
            spot: parseInt(spot),
            startTime: new Date().toISOString(),
            durationInMinutes: durationInMinutes
          }));

          return self._addEvent(ruleId, parkResult);
        })
        .then(function (ruleEvent) {
          if (ruleEvent instanceof ParkingChargeRejected) {
            return {reason: ruleEvent.reason};
          }
          if (ruleEvent instanceof ApprovedForCharge) {
            return charge(ruleEvent.totalCharge);
          }
        });
  }

  return validateRule();
};

ParkingController.prototype.handleEnforce = function(enforceRequest){
  var spot = parseInt(enforceRequest.spot);
  //TODO: add function taking filters so we can pre-filter events instead of doing it here
  return this._getAllForDate(enforceRequest.date || new Date())
      .then(function(storedEvents) {
        return storedEvents
            .filter(function (ev) {
              return ev.typeId === 'SessionAdded';
            });
      })
      .then(function(sessionAddedEvents) {
        return sessionAddedEvents
            .filter(function (ev) {
              return ev.payload.spot === spot;
            });
      })
      .then(function(eventsForSpot) {
        return eventsForSpot.map(function(ev) {
          var sessionAdded = ev.payload;
          return {
            startTime: new Date(sessionAdded.startTime).toTimeString().split(' ')[0],
            vehicle: sessionAdded.vehicle,
            durationInMinutes: sessionAdded.durationInMinutes
          };
        });
      })
      .then(function(sessions) {
        return {sessions: sessions, spot: spot};
      });
};

//TODO: use type (instanceof) instead of $type
ParkingController.prototype.handleRequest = function(req, cb) {
  if (req.$type === 'park') {
    return this.handlePark(req)
        .then(function(response) {
          cb(null, response);
        })
        .catch(function(err) {
          cb(err);
        });
  }
  if (req.$type === 'enforce') {
    return this.handleEnforce(req)
        .then(function(response) {
          cb(null, response);
        })
        .catch(function(err) {
          cb(err);
        });
  }
  throw new Error('No handler for ' + req.$type);
};

module.exports = function(goesClient, goesReader, paymentProviders, config) {
  return new ParkingController(goesClient, goesReader, paymentProviders, config);
};