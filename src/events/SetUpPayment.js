/*jslint node:true */
"use strict";

var uuid = require('uuid');

function SetUpPayment(sourceEvent) {
  this.id = uuid.v4();
  this.version = '1.0.0';
  this.providerName = sourceEvent.providerName;
  this.merchantId = sourceEvent.merchantId;
  this.currency = sourceEvent.currency;
}

module.exports = SetUpPayment;