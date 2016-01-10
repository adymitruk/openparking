"use strict";

function Money(amount) {
    this.amount = amount;
}

Money.prototype.valueOf = function() {
    return Math.round(this.amount*100)/100;
};

module.exports = Money;

