var configName = process.argv[2];
var merchantId = process.argv[3];
if (!merchantId || !configName) {
  console.log('Usage:', process.argv[0], process.argv[1], '[configName]', '[merchantId]');
  return;
}

var config = require('../config/' + configName + '.json');
var goesClient = require('./integrations/goesClient')(config.goesUrl);
var when = require('when');

function readStream(aggregateId) {
  return when.promise(function(resolve, reject) {
    goesClient.readStream(aggregateId, function(err, events) {
      if (err) return reject(err);
      console.log('readStream', aggregateId, events);
      resolve(events);
    });
  })
}

function addEvent(aggregateId, event) {
  return when.promise(function(resolve, reject) {
    goesClient.addEvent(aggregateId, event, function(err) {
      if (err) return reject(err);
      console.log('addEvent', aggregateId, event);
      resolve(event);
    })
  })
}

var SetUpPayment = require('./events/SetUpPayment');
var SetRateRule = require('./events/SetRateRule');
var SetUpParking = require('./events/SetUpParking');

function initData(vendorMerchantId) {
  var paypalPayment = new SetUpPayment({
    providerName: 'stripe',
    merchantId: vendorMerchantId,
    currency: 'cad'
  });
  var rateRule = new SetRateRule({
        lotRange: "1000-2000",
        rates: [
          {
            name: "Everyday",
            timeRange: "Mon-Sun, 0900h-2200h",
            ratePerHour: 2,
            granularity: "minutes",
            limitStayInHours: 2,
            limitResetInMins: 30
          }
        ],
        restrictions: [
          {
            name: "Morning Rush Hour",
            timeRange: "Mon-Fri, 0700h-1000h"
          },
          {
            name: "Evening Rush Hour",
            timeRange: "Mon-Fri, 1600h-1800h"
          }
        ]
      }
  );
  var parking = new SetUpParking();
  addEvent(config.paymentId, paypalPayment)
      .then(function() {
        return addEvent(config.ruleId, rateRule);
      })
      .then(function() {
        return addEvent(config.parkingId, parking);
      })
      .then(function() {
        console.log('Done');
        goesClient.close();
      });
}

initData(merchantId);