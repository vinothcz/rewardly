/*! crux-suggestr - v2.9.2 - 2015-01-23
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />
/// <reference path="cs.loadr.js" />
/// <reference path="cs.popover.js" />

/*global CanvasLoader, CRIMSON, CRUX, _, Handlebars, Modernizr */

/**
Takes a DOM element and adds event listeners to track any typing while the element is in focus. Using loadr it will query the given url to return some suggestions of what they are typing.  Includes some keyboard short cuts to navigate to returned list as well.

Templates are written using <a href="http://mustache.github.com/" target="_blank">Mustache</a> syntax and rendered using the <a href="http://handlebarsjs.com/" target="_blank">Handlebars</a> templating engine.

All requests made by Suggestr's Loadr instance should conform to those restrictions, depending on the value of the <code>allresults</code> option.

The Results array can contain any format you want, as that will be parsed by the template.

@class Suggestr
@extends Base
@requires CRUX.Queue
@requires Popover
@requires Loadr
@module Widgets

@tests suggestr/index.html
@demo docs/demos/suggestr.jade
**/

(function (window, define, factory, undefined) {
    "use strict";
    if (define !== undefined) {
        define(['./cs.base.js', './cs.popover.js', './cs.loadr.js'], factory);
    } else {
        factory();
    }
}(
    this,
    this.define,
    function () {
        "use strict";
        var Namespace = 'suggestr-',
            Css = {
                body: Namespace + 'body',
                clear: Namespace + 'clear',
                focus: Namespace + 'focus',
                group: Namespace + 'group',
                hidden: Namespace + 'hidden',
                list: 'option-list',
                noresults: 'loadr-status-nodata',
                partial: Namespace + 'partial',
                wrapper: Namespace + 'wrapper',
                prompt: Namespace + 'prompt',
                current: Namespace + 'current',
                footer: Namespace + 'footer'
            },

            keyCode = $.ui.keyCode,
            ignoredKeys = [keyCode.ALT, keyCode.CAPS_LOCK, keyCode.COMMAND, keyCode.COMMAND_LEFT, keyCode.COMMAND_RIGHT, keyCode.CONTROL, keyCode.END, keyCode.HOME, keyCode.LEFT, keyCode.NUMPAD_DECIMAL, keyCode.NUMPAD_DIVIDE, keyCode.NUMPAD_ENTER, keyCode.NUMPAD_MULTIPLY, keyCode.NUMPAD_SUBTRACT, keyCode.PAGE_DOWN, keyCode.PAGE_UP, keyCode.RIGHT, keyCode.SHIFT, keyCode.WINDOWS],
            trackedKeys = [keyCode.ENTER, keyCode.NUMPAD_ENTER, keyCode.UP, keyCode.DOWN, keyCode.ESCAPE, keyCode.TAB],

            _addCustomLoadingImage = function () {
                var elOuterHeight = this.element.outerHeight();

                this._html.loading = $('<div>').css({
                    position: 'absolute',
                    height: elOuterHeight,
                    width: elOuterHeight
                })
                .insertAfter(this.element)
                .position({
                    my: 'right-' + (elOuterHeight / 4) + ' bottom-' + (elOuterHeight / 4),
                    at: 'right bottom',
                    of: this.element
                })
                .spin({
                    length: 1,
                    radius: elOuterHeight / 4,
                    width: 1
                });
            },

            _removeCustomLoadingImage = function () {
                if (this._html.loading) {
                    this._html.loading.hide('fade', (Modernizr.cssanimations ? 200 : 1), $.proxy(function () {
                        this._html.loading.spin('destroy');
                        this._html.loading.remove();
                    }, this));
                }

                this._loadComplete();
            },

            _clientSearch = function (results) {
                var search = $.trim(this.element.val()).toLowerCase();

                var mapFunction = function (value) {
                    if ((typeof value === 'string' || typeof value === 'number') && value.toString().toLowerCase().indexOf(search) > -1) {
                        return true;
                    }

                    return null;
                };

                results = $.grep(results, function (result, index) {
                    var map = $.map(result, mapFunction);
                    return map.length;
                });

                return results;
            },

            _clientFilter = function (results) {
                if (this.options.allresults === false && results.Results) {
                    results.Results = results.Results.slice(0, this.options.items);
                } else if (this.options.allresults === true) {
                    results = results.slice(0, this.options.items);
                }

                return $.crux.loadr.prototype.options.clientfilter.call(this, results);
            };

        $.widget("crux.suggestr", {
            options: {

                /**
                When true the whole returned object is used and sent to the template to be parsed. When false only the Results object is used.

                @property allresults
                @type Boolean

                @default false
                **/
                allresults: false,

                /**
                When true the first options returned will automatically be highlighted.

                @property autofocus
                @type Boolean

                @default false
                **/
                autofocus: false,

                /**
                Function that is called when a resultsdata lookup is made. Default value returns the full result set if <code>resultsdata</code> is a string, or an interally-paged result set if <code>resultsdata</code> is an object.

                @property clientfilter
                @type Function

                @default _clientFilter
                **/
                clientfilter: _clientFilter,

                /**
                Function that is called when a resultsdata lookup is made. Default value uses <code>this.element.val()</code> as a filter string, and does a partial string match against all records with numeric or string fields, returning those that match. This function is called as a prefilter, before any additional filters (like pagination) are applied.

                @property clientsearch
                @type Function

                @default _clientSearch
                **/
                clientsearch: _clientSearch,

                /**
                The direction you want the popover to appear in relation to the {@link .target} element. The accepted directions are <code>top</code>, <code>right</code>, <code>bottom</code>, and <code>left</code>.

                @property direction
                @type String

                @default "bottom"
                ***/
                direction: 'bottom',

                /**
                When not empty a footer div is added to the wrapper with the given string.

                @property footer
                @type Function

                @default null
                ***/
                footer: null,

                /**
                The maximum number of results returned from the server.

                @property items
                @type Number

                @default 10
                ***/
                items: 10,

                /**
                The maximum height (in pixels) for the list.

                @property maxheight
                @type Number

                @default 300
                **/
                maxheight: 300,

                /**
                The minumun length the input must be before we look for suggestions.

                @property minstringlength
                @type Number

                @default 1
                **/
                minstringlength: 1,

                /**
                Message to be displayed when a request returns with no data.

                @property nodata
                @type String

                @default Falsey - Causes popover to be completely hidden when there's no data.
                **/
                nodata: '',

                /**
                Function that is called after a successful ajax request where there is at least one result. This method is called before the template is rendered allowing you to modify the results object as needed. When providing the callback as a string the Loadr turns the string into a function before calling it. Note: This conversion does NOT use eval().

                In order for loadr to continue working you MUST return an object in your parse method and it has to contain a 'Results' property, just like the result from the server.

                @property parse
                @type Function

                @default $.crux.loadr.prototype.options.parse
                **/
                parse: $.crux.loadr.prototype.options.parse,

                /**
                The position of the popover's body in relation to the <code>target</code> element. Only valid if the <code>direction</code> is <code>left</code> or <code>right</code>, and can be <code>top</code> or <code>bottom</code>. If the {@link .direction} is <code>top</code> or <code>bottom</code> the position will be <code>center</code>. If you provide a position that is incompatible with the {@link .direction} it will default to <code>top</code>.

                @property position
                @type String

                @default "left"
                **/
                position: 'center',

                /**
                Message to be displayed to prompt the user to start typing.

                @property prompt
                @type String

                @default ""
                **/
                prompt: '',

                /**
                 Delay, in milliseconds, before showing user a prompt if they're focused on this element and the value is empty.

                 @property promptydelay
                 @type Number

                 @default 2000
                 **/
                promptdelay: 2000,

                /**
                Data object to be supplied for preloaded data sets, as opposed to requesting data from the server. This can be used to either save a server hit, in the case of small, unchanging data sets, or for integration with other frameworks that have their own methods for data transport and/or custom object types. This property takes precedence over Loadr's ajax functionality.

                @property resultsdata
                @type Object

                @default null
                **/
                resultsdata: null,

                /**
                A callback that is triggered after selecting an item from the list. The function passes the event and an object containing information about the selected option.

                @property select
                @type Function

                @default null
                **/
                select: null,

                /**
                The template used to parse the JSON result set. When provided it can either be the id of the template without the '#' - or a snippet of HTML.

                To see the consturction of a template view the <a href="http://handlebarsjs.com/" target="_blank">Handlebars</a> documentation.

                @property template
                @type String

                @default null
                **/
                template: '<li>{{{Label}}}</li>',

                /**
                The type of request. This seta the <code>type</code> variable of the <a href="http://api.jquery.com/jQuery.ajax/">jQuery ajax object</a>.

                @property type
                @type String

                @default "GET"
                **/
                type: 'GET',

                /**
                The URL to request. This seta the <code>url</code> variable of the <a href="http://api.jquery.com/jQuery.ajax/">jQuery ajax object</a>.

                @property url
                @type String

                @default " "
                **/
                url: '',

                /**
                Sets the width of the generated link. If null the link will take the width of its parent element.

                @property width
                @type Number

                @default null
                **/
                width: null,

                /**
                Specifies the <code>z-index</code> CSS property of the List. The List is created using the {@link Popover} widget. If left as <code>null</code> the List's <code>z-index</code> value will be assigned to the global z-index value in CrUX. For each new Popover the CrUX z-index value is incremented by 1.

                @property zindex
                @type Number

                @default null
                **/
                zindex: null
            },

            _create: function () {
                this._vars = {
                    currentList: null,
                    form: this.element.parents('form'),
                    id: null,
                    isBuilt: false,
                    options: null,
                    preventFetch: false,
                    safeBlur: false
                };

                this._html = {
                    body: null,
                    list: null,
                    loading: null,
                    footer: null,
                    wrapper: null
                };

                if (this.options.width === null) {
                    this.options.width = this.element.outerWidth();
                }

                this._attachEvents();
            },

            // Enforce direction/position parity
            _setOptions: function (options) {
                if (options.direction && $.inArray(this.options.direction, ['top', 'right', 'bottom', 'left']) === -1) {
                    options.direction = $.crux.suggestr.prototype.options.direction;
                }
                if (options.position && $.inArray(this.options.position, ['top', 'bottom', 'center']) === -1) {
                    options.position = $.crux.suggestr.prototype.options.position;
                }

                this._super();

                if ($.inArray(this.options.direction, ['top', 'bottom']) !== -1 && this.options.position !== 'center') {
                    this.options.position = 'center';
                } else if ($.inArray(this.options.direction, ['left', 'right']) !== -1 && $.inArray(this.options.position, ['top', 'bottom']) === -1) {
                    this.options.position = 'top';
                }
            },

            _attachEvents: function () {
                this._on({
                    focus: _.debounce($.proxy(this._buildWrapper, this), 300)
                });
            },

            _prompt: function () {
                if (this.options.prompt && $.trim(this.element.val()) < this.options.minstringlength && this.element.is(':focus')) {
                    if (this._html.footer !== null) {
                        this._html.footer.hide();
                    }
                    this._html.list.html('<li class="' + Css.prompt + '">' + this.options.prompt + '</li>');
                    this._show();
                }
            },

            _buildWrapper: function () {
                if (!this._vars.isBuilt) {
                    this._html.wrapper = $('<div>', {
                        'class': Css.wrapper
                    });

                    this._html.body = $('<div>', {
                        'class': Css.body
                    }).appendTo(this._html.wrapper);

                    this._html.list = $('<ul>', {
                        'class': Css.list
                    }).appendTo(this._html.body);

                    if (this.options.footer !== null) {
                        this._html.footer = $('<div>', {
                            'class': Css.footer
                        }).appendTo(this._html.wrapper);
                    }

                    this.element.popover($.extend({}, this.options, {
                        autoshow: false,
                        content: this._html.wrapper,
                        preposition: $.proxy(this._maxHeight, this),
                        hideonclick: false,
                        caret: ($.inArray(this.options.direction, ['left', 'right']) === -1 ? 0 : 6),
                        offset: ($.inArray(this.options.direction, ['left', 'right']) === -1 ? '0' : (this.options.direction === 'left' ? '-3' : '3') + ' 0')
                    }));

                    this.element.loadr($.extend({}, this.options, {
                        autoload: false,
                        target: this._html.list,
                        addLoadingImage: _addCustomLoadingImage,
                        removeLoadingImage: _removeCustomLoadingImage,
                        success: $.proxy(this._success, this),
                        error: $.proxy(this._error, this)
                    }));

                    this._vars.isBuilt = true;

                    this._attachListEvents();

                    this._on({
                        blur: _.debounce($.proxy(function (e) {
                          if (this._vars.safeBlur) {
                            // HACK ALERT
                            // In IE10, clicking on the popover scrollbar handle causes this blur to hide the popover...
                            this._vars.safeBlur = false;
                            return;
                          }

                          if (!$(e.relatedTarget || document.activeElement).closest(this.element.popover('html', 'popover.wrapper')).length) {
                            this.hide();
                          }
                        }, this), 300)
                    });

                    this._on(this._html.body, {
                        blur: _.debounce($.proxy(function (e) {
                          this._hide();
                        }, this), 300)
                    });
                }

                if (this.element.val().length >= this.options.minstringlength) {
                    this._fetchList();
                } else {
                    _.debounce($.proxy(this._prompt, this), this.options.promptdelay).call();
                }
            },

            _success: function (e, results) {
                var footer = this.options.footer;

                if (footer !== null) {
                    if (typeof footer === 'string') {
                        footer = CRUX.stringToFunction(this.options.footer);
                    }
                    this._html.footer
                        .html(footer.call(this, results))
                        .show();
                }

                if (this.options.autofocus) {
                    this._html.list
                        .children(':first')
                            .addClass(Css.current);
                }

                if (this.element.is(':focus') && (this._html.list.children().length > 1 || this._html.list.children(':first').text() !== this.element.val())) {
                    this._show();
                }
            },

            _error: function (e, error) {
                if (error.textStatus === 'nodata' && this.options.nodata) {
                    if (this._html.footer !== null) {
                        this._html.footer.hide();
                    }
                    this._show();
                } else {
                    this._html.list.empty();
                    this._hide();
                }
            },

            _attachListEvents: function () {
                var listListeners = {};

                this._on({
                    keydown: $.proxy(this._keyDown, this),
                    keyup: _.debounce($.proxy(this._keyup, this), 300)
                });

                listListeners['click :not(.' + Css.noresults + ', .' + Css.prompt + ')'] = $.proxy(this._select, this);
                listListeners['mouseenter :not(.' + Css.noresults + ', .' + Css.prompt + ')'] = $.proxy(function (e) {
                    var $this = $(e.target);

                    $this
                        .addClass(Css.current)
                        .siblings('.' + Css.current)
                            .removeClass(Css.current);
                }, this);

                this._on(this._html.list, listListeners);
            },

            _fetchList: function () {
                if (!this._vars.preventFetch) {
                    var newData = {
                        search: $.trim(this.element.val()),
                        noofitems: this.options.items
                    };

                    this.element
                        .loadr('option', 'data', newData)
                        .loadr('reset');
                }
            },

            _keyDown: function (e) {
                if (this._isPopoverVisible() && $.inArray(e.keyCode, trackedKeys) !== -1 && !this._html.list.find('.' + Css.noresults + ', .' + Css.prompt).length) {
                    var current = this._html.list.find('.' + Css.current);

                    //switch
                    switch (e.keyCode) {
                    case keyCode.ENTER:
                    case keyCode.NUMPAD_ENTER:
                    case keyCode.TAB:
                        if (current.length) {
                            current.trigger('click');
                        }
                        break;

                    case keyCode.UP:
                    case keyCode.DOWN:
                        if (e.keyCode === keyCode.UP) {
                            current = current
                                .removeClass(Css.current)
                                .prev(':not(.' + Css.noresults + ', .' + Css.prompt + ')')
                                    .addClass(Css.current);

                            if (current.length === 0) {
                                current = this._html.list
                                    .children(':not(.' + Css.noresults + '):last')
                                        .addClass(Css.current);
                            }
                        } else {
                            current = current
                                .removeClass(Css.current)
                                .next(':not(.' + Css.noresults + ', .' + Css.prompt + ')')
                                    .addClass(Css.current);

                            if (current.length === 0) {
                                current = this._html.list
                                    .children(':not(.' + Css.noresults + '):first')
                                        .addClass(Css.current);
                            }
                        }

                        var top = 0,
                            height = current.outerHeight(),
                            scrollTop = this._html.body.scrollTop(),
                            scrollHeight = this._html.body.height();

                        this._html.list.children().each(function (index, element) {
                            if (element === current[0]) {
                                return false;
                            }

                            top += $(element).outerHeight();
                        });

                        if (scrollTop > top) {
                            this._html.body.scrollTop(top);
                        } else if (scrollTop + scrollHeight < top + height) {
                            var difference = (top + height) - (scrollTop + scrollHeight);

                            if (scrollTop < (scrollTop + scrollHeight - difference)) {
                                this._html.body.scrollTop(scrollTop + difference);
                            }
                        }

                        e.preventDefault();
                        break;

                    case keyCode.ESCAPE:
                        this._hide();
                        break;
                    }
                }

                _.debounce($.proxy(this._prompt, this), this.options.promptdelay).call();
            },

            _keyup: function (e) {
                this._vars.preventFetch = false;

                if ($.trim(this.element.val()).length < this.options.minstringlength) {
                    this._hide();
                } else {
                    if ($.inArray(e.keyCode, ignoredKeys.concat(trackedKeys)) === -1) {
                        this._fetchList();
                    }
                }
            },

            _hide: function () {
                if (this._isPopoverVisible()) {
                    this.element.popover('hide');
                }
            },

            _show: function () {
                if (!this._isPopoverVisible()) {
                    this.element.popover('show');
                } else {
                    this.element.popover('position');
                }
            },

            _isPopoverVisible: function () {
                var wrapper;

                if (this.element.is(':crux-popover') && (wrapper = this.element.popover('html', 'popover.wrapper'))) {
                    return wrapper.data('popover-visible') === true;
                }

                return false;
            },

            _select: function (e) {
                if (this.options.select) {
                    this.options.select.call(this, e);
                } else {
                    var $target = $(e.target),
                        value = $.trim($target.text());

                    e.preventDefault();
                    this.element.val(value);
                    this._hide();
                }

                this._vars.preventFetch = true;
            },

            _maxHeight: function () {
                if (!this.options.maxheight) {
                    return;
                }

                this._html.body.css({
                    maxHeight: this.options.maxheight - (this._html.footer !== null ? this._html.footer.outerHeight() : 0)
                });

                this.element.popover('option', 'preposition', null);
            },

            _destroy: function () {
                if (this.element.is(':crux-popover')) {
                    this.element.popover('destroy');
                }
                if (this.element.is(':crux-loadr')) {
                    this.element.loadr('destroy');
                }
            },

            hide: function () {
                this._hide();
            }
        });
    }
));
