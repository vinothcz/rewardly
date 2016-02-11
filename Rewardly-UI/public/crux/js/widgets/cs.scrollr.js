/*! crux-scrollr - v2.9.2 - 2015-01-23
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />

/**
Addes events and methods to work with the scrollbars of an element. When an element has a horizontal scrollbar and only the top of the element is visible on the screen a second horizontal scrollbar will be attacked to the bottom of the viewport to allow scrolling of the element.

@class Scrollr
@extends Base
@module Widgets

@tests scrollr/index.html
@demo docs/demos/scrollr.jade
**/

(function (window, define, factory, undefined) {
    "use strict";

    if (define !== undefined) {
        define(['./cs.base.js'], factory);
    } else {
        factory();
    }
}(
    this,
    this.define,
    function () {
        "use strict";

        $.widget('crux.scrollr', {
            options: {

                /**
                Callback function when the bottom of the content is reached.

                @property bottom
                @type Function

                @default null
                **/
                bottom: null,

                /**
                Callback function when the right side of the content is reached (for horizontal scrolling).

                @property right
                @type Function

                @default null
                **/
                right: null,

                /**
                Callback function whenever the x-axis (horizontal) is scrolled.

                @property x
                @type Function

                @default null
                **/
                x: null,

                /**
                Callback function whenever the y-axis (vertical) is scrolled.

                @property y
                @type Function

                @default null
                **/
                y: null
            },

            _create: function () {
                this._vars = {
                    bottom: false,
                    inView: false,
                    left: 0,
                    right: false,
                    top: 0
                };

                this._html = {
                    content: $('<div>'),
                    scrollbar: $('<div>')
                };

                this._html.scrollbar.width(this.element[0].clientWidth).css({
                    position: 'fixed',
                    bottom: 15,
                    left: 0,
                    overflowX: 'scroll',
                    overflowY: 'hidden',
                    zIndex: 100,
                    display: 'none'
                });

                this._html.content.width(this.element[0].scrollWidth).height(20).appendTo(this._html.scrollbar);

                this._attachEvents();
                this._testScroll();
            },

            _attachEvents: function () {
                this._on(this.element, {
                    scroll: '_triggerEvents'
                });

                this._on(this._html.scrollbar, {
                  scroll: '_scrollElement'
                });

                this._on(window, {
                  scroll: '_testScroll'
                });
            },

            _scrollElement: function () {
                this.element[0].scrollLeft = this._html.scrollbar[0].scrollLeft;
            },

            _scrollScrollbar: function () {
                this._html.scrollbar[0].scrollLeft = this.element[0].scrollLeft;
            },

            _triggerEvents: function () {
                var element = this.element[0],
                    bottom, right;

                bottom = (element.scrollHeight - 1 <= element.clientHeight + element.scrollTop) && element.scrollHeight > element.clientHeight;
                right = (element.scrollWidth === element.clientWidth + element.scrollLeft) && element.scrollWidth > element.clientWidth;

                if (bottom && !this._vars.bottom) {
                    this._trigger('bottom');
                    this._vars.bottom = true;
                } else if (!bottom) {
                    this._vars.bottom = false;
                }

                if (right && !this._vars.right) {
                    this._trigger('right');
                    this._vars.right = true;
                } else if (!right) {
                    this._vars.right = false;
                }

                if (this._vars.left !== element.scrollLeft) {
                    this._trigger('x');
                    this._vars.left = element.scrollLeft;
                }

                if (this._vars.top !== element.scrollTop) {
                    this._trigger('y');
                    this._vars.top = element.scrollTop;
                }
            },

            _testScroll: function () {
                if (Math.floor(this.element[0].scrollWidth) <= Math.floor(this.element[0].clientWidth + 1)) {
                    return;
                }

                var that = this,
                    element = this.element,
                    scrollbar = this._html.scrollbar,
                    w = $(window),
                    win = {
                        top: parseInt(w.scrollTop(), 10),
                        bottom: parseInt(w.scrollTop() + w.height(), 10)
                    },
                    offset = {
                        top: parseInt(element.offset().top, 10) + 40,
                        bottom: parseInt(element.offset().top + element.outerHeight(), 10) - 15
                    };

                if ((offset.top < win.bottom) && (offset.bottom > win.bottom) && !this._vars.inView) {
                    scrollbar
                        .insertBefore(element)
                        .css({
                            left: element.offset().left
                        })
                        .fadeIn(100);

                    this._delay(function () {
                        scrollbar[0].scrollLeft = element[0].scrollLeft;
                    }, 0);

                    this._on(scrollbar, {
                        scroll: this._scrollElement
                    });

                    $(element).on('scroll.float', $.proxy(this._scrollScrollbar, this));

                    this._vars.inView = true;

                } else if (((offset.bottom < win.bottom) || (offset.top > win.bottom)) && this._vars.inView) {
                    scrollbar.fadeOut(100, $.proxy(function () {
                        scrollbar.detach();
                        $(element).off('scroll.float');
                        this._off(scrollbar, 'scroll');
                        this._vars.inView = false;
                    }, this));
                }
            },

            /**
            Return the X and Y values of the scrollbars.

            @method get

            @param {Boolean} [content] If true the values of the viewable area, not the scrollbar, are returned.
            */
            get: function (content) {
                return {
                    x: this.element[0].scrollLeft,
                    y: this.element[0].scrollTop
                };
            },

            /**
            Scrolls the content area based on the provided value. The value can be a number or string.
            <pre>
            <code>
            $('.example').scrollr('scroll', 200);

            //or
            $('.example').scrollr('scroll', 'bottom'); //Accepts: top, middle, bottom

            //or
            $('.example').scrollr('scroll', '50%');
            </code>
            </pre>

            <i>This method differs from the {{#crossLink "Scrollr/contentscroll"}}{{/crossLink}} method in that the calculations are based on the height of the scroll bar.</i>

            @method scroll

            @param {Number | String} value The position to scroll to (based on the scroll bar).
            @param {String} [axis] The axis that is scrolled. Can be either <code>x</code> or <code>y</code>.
            **/

            scroll: function (val, axis) {
                if (val === undefined) {
                    return;
                }

                var x = axis && axis.toLowerCase() === 'x';

                if (typeof val === 'string') {
                    var clientDimension = (x ? 'clientWidth' : 'clientHeight'),
                        scrollDimension = (x ? 'scrollWidth' : 'scrollHeight'),
                        points = {
                            'top': '0%',
                            'left': '0%',
                            'middle': '50%',
                            'bottom': '100%',
                            'right': '100%'
                        };

                    val = points[val] || val;

                    if (val.indexOf('%') !== -1) {
                        val = (this.element[0][scrollDimension] - this.element[0][clientDimension]) * (parseFloat(val) / 100);
                    } else {
                        val = parseFloat(val);
                    }
                }

                this.element[x ? 'scrollLeft' : 'scrollTop'].call(this.element, val);
            },


            /**
            Scrolls the content area based on the provided value. The value can be a number or string.
            <pre>
            <code>
            $('.example').scrollr('contentscroll', 200);
            //or
            $('.example').scrollr('contentscroll', 'bottom'); //Accepts: top, middle, bottom
            //or
            $('.example').scrollr('contentscroll', '50%');
            </code>
            </pre>

            <i>This method is different from the {{#crossLink "Scrollr/scroll"}}{{/crossLink}} method in that the calculations are based on the scrollable area, not the scrollbar.</i>

            @method contentscroll

            @param {Number | String | jQuery Object} val The position to scroll to (based on the content area).
            @param {String} [axis] The axis that is scrolled. Can be either <code>x</code> or <code>y</code>.
            **/

            contentscroll: function (val, axis) {
                if (val === undefined) {
                    return;
                }

                var x = axis && axis.toLowerCase() === 'x';

                var self = this,
                    timer = null,
                    pos, height, elHeight;

                if (val.constructor === $) {
                    val = this.element[0][x ? 'scrollLeft' : 'scrollTop'] + val.position()[x ? 'left' : 'top'];
                    //val = Math.abs(val.position()[x ? 'left' : 'top']);
                }

                this.scroll(val, axis);
            },

            /**
            Resizes the scrollbar width and height based on the available space for the scrollbars and the handle based the content in the scrollable area.

            If the available area for the scrollbars is wide or tall enough that the scrollbars are no longer needed they are disabled and detached from the DOM.

            * This method is no longer needed. It has been deprected and only returns the jQuery element. *

            @method resize
            @deprecated
            **/
            resize: function () {
                return this.element;
            },

            _destroy: function () {
                this._html.scrollbar.remove();
                this._off(window, 'scroll');
            }
        });
    }
));
