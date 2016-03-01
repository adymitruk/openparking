var stripe = require('stripe');

function Stripe(appBaseUrl, secretKey, publishableKey) {
  this._appBaseUrl = appBaseUrl;
  this._publishableKey = publishableKey;
  this._installed = false;
  this._stripe = stripe(secretKey);
  this._transactions = {};
  this._transactionHandlers = {};
}

Stripe.prototype.registerTransaction = function(trx, handler) {
  this._transactions[trx.transactionId] = trx;
  this._transactionHandlers[trx.transactionId] = handler;
};

Stripe.prototype.unregisterTransaction = function(trx) {
  delete this._transactions[trx.transactionId];
  delete this._transactionHandlers[trx.transactionId];
};

Stripe.prototype.createPaymentUrl = function(transactionId) {
  return [
      this._appBaseUrl, 'stripe/pay',
      encodeURIComponent(transactionId)
  ].join('/')
};

Stripe.prototype.wireUp = function(app) {
  if (this._installed) return;

  app.get('/stripe/pay/:transactionId', this._handlePay.bind(this));
  app.post('/stripe/charge', this._handleCharge.bind(this));

  this._installed = true;
};

Stripe.prototype._handlePay = function(req, res) {
  var trx = this._transactions[req.params.transactionId];
  if (!trx) {
    res.status(400).send(msgPage('Invalid arguments'));
    return;
  }
  var amount = parseInt(parseFloat(trx.amount) * 100);
//TODO: extract to handlebars view
  res.status(200).send('<!DOCTYPE html>\
<html>\
<head>\
<meta name="viewport" content="width=device-width, initial-scale=1"/>\
</head>\
<body>\
' + trx.description + '<br/>\
for ' + trx.amount + ' ' + trx.currency + '<br/>\
<form class="pay-form" action="/stripe/charge" method="POST">\
  <script\
    src="https://checkout.stripe.com/checkout.js" class="stripe-button"\
    data-key="' + this._publishableKey + '"\
    data-amount="' + amount + '"\
    data-locale="auto">\
  </script>\
  <input name="transactionId" type="hidden" value="' + req.params.transactionId + '">\
  <input name="returnUrl" type="hidden" value="' + trx.returnUrl + '">\
</form>\
</body>\
</html>');
};

function msgPage(msg) {
  //TODO: extract to handlebars view
  return '<!DOCTYPE html>\
<html>\
<head>\
<meta name="viewport" content="width=device-width, initial-scale=1"/>\
</head>\
<body>' + msg + '</body>\
<html>';
}

Stripe.prototype._handleCharge = function(req, res) {
  var trx = this._transactions[req.body.transactionId];
  if (!trx) {
    res.status(400).send(msgPage('Invalid arguments'));
    return;
  }

  var handler = this._transactionHandlers[req.body.transactionId];
  if (!handler) {
    console.log('No handler for this transactionId.', req.body);
    res.status(400).send(msgPage('Sorry, your payment could not be processed.'));
    return;
  }

  var amount = parseInt(parseFloat(trx.amount) * 100);
  var stripeToken = req.body.stripeToken;
  this._stripe.charges.create({
    amount: amount,
    currency: trx.currency,
    source: stripeToken,
    description: trx.description
  }, function(err, charge) {
    if (err) {
      // The card has been declined or something else happened
      console.log('processing error:', err);
      handler(req.body.transactionId, false, function(err, response) {
        if (err) {
          console.log('ERROR:', err);
          res.render('500.html', {error: err});
          return;
        }
        res.render('stripe/denied.html', response);
      });
    }
    else {
      handler(req.body.transactionId, true, function(err, response) {
        if (err) {
          console.log('ERROR:', err);
          res.render('500.html', {error: err});
          return;
        }
        res.render('stripe/success.html', response);
      });
    }
  });
};


module.exports = function(appBaseUrl, secretKey, publishableKey) {
  return new Stripe(appBaseUrl, secretKey, publishableKey);
};