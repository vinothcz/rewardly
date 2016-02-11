/*! utils-abbreviate - v2.9.1 - 2015-01-23
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="accounting.js" />

/*global accounting */

/**
A number formatting class. The functions here are extensions to the base accounting class. For documentation regarding the base functionality please visit the <a href="http://josscrowcroft.github.com/accounting.js/" target="_blank">accounting.js website</a>.

The additional methods for accounting js format numbers to comply with the <a href="https://fogbugz.devid.local/default.asp?W1374" target="_blank">guidelines</a> set by the User Experience team.

Wherever applicable (dashboards, measure summaries, etc.) number values should be limited to three digits (detailed displays are more appropriate for displaying all digits). This eliminates the need to vary font sizes in order to accommodate larger numbers. The 3-digit number should be wrapped in wrapped in an HTML tag (such as a 'span') and should have a 'title' attribute set to the entire number.

.777 = .777

1.77 = 1.77

17.77 = 17.8

177.77 = 178

1,777.77 = 1.78K

17,777.77 = 17.8K

177,777.77 = 178K

1,777,777.77 = 1.78M

17,777,777.77 = 17.8M

177,777,777.77 = 178M

1,777,777,777.77 = 1.78B

17,777,777,777.77 = 17.8B

177,777,777,777.77 = 178B

Additional points:

* An exception occurs for dollar figures in the 10s: e.g. $33.41
* Although M and MM are the official standards for thousand and million, the abbreviations above are more widely accepted and provide consistent character count
* Always include commas when displaying entire numbers greater than or equal to 1,000
* Wherever applicable, show a value's unit of measurement e.g. 15 days, 4 months, $32.41, 2.98%, etc.
* Zeros should be displayed both for standardization in formatting and alignment. It also eliminates any questions of whether or not rounding has occurred. 6.00 is correct; 6 and 6.0 are not

@class accounting
@tests formatting/index.html

@module CrUX
**/
(function(window, define, factory) {
    'use strict';

    if (define !== undefined) {
        define(['./accounting.js'], factory);
    } else {
        factory(accounting);
    }
}(this, this.define, function (accounting) {
    'use strict';

    var abbreviations = "KMBTPE",
        abbLength = abbreviations.length + 1;

    function shrinkNumber(number, currency) {
        number = accounting.unformat(number);

        var negative = number < 0 ? "-" : "",
            count = abbLength,
            smallCount = 3,
            num, decimal, size, abb = '';

        number = Math.abs(number);

        if (number < 10) {
            number = accounting.toFixed(number, 2);
            abb = '';
        } else if (number < 100) {
            number = accounting.toFixed(number, currency ? 2 : 1);
            abb = '';
        } else if (number < 1000) {
            number = accounting.toFixed(number, 0);
            abb = '';
        }

        while (count && number >= 1000) {
            size = Math.pow(10, (count--) * 3);
            if (size <= number) {
                num = number / size;
                decimal = 3 - (accounting.toFixed(num, 0) + '').length;
                number = accounting.toFixed(num, decimal);
                abb = abbreviations.charAt(count);
                break;
            }
        }

        return [negative, number, abb];
    }
    /**
    Abbreviate a number to the format listed above.

    @method abbrevNumber

    @param {Number} number The number to be formatted
    @return {String} The formatted number.
    */
    function abbreviateNumber(number) {
        var num = shrinkNumber(number).join('');
        return num;
    }

    /**
    Abbreviate a number to the format listed above including a monetary symbol.

    @method abbrevMoney

    @param {Number} number The number to be formatted
    @param {String} [symbol] The monetary symbol to be used. If none is provided it defaults to '$'.
    @return {String} The formatted number.
    */
    function abbreviateMoney(number, symbol) {
        var num = shrinkNumber(number, true).join('');
        return (symbol || accounting.settings.currency.symbol) + num;
    }

    accounting.abbrevNumber = abbreviateNumber;
    accounting.abbrevMoney = abbreviateMoney;

    if (typeof define === "function" && define.amd) {
        return accounting;
    }
}));
