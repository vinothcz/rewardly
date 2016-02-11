/*! crux-loadr - v2.9.2 - 2015-08-06
* Copyright (c) 2015 Advisory Board Company; Licensed  */

/// <reference path="cs.base.js" />

/*global CanvasLoader, CRIMSON, CRUX, _, Handlebars, Modernizr */

/**
Takes a DOM element and makes a single ajax request based on the <code>data-cs-*</code> params provided and/or the parameters specified via JavaScript. After initialization Loadr checks to see if there are any active Loadr requests and will add each new instance into a request queue. As one request completes the next request from the queue is automatically processed.

Templates are written using <a href="http://mustache.github.com/" target="_blank">Mustache</a> syntax and rendered using the <a href="http://handlebarsjs.com/" target="_blank">Handlebars</a> templating engine.

All requests made by Loadr should be returned using JSON and at minimum be formatted like this:

<pre class="prettyprint">
{
    Results: []
}
</pre>

The Results array can contain any format you want, as that will be parsed by the template.

@class Loadr
@extends Base
@requires CRUX.Queue
@module Widgets

@tests loadr/index.html
@demo docs/demos/loadr.jade
**/

(function (window, define, factory, undefined) {
    "use strict";

    if (define !== undefined) {
        define(['./cs.queue.js', './cs.modernizr.js', './cs.spinner.js', './cs.helpers.js', './cs.base.js', 'inputsearch.js'], factory);
    } else {
        factory(CRUX.Queue, Modernizr);
    }
}(
    this,
    this.define,
    function (queue, modernizr) {
        "use strict";

        var Namespace = 'cs-loadr-',

        Css = {
            head: Namespace + 'head'
        },

        _removeLoadingImage = function () {
            var that = this;

            // Fixes issue with createWrapper where the current styles are applied to
            // element being wrapped. In our case some elements don't have a height,
            // meaning they get set to 0. When the wrapper is removed they don't remove
            // the set styles resulting in a 0 height element with content.
            this.options.target.removeAttr('style');

            this._html.loading.find('.cs-loadr-overlay').hide('fade', (modernizr.cssanimations ? 200 : 1), function () {
                $(this).spin('destroy').parent().replaceWith(that.options.target);
                that._html.loading = null;
                that._loadComplete();
            });
        },

        _addLoadingImage = function () {
            this._html.loading = $.effects.createWrapper(this.options.target)
                .height('auto')
                .append($('<div>').addClass('cs-loadr-overlay'))
                .spin();

            this._html.loading.css('min-height', this._html.loading.find('.cs-spinner-wrapper').height());
        },

        _clientSearch = function (results) {
            var search = $.trim(this.options.data.search).toLowerCase();

            if (search.length) {
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
            }

            return results;
        },

        _clientFilter = function (results) {
            return results;
        };

        $.widget('crux.loadr', {
            options: {

                /**
                When true the whole returned object is used and sent to the template to be parsed. When false only the Results object is used.

                @property allresults
                @type Boolean

                @default false
                **/
                allresults: false,

                /**
                Send the request asynchronously. This sets the <code>async</code> variable of the <a href="http://api.jquery.com/jQuery.ajax/">jQuery ajax object</a>.

                @property async
                @type Boolean

                @default true
                **/
                async: true,

                /**
                Process the ajax request as soon as the Loadr is initialized. The request may be added to the queue if there is a different request currently executing.

                @property autoload
                @type Boolean

                @default true
                **/
                autoload: true,

                /**
                Allow the browser to cache the ajax request. This sets the <code>cache</code> variable of the <a href="http://api.jquery.com/jQuery.ajax/">jQuery ajax object</a>.

                @property cache
                @type Boolean

                @default false
                **/
                cache: false,

                /**
                Function that is called when a resultsdata lookup is made. Default value returns all records.

                @property clientfilter
                @type Function

                @default _clientFilter
                **/
                clientfilter: _clientFilter,

                /**
                Function that is called when a resultsdata lookup is made. Default value uses <code>this.options.data.search</code> as a filter string, and does a partial string match against all records with numeric or string fields, returning those that match. This function is called as a prefilter, before any additional filters (like pagination) are applied.

                @property clientsearch
                @type Function

                @default _clientSearch
                **/
                clientsearch: _clientSearch,

                /**
                Function that is called after the ajax request is complete and the loading animation has been removed. This event is triggered whether the request resulted in success or an error.

                When providing the callback as a string the Loadr turns the string into a function before calling it. Note: This conversion does NOT use eval().

                @property complete
                @type Function

                @default null
                **/
                complete: null,

                /**
                Allow the browser to cache the ajax request. This sets the <code>contentType</code> variable of the <a href="http://api.jquery.com/jQuery.ajax/">jQuery ajax object</a>.

                @property contenttype
                @type String

                @default "application/json; charset=utf-8"
                **/
                contenttype: "application/json; charset=utf-8",

                /**
                Data to be sent to the server. Data must be in key/value pairs or a valid JSON object. This sets the <code>data</code> variable of the <a href="http://api.jquery.com/jQuery.ajax/">jQuery ajax object</a>.

                When passing a JSON object as an attribute on an element make sure to use the single quote (&#146;) otherwise your JSON object won't be in the correect format.

                @property data
                @type Object

                @default {}
                **/
                data: {},

                /**
                The type of data that you are expecting back from the server. This sets the <code>dataType</code> variable of the <a href="http://api.jquery.com/jQuery.ajax/">jQuery ajax object</a>.

                @property datatype
                @type String

                @default "json"
                **/
                datatype: 'json',

                /**
                Function that is called after the ajax request results in an error. When providing the callback as a string the Loadr turns the string into a function before calling it. Note: This conversion does NOT use eval().

                @property error
                @type Function

                @default null
                **/
                error: null,

                /**
                The id (without the hash) or jQuery object of an input element on the page. When typing in this field the Loadr element will auto-update with matching results.

                @property filter
                @type String | HTMLElement | jQuery Object

                @default null
                **/
                filter: null,

                /**
                Message to be displayed when a request returns with no data.

                @property nodata
                @type String

                @default "There is no data available."
                **/
                nodata: 'There is no data available.',

                /**
                Function that is called after a successful ajax request where there is at least one result. This method is called before the template is rendered allowing you to modify the results object as needed. When providing the callback as a string the Loadr turns the string into a function before calling it. Note: This conversion does NOT use eval().

                In order for loadr to continue working you MUST return an object in your parse method and it has to contain a 'Results' property, just like the result from the server.

                @property parse
                @type Function

                @default null
                **/
                parse: function (results) {
                    return results;
                },

                /**
                Adds the request to the request queue. If false the request will bypass the queue and be called immediately.

                @property queue
                @type Boolean

                @default true
                **/
                queue: true,

                /**
                The HTML of the DOM element will be replaced with the results of the Loadr request. If set to false the results of the Loadr request will be appended to the DOM element.

                @property replace
                @type Boolean

                @default true
                **/
                replace: true,

                /**
                Data object to be supplied for preloaded data sets, as opposed to requesting data from the server. This can be used to either save a server hit, in the case of small, unchanging data sets, or for integration with other frameworks that have their own methods for data transport and/or custom object types. This property takes precedence over Loadr's ajax functionality.

                @property resultsdata
                @type Object

                @default null
                **/
                resultsdata: null,

                /**
                Function that is called after a successful ajax request where there is at least one result. When providing the callback as a string the Loadr turns the string into a function before calling it. Note: This conversion does NOT use eval().

                @property success
                @type Function

                @default null
                **/
                success: null,

                /**
                The element where the rendered template will be added to the DOM.

                @property target
                @type jQuery Object

                @default null
                **/
                target: null,

                /**
                The template used to parse the JSON result set. When provided it can either be the id of the template without the '#' - or a snippet of HTML.

                To see the consturction of a template view the <a href="http://handlebarsjs.com/" target="_blank">Handlebars</a> documentation.

                @property template
                @type String

                @default null
                **/
                template: null,

                /**
                The type of request. This sets the <code>type</code> variable of the <a href="http://api.jquery.com/jQuery.ajax/">jQuery ajax object</a>.

                @property type
                @type String

                @default "GET"
                **/
                type: 'GET',

                /**
                The URL to request. This sets the <code>url</code> variable of the <a href="http://api.jquery.com/jQuery.ajax/">jQuery ajax object</a>.

                @property url
                @type String

                @default " "
                **/
                url: '',

                /**
                Function that is called when a request is made. Default value creates a spinnr instance inside the widget's instance. Can be overridden to change the location of spinnr and/or remove the spinnr altogether.

                @property addLoadingImage
                @type Function

                @default _addLoadingImage
                **/
                addLoadingImage: _addLoadingImage,

                /**
                Function that is called after the request is completed. Default value removes the spinnr from the widget's instance. Should be overridden if addLoadingImage is overridden.

                @property removeLoadingImage
                @type Function

                @default _removeLoadingImage
                **/
                removeLoadingImage: _removeLoadingImage
            },

            _create: function () {
                var keyCode = $.ui.keyCode, search;

                this._html = this._html || {};
                this._vars = this._vars || {};

                $.extend(true, this._html, {
                    loading: null
                });

                $.extend(true, this._vars, {
                    complete: $.Callbacks(),
                    deferred: new $.Deferred(),
                    error: $.Callbacks(),
                    filterValue: '',
                    oldFilterValue: '',
                    isLoading: false,
                    originalContent: this.element.contents(),
                    resultsData: null,
                    success: $.Callbacks(),
                    template: null
                });

                if (this.options.target === null) {
                    this.options.target = this.element;
                }

                if (this.options.filter !== null) {
                    if (this.options.filter.constructor !== $) {
                        if (typeof this.options.filter === 'string') {
                            this.options.filter = $('#' + this.options.filter);
                        } else {
                            this.options.filter = $(this.options.filter);
                        }
                    }

                    this.options.filter.on('keydown.loadr focusout.search-cancel-button', _.debounce($.proxy(function (e) {
                            if (e.keyCode !== keyCode.ENTER && e.keyCode !== keyCode.NUMPAD_ENTER && e.keyCode !== keyCode.TAB) {
                                search = $.trim(this.options.filter[0].value);
                                if (this._vars.filterValue === search) {
                                    return;
                                }

                                this._vars.filterValue = this.options.data.search = search;
                                this.reset();
                            }
                        }, this),
                        300
                    ));

                    this._vars.filterValue = $.trim(this.options.filter[0].value);
                    if (this._vars.filterValue.length) {
                        this.options.data.search = this._vars.filterValue;
                    }

                    this.options.filter.wrap('<div class="' + Css.head + '">');
                }

                if (this.options.template) {
                    this.option('template', this.options.template);
                }

                if (this.options.autoload) {
                    this._process();
                }

                /**
                Start the Loadr request attached to the DOM element.

                @method start
                */
                this.start = this.reload;
            },

            _setOption: function (key, value) {
                var returnVal = this._super(key, value),
                    optionMap = {
                        resultsdata: function (value) {
                            setTimeout($.proxy(this.reset, this), 1);
                        },
                        template: function (value) {
                            var template = value, templateName, source;

                            if (typeof template === 'function' || typeof (template = CRUX.stringToFunction(template)) === 'function') {
                                templateName = 'compiledTemplate' + CRUX.guid();
                                Handlebars.registerPartial(templateName, template);

                                // _modifyTemplate is used as hook for further template manipulation if needed by other widgets
                                if (this._modifyTemplate !== undefined) {
                                    source = this._modifyTemplate('{{> ' + templateName + '}}');
                                } else {
                                    source = '{{#each_index .}}{{> ' + templateName + '}}{{/each_index}}';
                                }
                            } else {
                                source = (document.getElementById(value) ? $('#' + value).html() : value);

                                // _modifyTemplate is used as hook for further template manipulation if needed by other widgets
                                if (this._modifyTemplate !== undefined) {
                                    source = this._modifyTemplate(source);
                                } else {
                                    source = '{{#each_index .}}' + source + '{{/each_index}}';
                                }
                            }

                            this._vars.template = Handlebars.compile(source);
                        }
                    };

                if (typeof optionMap[key] === 'function') {
                    optionMap[key].call(this, value);
                }

                return returnVal;
            },

            _process: function () {
                if (this.element.parent().is(':visible')) {
                    this.options.addLoadingImage.call(this);
                }

                if (this.options.queue) {
                    queue.add(this, this._load);
                    queue.start();
                } else {
                    this._load();
                }
            },

            _load: function () {
                this._vars.isLoading = true;
                this._vars.resultsData = null;

                return this._call()
                    .done($.proxy(this._successDecorator, this))
                    .fail($.proxy(this._error, this))
                    .always($.proxy(this._complete, this));
            },

            _call: function () {
                var dfd = new $.Deferred();

                if (this.options.resultsdata) {
                    dfd.resolve();
                } else if (!this.options.url) {
                    dfd.reject();
                } else {
                    this._vars.request = $.ajax(this.options.url, {
                        async: this.options.async,
                        cache: this.options.cache,
                        contentType: this.options.contenttype,
                        context: this,
                        data: this.options.type === 'POST' ? JSON.stringify(this.options.data) : this.options.data,
                        dataType: this.options.datatype,
                        error: dfd.reject,
                        success: dfd.resolve,
                        traditional: true,
                        type: this.options.type
                    });
                }

                return dfd;
            },

            _successDecorator: function () {
                // Adapter function for _success, which expects the legitimate callback parameters from $.ajax...
                // If we have arguments, we've received them from a legitimate $.ajax call, otherwise, we're
                // Pulling from the locally-supply data source, which we forward on... status and jxhr aren't
                // currently used in our own _success/_error/_complete methods, so it's ok that they're undefined.
                if (arguments.length) {
                    this._success.apply(this, arguments);
                } else {
                    var results = this.options.resultsdata,
                        search = this.options.clientsearch,
                        filter = this.options.clientfilter;

                    if (typeof results === 'string') {
                        results = CRUX.stringToObject(results);
                    }

                    if (typeof search === 'string') {
                        search = CRUX.stringToFunction(search);
                    }

                    if (typeof filter === 'string') {
                        filter = CRUX.stringToFunction(filter);
                    }

                    try {
                        results = $.extend(true, (this.options.allresults === false ? {} : []), results);

                        if (this.options.allresults === false && results.Results) {
                            results.Results = search.call(this, results.Results);
                        } else if (this.options.allresults === true) {
                            results = search.call(this, results);
                        }
                    } catch (e) {
                        this._error(undefined, 'parseerror', 'error');
                    }

                    this._success(filter.call(this, results));
                }
            },

            _success: function (results, status, jxhr) {
                var parser = this.options.parse;

                this.options.target.find('[class^="loadr-status"]').remove();

                if (this.options.replace === true || (this.options.filter instanceof jQuery && this._vars.filterValue !== this._vars.oldFilterValue)) {
                    this.options.target.empty();
                }

                if (typeof parser === 'string') {
                    parser = CRUX.stringToFunction(this.options.parse);
                }

                this._vars.resultsData = results = parser(results);

                if (this.options.allresults === false && results.Results === undefined) {
                    this._error(jxhr, 'parseerror', 'error');
                    return;
                }

                if ((this.options.allresults === true && !results.length) || (this.options.allresults === false && !results.Results.length)) {
                    this._error(jxhr, 'nodata', 'error');
                    return;
                }

                if (this.options.template && this._processOutput === undefined) {
                    this.options.target.append(this._vars.template(this.options.allresults ? results : results.Results));
                } else if (this._processOutput) {
                    this._processOutput();
                }

                /**
                Triggered after an successful server response from an ajax request where there is data.

                If you are binding to this event the widget name is automatically prefixed to the event.

                <code>
                $('.example').on( "{widgetname}success", function(event) {});
                </code>

                @event success
                **/
                this._trigger('success', null, [results]);
                this._vars.success.fireWith(this, [this.element[0], results]);
            },

            _contentHelper: function (message, status) {
                var html = '',
                    err = 'loadr-status-';

                if (this.options.target.is('table')) {
                    html = $('<tr><td></td></tr>');
                    html.find('td').addClass(err + status).append(message);
                } else if (this.options.target.is('ol, ul')) {
                    html = $('<li>').addClass(err + status).append(message);
                } else {
                    html = $('<div>').addClass(err + status).append(message);
                }

                return html;
            },

            _error: function (jxhr, status, error) {
                var msg = 'There was an error retrieving data.';

                if (status === 'timeout') {
                    msg = 'The request has timed out.';
                } else if (status === 'abort') {
                    msg = 'The request has been aborted.';
                } else if (status === 'parseerror') {
                    msg = 'The data returned is not in the correct format';
                } else if (status === 'nodata') {
                    msg = this.options.nodata;
                }

                this.options.target.html(this._contentHelper(msg, status));

                /**
                Triggered after an unsuccessful server response from an ajax request or if there is no data returned in a successful response.

                If you are binding to this event the widget name is automatically prefixed to the event.

                <code>
                $('.example').on( "{widgetname}error", function(event) {});
                </code>

                @event error
                **/
                this._trigger('error', null, {textStatus: status, errorThrown: error});
                this._vars.error.fireWith(this, [this.element[0], status, error]);
            },

            _complete: function (xhr) {
                if (this._html.loading !== null) {
                    this.options.removeLoadingImage.call(this);
                } else {
                    this._loadComplete();
                }
                this._vars.oldFilterValue = this._vars.filterValue;
            },

            _loadComplete: function () {
                this._vars.isLoading = false;

                /**
                Triggered after a loadr request has been completed and the loading animation has been removed from the DOM.

                If you are binding to this event the widget name is automatically prefixed to the event.

                <code>
                $('.example').on( "{widgetname}complete", function(event) {});
                </code>

                @event complete
                **/
                this._trigger('complete', null, [this._vars.resultsData]);
                this._vars.complete.fireWith(this, [this.element[0], this._vars.resultsData]);

                if ($.fn.iconic) {
                    this.options.target.find('[class^=iconic]').iconic();
                }
            },

            /**
            Add a callback to the stack (success, error, complete). See <a href="http://api.jquery.com/callbacks.add/" target="_blank">jQuery Callbacks (add)</a> for more details.

            @method add

            @param {String} type The type of callback to add.
            @param {Function | Array} fn A function or an array of functions.
            */
            add: function (type) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (!args.length) {
                    return;
                }

                this._vars[type].add(args);
            },

            /**
            Remove a callback from the stack (success, error, complete). See <a href="http://api.jquery.com/callbacks.remove/" target="_blank">jQuery Callbacks (remove)</a> for more details.

            @method remove

            @param {String} type The type of callback to remove.
            @param {Function | Array} fn A function or an array of functions.
            */
            remove: function (type) {
                var self = this,
                    args = Array.prototype.slice.call(arguments, 1);

                if (!args.length) {
                    return;
                }

                $.each(args, function (i, cb) {
                    if ($.type(cb) === 'array') {
                        $.each(cb, function (j, _cb) {
                            self.remove(type, _cb);
                        });
                    } else {
                        self._vars[type].remove(cb);
                    }
                });
            },

            /**
            Reload the Loadr request attached to the DOM element. Aborts any currently executing request (that is attached to this element).

            @method reload
            */
            reload: function () {
                if (this._vars.request && this._vars.request.state() === 'pending') {
                    this._vars.request.abort();
                }
                this._process();
            },

            reset: function () {
                this.reload();
            },

            destroy: function () {
                this.element.empty().append(this._vars.originalContent);

                $.Widget.prototype.destroy.call(this);
            }
        });

        $(function () {
            $('.deferred').loadr();
        });
    }
));
