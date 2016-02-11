/*! crux-template - v1.0.0 - 2015-03-04
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />
/// <reference path="cs.helpers.js" />

/**
Adds template support to any component. Intended to be coupled to other components as an internal utility component for processing data-driven templates.

@class Template
@extends Base
@uses Helpers
@module Widgets

@tests template/index.html
@demo docs/demos/template.jade
**/

(function (window, define, factory, undefined) {
  "use strict";

  if (define !== undefined) {
    define(['handlebars', './cs.base.js', './cs.helpers.js'], factory);
  } else {
    factory(Handlebars);
  }
}(
  this,
  this.define,
  function (handlebars) {
    'use strict';

    $.widget('crux.template', {
      options: {

        /**
        The template compiler used to process the template string into a function.

        @property compiler
        @type Function

        @default Handlebars.compile
        **/
        compiler: handlebars.compile,

        /**
        The template used to parse the JSON result set. When provided it can either be the id of the template without the '#', a snippet of HTML, or a precompiled javascript template function.

        To see the construction of a template view the <a href="http://handlebarsjs.com/" target="_blank">Handlebars</a> documentation.

        @property template
        @type String | Function

        @default ''
        **/
        template: ''
      },

      _create: function () {
        this._vars = {
          compiler: null,
          template: null
        };
      },

      _init: function () {
        var html;

        if (!this.options.template) {
          html = this.element.html();

          if (html) {
            this.options.template = html;
          }
        }

        this._setOptions(this.options);
      },

      _setOptions: function (options) {
        var ret = this._super(options);

        if (options.template || options.compiler) {
          this._vars.template = null;

          if (options.compiler) {
            this._vars.compiler = null;
          }

          this._setTemplate();
        }

        return ret;
      },

      _setTemplate: function () {
        var compiler;

        if (this._vars.compiler === null) {
          compiler = this.options.compiler;

          if (typeof compiler === 'string') {
            compiler = CRUX.stringToFunction(compiler);
          }

          this._vars.compiler = compiler;
        }

        if (this._vars.template === null) {
          if (typeof this.options.template === 'string') {
            this._vars.template = this._vars.compiler(this.options.template);
          } else if (typeof this.options.template === 'function') {
            this._vars.template = this.options.template;
          }
        }
      },

      /**
      Renders the template with the provided data, and broadcasts it via the 'templaterendered' event.

      @method render

      @param {Object | Array} data The data to be used when rendering the template.
      **/
      render: function (data) {
        var markup;

        if (this._vars.template === null) {
          this._setTemplate();
        }

        if (this._vars.template === null) {
          throw new Error('Unable to process template. Make sure a compiler and template have been properly set.');
        }

        markup = this._vars.template(data);
        this._trigger('rendered', null, markup);
      }
    });

    $(function () {
      $('.deferred-template').template();
    });
  }
));
