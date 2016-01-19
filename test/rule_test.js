/*jslint node:true */
"use strict";

function fib(n) {
    if (n === 1) {
        return 1;
    }
    return n + fib(n-1);
}
module.exports = {
    'Test Debugging w/ recursion': function (test) {
        var actual = fib(5);
        test.expect(1);
        test.ok(actual === 8);
        test.done();
    }
};