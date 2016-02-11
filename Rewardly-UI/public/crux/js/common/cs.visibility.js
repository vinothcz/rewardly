/*! utils-visibility - v2.9.1 - 2015-01-23
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

    if (typeof define === "function" && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(jQuery);
    }

}(function ($) {
    'use strict';

    /**
    Adds an element to a queue and tests if it is visible. Once the element becomes visible the provided callback is executed and the element is removed from the queue. The Visibility function automatically begins when the first element is added and ends when there are no longer elements to test.

    @class CRUX.Visibility
    @constructor
    **/
    var Visibility = (function () {
        var instance;

        function Visibility() {
            var list = [];

            function test() {
                var length = list.length,
                    i = 0,
                    item;

                for (i = length - 1; i >= 0; i -= 1) {
                    item = list[i];

                    if ($(item.e).is(':visible')) {
                        item.m.call(item.c);
                        list.splice(i, 1);
                        continue;
                    }

                    if (!$(item.e, document.body).length) {
                        list.splice(i, 1);
                    }
                }

                if (list.length) {
                    setTimeout(test, 35);
                }
            }

            /**
            Add an element to be tested for visibility

            @method add
            @param {HTMLElement | jQuery Object} element The DOM node to be tested.
            @param {Function} method The callback function that is executed when the elemtn becomes visible.
            @param {Object} [context=window] The context of the 'this' keyword for the callback function
            **/
            function add(element, method, context) {
                if (!element || !method) {
                    return;
                }

                element = element[0] || element;

                if ($(element).is(':visible')) {
                    method.call(context || window);
                    return;
                }

                list.push({
                    e: element,
                    m: method,
                    c: context || window
                });

                if (list.length === 1) {
                    test();
                }
            }

            /**x
            Removes the element from the queue and will no longer be tested for visiblity. If an element has become visible it is automatically removed from the queue.

            @method remove
            @param {HTMLElement} element The DOM node that was supplied in the {{#crossLink "Visibility/add"}}{{/crossLink}} method.
            @param {Function} method The callback function that was supplied in the {{#crossLink "Visibility/add"}}{{/crossLink}} method.
            **/
            function remove(element, method) {
                var length = list.length,
                    i = 0;

                if (!length || !element) {
                    return;
                }

                for (i = length - 1; i >= 0; i -= 1) {
                    if (element === list[i].e) {
                        if (method && method.toString() !== list[i].m.toString()) {
                            continue;
                        }

                        list.splice(i, 1);
                    }
                }
            }

            return {
                add: add,
                remove: remove
            };
        }

        return new Visibility();
    }());

    if (typeof define === "function" && define.amd) {
        return Visibility;
    } else if (window.CRUX) {
        window.CRUX.Visibility = Visibility;
    } else {
        window.Visibility = Visibility;
    }
}));
