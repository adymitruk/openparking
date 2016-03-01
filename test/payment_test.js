var uuid = require('uuid');

var Payment = require('../src/payment');
var InitiatePayment = require('../src/commands/InitiatePayment');
var ConfirmPayment = require('../src/commands/ConfirmPayment');
var SetUpPayment = require('../src/events/SetUpPayment');
var PaymentInitiated = require('../src/events/PaymentInitiated');
var PaymentSucceeded = require('../src/events/PaymentSucceeded');
var PaymentFailed = require('../src/events/PaymentFailed');

function objTypeName(obj) {
  if (typeof obj === 'object' && typeof obj.constructor === 'function')
      return obj.constructor.name;
  return typeof obj;
}

module.exports = {
  setUp: function(cb) {
    this.payment = new Payment();
    this.payment.hydrate(new SetUpPayment({
      providerName: 'PayPal',
      merchantId: 'billing@my-business-test.com',
      currency: 'CAD'
    }));
    cb();
  },
  'Test Initiate A Payment': function(test) {
    var command = new InitiatePayment({
      description: 'Parking 2h at 1234',
      itemPrice: 4.0,
      id: 1234
    });
    var event = this.payment.execute(command);
    test.ok(event instanceof PaymentInitiated, "Expected PaymentInitiated, got " + objTypeName(event));
    test.ok(event.itemId === command.itemId);
    test.ok(event.itemCost === command.itemCost);
    test.ok(event.itemDescription === command.itemDescription);
    test.ok(event.transactionId === command.transactionId);
    test.ok(event.currency === 'CAD');
    test.ok(event.providerName === 'PayPal');
    test.ok(event.merchantId === 'billing@my-business-test.com');
    test.done();
  },
  'Test Confirm Non-Existing Transaction': function(test) {
    //Arrange
    //Act
    var transactionId = uuid.v4();
    var command = new ConfirmPayment(transactionId);
    //Asert
    var self = this;
    test.throws(function() {
      self.payment.execute(command);
    }, new RegExp("^Trying to confirm a payment that doesn't exists. " + transactionId + "$"));
    test.done();
  },
  'Test Confirm Transaction Success': function(test) {
    //Arrange
    var transactionId = uuid.v4();
    this.payment.hydrate(new PaymentInitiated({
      merchantId: 'billing@my-business-test.com',
      itemDescription: 'Parking 2h at 1234',
      itemCost: 4.00,
      itemId: 1234,
      currency: 'CAD',
      transactionId: transactionId,
      providerName: 'PayPal'
    }));
    //Act
    var event = this.payment.execute(new ConfirmPayment(transactionId, true));
    //Assert
    test.ok(event instanceof PaymentSucceeded, "Expected PaymentSucceeded, got " + objTypeName(event));
    test.ok(event.transactionId === transactionId, "event transactionId doesn't match.");
    test.done();
  },
  'Test Confirm Transaction Denied': function(test) {
    //Arrange
    var transactionId = uuid.v4();
    this.payment.hydrate(new PaymentInitiated({
      merchantId: 'whatever',
      itemDescription: 'Parking 2h at 1234',
      itemCost: 4.00,
      itemId: 1234,
      currency: 'CAD',
      transactionId: transactionId,
      providerName: 'PayPal'
    }));
    //Act
    var event = this.payment.execute(new ConfirmPayment(transactionId, false));
    //Assert
    test.ok(event instanceof PaymentFailed, "Expected PaymentFailed, got " + objTypeName(event));
    test.ok(event.transactionId === transactionId, "event transactionId doesn't match.");
    test.done();
  },
  'Test Confirm Transaction Twice': function(test) {
    //Arrange
    var transactionId = uuid.v4();
    this.payment.hydrate(new PaymentInitiated({
      merchantId: 'billing@my-business-test.com',
      itemDescription: 'Parking 2h at 1234',
      itemCost: 4.00,
      itemId: 1234,
      currency: 'CAD',
      transactionId: transactionId,
      providerName: 'PayPal'
    }));
    this.payment.hydrate(new PaymentSucceeded(transactionId));
    //Act
    var self = this;
    test.throws(function() {
      self.payment.execute(new ConfirmPayment(transactionId));
    }, new RegExp("^Trying to confirm a payment that is already confirmed. " + transactionId + "$"));
    test.done();
  }
};