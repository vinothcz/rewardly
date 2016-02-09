/*! crux-base - v2.9.1 - 2015-01-22
* Copyright (c) 2015 Advisory Board Company; */

/**
@module Widgets
@main
**/

(function (window, define, factory, undefined) {
    'use strict';

    if (define !== undefined) {
        define(['./cs.core.js'], factory);
    } else {
        factory(CRUX);
    }
}(
this, this.define, function (core) {
    'use strict';

    /**
    Widgets are a collection of tools that can be embedded in your application.

    @class Base
    @module Widgets

    @tests base/index.html
    **/

    /**
    <b>Getter / Setter</b>

    There a three different scenarios for this method:
    <ol>
        <li>When calling option by itself the entire options object for the widget is returned.</li>
        <li>When only a key is provided the value for that key is returned.</li>
        <li>When a key and value are provided the key is now set to the value.</li>
    </ol>
    <i>Note: Even though any option can be updated/changed after initialization not all options will have an effect on the widget after they have been changed.</i>

    @param {String | Object} [key] The key that corresponds to a property on the widget. You can set multiple options using an object instead of a string.
    @param {Any} [value] The value to update the corresponding option for the widget.

    @method option
    **/

    /**

    By default the widget includes the default option of 'disabled':

    <code>('option', 'disabled', false)</code>

    @property disabled
    @type option

    @default false

    **/

    /**
    Returns the element that initialized the widget.

    @method widget
    **/

    /**
    Unbinds all events and removes all generated html from the element. This will return the element back to its pre-init state.

    @method destroy
    **/

    /**
    Helper method that calls ('option', 'disabled', true).

    @method disable
    **/

    /**
    Helper method that calls ('option', 'disabled', false).

    @method enable
    **/


    // Update to $.Widget
    $.extend($.Widget.prototype, {
        _prototypeCallbacks: {},

        _getCreateOptions: function () {
            var el = this.element[0],
                x = 0,
                options = {},
                option;

            for (x; x < el.attributes.length; x += 1) {
                if (el.attributes[x].name.indexOf('data-cs-') === 0) {
                    option = el.attributes[x].name.substr(8);
                    if (this.options[option] !== undefined) {
                        options[option] = this.element.data($.camelCase(el.attributes[x].name.substr(5)));
                    }
                }
            }

            // For artbitrary event publishing
            this._callbacks = {};

            return options;
        },

        /**
        Binds a before/after event trigger to any internal widget function (except for "_createWidget" and "_trigger").

        <pre class="prettyprint">
        <code>
        $().widget('publish', 'before', 'show'); //Triggers 'widgetbeforeshow' event before every call to $().widget('show'), across all instances
        $().widget('publish', 'after', 'show', false, true); //Triggers 'widgetaftershow' event after every call to $().widget('show'), only on the current instance
        $().widget('publish', 'after', '_build', true); //Triggers 'widgetafter_build' event after every call to this._build (internally), and fails silently if that function is missing
        </code>
        </pre>

        @method publish
        @param {String} [when] When to trigger the event ('before' or 'after').
        @param {String} [fnName] Function to bind this publisher to.
        @param {Boolean} [failSilently] How to fail if the function implementation doesn't exist (defaults to throwing an exception).
        @param {Boolean} [onlyAlterThisInstance] Whether to alter the widget prototype to affect all instances, or just this specific instance (defaults to prototype).
        @return {jQuery Object} Element for this widget instance
        **/
        publish: function (when, fnName, failSilently, onlyAlterThisInstance) {
            this._setEventPublisher(when, fnName, failSilently, onlyAlterThisInstance, true);
        },

        /**
        Unbinds a before/after event trigger from any internal widget function (except for "_createWidget" and "_trigger").

        <pre class="prettyprint">
        <code>
        $().widget('unpublish', 'before', 'show'); //Unbinds 'widgetbeforeshow' event from every call to $().widget('show'), across all instances
        $().widget('unpublish', 'after', 'show', false, true); //Unbinds 'widgetaftershow' event from every call to $().widget('show'), only on the current instance
        $().widget('unpublish', 'after', '_build', true); //Unbinds 'widgetafter_build' event from every call to this._build (internally), and fails silently if that function is missing
        </code>
        </pre>

        @method unpublish
        @param {String} [when] When to trigger the event ('before' or 'after').
        @param {String} [fnName] Function to bind this publisher to.
        @param {Boolean} [failSilently] How to fail if the function implementation doesn't exist (defaults to throwing an exception).
        @param {Boolean} [onlyAlterThisInstance] Whether to alter the widget prototype to affect all instances, or just this specific instance (defaults to prototype).
        @return {jQuery Object} Element for this widget instance
        **/
        unpublish: function (when, fnName, failSilently, onlyAlterThisInstance) {
            this._setEventPublisher(when, fnName, failSilently, onlyAlterThisInstance, false);
        },

        /**
         * Convenience function for publish/unpublish to pass through to
         **/
        _setEventPublisher: function (when, fnName, failSilently, onlyAlterThisInstance, value) {
            var callbackPointer = null;

            if ($.inArray(when, ['before', 'after']) === -1) {
                throw new RangeError('"when" parameter must be either "before" or "after".');
            }

            if ($.inArray(fnName, ['_createWidget', '_trigger']) !== -1) {
                throw new Error('Publish function cannot bind to "_createWidget" or "_trigger" functions.');
            }

            callbackPointer = (onlyAlterThisInstance ? this._callbacks : $[this.namespace][this.widgetName].prototype._prototypeCallbacks);

            if (this[fnName] === undefined) {
                if (failSilently) {
                    return;
                }

                throw new RangeError('No function by the name ' + fnName);
            }

            callbackPointer[fnName] = callbackPointer[fnName] || {};
            callbackPointer[fnName][when] = value;
        },

        /**
        Gets the the HTML that is generated by a widget. This method will return a jQuery wrapped element, an object literal containing a collection of HTML elements, or null if no matches are found. If the widget contains no generated HTML the method returns the element that instantiated the widget wrapped in a jQuery object. The key is a string that corresponds to a propery on the HTML object. You can retrieve nested objects by using dot notation.

        <pre class="prettyprint">
        <code>
        //Example HTML object structure
        {
            wrapper: $('&lt;div /&gt;'),
            group: {
                item: $('&lt;span /&gt;')
            }
        }

        $().widget('html'); //Returns { wrapper: $('&lt;div /&gt;'), group: { item: $('&lt;span /&gt;') } }
        $().widget('html', 'group'); //Returns { item: $('&lt;div /&gt;') }
        $().widget('html', 'wrapper'); //Returns $('&lt;div /&gt;')
        $().widget('html', 'group.item'); //Returns $('&lt;span /&gt;')
        </code>
        </pre>

        @method html
        @param {String} [key] The HTML to retrieve.
        @return {jQuery Object | Object | null} Element or collection of elements
        **/
        html: function (key) {
            if (!this._html) {
                return this.element;
            }

            var curHTML = $.extend({}, this._html),
                i = 0,
                html,
                parts;

            if (!key) {
                return curHTML;
            }

            parts = key.split('.');
            key = parts.shift();

            if (parts.length) {
                curHTML = $.extend({}, this._html[key]);

                for (i; i < parts.length - 1; i += 1) {
                    curHTML[parts[i]] = curHTML[parts[i]] || {};
                    curHTML = curHTML[parts[i]];
                }

                key = parts.pop();
            }

            html = curHTML[key];

            if ($.isPlainObject(html)) {
                return html;
            }

            if (html && !(html instanceof jQuery)) {
                html = $(html);
            }

            return html === undefined ? null : html;
        }
    });

    /*
     Overwrites the default trigger functionality to first check if the supplied callback is a string.
     If the callback is a string we convert it to a function and continue with triggering the event and
     and the specified callback function. Copied over whole function - the event was being called twice
     for some reason in 1.9 - need to investigate further.
    */
    $.Widget.prototype._trigger = function (type, event, data) {
        var prop, orig, callback;

        if (typeof this.options[type] === 'string') {
            callback = core.stringToFunction(this.options[type]);
        } else {
            callback = this.options[type];
        }

        data = data || {};
        event = $.Event(event);
        event.type = (type === this.widgetEventPrefix ?
            type :
            this.widgetEventPrefix + type).toLowerCase();
        // the original event may come from any element
        // so we need to reset the target on the new event
        event.target = this.element[0];

        // copy original event properties over to the new event
        orig = event.originalEvent;
        if (orig) {
            for (prop in orig) {
                if (!(prop in event)) {
                    event[prop] = orig[prop];
                }
            }
        }

        this.element.trigger(event, data);
        return !($.isFunction(callback) &&
            callback.apply(this.element[0], [event].concat(data)) === false ||
            event.isDefaultPrevented());
    };

    /**
     * Loops through the members of an object intended to be used as a widget prototype, finding all members of
     * type 'function', and wrapping them in a closure that checks internal properties of _prototypeCallbacks
     * and _callbacks to see if they have an object-mapped named entry for the given function name, and if that
     * entry has before/after properties set to true. If they do, we trigger a before/after event for this
     * function as appropiate, and pass our scope and arguments on to the intended function... This allows for
     * arbitrary publishing of events at runtime.
     **/
    function decorateForPublishing(prototype) {
        prototype._prototypeCallbacks = prototype._prototypeCallbacks || {};

        $.each(prototype, function (key, callback) {
            if (typeof callback === 'function' && !callback.overridden && $.inArray(key, ['_createWidget', '_trigger']) !== 1) {
                prototype._prototypeCallbacks[key] = prototype._prototypeCallbacks[key] || {};

                var closure = function () {
                    var beforeReturnVal = null,
                        args = $(arguments).toArray(),
                        beforeEventType = 'before' + key,
                        beforeEvent = $.Event(beforeEventType),
                        closureCompletion = $.proxy(function () {
                            var returnVal = null,
                                deferredResults = $(arguments).toArray(),
                                continueExecution = (function () {
                                    var result = true;

                                    $.each(deferredResults, function (index, deferredResult) {
                                        if (deferredResult === false) {
                                            result = false;
                                        }

                                        return result;
                                    });

                                    return result;
                                }());

                            if (continueExecution !== false) {
                                // Store the return value for later
                                returnVal = callback.apply(this, args);

                                /**
                                 * If we're not explicitly unpublishing an event at the instance level, check
                                 * both the prototype and instance levels for arbitrary event publishing.
                                 **/
                                if (!this._callbacks || !this._callbacks[key] || this._callbacks[key].after !== false) {
                                    if (($[this.namespace][this.widgetName].prototype._prototypeCallbacks[key] && $[this.namespace][this.widgetName].prototype._prototypeCallbacks[key].after) || (this._callbacks && this._callbacks[key] && this._callbacks[key].after !== false)) {
                                        this._trigger('after' + key);
                                    }
                                }

                            }

                            // Return the actual output of our target function to the caller
                            return returnVal;
                        }, this);

                    beforeEvent.deferredList = [];

                    /**
                     * If we're not explicitly unpublishing an event at the instance level, check
                     * both the prototype and instance levels for arbitrary event publishing.
                     **/
                    if (!this._callbacks || !this._callbacks[key] || this._callbacks[key].before !== false) {
                        if (($[this.namespace][this.widgetName].prototype._prototypeCallbacks[key] && $[this.namespace][this.widgetName].prototype._prototypeCallbacks[key].before) || (this._callbacks && this._callbacks[key] && this._callbacks[key].before)) {
                            beforeEvent.defer = function (deferred) {
                                beforeEvent.deferredList.push(deferred);
                            };

                            this._trigger(beforeEventType, beforeEvent);
                        }
                    }

                    // If we got a false return from our before trigger, suppress this function call altogether
                    if (beforeEvent.isDefaultPrevented()) {
                        return;
                    }

                    /**
                     * Check for any deferred objects that have been attached to this event, and if they're
                     * present, bind the rest of our execution chain to its success function... We also allow
                     * a fail function call the rest of our execution chain, but only if it doesn't
                     * explicitly return false as its first parameter.
                     **/
                    if (beforeEvent.deferredList.length) {
                        var valueDeferred = $.Deferred();

                        $.when.apply(null, beforeEvent.deferredList).always($.proxy(function () {
                            var returnVal = closureCompletion.apply(this, arguments);

                            valueDeferred.resolve(returnVal);
                        }, this));

                        return valueDeferred.promise();
                    }

                    // Return the rest of our execution chain results if neither of the above conditions pass
                    return closureCompletion();
                };

                closure.guid = prototype[key].guid;
                closure.overridden = true;
                prototype[key] = closure;
            }
        });
    }

    decorateForPublishing($.Widget.prototype);

    var widgetFactory = $.widget;

    /**
     * Hijack the $.widget function to add our own sorcery for arbitrary event publishing on all of our widgets
     **/
    $.widget = function (name, base, prototype) {
        var targetPrototype = prototype;

        if (!targetPrototype) {
            targetPrototype = base;
        }

        decorateForPublishing(targetPrototype);

        return widgetFactory.apply(this, arguments);
    };

    for (var key in widgetFactory) {
        if (widgetFactory.hasOwnProperty(key)) {
            $.widget[key] = widgetFactory[key];
        }
    }

    // Somewhere along the line, $.ui.keyCode lost some values, so we're replacing them here, with compatibility
    $.extend($.ui.keyCode, {
        ALT: $.ui.keyCode.ALT || 18,
        BACKSPACE: $.ui.keyCode.BACKSPACE || 8,
        CAPS_LOCK: $.ui.keyCode.CAPS_LOCK || 20,
        COMMA: $.ui.keyCode.COMMA || 188,
        COMMAND: $.ui.keyCode.COMMAND || 91,
        COMMAND_LEFT: $.ui.keyCode.COMMAND_LEFT || 91, // COMMAND
        COMMAND_RIGHT: $.ui.keyCode.COMMAND_RIGHT || 93,
        CONTROL: $.ui.keyCode.CONTROL || 17,
        DELETE: $.ui.keyCode.DELETE || 46,
        DOWN: $.ui.keyCode.DOWN || 40,
        END: $.ui.keyCode.END || 35,
        ENTER: $.ui.keyCode.ENTER || 13,
        ESCAPE: $.ui.keyCode.ESCAPE || 27,
        HOME: $.ui.keyCode.HOME || 36,
        INSERT: $.ui.keyCode.INSERT || 45,
        LEFT: $.ui.keyCode.LEFT || 37,
        MENU: $.ui.keyCode.MENU || 93, // COMMAND_RIGHT
        NUMPAD_ADD: $.ui.keyCode.NUMPAD_ADD || 107,
        NUMPAD_DECIMAL: $.ui.keyCode.DECIMAL || 110,
        NUMPAD_DIVIDE: $.ui.keyCode.DIVIDE || 111,
        NUMPAD_ENTER: $.ui.keyCode.ENTER || 108,
        NUMPAD_MULTIPLY: $.ui.keyCode.MULTIPLY || 106,
        NUMPAD_SUBTRACT: $.ui.keyCode.SUBTRACT || 109,
        PAGE_DOWN: $.ui.keyCode.PAGE_DOWN || 34,
        PAGE_UP: $.ui.keyCode.PAGE_UP || 33,
        PERIOD: $.ui.keyCode.PERIOD || 190,
        RIGHT: $.ui.keyCode.RIGHT || 39,
        SHIFT: $.ui.keyCode.SHIFT || 16,
        SPACE: $.ui.keyCode.SPACE || 32,
        TAB: $.ui.keyCode.TAB || 9,
        UP: $.ui.keyCode.UP || 38,
        WINDOWS: $.ui.keyCode.WINDOWS || 91 // COMMAND
    });
}));
