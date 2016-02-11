/*! crux-tokenizr - v1.0.0 - 2015-03-04
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />
/// <reference path="cs.template.js" />

/**
For creating and working with visual token placeholders. This is meant to be a generic token creator, which can be coupled to other components that want to integrate some kind of tokenized lists.

@class Tokenizr
@extends Base
@uses Template
@module Widgets

@tests tokenizr/index.html
@demo docs/demos/tokenizr.jade
**/

(function (window, define, factory, undefined) {
  "use strict";

  if (define !== undefined) {
    define(['./cs.base.js', './cs.template.js'], factory);
  } else {
    factory();
  }
}(
  this,
  this.define,
  function () {
    "use strict";

    var Namespace = 'cs-tokenizr-',

        Css = {
          list: Namespace + 'list',
          remove: Namespace + 'remove',
          text: Namespace + 'text',
          token: Namespace + 'token'
        };

    $.widget('crux.tokenizr', {
      options: {
      },

      _css: Css,

      _create: function () {
        this._html = {
          target: null
        };

        if (this.element.is('ul')) {
          this._html.target = this.element;
        } else {
          this._html.target = $('<ul></ul>').appendTo(this.element);
        }

        this._html.target.addClass(this._css.list);
        this._html.target.template({
          template: '<li class="' + this._css.token + '" data-token-value="{{Value}}"><span class="tag{{#if ClassName}} {{ClassName}}{{/if}}"><span class="' + this._css.text + '">{{Text}}</span><span class="' + this._css.remove + '"><i class="iconic x-alt"></i></span></span></li>'
        });

        this._attachEvents();
      },

      _init: function () {
        this._setOptions(this.options);
      },

      _attachEvents: function () {
        this._on({
          templaterendered: this._renderToken
        });
      },

      _renderToken: function (e, markup) {
        var token = $(markup).appendTo(this._html.target);

        e.stopPropagation();

        this._trigger('tokenadded', null, token);
      },

      /**
      Adds a token to the token list container. Emits a 'tokenizrtokenadded' event when complete. Expects an object map with, at minimum, a <strong>text</strong> property, and optionally, a <strong>value</strong> and a <strong>className</strong> property for additional information about the token being generated. If no <strong>value</strong> is passed, it will be defaulted to the <strong>text</strong> value.

      @method add

      @param {Object} tokenData The data to be used for creating the new token.
      **/
      add: function (tokenData) {
        this._html.target.template('render', {
          ClassName: tokenData.className || undefined,
          Text: tokenData.text,
          Value: tokenData.value || tokenData.text
        });
      },

      /**
      Removes a token from the token list container. Emites a 'tokenizrtokenremoved' event when complete. Expects a <strong>token</strong> parameter, which is a DOM element reference, or a jQuery reference to a DOM element.

      @method remove

      @param {Element | jQuery} token The data to be used when rendering the template.
      **/
      remove: function (token) {
        var $token = $(token);

        if (!$token.is('.' + this._css.token)) {
          return;
        }

        $token.remove();

        this._trigger('tokenremoved', null, token);
      },

      /**
      Returns the cumulative value of the entire list of tokens. Similar to a multi-select list, if there are no tokens, the return value will be <code>null</code>. If there are any number of tokens generated, the return value will be an array of all of the values of the individual tokens.

      @method value
      **/
      value: function () {
        var returnVal = [];

        returnVal = $.map(this._html.target.find('.' + this._css.token), function (token) {
          return $(token).attr('data-token-value');
        });

        if (!returnVal.length) {
          returnVal = null;
        }

        return returnVal;
      },

      _destroy: function () {
        this._html.target.find('.' + this._css.token).each($.proxy(function (i, token) {
          this.remove(token);
        }, this));
        this._html.target.removeClass(this._css.list);
      }
    });

    $(function () {
      $(document).on('click', '.' + Css.remove, function () {
        var token = $(this).closest('.' + Css.token),
            tokenizr = token.closest(':crux-tokenizr');
        tokenizr.tokenizr('remove', token);
      });

      $('.deferred-tokenizr').tokenizr();
    });
  }
));
