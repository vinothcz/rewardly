/*! crux-core - v2.9.1 - 2015-01-22
* Copyright (c) 2015 Advisory Board Company; */

/**
@module CrUX
**/

/**
Root object that contains all CrUX specific methods and variables. Used to prevent namespace pollution.

@class CRUX
**/

(function (factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'moment'], factory);
    } else {
        factory(jQuery);
    }

}(function ($) {
    'use strict';

    var CRUX = {};

    /**
    The base z-index for popovers

    @property zIndexBase
    @type Integer
    @final
    **/
    CRUX.zIndexBase = 100;

    /**
    The current z-index value. This number is incremented by one each time a popover is created.

    @property zIndexCurrent
    @type Integer

    @default 100
    **/
    CRUX.zIndexCurrent = (function () {
        var zIndex = CRUX.zIndexBase;

        $('body *').each(function () {
            zIndex = Math.max(zIndex, $(this).css('z-index')) || zIndex;
        });

        return zIndex;
    }());


    /**
    Takes a string and converts it to a function provided it exists within the context (default is window) specified. The string can be namespaced, for example:

    <code>
    "CRUX.stringToFunction"
    </code>

    Once found the function still needs to be invoked.

    @method stringToFunction
    @param {String} name The name of the function to be executed
    @return {Function} The Function definition
    **/
    CRUX.stringToFunction = function (name) {
        var context = CRUX.stringToObject(name);

        if (typeof context !== 'function') {
            context = null;
        }

        return context;
    };

    /**
    Takes a string and converts it to an object provided it exists within the context (default is window) specified. The string can be namespaced, for example:

    <code>
    "CRUX.stringToObject"
    </code>

    @method stringToObject
    @param {String} name The name of the object
    @return {Object} The object definition
    **/
    CRUX.stringToObject = function (name, context) {
        var namespaces = name.split('.'),
            length = namespaces.length,
            i = 0;

        context = context || window;

        for (i; i < length; i += 1) {
            if (!context) {
                break;
            }
            context = context[namespaces[i]];
        }

        return context;
    };

    CRUX.guid = function () {
        /*jshint bitwise:false */
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c === 'x' ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    };

    /**
    Takes a date string from a return MVC.NET Ajax result and converts it to a formatted date.

    @method ParseDate
    @param {Date | String} date The date
    @param {String} [format="MM/DD/YYYY"] The format for the date. See <a href="http://momentjs.com/docs/#/displaying/format/" target="_blank">Moment.js</a> for formatting options.
    @return {String} A formatted date
    **/
    CRUX.ParseDate = function (date, format) {
        return moment(date).format(format || 'MM/DD/YYYY');
    };

    /**
    Creates a function that will delay the execution of `func` until after `wait` milliseconds have elapsed since the last time it was invoked. Passing `immediate` as true indicates that `func` should be invoked on the leading edge of the `wait` timeout.

    @method Debounce
    @param {Function} func The function to debounce.
    @param {Number} wait The number of milliseconds to delay.
    @param {Boolean} immediate Specifies execution should take place on the leading edge of the timeout.
    @return {Function} The debounced function.
    **/
    CRUX.Debounce = function (func, wait, immediate) {
      var tId;

      return function () {
        var context = this, args = arguments,
            callNow = immediate && !tId,
            later = function () {
              tId = null;
              if (!immediate) {
                func.apply(context, args);
              }
            };

        clearTimeout(tId);
        tId = setTimeout(later, wait);
        if (callNow) {
          func.apply(context, args);
        }
      };
    };

    if (typeof define === 'function' && define.amd) {
        return CRUX;
    } else {
        window.CRUX = CRUX;
    }
}));
