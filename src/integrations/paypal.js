//TODO: update this integration to latest interface
var https = require('https'),
    querystring = require('querystring');

function PayPal(appBaseUrl, sandbox) {
  this._installed = false;
  this._appBaseUrl = appBaseUrl;
  this._baseUrl = ['https://www', sandbox?'.sandbox':'', '.paypal.com/cgi-bin/webscr'].join('');
  this._transactionHandlers = {};
}

PayPal.prototype.registerTransactionNotificationHandler = function(trxId, handler) {
  this._transactionHandlers[trxId] = handler;
};

PayPal.prototype.unregisterTransactionNotificationHandler = function(trxId) {
  delete this._transactionHandlers[trxId];
};

PayPal.prototype.wireUp = function(app) {
  if (this._installed) return;

  app.get('/paypal/ipn', this._handleInstantPaymentNotification.bind(this));
  this._installed = true;
};

PayPal.prototype.createPaymentUrl = function(paymentInitiatedEvent) {
  var businessEmail = paymentInitiatedEvent.merchantId,
      itemName = paymentInitiatedEvent.itemDescription,
      itemNumber = paymentInitiatedEvent.itemId,
      amount = paymentInitiatedEvent.itemCost,
      currencyCode = paymentInitiatedEvent.currency,
      transactionId = paymentInitiatedEvent.transactionId;

  return [
      this._baseUrl + '?cmd=_xclick',
      '&business=', encodeURIComponent(businessEmail),
      '&item_name=', encodeURIComponent(itemName),
      '&item_number=', encodeURIComponent(itemNumber),
      '&amount=', encodeURIComponent(amount),
      '&currency_code=', encodeURIComponent(currencyCode),
      '&custom=', encodeURIComponent(transactionId),
      '&notify_url=', encodeURI(this._appBaseUrl + '/paypal/ipn')
  ].join('');
};

PayPal.prototype._verifyWithPayPal = function(qs, cb) {
  var validateIpnUrl = this._baseUrl + '?cmd=_notify-validate&' + qs;
  try {
    https.get(validateIpnUrl, function (res) {
      var response = '';
      res.on('data', function (c) {
        response += c.toString();
      });
      res.on('end', function () {
        if (response === 'VERIFIED') {
          return cb(null, true);
        } else {
          return cb(null, false);
        }
      });
    });
  } catch(e) {
    cb(e);
  }
};

PayPal.prototype._handleInstantPaymentNotification = function(req, res) {
  var self = this;
  var qs = req.url.split('?')[1];
  this._verifyWithPayPal(qs, function(err, verified) {
    if (err) {
      res.status(500).end(err.message);
      return;
    }
    if (!verified) {
      console.log('Unverified IPN received.', req.query);
      return;
    }
    var trxId = req.query.custom;
    var status = req.query.payment_status;
    var handler = self._transactionHandlers[trxId];
    if (!handler) {
      console.log('No handler registered for transaction', trxId);
      return;
    }
    if (status === 'completed') return handler(trxId, true);
    if (status === 'denied') return handler(trxId, false);
    console.log('Received unknown payment status', status, 'for transaction', trxId);
  });
};

module.exports = function(appBaseUrl, sandbox) {
  return new PayPal(appBaseUrl, sandbox);
};