var uuid = require('uuid');
var InitiatePayment = require('./commands/InitiatePayment');
var ConfirmPayment = require('./commands/ConfirmPayment');
var SetUpPayment = require('./events/SetUpPayment');
var PaymentInitiated = require('./events/PaymentInitiated');
var PaymentSucceeded = require('./events/PaymentSucceeded');
var PaymentFailed = require('./events/PaymentFailed');

function objTypeName(obj) {
  if (typeof obj === 'object' && typeof obj.constructor === 'function')
    return obj.constructor.name;
  return typeof obj;
}

function Payment(){
  var pendingPayments = [];
  var confirmedPayments = [];
  var merchantId = null;
  var providerName = null;
  var currency = null;
  this.execute =  function(command) {
    if (command instanceof InitiatePayment) return _initiatePayment(command);
    if (command instanceof ConfirmPayment) return _confirmPayment(command);
    throw new Error('Invalid command type: ' + objTypeName(command))
  };
  function _initiatePayment(command) {
    return new PaymentInitiated({
      merchantId: merchantId,
      providerName: providerName,
      currency: currency,
      itemId: command.itemId,
      itemCost: command.itemCost,
      itemDescription: command.itemDescription,
      transactionId: command.transactionId
    });
  }
  function _confirmPayment(command) {
    if (confirmedPayments.hasOwnProperty(command.transactionId)){
      throw new Error("Trying to confirm a payment that is already confirmed. " + command.transactionId);
    }
    if (!pendingPayments.hasOwnProperty(command.transactionId)){
      throw new Error("Trying to confirm a payment that doesn't exists. " + command.transactionId);
    }
    if (command.success) {
      return new PaymentSucceeded(command.transactionId, providerName);
    } else {
      return new PaymentFailed(command.transactionId, providerName);
    }
  }
  this.hydrate = function(ev) {
    if (ev instanceof SetUpPayment) return _setUpPayment(ev);
    if (ev instanceof PaymentInitiated) return _paymentInitiated(ev);
    if (ev instanceof PaymentSucceeded) return _paymentSucceeded(ev);
  };
  function _setUpPayment(setUpPayment) {
    providerName = setUpPayment.providerName;
    currency = setUpPayment.currency;
    merchantId = setUpPayment.merchantId;
  }
  function _paymentInitiated(paymentInitiated) {
    pendingPayments[paymentInitiated.transactionId] = paymentInitiated;
  }
  function _paymentSucceeded(paymentSucceeded) {
    confirmedPayments[paymentSucceeded.transactionId]
        = pendingPayments[paymentSucceeded.transactionId];
    delete pendingPayments[paymentSucceeded.transactionId]
  }
}

module.exports = Payment;