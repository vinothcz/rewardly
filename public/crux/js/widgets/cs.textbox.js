/*! crux-textbox - v1.0.0 - 2015-03-04
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />

/**
For interactions with text inputs and textareas. Adds some auto-formatting options, such as converting values to upper/lower/propercase automatically, trimming whitespace, etc.

@class Textbox
@extends Base
@module Widgets

@tests textbox/index.html
@demo docs/demos/textbox.jade
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

    $.widget('crux.textbox', {
      options: {
          /**
          Sets whether the value of the component should automatically be trimmed of leading and trailing whitespace when the user blurs away from it.

          @property trim
          @type Boolean

          @default true
          **/
          trim: true,

          /**
          Sets the type of formatting that the component should automatically use for its value when the user blurs away from it. Accepted values are <code>null</code>, <strong>lower</strong>, <strong>upper</strong>, and <strong>proper</strong>.

          @property format
          @type String

          @default null
          **/
          format: null
      },

      _create: function () {
        this._super();

        this._on({
          keyup: this._forwardTrigger,
          keydown: this._forwardTrigger,
          keypress: this._forwardTrigger,
          focus: this._forwardTrigger,
          blur: this._forwardTrigger,
          change: this._forwardTrigger
        });

        this._setOptions(this.options);
      },

      _setOptions: function (options) {
        var optionMap = {
          trim: function (value) {
            this.element.off('textboxblur.trim');

            if (value) {
              this.element.on('textboxblur.trim', $.proxy(this._trim, this));
              this._delay(this._trim, 0);
            }
          },
          format: function (value) {
            this.element.off('textboxblur.format');

            if ($.inArray(value, ['default', 'lower', 'upper', 'proper']) === -1) {
              value = 'default';
            }

            if (value !== 'default') {
              this.element.on('textboxblur.format', $.proxy(this._format, this));
              this._delay(this._format, 0);
            }

            return value;
          }
        };

        if (options.trim !== undefined) {
          optionMap.trim.call(this, options.trim);
        }

        if (options.format !== undefined) {
          options.format = optionMap.format.call(this, options.format);
        }

        return this._super(options);
      },

      _forwardTrigger: function (e) {
        this._trigger(e.type, e, e.target);
      },

      _trim: function () {
        var value = this.element[0].value;

        if (value.match(/^\s|\s$/)) {
          this.value(this.element[0].value.replace(/^\s+/, '').replace(/\s+$/, ''));
        }
      },

      _format: function () {
        var value = this.element[0].value,
            adjustedValue = value,
            formatMap = {
              lower: function (value) {
                return value.toLowerCase();
              },
              upper: function (value) {
                return value.toUpperCase();
              },
              proper: function (value) {
                return value.toLowerCase().replace(/^(.)|\s(.)/g, function($1) {
                  return $1.toUpperCase();
                });
              }
            };

        if (formatMap[this.options.format] !== undefined) {
          value = formatMap[this.options.format].call(this, value);
        }

        this.value(value);
      },

      /**
      When called with no parameters, acts as a getter for the current value of the component. When called with a parameter, acts as a setter for the current value of the component.

      @method value

      @param {String | Number} value The new value to set the textbox to.
      **/
      value: function (value) {
        if (value === undefined) {
          return this.element[0].value;
        }

        if (value !== this.element[0].value) {
          this.element[0].value = value;
          this.element.trigger('change');
        }
      },

      _destroy: function () {
        this.element.off('textboxblur.format');
        this.element.off('textboxblur.trim');
      }
    });

    $(function () {
      $(':text, textarea').textbox();
    });
  }
));
