/*! crux-tooltip - v2.9.1 - 2015-01-23
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />
/// <reference path="cs.popover.js" />

/**
Tooltips are an extension to the {{#crossLink "Popover"}}{{/crossLink}} widget. Any option, method or event available in popover is also available to you with Tooltip. Tooltips can be attached to any element and can be configured to show on hover or click. Tooltips are generated on the fly the first time the tooltip is meant to be displayed. This will improve the performance of the browser on pages that have a large number of tooltips. The tooltip uses collision detection to determine if it is going to appear outside the bounds of the window. If it does, the tooltip will automatically adjust position (not size) to fit within the bounds of the window.

@class Tooltip
@extends Popover
@module Widgets

@tests tooltip/tooltip.html
@demo docs/demos/tooltip.jade
**/

(function (window, define, factory, undefined) {
    "use strict";

    if (define !== undefined) {
        define(['./cs.base.js', './cs.jquery.js', './cs.spinner.js', './cs.popover.js'], factory);
    } else {
        factory();
    }
}(
    this,
    this.define,
    function () {
        "use strict";

        var Namespace = 'cs-tooltip-',
            Css = {
                body: Namespace + 'body',
                open: Namespace + 'open',
                title: Namespace + 'title',
                wrapper: Namespace + 'wrapper'
            };

        $.widget('crux.tooltip', $.crux.popover, {
            options: {
                /**
                The event that triggers showing and hiding of the tooltip. Accepts <code>hover</code> and <code>click</code>. The <code>showdelay</code> and <code>hidedelay</code> properties only take effect when using <code>hover</code>.

                @property event
                @type String

                @default "hover"
                **/
                event: 'hover',

                /**
                The time (in milliseconds) to delay hiding of the tooltip. This timer starts after mousing away from the element that created the tooltip or mousing away from the tooltip itself. During the delay, if the user mouses over the tooltip (again) the timer will be cleared and the tooltip will not be hidden until the user mouses away again.

                @property hidedelay
                @type Number

                @default 300
                **/
                hidedelay: 300,

                /**
                The time (in milliseconds) to delay showing of the tooltip. This timer starts after mousing over the element will create the tooltip. If you mouse away from the element the timer will be stopped and the tooltip will not be shown. This is used to prevent the tooltip from being created needlesly if the user mouses over a tooltip element to get to another section of the page.

                @property showdelay
                @type Number

                @default 300
                **/
                showdelay: 300,

                /**
                The title for the tooltip. If provided as a function the returned value of the function will be the title.

                @property title
                @type {jQuery Object | String | Function}

                @default null
                **/
                title: null
            },

            _create: function () {
                this._vars = {
                    closeTimer: null,
                    openTimer: null
                };

                this._html = {
                    tooltip: {
                        title: null,
                        content: null
                    }
                };

                this._attachEvents();
                this._super();
            },

            _checkAutoshow: function () {
                if (this.options.autoshow && this.options.event === 'hover') {
                    this._vars.openTimer = this._delay('show', this.options.showdelay);
                } else {
                    this._super();
                }
            },

            _attachEvents: function () {
                if (this.options.event === 'hover') {
                    this._on(this.element, {
                        mouseenter: function () {
                            clearTimeout(this._vars.closeTimer);
                            this._vars.openTimer = this._delay('show', this.options.showdelay);
                        },
                        mouseleave: function () {
                            clearTimeout(this._vars.openTimer);
                            if (this._vars.isBuilt) {
                                this._vars.closeTimer = this._delay('hide', this.options.hidedelay);
                            }
                        }
                    });
                } else if (this.options.event === 'click') {
                    this._on(this.element, {click: 'show'});
                }
            },

            _attachPopoverEvents: function () {
                var self = this;

                this._on(this._html.popover.wrapper, {
                    mouseenter: function () {
                        clearTimeout(this._vars.closeTimer);
                    },
                    mouseleave: function () {
                        this._vars.closeTimer = this._delay('hide', this.options.hidedelay);
                    }
                });
            },

            _getContent: function () {
                if (this.options.title) {
                    this._getTitle();
                }

                this._super();
            },

            _setContent: function (content) {
                var tooltipContent = this._html.tooltip.content.empty();

                if (!content) {
                    tooltipContent.spin();
                } else {
                    if (tooltipContent.data('spinner')) {
                        tooltipContent.spin('destroy');
                    }
                    tooltipContent.append(content);
                }

                this._open();
            },

            _getTitle: function () {
                var content,
                    that = this,
                    optionsTitle = this.options.title;

                if (typeof optionsTitle === 'string' || optionsTitle instanceof jQuery) {
                    return this._setTitle(optionsTitle);
                }

                content = optionsTitle.call(this.options.target[0], function (response) {
                    if (!that._vars.isVisible) {
                        return;
                    }

                    that._delay(function () {
                        this._setTitle(response);
                    });
                });

                this._setTitle(content);
            },

            _setTitle: function (content) {
                this._html.tooltip.title.empty().append(content);
            },

            _build: function () {
                this._super();

                if (this.options.title) {
                    this._html.tooltip.title = $('<div>', {
                        'class': Css.title
                    })
                    .appendTo(this._html.popover.content);
                }

                this._html.tooltip.content = $('<div>', {
                    'class': Css.body
                })
                .appendTo(this._html.popover.content);

                if (!this.options.sticky && this.options.event === 'hover') {
                    this._attachPopoverEvents();
                }
            },

            widget: function () {
                return this._html.tooltip.content;
            }
        });
    }
));
