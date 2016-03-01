var uuid = require('uuid');

function PaymentFailed(transactionId, providerName) {
  this.id = uuid.v4();
  this.version = '1.0.0';
  this.providerName = providerName;
  this.transactionId = transactionId;
}

module.exports = PaymentFailed;