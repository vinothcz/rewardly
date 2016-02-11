/*! crux-pagr - v2.9.1 - 2015-01-23
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />
/// <reference path="cs.loadr.js" />

/*global _ */

/**
Adds pagiation to any element that also uses {{#crossLink "Loadr"}}{{/crossLink}}. This means that when you set options or call methods on the Pagr widget, you also have access to any option or method on the {{#crossLink "Loadr"}}{{/crossLink}} widget.

Pagr adds two parameters to each ajax request; <code>noofitems</code>, which tells the server how many items to return in the request, and <code>index</code>, which tells the server which table row to start getting results from. These parameters can also be configured if your server uses different variable names.

Pagr has a number of different configurations depending on how you want to be able to page through your data. Make sure to look at all of the parameters available to you when you configure Pagr. One option Pagr allows is infinite scrolling. This is where a scroll bar (using the {{#crossLink "Scrollr"}}{{/crossLink}} widget) is added to the content area. Reaching the bottom of the scrollable area will load the next page.

In order for Pagr to know how many pages to calculate an additional item needs to be added to the Loadr response. It should now look like:
<pre class="prettyprint">
{
    TotalRecords: 1
    Results: []
}
</pre>

<code>TotalRecords</code> is the count of the complete result set, not how many records are being returned for a specific page.

Adding a class <code>deferred-pagr</code> to any element will trigger Pagr.

@class Pagr
@extends Loadr
@module Widgets

@tests pagr/pagr.html
@demo docs/demos/pagr.jade
**/

