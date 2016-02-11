/*! utils-queue - v2.9.1 - 2015-01-23
* Copyright (c) 2015 Advisory Board Company */

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
        define(['jquery'], factory);
    } else {
        factory(jQuery);
    }

}(function ($) {
    'use strict';

    /**
    Places an object into a queue to be processed sequentially. The queue makes use of jQuery Deferreds to determine when the callback has been completed. This allows the callback to contain asynchronous content and we can be sure the queue is still processed sequentially.

    @class CRUX.Queue
    @constructor
    **/
    var Queue = (function () {
        var instance;

        function Queue() {
            var queue = [],
                queueing = false,
                obj;

            /**
            Add an object into the queue.

            @method add
            @param {Object} object The object to be placed in the queue. The object also provides the context for the 'this' keyworkd when the callback is executed.
            @param {Function} method The callback function.
            @param [arguments]* Any additional parameters you want to pass to the callback
            **/
            function add(object, method) {
                queue.push({
                    _o: object,
                    _m: method,
                    _a: Array.prototype.slice.call(arguments, 2)
                });
            }

            function process() {
                if (queue.length > 0) {
                    queueing = true;

                    obj = queue.shift();
                    $.when(obj._m.apply(obj._o, obj._a)).always(process);
                } else {
                    queueing = false;
                }
            }

            /**
            Starts processing the queue. Unlike the {{#crossLink "Visiblity"}}{{/crossLink}} class this does not start automatically.

            @method start
            **/
            function start() {
                if (!queueing) {
                    process();
                }
            }

            return {
                add: add,
                start: start
            };
        }

        return new Queue();
    }());

    if (typeof define === 'function' && define.amd) {
        return Queue;
    } else if (window.CRUX) {
        window.CRUX.Queue = Queue;
    } else {
        window.Queue = Queue;
    }
}));
