var uuid = require('uuid');

function PaymentInitiated(sourceEvent) {
  this.version = '1.0.0';
  this.id = uuid.v4();
  this.merchantId = sourceEvent.merchantId;
  this.itemDescription = sourceEvent.itemDescription;
  this.itemId = sourceEvent.itemId;
  this.itemCost = sourceEvent.itemCost;
  this.currency = sourceEvent.currency;
  this.transactionId = sourceEvent.transactionId;
  this.providerName = sourceEvent.providerName;
}

module.exports = PaymentInitiated;