/*! utils-inputsearch - v2.0.0 - 2015-08-03
* Copyright (c) 2015 Advisory Board Company */

/*global _ */

/**
A HTML5 polyfill for input[type="search"]. Adds a custom cancel button to the input search field for all the browsers.
The cancel button allows to clear the input field.
@class InputSearch
@module Widgets

@demo docs/demos/inputsearch.jade
**/
(function (window, define, factory, undefined) {
    'use strict';

    if (define !== undefined) {
        define(factory);
    } else {
        factory();
    }
}(this, this.define, function () {
  "use strict";

  /**
   * Searchfield constructor
   *
   * @param {jQuery|Element} $el Input element we want to augment
   * @param {Object=} options Behaviour options
   * @constructor
   */
  function Searchfield($el, options){
    this.$el = $el;
    this.options = options || {};
    this.$cancelButton = null;

    if (!$el || !$el instanceof $){
      throw new TypeError('$el should be a jQuery Selector instance.');
    }

    // Initializing features
    this.options.showCancel && this.setupCancelButton();
  }

  // Methods
  Searchfield.prototype = {
    /**
     * Clear the search field
     * @method clear
     */
    clear: function clear(){
      this.$el.val('').focus().trigger('keyup');

      this.hideCancelButton();
    },
    /**
     * Creates a Cancel Button and attach events to it
     * @method setupCancelButton
     */
    setupCancelButton: function setupCancelButton(){
      this.$cancelButton = $( document.createElement('i') );
      var iconStyle ='',
          iconSize,
          iconClass;

      if (this.$el.hasClass('extra-large')) {
        iconSize = 24;
        iconClass = 'luna-icon-24 icon-x-circle-fill';
        this.$cancelButton
          .addClass('luna-icon-24 icon-x-circle-fill search-cancel-button hidden')
          .on('click', $.proxy(this.clear, this))
          .insertAfter(this.$el);
      }
      else {
        iconSize = 16;
        iconClass = 'luna-icon-16 icon-x-circle';
        this.$cancelButton
          .addClass('luna-icon-16 icon-x-circle search-cancel-button hidden')
          .on('click', $.proxy(this.clear, this))
          .insertAfter(this.$el);
      }

      //fallback for those not using luna icons.
      iconStyle = this.$cancelButton.css('font-family').search('luna-icon-' +iconSize);
      if(iconStyle < 0) {
        this.$cancelButton.removeClass('luna-icon-' + iconSize + ' ' + iconClass).addClass('search-icon-' + iconSize);
      }
    },
    /**
     * Positions the Cancel Button to where it belongs
     * @method repositionCancelButton
     */
    repositionCancelButton: function repositionCancelButton(){
      this.$cancelButton.position({
        my: 'right center',
        at: 'right-12px center-2px',
        of: this.$el
      });
    },
    /**
     * Hide the Cancel Button when the field is empty
     * @method maybeHideCancelButton
     */
    maybeHideCancelButton: function maybeHideCancelButton(){
      var isVisible = !this.$cancelButton.hasClass('hidden'),
          inpVal = $.trim(this.$el.val()).length;

      if(inpVal > 0) {
        this.showCancelButton();
      }
      else {
        this.hideCancelButton();
      }
    },
    /**
     * Hide the Cancel Button in the searchfield
     * @method hideCancelButton     
     */
    hideCancelButton: function hideCancelButton(){
      this.$cancelButton.addClass('hidden');
    },
    /**
     * Show the Cancel Button in the searchfield
     * @method showCancelButton     
     */
    showCancelButton: function showCancelButton(){
      setTimeout($.proxy(this.repositionCancelButton, this), 0);
      this.$cancelButton.removeClass('hidden');
    }
  };

  /**
   * jQuery Plugin for Searchfield
   *
   * @param {Object|String|undefined=} option
   */
  $.fn.inputSearch = function inputSearch(option){
    var defaults = {
        /**
          If set to true (by default), the related input element will receive back the focus after the user has clicked on the cancel button.

          @property focusAfterClear
          @type Boolean

          @default true
        **/
        focusAfterClear: true,
        /**
          If set to true (by default), will display a cancel button after the input has been focused. The button will appear only if the input element has a non-empty value.
    
          @property showCancel
          @type Boolean

          @default true
        **/
        showCancel: true
    },
    options = $.extend({}, defaults, typeof option === 'object' && option);

    return $(this).each(function(){
      var $input = $(this);
      var data = $input.data('input-search');

      if (!data){
        $input.data('input-search', (data = new Searchfield($input, options)));
      }

      if (typeof option === 'string'){
        data[option]();
      }
    });
  };

  /**
   * @type {Searchfield}
   */
    $.fn.inputSearch.Constructor = Searchfield;

  /**
   * Default Event Listeners
   */
  function _initSearchInput(event){
    var inpVal = $.trim($(this).val()).length,
        isfocussed = $(this).is(':focus');

    if((event.type === undefined) || (event.which === 27)) {
      $(this).inputSearch('clear');
    }
    else {
      $(this).inputSearch('maybeHideCancelButton');
    }
  }

  $(document)
    .on('focus blur keyup mouseover mouseout', 'input[type="search"]', _.debounce(_initSearchInput, 0))
    .ready(function(){
        $(this)
        .find('input[type="search"][value!=""]')
        .each(_initSearchInput);
    });
}));
