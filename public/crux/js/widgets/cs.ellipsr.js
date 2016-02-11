/*! crux-ellipsr - v2.9.1 - 2015-01-23
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />

/*global CRUX, _ */

/**
Takes a long <em>single line</em> of text and inserts an ellipses (...) into the center to shrink the text so it fits within available dimesions of it's parent element. Hovering over an ellipsed item will show the full string.

@class Ellipsr
@extends Base
@requires CRUX.Visibility
@module Widgets

@tests ellipsr/ellipsr.html
@demo docs/demos/ellipsr.jade
**/

(function (window, define, factory, undefined) {
    "use strict";

    if (define !== undefined) {
        define(['./cs.visibility.js','./cs.base.js', './cs.jquery.js'], factory);
    } else {
        factory(CRUX.Visibility);
    }
}(
    this,
    this.define,
    function (visibility) {
        "use strict";

        var Namespace = 'cs-ellipsr-',

        Css = {
            full: Namespace + 'full',
            hidden: Namespace + 'hidden'
        },

        Points = {
            left: 0,
            center: 0.5,
            right: 1
        },

        Resize = (function () {
            var instance;

            function Resize() {
                var list = [];

                function test() {
                    var length = list.length,
                        item;

                    while (length) {
                        --length;
                        item = list[length];

                        if (!item.e.closest('html').length) {
                            list.splice(length, 1);
                            continue;
                        }

                        if (item.e.is(':visible')) {
                            item.c.resize();
                        }
                    }

                    if (list.length === 0) {
                        $(window).off('resize.ellipsrwindow');
                    }
                }

                function add(element, context) {
                    list.push({
                        e: element,
                        c: context
                    });

                    if (list.length === 1) {
                        $(window).on('resize.ellipsrwindow', _.throttle(test, 100));
                    }
                }

                function remove(element) {
                    var length = list.length;

                    if (!length || !element) {
                        return;
                    }

                    while (length) {
                        --length;

                        if (element.is(list[length].e)) {
                            list.splice(length, 1);
                        }
                    }

                    if (list.length === 0) {
                        $(window).off('resize.ellipsrwindow');
                    }
                }

                return {
                    add: add,
                    remove: remove
                };
            }

            if (instance) {
                return instance;
            }
            instance = new Resize();

            return instance;
        }());

        $.widget('crux.ellipsr', {
            options: {

                /**
                The alignment of the popover that shows the full text string. Values can be <code>left</code>, <code>center</code> or <code>right</code>.

                @property overlay
                @type String

                @default "left"
                **/
                overlay: 'left',

                /**
                The position to insert the replacement for the text. It can be a string of <code>left</code>, <code>center</code> or <code>right</code>. It could also be a string containing a percent - "50%".

                It could also be a Number. When you use a number the behavior is different depending on if the ellipsed text is a single word or multiple words. If it is a single word the number corresponds to the character where you want to start replacing text. If it is multiple words the number corresponds to the word where you want to start replacing text.

                @property position
                @type {string | Number}

                @default "center"
                **/
                position: 'center',

                /**
                The string to replace the removed characters with.

                @property replace
                @type String

                @default "&hellip;"
                **/
                replace: '&hellip;',

                /**
                Automatically adjust the number of characters replaced by the ellipr as the parent element changes size.  This can <b>not</b> be changed after initialization.

                @property resize
                @type Boolean

                @default false
                **/
                resize: false,

                /**
                The amount of time (in milliseconds) before the full string is shown. This can <b>not</b> be changed after initialization.

                @property showdelay
                @type Number

                @default 300
                **/
                showdelay: 300,

                /**
                When hovering over the ellipsed element show the full text.

                @property showfull
                @type Boolean

                @default true
                **/
                showfull: true
            },

            _create: function () {
                this._vars = {
                    back: '',
                    front: '',
                    inserted: false,
                    point: null,
                    text: ''
                };

                this._html = {
                    popover: $('<span></span>', {
                        'class': Css.full
                    }),
                    text: null
                };

                this.element.addClass(Css.hidden);
                visibility.add(this.element, this._start, this);
            },

            _start: function () {
                this._vars.text = $.trim(this.element.text());

                this.element.wrapInner('<span />');
                this._html.text = this.element.children('span');

                // Append to body to prevent container stretching or cutting off inside of scrollable areas
                $('body').append(this._html.popover.text(this._vars.text));

                this._parse();

                if (this._html.popover[0].scrollWidth > this.element.innerWidth()) {
                    this.resize();
                }

                if (this.options.resize) {
                    Resize.add(this.element, this);
                }

                if (this.options.showfull) {
                    this._attachEvents();
                }
            },

            _setOption: function (key, value) {
                var options = this.options;

                this._super(key, value);

                switch (key) {
                case 'resize':
                    if (value) {
                        Resize.add(this.element, this);
                    } else {
                        Resize.remove(this.element);
                    }
                    break;

                case 'showfull':
                    if (value) {
                        this._attachEvents();
                    } else {
                        this._off(this.element);
                        this._off(this._html.popover);
                    }
                    break;
                }
            },

            _setPosition: function (length) {
                var point = Points[this.options.position],
                    pos;

                if (point) {
                    return Math.ceil(length * point);
                }

                pos = parseInt(this.options.position, 10);
                if (typeof this.options.position === 'string' && this.options.position.indexOf('%') > 0) {
                    pos = pos < 0 ? 0 : pos > 100 ? 100 : pos;
                    point = Math.ceil(length * (pos / 100));
                }

                if (!point) {
                    point = pos < 0 ? 0 : pos > length ? length : pos;
                }

                return point;
            },

            _parse: function () {
                var space = this._vars.text.indexOf(' ') > -1 ? ' ' : '',
                    split = this._vars.text.split(space),
                    point = this._setPosition(split.length);

                this._vars.front = split.slice(0, point).join(space);
                this._vars.back = split.slice(point).join(space);
            },

            /**
            Resizes the ellipsed string based on the parent width.

            @method resize
            **/
            resize: function () {
                var front = this._vars.front,
                    back = this._vars.back,
                    text = this._vars.text;

                while (this._html.popover[0].scrollWidth > this.element.innerWidth()) {
                    if (back.length > front.length && back.length > 2) {
                        back = back.substring(1);
                    } else if (front.length > 2) {
                        front = front.substring(0, front.length - 1);
                    } else {
                        break;
                    }
                    text = front + this.options.replace + back;
                    this._html.popover.html(text);
                }

                this._html.text.html(text);
                this._html.popover.text(this._vars.text);
            },

            /**
            Updates the text in the ellipsed element to the provided string and resizes it. If no string is provided this method is analogous to the {{#crossLink "Ellipsr/resize"}}{{/crossLink}} method.

            @method update
            @param {String} [text] The new text for the ellipsed element.
            **/
            update: function (text) {
                if (text !== undefined) {
                    this._vars.text = $.trim(text);
                    this._html.popover.text(this._vars.text);
                    this._html.text.text(text);
                    this._parse();
                }

                this.resize();
            },

            _attachEvents: function () {
                var openTimer;

                this._on(this.element, {
                    mouseenter: function () {
                        openTimer = this._delay('show', this.options.showdelay);
                    },
                    mouseleave: function (e) {
                        clearTimeout(openTimer);
                    }
                });

                this._on(this._html.popover, {
                    mouseleave: 'hide',
                    click: $.proxy(function (e) {
                        e.preventDefault();
                        
                        // Trigger click event on original object in case we're nested
                        // under an anchor, then kill the event to prevent double-bubbling.
                        this.element[0].click();

                        e.stopPropagation();
                    }, this)
                });
            },

            /**
            Shows the full string. If the full string is already visible the popover will not show up.

            @method show
            **/
            show: function () {
                if ($.trim(this._html.text.text()) === this._vars.text) {
                    return;
                }

                this._html.popover.position({
                    my: this.options.overlay + ' center',
                    at: this.options.overlay + ' center',
                    of: this.element,
                    collision: 'fit'
                }).visible();
            },

            /**
            Hides the full string.

            @method hide
            **/
            hide: function () {
                this._html.popover.hidden();
            },

            _destroy: function () {
                this._html.popover.remove();
                this.element.removeClass(Css.hidden).html(this._vars.text);
                if (this.options.resize) {
                    Resize.remove(this.element);
                }
            },

            widget: function () {
                return this._html.popover;
            }
        });
    }
));
