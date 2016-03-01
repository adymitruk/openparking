var uuid = require('uuid');

function InitiatePayment(item) {
  this.itemId = item.id;
  this.itemDescription = item.description;
  this.itemCost = item.cost;
  this.transactionId = uuid.v4();
}

module.exports = InitiatePayment;