(function (window, define, factory, undefined) {
    "use strict";

    if (define !== undefined) {
        define(['./cs.base.js', './cs.loadr.js', './cs.scrollr.js'], factory);
    } else {
        factory();
    }
}(
    this,
    this.define,
    function () {
        "use strict";

        var Increment = 0,

            Namespace = 'cs-pagr-',

            Css = {
                active: Namespace + 'active',
                controls: Namespace + 'controls',
                disabled: Namespace + 'disabled',
                first: Namespace + 'first',
                input: Namespace + 'input',
                last: Namespace + 'last',
                loader: Namespace + 'loader',
                more: Namespace + 'more',
                nav: Namespace + 'nav',
                next: Namespace + 'next',
                pages: Namespace + 'pages',
                prev: Namespace + 'prev',
                records: Namespace + 'records',
                select: Namespace + 'select',
                shim: Namespace + 'shim',
                wrapper: Namespace + 'wrapper',
                wrappersmall: Namespace + 'wrapper-small'
            },

            _clientFilter = function (results) {
                /**
                 * If our resultsdata option is a string, we assume it's being updated from some external
                 * process, in which case, each 'page' of data is being loaded in by that process, and we
                 * should take the result set as-is.
                 **/
                if (typeof this.options.resultsdata === 'string') {
                    return results;
                }

                /**
                 * If we're still here, our resultsdata option is non-string, in which case we treat it as
                 * a fully-loaded result set that we need to page through internally.
                 **/
                var start = this.options.data.index,
                    end = this.options.data.index + this.options.data.noofitems;

                if (this.options.allresults === false && results.Results) {
                    results.Results = results.Results.slice(start, end);
                } else if (this.options.allresults === true) {
                    results = results.slice(start, end);
                }

                return $.crux.loadr.prototype.options.clientfilter.call(this, results);
            };

        $.widget('crux.pagr', $.crux.loadr, {
            options: {

                /**
                Function that is called when a resultsdata lookup is made. Default value returns the full result set if <code>resultsdata</code> is a string, or an interally-paged result set if <code>resultsdata</code> is an object.

                @property clientfilter
                @type Function

                @default _clientFilter
                **/
                clientfilter: _clientFilter,

                /**
                The index to start at when retrieving records from the server.

                @property index
                @type Number

                @default 0
                **/
                index: 0,

                /**
                The number of items for the server to send back in the request.

                @property items
                @type Number

                @default 20
                **/
                items: 20,

                /**
                The number of pages to show in the page navigation (if it is visible). Example: <code>... 3 4 5 6 7 ...</code>

                @property pages
                @type Number

                @default 5
                **/
                pages: 5,

                /**
                The profile parameter takes one of four values: <code>default</code>, <code>small</code>, <code>full</code>, <code>scroll</code>.

                The profile can only be set on initialization.

                @property profile
                @type String

                @default "default"
                **/
                profile: 'default',

                /**
                The different values for {{#crossLink "Pagr/items"}}{{/crossLink}} that the user can select via the {{#crossLink "Pagr/showselect"}}{{/crossLink}} control. If the number of {{#crossLink "Pagr/items"}}{{/crossLink}} to be shown is not in the list it will be added in the correct location.

                @property selectincrements
                @type Array

                @default [10, 20, 50]
                **/
                selectincrements: [10, 20, 50],

                /**
                Show a select list that will allow the user to change the number of items that are shown on each page.

                @property showselect
                @type Boolean

                @default false
                **/
                showselect: false
            },

            _create: function () {
                var autoload = this.options.autoload;
                this.options.autoload = false;

                $.crux.loadr.prototype._create.call(this);

                this._pagr();

                this.options.autoload = autoload;

                if (autoload) {
                    this._start();
                }
            },

            _pagr: function () {
                this._html = this._html || {};
                this._vars = this._vars || {};

                $.extend(true, this._html, {
                    pagr: {
                        controls: null,
                        first: null,
                        input: null,
                        last: null,
                        next: null,
                        pages: null,
                        prev: null,
                        records: null,
                        select: null,
                        shim: null,
                        wrapper: null
                    }
                });

                $.extend(true, this._vars, {
                    loaded: false,
                    pagr: {
                        showNumbers: false,
                        showFirstLast: false,
                        showInput: true
                    },
                    pages: {
                        first: 0,
                        last: 0,
                        total: 0
                    },
                    records: {
                        first: 0,
                        last: 0,
                        total: 0
                    }
                });

                this._update();

                if (this.options.profile === 'scroll') {
                    this._buildScroll();
                    return;
                }

                if (this.options.profile === 'full') {
                    this._vars.pagr.showNumbers = true;
                    this._vars.pagr.showFirstLast = true;
                } else if (this.options.profile === 'small') {
                    this._vars.pagr.showInput = false;
                }

                this._buildPagr();
                this._attachPagrEvents();
            },

            _update: function () {
                this.options.data.index = this.options.index * this.options.items;
                this.options.data.noofitems = this.options.items;
            },

            _buildPagr: function () {
                var self = this,
                    pagr = this._html.pagr,
                    listitem = '';

                pagr.wrapper = $('<div>', {
                    'class': Css.wrapper + (this.options.profile === 'small' ? ' ' + Css.wrappersmall : '')
                }).hide();

                pagr.controls = $('<ul>', {
                    'class': Css.controls
                })
                .appendTo(pagr.wrapper);

                if (this._vars.pagr.showInput) {
                    pagr.input = $('<li>', {
                        'class': Css.input
                    })
                    .html('<input type="number" min="1" name="' + Css.input + (Increment += 1) + '" value="' + (this.options.index + 1) + '" /> of <span></span>')
                    .appendTo(pagr.controls);
                }

                if (this._vars.pagr.showFirstLast) {
                    pagr.first = $('<li>', {
                        'class': Css.first + ' ' + Css.nav
                    })
                    .html('<a href="#" class="icon" data-cs-index="0">&#171;</a>')
                    .appendTo(pagr.controls);
                }

                pagr.prev = $('<li>', {
                    'class': Css.prev + ' ' + Css.nav
                })
                .html('<a href="#" class="icon">&#139;</a>')
                .appendTo(pagr.controls);

                if (this._vars.pagr.showNumbers) {
                    pagr.pages = $('<li></li>', {
                        'class': Css.pages
                    })
                    .appendTo(pagr.controls);
                }

                pagr.next = $('<li>', {
                    'class': Css.next + ' ' + Css.nav
                })
                .html('<a href="#" class="icon">&#155;</a>')
                .appendTo(pagr.controls);

                if (this._vars.pagr.showFirstLast) {
                    pagr.last = $('<li>', {
                        'class': Css.last + ' ' + Css.nav
                    })
                    .html('<a href="#" class="icon">&#187;</a>')
                    .appendTo(pagr.controls);
                }

                if (this.options.showselect) {
                    pagr.select = $('<select>')
                        .addClass(Css.select)
                        .appendTo(pagr.wrapper);

                    if ($.inArray(this.options.items, this.options.selectincrements) === -1) {
                        this.options.selectincrements.push(this.options.items);
                        this.options.selectincrements.sort(function (a, b) {
                            return a - b;
                        });
                    }

                    $.each(this.options.selectincrements, function (i, item) {
                        listitem += '<option value="' + item + '"';
                        if (item === self.options.items) {
                            listitem += ' selected="selected"';
                        }
                        listitem += '>' + item + '</option>';
                    });
                    pagr.select.html(listitem);
                }

                pagr.records = $('<div>', {
                    'class': Css.records
                })
                .appendTo(pagr.wrapper);

                this.options.target.after(pagr.wrapper);
            },

            _testKey: function (e) {
                if (e.which !== 13) {
                    return;
                }

                this._loadPage(e);
            },

            _loadPage: function (e) {
                e.preventDefault();

                if (this._vars.isLoading) {
                    return;
                }

                var index = 0,
                    target = $(e.currentTarget);

                if (target.is('a')) {
                    index = target.data('csIndex');
                } else {
                    index = parseInt(target.val(), 10) - 1;

                    if (index < 0 || isNaN(index)) {
                        index = 0;
                    } else if (index > this._vars.pages.total - 1) {
                        index = this._vars.pages.total - 1;
                    }
                }

                if (this.options.index !== index) {
                    this.options.index = index;

                    this._update();
                    this.reload();
                } else if (target.is('input')) {
                    target.val(this.options.index + 1);
                }
            },

            _changeCount: function (e) {
                var target = e.target,
                    value = parseInt(target.value, 10),
                    maxpages = Math.ceil(this._vars.records.total / value);

                if (this.options.index * value > this._vars.records.total) {
                    this.options.index = maxpages - 1;
                }

                this.options.items = value;
                this._update();
                this.reload();
            },

            _updatePagr: function (element, results) {
                var records =  this._vars.records,
                    pages = this._vars.pages;

                records.total = results.TotalRecords;
                records.first = this.options.index * this.options.items + 1 > records.total ? records.total : this.options.index * this.options.items + 1;
                records.last = records.first + this.options.items - 1 > records.total ? records.total : records.first + this.options.items - 1;

                pages.total = Math.ceil(records.total / this.options.items);
                if (records.total === this.options.items) {
                    pages.total = 1;
                } else if (this.options.index + 1 >= pages.total) {
                    this.options.index = pages.total - 1;
                }

                this._updatePagrRecords();
                this._updatePagrControls();

                if (this._vars.pagr.showNumbers) {
                    this._updatePagrPages();
                }

                this._showPagr();
            },

            _updatePagrPages: function () {
                var pages = '<ul>',
                    more = '<li class="' + Css.more + '">...</li>',
                    start, stop, x;

                stop = this.options.pages + this.options.index - Math.floor(this.options.pages / 2);
                if (stop > this._vars.pages.total) {
                    stop = this._vars.pages.total;
                }

                start = stop - this.options.pages;
                if (start <= 0) {
                    start = 0;
                    if (this._vars.pages.total >= this.options.pages) {
                        stop = this.options.pages;
                    }
                }

                if (stop - start < this.options.pages) {
                    stop = this._vars.pages.total;
                }

                if (start > 0) {
                    pages += more;
                }

                for (x = start; x < stop; x += 1) {
                    pages += '<li';
                    if (x === this.options.index) {
                        pages += ' class="' + Css.active + '"';
                    }
                    pages += '><a href="#"';
                    pages += ' data-cs-index="' + x + '">' + (x + 1) + '</a></li>';
                }
                if (stop < this._vars.pages.total) {
                    pages += more;
                }

                pages += '</ul>';

                this._html.pagr.pages.html(pages);
            },

            _updatePagrRecords: function () {
                this._html.pagr.records.html(this._vars.records.first + ' - ' + this._vars.records.last + (this.options.allresults === false && this._vars.pages.total === 1 ? '' : ' of ' + this._vars.records.total));
            },

            _updatePagrControls: function () {
                var pagr = this._html.pagr,
                    pages = this._vars.pages;

                if (this.options.allresults === false && pages.total === 1) {
                    this._hideControls();
                    return;
                } else {
                    this._showControls();
                }

                if (this.options.index === 0) {
                    if (this._vars.pagr.showFirstLast) {
                        pagr.first.children('a').addClass(Css.disabled);
                    }
                    pagr.prev.children('a').addClass(Css.disabled);
                } else {
                    if (this._vars.pagr.showFirstLast) {
                        pagr.first.children('a').removeClass(Css.disabled);
                    }
                    pagr.prev.children('a').removeClass(Css.disabled);
                }

                if (this.options.index + 1 === pages.total) {
                    this.options.index = pages.total - 1;

                    pagr.next.children('a').addClass(Css.disabled);
                    if (this._vars.pagr.showFirstLast) {
                        pagr.last.children('a').addClass(Css.disabled);
                    }
                } else {
                    pagr.next.children('a').removeClass(Css.disabled);
                    if (this._vars.pagr.showFirstLast) {
                        pagr.last.children('a').removeClass(Css.disabled);
                    }
                }

                pagr.prev.children('a').data('csIndex', this.options.index - 1 > 0 ? this.options.index - 1 : 0);
                pagr.next.children('a').data('csIndex', this.options.index + 1 === pages.total ? pages.total - 1 : this.options.index + 1);

                if (this._vars.pagr.showFirstLast) {
                    pagr.last.children('a').data('csIndex', pages.total - 1);
                }

                if (this._vars.pagr.showInput) {
                    pagr.input
                        .children('input').val(this.options.index + 1)
                        .next()
                        .text(pages.total);
                }
            },

            _hidePagr: function () {
                this._html.pagr.wrapper.hide();
            },

            _showPagr: function () {
                this._html.pagr.wrapper.show();
            },

            _hideControls: function () {
                this._html.pagr.controls.hide();
            },

            _showControls: function () {
                this._html.pagr.controls.show();
            },

            _attachPagrEvents: function () {
                this._vars.success.add(this._updatePagr);
                this._vars.error.add(this._hidePagr);

                this._html.pagr.controls.on('click.' + this.widgetName, 'a', $.proxy(this, '_loadPage'));

                if (this._vars.pagr.showInput) {
                    this._html.pagr.controls.on('keypress.' + this.widgetName, 'input', $.proxy(this, '_testKey'));
                }

                if (this.options.showselect) {
                    this._html.pagr.select.on('change', $.proxy(this, '_changeCount'));
                }
            },

            _buildScroll: function () {
                this.options.replace = false;
                this._vars.complete.add(this._updateScroll);
            },

            _updateScroll: function (element, results) {
                var that = this;

                if (this._vars.request.state() === 'resolved') {
                    this._vars.loaded = true;

                    if (this.options.index * this.options.items < results.TotalRecords) {
                        this.options.index += 1;
                        this._update();
                    }

                    if (!this.options.target.is(':crux-scrollr') || (this.options.target.scrollr('option', 'bottom') === null)) {
                        this.options.target.scrollr({
                            bottom: function () {
                                if (!that._vars.isLoading) {
                                    that._reload();
                                }
                            }
                        });
                    }

                    if (this.options.index * this.options.items >= results.TotalRecords) {
                        this.options.target.scrollr('option', 'bottom', null);
                    }
                }
            },

            _start: function () {
                this.start();
            },

            _reset: function () {
                this.options.index = 0;
            },

            _reload: function () {
                if (this.options.profile === 'scroll') {
                    this._process();
                } else {
                    this.reload();
                }
            },

            /**
            Resets the index of the request back to 0 (first page) and then makes the request.

            @method reset
            */
            reset: function () {
                this._reset();
                this._update();
                this.reload();
            },

            destroy: function () {
                if (this.options.profile === 'scroll' && this.options.target.is(':crux-scrollr')) {
                    this.options.target.scrollr('destroy');
                } else if (this._html.pagr.wrapper) {
                    this._html.pagr.wrapper.remove();
                }
                $.crux.loadr.prototype.destroy.call(this);
            },

            widget: function () {
                var widget = this.element;

                if (this.options.profile !== 'scroll') {
                    widget = this._html.pagr.wrapper;
                }

                return widget;
            }
        });

        $(function () {
            $('.deferred-pagr').pagr();
        });
    }
));
