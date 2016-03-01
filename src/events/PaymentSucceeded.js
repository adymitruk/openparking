var uuid = require('uuid');

function PaymentSucceeded(transactionId, providerName){
  this.version = '1.0.0';
  this.id = uuid.v4();
  this.transactionId = transactionId;
  this.providerName = providerName;
}

module.exports = PaymentSucceeded;