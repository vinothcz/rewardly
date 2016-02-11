/*! crux-actionmenu - v2.9.1 - 2015-01-22
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />
/// <reference path="cs.popover.js" />
/*global CRUX */

/**
Takes a DOM element with embedded list and associated content containers and creates a popover. Clicking each list item in the popover displays the content of the linked container inside an extension of the popover, like an extended drawer.

The content of the menu behaves similarly to that of the typical tab structure. the <code>href</code> of the link in the menu should point to the corresponding content area. If the <code>href</code> points to a hash without and associated ID the widget will look for the <code>data-action</code> attribute and evaluate any code that it contains.

Action Menu uses the {{#crossLink "Popover"}}{{/crossLink}} widget as a base to create the menu and the flyout. Any options, methods, or events available for Popover are available for the Action Menu.

@class ActionMenu
@extends Popover
@module Widgets

@tests actionmenu/actionmenu.html
@demo docs/demos/actionmenu.jade
**/

(function (window, define, factory, undefined) {
    "use strict";

    if (define !== undefined) {
        define(['./cs.base.js', './cs.popover.js'], factory);
    } else {
        factory();
    }
}(
this, this.define, function () {
    "use strict";

    var Namespace = 'cs-actionmenu-',

        Css = {
            body: Namespace + 'body',
            container: Namespace + 'container',
            content: Namespace + 'content',
            direction: Namespace,
            menu: Namespace + 'menu',
            wrapper: Namespace + 'wrapper'
        },

        Direction = {
            left: 'right',
            right: 'left'
        };

    $.widget('crux.actionmenu', $.crux.popover, {
        options: {

            /**
            The width of the flyout from the menu.

            @property bodywidth
            @type Number

            @default 400
            **/
            bodywidth: 400,

            /**
            The width of the area between the menu and the flyout.

            @property gutter
            @type Number

            @default 10
            **/
            gutter: 10,

            /**
            Searches within the element to find a match and uses that to create the menu. This should almost always be a UL.

            @property menu
            @type {JQuery Object | CSS Selector}

            @default "ul:eq(0)"
            **/
            menu: 'ul:eq(0)',

            /**
            Searches within the element to find a match and uses that to attach the event which will open the menu.

            @property target
            @type {JQuery Object | CSS Selector}

            @default ">a:eq(0)"
            **/
            target: '>a:eq(0)',

            /**
            The direction to open the flyout. Options are <code>left</code> and <code>right</code>.

            @property open
            @type String

            @default "right"
            **/
            open: 'right'
        },

        _create: function () {
            this.options.direction = 'bottom';
            this.options.menu = this.element.find(this.options.menu);
            this.options.content = this.options.menu.nextAll().width(this.options.bodywidth).css('margin', this.options.gutter).hidden();
            this.options.position = Direction[this.options.open];
            this.options.classname += ' ' + Css.wrapper;

            var self = this,
                target, hash;

            this._vars = {
                animated: false,
                containerWidth: this.options.bodywidth + this.options.gutter * 2,
                currentIndex: null,
                isOpen: false,
                menuHeight: 0,
                menuWidth: 0,
                position: this.options.open
            };

            this._html = {
                action: {
                    menu: null,
                    body: null,
                    container: null
                }
            };

            this.options.menu.find('a').each(function (i, el) {
                hash = this.hash === undefined ? this.href : this.hash;

                target = $(hash);
                if (target.length) {
                    $(this).data('index', self.options.content.index(target));
                }
            });

            this._super();
            this._attachEvents();
        },

        _build: function () {
            var action = this._html.action;

            this._super();

            this._html.popover.content.addClass(Css.direction + this._vars.position);

            action.menu = $('<div>', {
                'class': Css.menu
            }).append(this.options.menu);

            action.body = $('<div>', {
                'class': Css.body
            }).width(this.options.bodywidth).append(this.options.content);

            action.container = $('<div>', {
                'class': Css.container
            }).append(action.menu, action.body);
        },

        _preposition: function () {
            if (this._vars.position === 'left') {
                this._html.popover.wrapper.width(this._html.action.menu.width()).height(this._html.action.menu.height());
            }
        },

        _setContent: function () {
            this._html.popover.content.append(this._html.action.container);

            this._open();
        },

        _action: function (target) {
            this._deselect();
            var action = target.data('action'), fnName, fn;

            if (action) {
                fnName = action.split('(')[0];
                fn = CRUX.stringToFunction(fnName);

                if (typeof fn === 'function') {
                    fn.call(target[0], this.element);
                }
            }
        },

        _select: function (e) {
            e.preventDefault();

            var self = this,
                target = $(e.target),
                index = target.data('index'),
                animate = {},
                olditem, item, itemHeight, height;

            if (index === undefined) {
                this._action(target);
                return;
            }

            if (!this._vars.menuHeight) {
                this._vars.menuHeight = this._html.action.menu.height();
                this._vars.menuWidth = this._html.action.menu.width();
            }

            if (this._vars.animated || this._vars.currentIndex === index) {
                return;
            }

            this._vars.animated = true;

            olditem = this.options.content.eq(this._vars.currentIndex);
            item = this.options.content.eq(index).visible();
            itemHeight = item.outerHeight(true);
            height = itemHeight > this._vars.menuHeight ? itemHeight : this._vars.menuHeight;

            this._vars.currentIndex = index;

            if (!this._vars.isOpen) {
                this._html.popover.content.animate({
                    width: this._vars.menuWidth + this._vars.containerWidth,
                    height: height
                }, this.options.speed, function () {
                    self._vars.animated = false;
                });

                this._vars.isOpen = true;
            } else {
                this._html.popover.content.animate({
                    height: height
                }, this.options.speed);

                animate[this._vars.position] = 0;
                item.addClass('animated').animate(animate, {
                    duration: this.options.speed,
                    queue: false,
                    complete: function () {
                        olditem.hidden();
                        item.removeClass('animated').css(self._vars.position, '');
                        self._vars.animated = false;
                    }
                });
            }
        },

        _deselect: function () {
            var self = this;

            if (this._vars.isOpen) {
                this._vars.animated = true;

                this._html.popover.content.animate({
                    width: this._vars.menuWidth,
                    height: this._vars.menuHeight
                }, this.options.speed, function () {
                    self.options.content.eq(self._vars.currentIndex).hidden();
                    self._vars.currentIndex = null;
                    self._vars.isOpen = false;
                    self._vars.animated = false;
                });
            }
        },

        _attachEvents: function () {
            this._on(this.element, {
                actionmenuhide: '_deselect',
                actionmenupreposition: '_preposition'
            });
            this._on(this.options.target, {click: 'show'});
            this._on(this.options.menu, {'click a': '_select'});
        },

        widget: function () {
            return this._html.action.container;
        }
    });
}));
