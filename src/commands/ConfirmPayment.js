function ConfirmPayment(transactionId, success){
  this.transactionId = transactionId;
  this.success = success;
}

module.exports = ConfirmPayment;