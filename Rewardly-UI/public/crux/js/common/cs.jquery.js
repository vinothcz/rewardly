/*! crux-jquery - v2.9.1 - 2015-01-28
* Copyright (c) 2015 Advisory Board Company; */

/*global Spinner */

/**
All of the widgets and controls are built on <a href="http://jquery.com" target="_blank">jQuery</a> and <a href="http://jqueryui.com/">jQuery UI</a>.

<h3>jQuery UI</h3>
<div class="message warning">
    We do not use all of the jQuery UI widgets. See the list below. Only two widgets currently have CrUX styles, <b>Tabs</b> and <b>Dialog</b>. We will be providing styles for the other widgets with future CrUX updates. Once a widget has been styled an example will be added to the Boilerplate documentation.
</div>
<h4>Included Components</h4>
<ul>
    <li>All of Core</li>
    <li>All Interactions</li>
    <li>All Effects</li>
    <li><strong>Widgets</strong>
        <ul>
            <li><a href="http://jqueryui.com/demos/accordion/">Accordion</a></li>
            <li><a href="http://jqueryui.com/demos/autocomplete/">Autocomplete</a></li>
            <li><a href="http://jqueryui.com/demos/dialog/">Dialog</a></li>
            <li><a href="http://jqueryui.com/demos/slider/">Slider</a></li>
            <li><a href="http://jqueryui.com/demos/tabs/">Tabs</a></li>
        </ul>
    </li>
</ul>

@class jQuery
**/

(function (factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['jquery', './cs.core.js'], factory);
  } else {
    factory(jQuery, CRUX);
  }

}(function ($, core) {
  'use strict';

  $.dotNETDate = function (date, format) {
    return core.ParseDate(date, format);
  };

  /**
  Sets the visiblity of an element to 'hidden'.
  @method hidden
  **/
  $.fn.hidden = function () {
    return this.each(function () {
      $(this).css('visibility', 'hidden');
    });
  };

  /**
  Sets the visiblity of an element to 'visible'.
  @method visible
  **/
  $.fn.visible = function () {
    return this.each(function () {
      $(this).css('visibility', 'visible');
    });
  };

  /**
  Serializes a form and converts the values to a JSON object. The form allows namespacing of elements. Example: &lt;input name="input[name]" /&gt;
  @method serializeObject
  **/
  $.fn.serializeObject = function () {
    var obj = {},
        keys = /[^\[\]]+/g,
        element, last;

    $.each(this.serializeArray(), function () {
      var items = this.name.match(keys),
          length = items.length - 1,
          i = 0;

      element = obj;
      for (i; i < length; i += 1) {
        if (element[items[i]] === undefined) {
          element[items[i]] = isNaN(items[i + 1]) ? {} : [];
        }
        element = element[items[i]];
      }
      last = items[length];

      if (element[last] !== undefined) {
        if (!element[last].push) {
          element[last] = [element[last]];
        }

        element[last].push(this.value);
      } else {
        element[last] = this.value;
      }
    });

    return obj;
  };

  /**
  A new selector finding any unchecked items
  @method :unchecked
  @type Selector
  **/
  $.extend($.expr[':'], {
    unchecked: function (a) {
      return a.checked === false;
    }
  });

  // Set defaults for all jQuery UI Dialogs
  if ($.fn.dialog) {
    $.extend($.ui.dialog.prototype.options, {
      closeText: '×',
      modal: true,
      minHeight: 'auto',
      minWidth: '40%',
      draggable: false,
      resizable: false,
      closeOnOverlayClick: true
    });

    /**
    Override for jQuery UI's ui.dialog, which doesn't allow interaction with elements that exist outside of dialogs/datepickers.
    Adding support for crux.popover elements also, which are appended to the body instead of their target elements.
    **/
    $.widget('ui.dialog', $.ui.dialog, {
      _allowInteraction: function (event) {
        if ($(event.target).closest('.cs-popover-wrapper').length) {
          return true;
        }

        return this._superApply(arguments);
      },

      _createOverlay: function() {
        // Call super() method first, needed so that `this.overlay` will be set
        var ret = this._superApply(arguments);

        // Check to see that an overlay was actually created
        if (this.options.modal) {
          this._on(this.overlay, {
            click: this._onOverlayClick
          });
        }

        return ret;
      },

      _onOverlayClick: function() {
        if (this.option('closeOnOverlayClick')) {
          this.close();
        }
      }
    });
  }
}));
