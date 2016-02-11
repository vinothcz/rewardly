/*! crux-popover - v2.9.1 - 2015-01-22
* Copyright (c) 2015 Advisory Board Company; */

/// <reference path="cs.base.js" />

/*global CRUX */

/**
Adds a popover window to a targeted DOM element.

Popover is intended to provide base functionality for other widgets such as {{#crossLink "ActionMenu"}}{{/crossLink}} or {{#crossLink "Tooltip"}}{{/crossLink}}. If you just need a popover as a container, first try using {{#crossLink "Tooltip"}}{{/crossLink}}.

When building your own your own widget, you can add popover functionality by adding "$.crux.popover" as an argument to the global widget function:

<pre><code>
$.widget('crux.mynewwidget', $.crux.popover, {...});
</code></pre>

@class Popover
@extends Base
@module Widgets

@demo docs/demos/popover.jade
**/

(function (window, define, factory, undefined) {
    "use strict";

    if (define !== undefined) {
        define(['./cs.base.js', './cs.jquery.js'], factory);
    } else {
        factory();
    }
}(
    this,
    this.define,
    function () {
        "use strict";

        var Namespace = 'cs-popover-',

        Css = {
            content: Namespace + 'content',
            wrapper: Namespace + 'wrapper'
        },

        BottomRight = /bottom|right/i,

        LeftRight = /left|right/i,

        LeftTop = /left|top/i,

        TopBottom = /top|bottom/i,

        Direction = {
            bottom: {
                tip: 'top',
                caret: 'north'
            },
            center: {
                tip: 'left'
            },
            left: {
                tip: 'right',
                caret: 'east'
            },
            middle: {
                tip: 'top'
            },
            right: {
                tip: 'left',
                caret: 'west'
            },
            top: {
                tip: 'bottom',
                caret: 'south'
            }
        },

        adjustPopover = function (dir, size, info) {
            var axis = Direction[dir].tip,
                val = info.element[axis],
                dim;

            if (BottomRight.test(dir)) {
                dim = dir === 'bottom' ? 'height' : 'width';

                if (Math.floor(val + info.element[dim]) < Math.ceil(info.target[axis] + info.target[dim])) {
                    val -= size - 1;
                }

                return val;

            } else if (LeftTop.test(dir)) {
                axis = dir;
                val = info.element[axis];

                if (Math.floor(val) > Math.ceil(info.target[axis])) {
                    val += size - 1;
                }

                return val;
            }

            return val;
        },

        Popovers = $(),

        orphaned = function () {
            var x = Popovers.length,
                pop, $pop;

            while (x) {
                --x;

                pop = Popovers.get(x);
                $pop = $(pop);
                if (!$(document).find($pop.data('owner')).length) {
                    Popovers = Popovers.not(pop);
                    $pop.remove();
                }
            }

            if (Popovers.length) {
                setTimeout(orphaned, 5000);
            }
        };

        $.widget('crux.popover', {
            options: {

                /**
                Show the popover at the same time it is initialized.

                @property autoshow
                @type Boolean

                @default false
                **/
                autoshow: false,

                /**
                The size of the arrow that is connected the popover and points to the target. Available sizes are 4, 6, 8, 10 and 12.

                @property caret
                @type Number

                @default 6
                **/
                caret: 6,

                /**
                Adds additional class name(s) to the wrapper of the popover. This can be used to style the popover in a way other than the default.

                @property classname
                @type String

                @default " "
                **/
                classname: '',

                /**
                What to do with the popover when it encounters the edge of the screen. See <a href="http://api.jqueryui.com/position/" target="_blank">jQuery UI Position</a> for details.

                @property collision
                @type String

                @default "flip"
                **/
                collision: 'flip',

                /**
                The content to be placed inside the popover. If using a function the <code>return</code> value of this function will be what is placed inside the popover.

                <pre><code>
                {
                    content: $('selector')
                }
                //or
                {
                    content: function () {
                        return 'Content';
                    }
                }
                </code></pre>

                When using a function to set the content a second function is passed back as the first parameter. This pass the results of you ajax request in the currying function and the tooltip will be populated using that. There is no need to return a value in this scenario. While the content is loading a loading spinner is automatically added to the ppopover. Once the content appears the popover is automatically re-positioned to the new content.

                <pre><code>
                {
                    content: function ( curry ) {
                        $.ajax({}).done(function ( results ) {
                           curry( results );
                        });
                    }
                }
                </code></pre>

                ** Note: If you are using AJAX content that you want reloaded each time the tooltip is displayed you still need to use the 'dynamic' property.

                @property content
                @type {String | Function | jQuery Object}

                @default null
                **/
                content: null,

                /**
                The direction you want the popover to appear in relation to the target element. The accepted directions are <code>top</code>, <code>right</code>, <code>bottom</code>, and <code>left</code>.

                @property direction
                @type String

                @default "bottom"
                @deprectaed
                **/
                direction: 'bottom',

                /**
                If set to true, the tooltip will get the content new each time it is displayed. This is desireable if your tooltip contains content that can be modified based on settings in Focus or other suchs filters.

                @property dynamic
                @type Boolean

                @default false
                **/
                dynamic: false,

                /**
                The effect you want the popover to use when it appears and disappears. For a list of the available effects see the <a href="http://jqueryui.com/demos/show/" target="_blank">jQuery UI Show documentation</a>. For timing of the effect see the <code>speed</code> parameter. When set to <code>false</code> there is no effect on the popover. It shows/hides instantly.

                @property effect
                @type String

                @default false
                @dperected
                **/
                effect: false,

                /**
                Specifies the height of the popover container, in pixels.

                @property height
                @type Number

                @default null
                **/
                height: null,

                /**
                A function that is called after the popover is hidden.

                @property hide
                @type Function

                @default null
                **/
                hide: null,

                /**
                Hides the popover on click event outside a visible popover.

                @property hideonclick
                @type Boolean

                @default true
                **/
                hideonclick: true,

                /**
                Hides visible popover on ESC key event.

                @property hideonescape
                @type Boolean

                @default true
                **/
                hideonescape: true,

                /**
                Determines where to place the generated HTML for the popover. If set to true, the Popover will be inserted after the element that is attached to the Popover. If false (default) the HTML is appended to the <code>body</code> element.

                @property inline
                @type Boolean

                @default false
                **/
                inline: false,

                /**
                The number of pixels to offset the appearance of the popover. Given in string format where the first number is the left offset and the second number is the top offset. If you want the offset to be the same from the left and top you only have to provide one number. See the <a href="http://jqueryui.com/demos/position/#option-offset" target="_blank">jQuery UI Position</a> documention for more details.

                @property offset
                @type String

                @default " "
                **/
                offset: '',

                /**
                The position of the popover's body in relation to the <code>target</code> element. If the <code>direction</code> is <code>left</code> or <code>right</code> the position can be <code>top</code>, <code>bottom</code> or <code>center</code>. If the {@link .direction} is <code>top</code> or <code>bottom</code> the position can be <code>left</code>, <code>right</code> or <code>center</code>. If you provide a position that is incompatible with the {@link .direction} it will default to <code>center</code>.

                @property position
                @type String

                @default "left"
                **/
                position: 'left',

                /**
                A function hook that is called after the popover has been built but before it is positioned on the screen.

                @property preposition
                @type Function

                @default null
                **/
                preposition: null,

                /**
                A function that is called after the popover is shown.

                @property show
                @type Function

                @default null
                **/
                show: null,

                /**
                The time (in milliseconds) it takes for the popover to show or hide.

                @property speed
                @type Number

                @default 200
                **/
                speed: 200,

                /**
                Specifies the target of the popover. The target is the element on the page that the popover uses to position itself. If left as <code>null</code> the target is the element that gets the initializes the popover. You can specify a jQuery object or CSS selector to set the target.

                @property target
                @type {jQuery Object | CSS Selector}

                @default null
                **/
                target: null,

                /**
                Specifies the width of the popover, in pixels.

                @property width
                @type Number

                @default null
                **/
                width: null,

                /**
                Specifies the <code>z-index</code> CSS property of the Popover. If left as <code>null</code> the Popover's <code>z-index</code> value will be assigned to the global z-index value in CrUX. For each new Popover the CrUX z-index value is incremented by 1.

                @property zindex
                @type Number

                @default null
                **/
                zindex: null
            },

            _create: function () {
                var options = this.options;

                this._html = this._html || {};
                this._vars = this._vars || {};

                $.extend(true, this._html, {
                    popover: {
                        caret: $('<div class="caret' + options.caret + '"><i></i></div>'),
                        content: null,
                        wrapper: null
                    }
                });

                $.extend(true, this._vars, {
                    id: null,
                    isBuilt: false,
                    isVisible: false,
                    open: false,
                    zIndex: options.zindex || (CRUX.zIndexCurrent += 1)
                });

                // Updates for jQuery UI 1.9 - remove once depracated options are removed
                options.open = !options.effect ? null : {
                    effect: options.effect,
                    duration: options.speed
                };
                // end updates


                options.target = options.target === null ? this.element : options.target.constructor === $ ? options.target : this.element.find(options.target);

                this._checkAutoshow();
            },

            _checkAutoshow: function () {
                if (this.options.autoshow) {
                    this.show();
                }
            },

            _build: function () {
                var self = this,
                    popover = this._html.popover,
                    options = this.options;

                popover.wrapper = $('<div>', {
                    'class': Css.wrapper + (options.classname ? ' ' + options.classname : '')
                })
                .css({
                    'z-index': this._vars.zIndex
                })
                .data('owner', this.options.target[0]);

                this._vars.id = popover.wrapper.uniqueId().attr('id');

                if (options.width) {
                    popover.wrapper.width(options.width);
                }

                if (options.height) {
                    popover.wrapper.height(options.height);
                }

                if (options.caret) {
                    popover.wrapper.append(popover.caret);
                }

                popover.content = $('<div>', {
                    'class': Css.content + ' clearfix'
                }).appendTo(popover.wrapper);

                if (options.inline) {
                    this._html.popover.wrapper.insertAfter(this.element);
                } else {
                    this._html.popover.wrapper.appendTo(document.body);
                }

                this._vars.isBuilt = true;

                if (!Popovers.is(popover.wrapper)) {
                    Popovers.push(popover.wrapper[0]);
                }

                if (Popovers.length === 1) {
                    orphaned();
                }

                /**
                Triggered when the popover is first built. This does not correspond with showing the widget.

                If you are binding to this event the widget name is automatically prefixed to the event.

                <pre><code>
                $('.example').on("{widgetname}built", function(event) {});
                </code></code></pre>

                @event built
                **/
                this._trigger('built');
            },

            _getContent: function () {
                var content,
                    that = this,
                    optionsContent = this.options.content;

                if (typeof optionsContent === 'string' || optionsContent instanceof jQuery) {
                    return this._setContent(optionsContent);
                }

                content = optionsContent.call(this.options.target[0], function (response) {
                    if (!that._vars.isVisible) {
                        return;
                    }

                    that._delay(function () {
                        this._setContent(response);
                    });
                });

                this._setContent(content);
            },

            _setContent: function (content) {
                var popoverContent = this._html.popover.content.empty();

                if (!content) {
                    popoverContent.spin({
                        left: 0,
                        top: 0,
                        position: 'relative'
                    });
                } else {
                    if (popoverContent.data('spinner')) {
                        popoverContent.spin('destroy');
                    }
                    popoverContent.append(content);
                }

                this._open();
            },

            _open: function () {
                var popover = this._html.popover.wrapper;

                this._position();

                if (popover.data('popover-visible') !== true) {
                    popover.data('popover-visible', true).hide();
                    this._show(popover, this.options.open);
                }

                if (this.options.hideonescape) {
                    this._on(this.document, {
                        keyup: function (e) {
                            if (e.which === $.ui.keyCode.ESCAPE) {
                                this._close(e);
                            }
                        }
                    });
                }

                if (this.options.hideonclick) {
                    this._delay(function () {
                        this._on(this.document, {click: '_close'});
                    });
                }
                this._on(this.window, {resize: '_close'});

                /**
                Triggered after the popover is shown.

                If you are binding to this event the widget name is automatically prefixed to the event.

                <pre><code>
                $('.example').on("{widgetname}show", function(event) {});
                </code></pre>

                @event show
                **/
                this._trigger('show');
            },

            _position: function () {
                var options = this.options,
                    popover = this._html.popover,
                    offset = (options.offset || '0 0').split(' '),
                    collision = false,
                    difference = 0,
                    my, at;

                function off(adjust) {
                    return adjust < 0 ? adjust : '+' + adjust;
                }

                function pos(left, top) {
                    var tb = TopBottom.test(options.direction);

                    if (tb) {
                        my = [options.position + off(left), Direction[options.direction].tip + off(top)].join(' ');

                        if (!collision) {
                            at = [options.position, options.direction].join(' ');
                        } else {
                            at = [options.position, Direction[options.direction].tip].join(' ');
                        }
                    } else {
                        my = [Direction[options.direction].tip + off(left), options.position + off(top)].join(' ');

                        if (!collision) {
                            at = [options.direction, options.position].join(' ');
                        } else {
                            at = [Direction[options.direction].tip + off(left), options.position].join(' ');
                        }
                    }
                }

                popover.wrapper.show();

                /**
                Triggered just before a popover is positioned on the screen. This event will allow you to manipulate the popover before it get's positioned.

                <pre><code>
                $('.example').bind("{widgetname}preposition", function(event) {});
                </code></pre>

                @event preposition
                **/
                this._trigger('preposition', null, popover.wrapper);

                if (offset.length === 1) {
                    offset.push(offset[0]);
                }

                // set my/at values for container
                pos(offset[0], offset[1]);

                popover.wrapper.position({
                    my: my,
                    at: at,
                    collision: options.collision,
                    of: options.target,
                    using: function (coords, info) {
                        var collisionCheck = TopBottom.test(options.direction) ? 'vertical' : 'horizontal';

                        if (info[collisionCheck] === Direction[options.direction].tip) {
                            collision = false;
                        } else {
                            collision = true;
                        }

                        popover.wrapper.css({
                            left: (!options.caret) ? coords.left : function () {
                                return adjustPopover(info.horizontal, options.caret, info);
                            },
                            top: (!options.caret) ? coords.top : function () {
                                return adjustPopover(info.vertical, options.caret, info);
                            }
                        });
                    }
                });


                // set up offset for caret
                if (TopBottom.test(options.direction)) {
                    if (options.position === 'left') {
                        offset[0] = 10;
                    } else if (options.position === 'right') {
                        offset[0] = -10;
                    } else {
                        offset[0] = 0;
                    }

                    offset[1] = Number(offset[1]);

                    if (collision) {
                        if (options.direction === 'top') {
                            difference = popover.wrapper.position().top - options.target.position().top - options.target.innerHeight();
                            offset[1] += (offset[1] * -1) + (difference - 1);
                        } else {
                            difference = options.target.position().top - popover.wrapper.position().top - popover.wrapper.innerHeight();
                            offset[1] += (offset[1] * -1) - (difference + 1);
                        }
                    }
                } else if (LeftRight.test(options.direction)) {
                    if (options.position === 'top') {
                        offset[1] = 10;
                    } else if (options.position === 'bottom') {
                        offset[1] = -10;
                    } else {
                        offset[1] = 0;
                    }

                    offset[0] = Number(offset[0]);

                    if (collision) {
                        if (options.direction === 'left') {
                            difference = popover.wrapper.position().left - options.target.position().left - options.target.innerWidth();

                            offset[0] += (offset[0] * -1) + (difference - 1.75);
                        } else {
                            difference = options.target.position().left - popover.wrapper.position().left - popover.wrapper.innerWidth();
                            offset[0] += (offset[0] * -1) - (difference + 1.75);
                        }
                    }
                }

                // set my/at values for caret
                pos(offset[0], offset[1]);

                if (options.caret) {
                    popover.caret.removeClass('north south east west')
                        .addClass(collision ? Direction[Direction[options.direction].tip].caret : Direction[options.direction].caret)
                        .position({
                            my: my,
                            at: at,
                            collision: 'none',
                            of: options.target,
                            using: function (coords, info) {
                                if (TopBottom.test(options.direction)) {
                                    popover.caret.css({
                                        left: coords.left,
                                        top: coords.top
                                    });
                                } else {
                                    popover.caret.css({
                                        left: collision ? coords.left - offset[0] : coords.left,
                                        top: coords.top
                                    });
                                }
                            }
                        });
                }
            },


            /**
            Positions the popover element.

            @method position
            **/
            position: function () {
                if (this._vars.isVisible) {
                    this._position();
                }

                return this.element;
            },


            /**
            Shows the popover element.

            @method show
            **/
            show: function () {
                if (this._vars.isVisible || this.options.content === null) {
                    return this.element;
                }

                this._vars.isVisible = true;

                if (!this._vars.isBuilt) {
                    this._build();
                    this._getContent();
                } else if (this.options.dynamic) {
                    this._getContent();
                } else {
                    this._open();
                }

                return this.element;
            },

            /**
            Hides the popover element.

            @method hide
            **/
            hide: function () {
                var event = $.Event('click');
                event.target = this.element[0];
                this._close(event, true);
            },

            _close: function (e, force) {
                var target = $(e.target);

                if (!force && (!this._vars.isVisible || (e.type === 'click' && target.closest('#' + this._vars.id).length))) {
                    return this.element;
                }

                if (this._vars.isBuilt) {
                    this._html.popover.wrapper.data('popover-visible', false).hide();
                }

                this._vars.isVisible = false;

                if (this.options.hideonclick || this.options.hideonescape) {
                    $(this.document).unbind(this.eventNamespace);
                }
                $(this.window).unbind(this.eventNamespace);

                /**
                Triggered after the popover is hidden.

                If you are binding to this event the widget name is automatically prefixed to the event.

                <pre><code>
                $('.example').on("{widgetname}hide", function(event) {});
                </code></pre>

                @event hide
                **/
                this._trigger('hide');
            },

            _destroy: function () {
                this.hide();

                if (this._vars.isBuilt) {
                    this._html.popover.wrapper.remove();
                }
            },

            widget: function () {
                if (this._vars.isBuilt) {
                    return this._html.popover.wrapper;
                }

                return this.element;
            }
        });
    }
));
