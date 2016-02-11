/*! crux-button - v1.0.0 - 2015-03-04
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />

/**
For interactions with and state management for buttons.

@class Button
@extends Base
@module Widgets

@tests button/index.html
@demo docs/demos/button.jade
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
    'use strict';

    var Namespace = 'cs-button-',

        Css = {
          busy: Namespace + 'busy ui-state-busy'
        };

    $.widget('crux.button', {
      options: {
        /**
        Sets whether the component is currently in a busy state or not. Emits an event only when state is actually changed.

        @property busy
        @type Boolean

        @default false
        **/
        busy: false,

        /**
        Sets whether the component should also be disabled whenever its state is changed to a busy state. This will also enable the component when the busy state has been cleared, unless the component has been explicitly disabled by some other piece of code.

        @property disablewhenbusy
        @type Boolean

        @default true
        **/
        disablewhenbusy: true
      },

      _css: Css,

      _create: function () {
        this._vars = {
          disabled: false
        };

        this._attachEvents();

        // If we're initializing this button as busy, make
        // sure to call _setOption to get its state in check
        if (this.options.busy) {
          this.options.busy = false;
          this.busy();
        }
      },

      _attachEvents: function () {
        this._on({
          click: this._forwardTrigger
        });
      },

      _checkDisabled: function () {
        var isDisabled;

        if (this.options.disablewhenbusy) {
          // Cache our current disabled value
          isDisabled = this._vars.disabled;

          // disable will set our internal disabled check to true,
          // so we want to fire it and then set it to whatever our
          // cached value is from above... our internal disabled
          // check is to determine whether this element has been
          // legitimately disabled or is only disabled because the
          // button is flagged as busy... we don't re-enable the
          // button on ready if it's been explicitly disabled
          this.disable();
          this._vars.disabled = isDisabled;
        }
      },

      _checkEnabled: function () {
        if (this.options.disablewhenbusy && !this._vars.disabled) {
          this.enable();
        }
      },

      _forwardTrigger: function (e) {
        this._trigger(e.type, e, e.target);
      },

      _setOption: function (key, value) {
        var isBusy = this.options.busy,
            returnVal = this._super(key, value),
            optionMap = {
              busy: function (value) {
                this.element.toggleClass(Css.busy, value);

                if (value && !isBusy) {
                  this._checkDisabled();
                  this._trigger('busy');
                } else if (!value && isBusy) {
                  this._checkEnabled();
                  this._trigger('ready');
                }
              },
              disabled: function (value) {
                this._vars.disabled = value;

                if (!value && this.options.disablewhenbusy && this.options.busy) {
                  this.disable();
                  this._vars.disabled = value;
                }
              }
            };

        if (optionMap[key] !== undefined) {
          optionMap[key].call(this, value);
        }

        return returnVal;
      },

      /**
      Sets the button to a <strong>busy</strong> state, similar to how the <code>disable</code> method sets a component to a <strong>disabled</strong> state. Emits a 'buttonbusy' event.

      @method busy
      **/
      busy: function () {
        this.option('busy', true);
      },

      /**
      Sets the button to a <strong>ready</strong> state, similar to how the <code>enable</code> method sets a component back to an <strong>enabled</strong> state. Emits a 'buttonready' event.

      @method ready
      **/
      ready: function () {
        this.option('busy', false);
      },

      /**
      A dual-use method, which acts as a getter or setter, depending on whether or not a parameter is passed. If not passed, acts as a getter, and returns the current text of the button's display.

      @method value

      @param {String | Number} [value] The value to which the button's display text should be set.
      **/
      value: function (value) {
        if (this.element.is('input')) {
          this.element[0].value = value;
        } else if (this.element.is('button')) {
          this.element.text(value);
        }
      }
    });

    $(function () {
      $(':button, input[type="reset"], input[type="submit"]').button();
    });
  }
));
