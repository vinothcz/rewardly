/*! crux-selectr - v2.10.1 - 2015-08-04
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />
/// <reference path="cs.popover.js" />
/// <reference path="cs.ellipsr.js" />
/// <reference path="cs.loadr.js" />

/**
Take a <code>select</code> list (single or multi select) and converts it to a dynamic, filterable list. When you select an item from the list the corresponding option in the original <code>select</code> list will be selected as well.

You may also use any regular container element to build a filterable list, with the help of either a url endpoint or a client-side data set. In this case, Selectr uses a {{#crossLink "Loadr"}}{{/crossLink}} instance to process the data and render the list. The general structure of the expected data object is below. A <code>parse</code> method may be employed to transform data from an existing endpoint into something Selectr can consume.

<pre class="prettyprint">
[
    {
        text: 'Option 1 Display Text',
        value: 'Option 1 value'
    },
    {
        text: 'Option 1 Display Text',
        value: 'Option 1 value'
    },
    {
        text: 'Option Group 1 Display Text',
        options: [ // This is what denotes child options
            {
                text: 'Suboption 1 Display Text',
                value: 'Suboption 1 value'
            },
            {
                text: 'Suboption 2 Display Text',
                value: 'Suboption 2 value'
            }
        ]
    }
]
</pre>

@class Selectr
@extends Base
@requires Popover
@requires Ellipsr
@requires Loadr
@requires CRUX.Visibility
@module Widgets

@tests selectr/selectr.html
@demo docs/demos/selectr.jade
**/

(function (window, define, factory, undefined) {
  'use strict';

  if (define !== undefined) {
      define(['./cs.modernizr.js', './cs.visibility.js', './cs.base.js', './cs.popover.js', './cs.ellipsr.js', './cs.loadr.js', 'inputsearch.js'], factory);
  } else {
      factory(Modernizr, CRUX.Visibility);
  }
}(this, this.define, function (modernizr, visibility) {
  'use strict';

  var Namespace = 'cs-selectr-',

      Css = {
        body: Namespace + 'body',
        filter: Namespace + 'filter',
        focus: Namespace + 'focus',
        group: Namespace + 'group',
        head: Namespace + 'head',
        hidden: Namespace + 'hidden',
        hover: Namespace + 'hover',
        label: Namespace + 'label',
        link: Namespace + 'link',
        linktext: Namespace + 'text',
        list: 'option-list',
        multiple: Namespace + 'multiple',
        noresults: Namespace + 'noresults',
        optgroup: 'optgroup',
        selected: Namespace + 'selected',
        toggles: Namespace + 'toggles',
        utilities: Namespace + 'utilities',
        wrapper: Namespace + 'wrapper'
      },

      Partials = {
        'selectr.listitems': '{{#each .}}{{> selectr.listitem}}{{/each}}',
        'selectr.listitem': '{{#if visible}}{{#HasChildren}}{{> selectr.optgroup}}{{else}}{{> selectr.option}}{{/HasChildren}}{{/if}}',
        'selectr.optgroup': '<li data-path="{{_vars.path}}" class="' + Css.optgroup + '"><div><label><input type="checkbox" tabindex="-1" value="{{text}}"{{OptionSelected}} /> {{{text}}}</label></div><ul class="' + Css.group + '">{{> selectr.listitems _vars.options}}</ul></li>',
        'selectr.option': '<li data-path="{{_vars.path}}"{{#if selected}} class="' + Css.selected + '"{{/if}}><label><input type="checkbox" tabindex="-1" value="{{value}}"{{OptionSelected}} /> {{{text}}}</label></li>'
      },

      _removeLoadingImage = function () {
        var target = this.element,
            overlay = this._html.loading.find('.cs-loadr-overlay');

        if (this._html.linktext) {
          target = this._html.linktext;
        }

        // Fixes issue with createWrapper where the current styles are applied to
        // element being wrapped. In our case some elements don't have a height,
        // meaning they get set to 0. When the wrapper is removed they don't remove
        // the set styles resulting in a 0 height element with content.
        target.removeAttr('style');

        overlay.hide('fade', (modernizr.cssanimations ? 200 : 1), $.proxy(function () {
          overlay.spin('destroy').parent().replaceWith(target);
          this._html.loading = null;
          this._loadComplete();
        }, this));
      },

      _addLoadingImage = function () {
        var target = this.element;

        if (this._html.linktext) {
          target = this._html.linktext;
        }

        this._html.loading = $.effects.createWrapper(target)
          .height('auto')
          .append($('<div>').addClass('cs-loadr-overlay'))
          .spin();

        this._html.loading.css('min-height', this._html.loading.find('.cs-spinner-wrapper').height());
      };

  $.each(Partials, function (name, str) {
    Handlebars.registerPartial(name, str);
  });

  Handlebars.registerHelper('OptionSelected', function () {
    var returnVal, selected = this.selected();

    if (selected === true) {
      returnVal = ' checked=checked';
    } else if (selected === 'indeterminate') {
      returnVal = ' data-indeterminate=true';
    } else {
      returnVal = '';
    }

    return returnVal;
  });

  Handlebars.registerHelper('HasChildren', function (options) {
    var returnVal;

    if (this instanceof SelectrOptgroup && this.options().length) {
      returnVal = options.fn(this);
    } else {
      returnVal = options.inverse(this);
    }

    return returnVal;
  });

  function SelectrOption (option, path, list, instance, index) {
    var text = (option.nodeName === 'OPTION' ? ($(option).data('text') || option.innerHTML) : option.text);

    this._vars = {
      hovered: false,
      index: (option.nodeName === 'OPTION' ? option.index : index),
      instance: instance,
      list: list,
      node: null,
      path: path,
      selected: option.selected || false,
      text: (text || ''),
      value: (option.value || ''),
      visible: true
    };
  }

  function SelectrOptgroup (optgroup, path, list, instance) {
    var text = (optgroup.nodeName === 'OPTGROUP' ? optgroup.label : optgroup.text);

    this._vars = {
      hovered: false,
      instance: instance,
      list: list,
      node: null,
      path: path,
      options: [],
      selected: false,
      text: (text || ''),
      visible: true
    };

    $([this.options()]).on('change', $.proxy(function (e, data) {
      $([this._vars.list]).trigger('change', [data]);
    }, this));
  }

  SelectrOption.prototype = {
    _setIfDifferent: function (prop, value) {
      if (typeof this._vars[prop] !== 'undefined' && this._vars[prop] !== value) {
        this._vars[prop] = value;

        $([this._vars.list]).trigger('change', [[this]]);
      }
    },

    getNode: function () {
      return this._vars.instance._html.list.find('[data-path="' + this._vars.path + '"]');
    },

    hovered: function (value) {
      if (!arguments.length) {
        return this._vars.hovered;
      }

      value = (Boolean(value) || false);

      if (this._vars.hovered !== value) {
        this._vars.hovered = value;
        this.getNode().toggleClass(Css.hover, value);
      }
    },

    selected: function (value) {
      if (!arguments.length) {
        return this._vars.selected;
      }

      value = (Boolean(value) || false);

      this._setIfDifferent('selected', value);
    },

    text: function (value) {
      if (!arguments.length) {
        return this._vars.text;
      }

      value = (String(value) || '');

      this._setIfDifferent('text', value);
    },

    value: function (value) {
      if (!arguments.length) {
        return this._vars.value;
      }

      value = (String(value) || '');

      this._setIfDifferent('value', value);
    },

    visible: function (value) {
      if (!arguments.length) {
        return this._vars.visible;
      }

      this._vars.visible = (value === false ? false : true);
    }
  };

  SelectrOptgroup.prototype = {
    _setIfDifferent: function (prop, value) {
      if (typeof this._vars[prop] !== 'undefined' && this._vars[prop] !== value) {
        this._vars[prop] = value;
      }
    },

    getNode: function () {
      return this._vars.instance._html.list.find('[data-path="' + this._vars.path + '"]');
    },

    hovered: function (value) {
      if (!arguments.length) {
        return this._vars.hovered;
      }

      value = (Boolean(value) || false);

      if (this._vars.hovered !== value) {
        this._vars.hovered = value;
        this.getNode().toggleClass(Css.hover, value);
      }
    },

    options: function () {
      return this._vars.options;
    },

    selected: function (value) {
      if (!arguments.length) {
        return ($.proxy(function () {
          var returnVal,
              firstVisible = true,
              selected = false,
              allSelected = false;

          $.each(this.options() || [], function (i, option) {
            if (!option.visible()) {
              return;
            }

            if (firstVisible) {
              firstVisible = false;
              allSelected = true;
            }

            var optionSelected = option.selected();

            selected = (selected || Boolean(optionSelected));
            allSelected = (allSelected && (optionSelected === true));
          });

          if (allSelected) {
            returnVal = true;
          } else if (selected) {
            returnVal = 'indeterminate';
          } else {
            returnVal = false;
          }

          return returnVal;
        }, this)());
      }

      value = (Boolean(value) || false);

      $.each(this.options() || [], function (i, option) {
        if (option.visible()) {
          option.selected(value);
        }
      });
    },

    text: function (value) {
      if (!arguments.length) {
        return this._vars.text;
      }

      value = String(value) || '';

      this._setIfDifferent('text', value);
    },

    value: function (value) {
      if (!arguments.length) {
        return this._vars.value;
      }

      value = String(value) || '';

      this._setIfDifferent('value', value);
    },

    visible: function () {
      var pathRegex = new RegExp('^' + this._vars.path + '._vars.options');

      return ($.proxy(function () {
        var returnVal;

        $.each(this.options() || [], function (i, option) {
          returnVal = option.visible();

          return !returnVal;
        });

        return returnVal;
      }, this)());
    }
  };

  $.widget('crux.selectr', {
    widgetEventPrefix: 'selectr',

    options: {
      /**
      Function that is called when a request is made. Default value creates a spinnr instance inside the widget's instance. Can be overridden to change the location of spinnr and/or remove the spinnr altogether.

      @property addLoadingImage
      @type Function

      @default _addLoadingImage
      **/
      addLoadingImage: _addLoadingImage,

      /**
      The text to be shown in the selectr link when all items are selected.

      @property allselectedtext
      @type String

      @default 'All Selected'
      **/
      allselectedtext: 'All Selected',

      /**
      A callback that is triggered after deselecting an item from the list. The function passes the event and an object containing information about the selected option.

      @property deselect
      @type Function

      @default null
      **/
      deselect: null,

      /**
      Adds a search box to the top of the option list allowing you to filter to only the options you want to see. The filter resets when the list is closed. If this value is a string, it will enable the filter as well as define the first part of the placeholder text for it. The last part comes from the <code>title</code> option

      @property filter
      @type {Boolean | String}

      @default 'Search'
      **/
      filter: 'Search',

      /**
      When true, filter matching also matches against group names, and if a match is found, displays all items in the group. When false, will only match against items within groups.

      @property filterwithgroups
      @type Boolean

      @default true
      **/
      filterwithgroups: true,

      /**
      Show the footer of the option list. In case of single select lists the footer contains the current count of visible items in the list. For multiple select lists the footer shows the count and two links that select all or none of the options.

      @property footer
      @type Boolean

      @default true
      **/
      footer: true,

      /**
      The width, in pixels, of the select list that opens. This only applies if the link width is smaller than the list width. If the link is wider than this parameter the list will take the width of the link.

      @property listwidth
      @type Number

      @default 220
      **/
      listwidth: 220,

      /**
      The maximum height (in pixels) for the list.

      @property maxheight
      @type Number

      @default 300
      **/
      maxheight: 300,

      /**
      The text to be shown in the selectr link when no items are selected.

      @property noneselectedtext
      @type String

      @default 'None Selected'
      **/
      noneselectedtext: 'None Selected',

      /**
      Function that is called after the request is completed. Default value removes the spinnr from the widget's instance. Should be overridden if addLoadingImage is overridden.

      @property removeLoadingImage
      @type Function

      @default _removeLoadingImage
      **/
      removeLoadingImage: _removeLoadingImage,

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
      The term of the list of options that shows up in the filter input and in the footer.

      @property title
      @type String

      @default "Items"
      **/
      title: 'Items',

      /**
      The URL to request. This sets the <code>url</code> variable of the <a href="http://api.jquery.com/jQuery.ajax/">jQuery ajax object</a>.

      @property url
      @type String

      @default " "
      **/
      url: '',

      /**
      Takes the contents of the label associated with the <code>select</code> list and adds it to the clickable area for the dropdown.

      @property uselabel
      @type Boolean

      @default false
      **/
      uselabel: false,

      /**
      Sets the width of the generated link. If null the link will take the width of its parent element.

      @property width
      @type Number

      @default null
      **/
      width: null,

      /**
      Specifies the <code>z-index</code> CSS property of the List. The List is created using the {{#crossLink "Popover"}}{{/crossLink}} widget. If left as <code>null</code> the List's <code>z-index</code> value will be assigned to the global z-index value in CrUX. For each new Popover the CrUX z-index value is incremented by 1.

      @property zindex
      @type Number

      @default null
      **/
      zindex: null
    },

    _css: Css,

    _template: Handlebars.compile('{{> selectr.listitems}}'),

    _attachKeyboardEvents: function () {
      var filterString = '';

      this._on(this._html.link, {
        keydown: function (e) {
          var matches, currentSelection, currentSelectionIndex, func;

          if (!this._vars.isOpen && e.which !== $.ui.keyCode.TAB) {
            if ($.inArray(e.which, [$.ui.keyCode.UP, $.ui.keyCode.DOWN]) === -1) {
              if (this.options.filter) {
                if ($.inArray(e.which, [$.ui.keyCode.TAB, $.ui.keyCode.LEFT, $.ui.keyCode.RIGHT, $.ui.keyCode.ALT, $.ui.keyCode.BACKSPACE, $.ui.keyCode.CAPS_LOCK, $.ui.keyCode.CONTROL, $.ui.keyCode.END, $.ui.keyCode.ENTER, $.ui.keyCode.ESCAPE, $.ui.keyCode.HOME, $.ui.keyCode.INSERT, $.ui.keyCode.MENU, $.ui.keyCode.NUMPAD_ENTER, $.ui.keyCode.PAGE_DOWN, $.ui.keyCode.PAGE_UP, $.ui.keyCode.SHIFT, $.ui.keyCode.WINDOWS, $.ui.keyCode.COMMAND, $.ui.keyCode.COMMAND_LEFT, $.ui.keyCode.COMMAND_RIGHT]) === -1) {
                  func = (e.shiftKey ? 'toUpperCase' : 'toLowerCase');
                  this._html.filter.val(String.fromCharCode(e.which)[func]());
                  this.show();
                }
              } else {
                filterString += String.fromCharCode(e.which).toLowerCase();

                currentSelection = this._getOptions(function (item) {
                  return item.selected();
                });

                matches = this._getOptions(function (item) {
                  return item.text().toLowerCase().indexOf(filterString) === 0;
                });

                if (!matches.length) {
                  filterString = String.fromCharCode(e.which).toLowerCase();

                  matches = this._getOptions(function (item) {
                    return item.text().toLowerCase().indexOf(filterString) === 0;
                  });
                }

                if (matches.length) {
                  if (filterString.length === 1) {
                    currentSelectionIndex = $(matches).index(currentSelection[0]);

                    if (currentSelectionIndex === matches.length - 1) {
                      currentSelectionIndex = -1;
                    }

                    matches[currentSelectionIndex + 1].selected(true);
                  } else if ($(matches).index(currentSelection[0]) === -1) {
                    matches[0].selected(true);
                  }
                }
              }
            }
          }
        }
      });

      this._on(this._html.link, {
        keydown: CRUX.Debounce(function (e) {
          filterString = '';
        }, 500)
      });
    },

    _attachList: function () {
      this._populateList();
      this._displayList();
    },

    _attachListEvents: function () {
      // safeSort exists because Array.prototype.sort doesn't necessarily
      // leave order alone when you return 0 from the comparator, it still
      // does its own sort algorithm, which isn't defined by the spec, but
      // is left up to the browser to implement, which means if we have all
      // tabindex="0" items, they randomly sort based on some browser opinion,
      // rather than staying the same before and after sort... this safeSort
      // function does a strict order by tabindex value, followed by original
      // dom discovery order...
      var safeSort = function (elements) {
            var i, j, extras = [], tabindex, lowTabindex, element = $({});

            for (i = 0, j = elements.length; i < j; i++) {
              element[0] = elements[i];
              tabindex = (Number(element.attr('tabindex')) || 0);

              if (lowTabindex === undefined || lowTabindex > tabindex) {
                lowTabindex = tabindex;
              }
            }

            for (i = 0, j = elements.length; i < j; i++) {
              element[0] = elements[i];
              tabindex = (Number(element.attr('tabindex')) || 0);

              if (tabindex > lowTabindex) {
                extras = extras.concat(elements.splice(i, 1));
                i--, j--;
              }
            }

            if (extras.length) {
              return elements.concat(safeSort(extras));
            } else {
              return elements;
            }
          },
          getTabTarget = $.proxy(function (next) {
            var tabbables = safeSort($(':tabbable').get()),
                index = $(tabbables).index(this._html.link);

            if (next) {
              if (index === (tabbables.length - 1)) {
                index = 0;
              } else {
                index++;
              }
            } else {
              if (index === 0) {
                index = (tabbables.length - 1);
              } else {
                index--;
              }
            }

            return tabbables[index];
          }, this);

      this._on({
        selectrlistchanged: function () {
          this._setIndeterminate();
        },
        selectrlistreset: function () {
          var items = this._getOptions(function (item) {
            return true;
          });

          this._html.utilcount.html(items.length + ' ' + this.options.title);
        }
      });

      this._on(this._html.link, {
        popoverhide: function () {
          this._trigger('hide');
          this._vars.isOpen = false;
        },
        popovershow: function () {
          this._trigger('show');
          this._vars.isOpen = true;
        }
      });

      this._on(this._html.wrapper, {
        keydown: function (e) {
          var tab, keyEvent, items;

          if (e.keyCode === $.ui.keyCode.TAB) {
            e.preventDefault();

            this.hide();

            getTabTarget(!e.shiftKey).focus();
          } else if (e.keyCode === $.ui.keyCode.ESCAPE) {
            e.preventDefault();

            this.hide();

            this._html.link[0].focus();
          } else if ($.inArray(e.which, [$.ui.keyCode.UP, $.ui.keyCode.DOWN]) !== -1) {
            e.preventDefault();

            this._handleArrowKey(e);
          } else if (e.which === $.ui.keyCode.ENTER) {
            e.preventDefault();

            items = this._getOptions(function (item) {
              return item.hovered();
            }, undefined, undefined, this._vars.isMultiple);

            if ($('html.ie8').length) {
              $(items).each(function (index, item) {
                item.getNode().find('> div > label, > label').trigger('click');
              });
            } else {
              $(items).each(function (index, item) {
                item.getNode().find('> div > label :checkbox, > label :checkbox').trigger('click');
              });
            }
          }
        }
      });

      if (this.options.filter) {
        this._on(this._html.link, {
          popovershow: function () {
            this._delay(function () {
              var range;

              if ($('html').hasClass('ie8')) {
                // Needed to set the cursor at the end of the text in the filter
                range = this._html.filter[0].createTextRange();
                range.moveStart('character', 1);
                range.select();
              } else {
                this._html.filter[0].focus();
              }
            }, 1);
          }
        });

        this._on(this._html.filter, {
          keyup: CRUX.Debounce(this._filter, 200)
        });
      }

      this._on(this._html.list, {
        'click input': this._select,
        mousedown: function (e) {
          // HACK ALERT
          // In selectrs with no filter option, clicking on a list item label causes this blur to hide
          // before the click can be forwarded to the checkbox for selection in modern browsers...

          this._vars.safeBlur = true;
        },
        mousemove: function () {
          $.each(this._getOptions(function (item) {
            return item.hovered();
          }, undefined, undefined, this._vars.isMultiple), function (index, item) {
            item.hovered(false);
          });
        }
      });

      if ($('html.ie8').length) {
        this._on(this._html.list, {
          'click label': this._select
        });
      }

      if (this._vars.isMultiple) {
        if (this.options.footer) {
          this._on(this._html.util, {
            'click a': this._selectToggle
          });
        }
      }
    },

    _attachListObjEvents: function () {
      var changes = [],
          triggerChange = CRUX.Debounce($.proxy(function () {
            var data = [].concat(changes);

            changes = [];

            this._processListChangeEvents(data);
          }, this), 0);

      $([this._vars.list]).on('change', $.proxy(function (e, data) {
        if (data) {
          changes = changes.concat(data);
        }

        triggerChange();
      }, this));
    },

    _buildLink: function () {
      // safeSort exists because Array.prototype.sort doesn't necessarily
      // leave order alone when you return 0 from the comparator, it still
      // does its own sort algorithm, which isn't defined by the spec, but
      // is left up to the browser to implement, which means if we have all
      // tabindex="0" items, they randomly sort based on some browser opinion,
      // rather than staying the same before and after sort... this safeSort
      // function does a strict order by tabindex value, followed by original
      // dom discovery order...
      var label,
          safeSort = function (elements) {
            var i, j, extras = [], tabindex, lowTabindex, element = $({});

            for (i = 0, j = elements.length; i < j; i++) {
              element[0] = elements[i];
              tabindex = (Number(element.attr('tabindex')) || 0);

              if (lowTabindex === undefined || lowTabindex > tabindex) {
                lowTabindex = tabindex;
              }
            }

            for (i = 0, j = elements.length; i < j; i++) {
              element[0] = elements[i];
              tabindex = (Number(element.attr('tabindex')) || 0);

              if (tabindex > lowTabindex) {
                extras = extras.concat(elements.splice(i, 1));
                i--, j--;
              }
            }

            if (extras.length) {
              return elements.concat(safeSort(extras));
            } else {
              return elements;
            }
          },
          getTabTarget = $.proxy(function (next) {
            var tabbables = safeSort($(':tabbable').get()),
                index = $(tabbables).index(this._html.link);

            if (next) {
              if (index === (tabbables.length - 1)) {
                index = 0;
              } else {
                index++;
              }
            } else {
              if (index === 0) {
                index = (tabbables.length - 1);
              } else {
                index--;
              }
            }

            return tabbables[index];
          }, this);

      if (this._vars.isSelect) {
        this.element.hide().data('ignorehidden', true);
      }

      this._html.link = $('<a>', {
        'class': this._css.link,
        tabindex: 0
      }).html('<div class="caret6 south"></div>');

      this._html.linktext = $('<div>', {
          'class': this._css.linktext
        })
        .prependTo(this._html.link);

      if (this.options.uselabel) {
        label = $('label[for=' + this.element[0].id + ']').hide();
        $('<div>', {
            'class': this._css.label
        }).text(label.text()).prependTo(this._html.link);
      }

      this._html.link.css('width', this.options.width || 'auto');

      if (this._vars.isSelect) {
        this._html.link.insertAfter(this.element);
      } else {
        this._html.link.appendTo(this.element);
      }

      this._html.linktext.ellipsr({
        showfull: false
      });

      this._setLink();

      this._on(this._html.link, {
        blur: function (e) {
          this._delay(function () {
            if (this._vars.safeBlur) {
              // HACK ALERT
              // In selectrs with no filter option, clicking on a list item label causes this blur to hide
              // before the click can be forwarded to the checkbox for selection in modern browsers...
              this._vars.safeBlur = false;
              return;
            }

            if (!$(e.relatedTarget || document.activeElement).closest(this._html.wrapper).length) {
              this.hide();
            }
          }, 0);
        },
        click: function () {
          this.show();
        },
        focus: function () {
          this._html.link.addClass(this._css.focus);
        },
        keydown: function (e) {
          var items;

          if (e.keyCode === $.ui.keyCode.SPACE) {
            e.preventDefault();

            this.show();
          } else if ($.inArray(e.which, [$.ui.keyCode.UP, $.ui.keyCode.DOWN]) !== -1) {
            e.preventDefault();

            this.show();

            this._handleArrowKey(e);
          } else if (e.which === $.ui.keyCode.ENTER) {
            e.preventDefault();

            items = this._getOptions(function (item) {
              return item.hovered();
            }, undefined, undefined, this._vars.isMultiple);

            if ($('html.ie8').length) {
              $(items).each(function (index, item) {
                item.getNode().find('> div > label, > label').trigger('click');
              });
            } else {
              $(items).each(function (index, item) {
                item.getNode().find('> div > label :checkbox, > label :checkbox').trigger('click');
              });
            }
          } else if (e.keyCode === $.ui.keyCode.TAB) {
            e.preventDefault();

            this.hide();

            getTabTarget(!e.shiftKey).focus();
          }
        }
      });

      this._attachKeyboardEvents();

      if (this._vars.form.length) {
        this._on({
          validationerror: function (e, message) {
            this._vars.form.validate('addError', this._html.link, message);
          }
        });
      }

      this._trigger('linkbuilt', null, this._html.link[0]);

      this._buildList();
    },

    _buildList: function () {
      var html = this._html, optionLength;

      html.wrapper = $('<div>', {
        'class': this._css.wrapper
      });

      if (this.options.filter) {
        html.filter = $('<input>', {
          'class': this._css.filter,
          tabindex: 0,
          type: 'search',
          placeholder: (this.options.filter === true ? 'Search' : this.options.filter) + ' ' + this.options.title
        }).appendTo(html.wrapper).wrap('<div class="' + this._css.head + '">');
      }

      html.body = $('<div>', {
        'class': this._css.body
      }).appendTo(html.wrapper);

      html.list = $('<ul>', {
        'class': this._css.list + (this._vars.isMultiple ? ' ' + this._css.multiple : '')
      }).appendTo(html.body);

      if (this.options.footer) {
        if (this._vars.isSelect) {
          optionLength = this.element[0].options.length;
        } else {
          optionLength = this._getOptions(function (item) {
            return item.visible();
          }).length;
        }

        html.util = $('<div>', {
          'class': this._css.utilities
        }).html('<span><b></b></span>').appendTo(html.wrapper);

        html.utilcount = $('<span>')
          .html(optionLength + ' ' + this.options.title)
          .insertAfter(html.util.find('b'));

        if (this._vars.isMultiple) {
          html.toggles = $('<span>', {
            'class': this._css.toggles
          }).html(' select <a href="#" class="all">all</a> | <a href="#" class="none">none</a>');
          html.util.append(html.toggles);
        }
      }

      this._trigger('listbuilt', null, html.wrapper[0]);
    },

    _create: function () {
      this._html = {
        body: null,
        filter: null,
        link: null,
        linktext: null,
        list: null,
        noresults: '<li class="' + this._css.noresults + '">No matches found.</li>',
        toggles: null,
        util: null,
        utilcount: null,
        wrapper: null
      };

      this._vars = {
        currentList: null,
        deferred: null,
        groups: null,
        filterChecked: false,
        form: this.element.parents('form'),
        id: null,
        isBuilt: false,
        isFiltered: false,
        isOpen: false,
        isSelect: this.element.is('select'),
        isMultiple: (this.element.is('select') ? this.element.prop('multiple') : ($.trim(this.element.data('multiple')) !== '')),
        list: [],
        options: null,
        safeBlur: false
      };

      if (!this._vars.isSelect) {
        this._createLoadr();
      }

      this._attachListObjEvents();

      this._on({
        selectrlistchanged: this._setIndeterminate
      });

      visibility.add(this.element, function () {
        this._reload()
          .done(this._buildLink);
      }, this);
    },

    _createLoadr: function () {
      this.element.loadr($.extend({}, this.options, {
        allresults: true,
        autoload: false,
        error: $.proxy(function () {
          this._vars.deferred.reject();
        }, this),
        filter: null,
        replace: false,
        success: $.proxy(function (e, data) {
          this._vars.deferred.resolveWith(this, [data]);
        }, this)
      }));
    },

    _destroyLoadr: function () {
      this.element.loadr('destroy');
    },

    _displayList: function () {
      this._html.link.popover({
        autoshow: false,
        caret: 0,
        collision: this.options.filter ? 'none' : 'flip',
        content: this._html.wrapper,
        hide: $.proxy(this._hide, this),
        width: this.options.listwidth < this._html.link.outerWidth() ? this._html.link.outerWidth() : this.options.listwidth,
        position: 'right',
        offset: '0 -1',
        preposition: $.proxy(this._maxHeight, this),
        target: this._html.link,
        zindex: this.options.zindex
      });

      this._attachListEvents();
    },

    _filter: function (e) {
      var html = this._html,
          term = $.trim(html.filter[0].value).toLowerCase(),
          filtered, list, counter = 0, groupList = [];

      if (!e || $.inArray(e.which, [$.ui.keyCode.TAB, $.ui.keyCode.ESCAPE, $.ui.keyCode.UP, $.ui.keyCode.DOWN, $.ui.keyCode.ENTER]) === -1) {

        if (term.length) {
          $.each(this._getOptions(function (item) {
            return true;
          }, undefined, undefined, this.options.filterwithgroups), function (index, item) {
            item.visible(false);
          });

          filtered = this._getOptions(function (item) {
            var pass = item.text().toLowerCase().indexOf(term) !== -1;

            if (pass && item instanceof SelectrOptgroup) {
              groupList.push(item._vars.path);
            }

            if (!pass) {
              $.each(groupList, function (index, path) {
                if (item._vars.path.indexOf(path) === 0) {
                  pass = true;
                }

                return !pass;
              });
            }

            return pass;
          }, undefined, undefined, this.options.filterwithgroups);

          $.each(filtered, function (index, item) {
            if (item instanceof SelectrOption) {
              counter++;
            }

            item.visible(true);
          });

          if (this.options.footer) {
            html.util.find('b').text(counter + ' of ');
          }
        } else {
          filtered = this._getOptions(function (item) {
            return true;
          });

          $.each(filtered, function (index, item) {
            item.visible(true);
          });

          if (this.options.footer) {
            html.util.find('b').empty();
          }
        }

        if (filtered.length) {
          list = this._printList(this._vars.list);

          if (this._vars.isMultiple && this.options.footer) {
            this._html.toggles.show();
          }
        } else {
          list = this._html.noresults;

          if (this._vars.isMultiple && this.options.footer) {
            this._html.toggles.hide();
          }
        }

        this._populateList();
        this._trigger('filter', null, term);
      }
    },

    _getOptions: function (comparator, list, options, includeGroups) {
      options = options || [];

      $.each(list || this._vars.list, $.proxy(function (index, item) {
        if (item instanceof SelectrOptgroup) {
          if (includeGroups && comparator.call(this, item, options)) {
            options.push(item);
          }
          options = this._getOptions(comparator, item.options(), options);
        } else if (comparator.call(this, item, options)) {
          options.push(item);
        }
      }, this));

      return options;
    },

    _getValue: function () {
      var returnVal, counter = 0;

      if (this.isSelect) {
        returnVal = this.element.val();
      } else {
        if (this._vars.isMultiple) {
          returnVal = this._getOptions(function (item) {
            return item.selected();
          });

          if (!returnVal.length) {
            returnVal = null;
          } else {
            returnVal = $.map(returnVal, function (item) {
              return item.value();
            });
          }
        } else {
          returnVal = this._getOptions(function (item) {
            return item.selected();
          });

          if (!returnVal.length) {
            returnVal = this._getOptions(function (item) {
              return !!(counter++);
            });
          }

          returnVal = returnVal[0].value();
        }
      }

      return returnVal;
    },

    _handleArrowKey: function (e) {
      var items, item, currentSelection, currentSelectionIndex, bodyHeight, itemHeight, position, scrollTop, path;

      if ($.inArray(e.which, [$.ui.keyCode.UP, $.ui.keyCode.DOWN]) === -1) {
        return;
      }

      if (!this._vars.isOpen) {
        this.show();
      }

      items = this._getOptions(function (item) {
        return item.visible();
      }, undefined, undefined, this._vars.isMultiple);

      currentSelection = this._getOptions(function (item) {
        return item.hovered() && item.visible();
      }, undefined, undefined, this._vars.isMultiple);

      if (!currentSelection.length) {
        if (document.activeElement && $(document.activeElement).closest('li').closest(this._html.list).length) {
          path = $(document.activeElement).closest('li').attr('data-path');

          currentSelection = this._getOptions(function (item) {
            return item._vars.path === path;
          }, undefined, undefined, this._vars.isMultiple);

          currentSelectionIndex = $.inArray(currentSelection[0], items);
        } else {
          currentSelection = [this._getOptions(function (item) {
            return item.visible();
          }, undefined, undefined, this._vars.isMultiple)[0]];
          currentSelectionIndex = (e.which === $.ui.keyCode.UP ? 0 : -1);
        }
      } else {
        currentSelectionIndex = $.inArray(currentSelection[0], items);
      }

      if (e.which === $.ui.keyCode.UP) {
        if (currentSelectionIndex === 0) {
          currentSelectionIndex = (items.length - 1);
        } else {
          currentSelectionIndex--;
        }
      } else {
        if (currentSelectionIndex === (items.length - 1)) {
          currentSelectionIndex = 0;
        } else {
          currentSelectionIndex++;
        }
      }

      item = items[currentSelectionIndex];

      currentSelection[0].hovered(false);
      item.hovered(true);

      itemHeight = (item instanceof SelectrOption ? item.getNode().height() : item.getNode().children('div:first').height());
      position = item.getNode().position();
      bodyHeight = this._html.body.height();
      scrollTop = this._html.body.scrollTop();

      if (position.top < 0) {
        this._html.body.scrollTop(scrollTop + position.top);
      } else if ((position.top + itemHeight) > bodyHeight) {
        this._html.body.scrollTop(scrollTop + (position.top - bodyHeight) + itemHeight);
      }
    },

    _hide: function () {
      this._html.link.removeClass(this._css.focus);
    },

    _maxHeight: function () {
      if (!this.options.maxheight) {
        return;
      }

      this._html.body.css({
        'max-height': this.options.maxheight - (this.options.footer ? this._html.util.outerHeight() : 0) - (this.options.filter ? this._html.filter.parent().outerHeight() : 0)
      });

      this._html.link.popover('option', 'preposition', null);
    },

    _parseSelectData: function () {
      var list = this._vars.list, optgroup, options, path;

      if (this._vars.isSelect) {
        this.element.children().each($.proxy(function (instance, i, option) {
          path = i.toString();
          if (option.nodeName === 'OPTGROUP') {
            optgroup = new SelectrOptgroup(option, path, list, instance);
            options = optgroup.options();

            $(option).children().each(function (j, childOption) {
              path = i.toString() + '._vars.options.' + j.toString();
              options.push(new SelectrOption(childOption, path, options, instance));
            });

            list.push(optgroup);
          } else if (option.nodeName === 'OPTION') {
            list.push(new SelectrOption(option, path, list, instance));
          }
        }, this, this));
      }
    },

    _parseLoadrData: function (data) {
      var list = this._vars.list, path, index = 0,
          listitem = function (item, path, list, instance) {
            var returnVal, options;

            if (typeof item.options !== 'undefined' && item.options.length) {
              returnVal = new SelectrOptgroup(item, path, list, instance),
              options = returnVal.options();

              $.each(item.options, function (i, childOption) {
                options.push(listitem(childOption, path + '._vars.options.' + i.toString(), options, instance));
              });
            } else if (typeof item.value !== 'undefined') {
              returnVal = new SelectrOption(item, path, list, instance, index++);
            }

            return returnVal;
          };

      $.each(data, $.proxy(function (i, option) {
        path = i.toString();
        list.push(listitem(option, path, list, this));
      }, this));

      this._delay(function () {
        $([this._vars.list]).trigger('change', [[]]);
      }, 0);
    },

    _populateList: function () {
      this._html.list.html(this._printList(this._vars.list));

      this._trigger('listchanged', null, this._html.list[0]);
    },

    _printList: function (list) {
      return this._template(list);
    },

    _processListChangeEvents: function (data) {
      var deduped = {}, options, selected, parent, parentPath, parentSelected, pathChecked,
          eventData = {
            deselected: [],
            selected: []
          },
          pathRegex = /\._vars\.options\.\d+$/;

      // Dedupe the list
      $.each(data, function (index, item) {
        deduped[item._vars.path] = item;
      });

      // Get all currently selected options
      selected = this._getOptions(function (item) {
        return item.selected();
      }, data);

      // Cache a reference to the most recently selected item
      selected = selected.pop();

      // Dedupe the list
      data = [];

      $.each(deduped, function (path, item) {
        data.push(item);
      });

      // Single-select lists must always have exactly 1 option
      // set, so unset any but the most recent one if multiple
      // are selected, and if none are selected, set the first
      if (!this._vars.isMultiple) {
        options = this._getOptions(function (item) {
          return item.selected();
        });

        if (options.length === 0) {
          options = this._getOptions(function (item, options) {
            return !options.length;
          });

          if (options.length === 1) {
            // In this case, we have to kick off the change event in
            // the next event loop because we have inconsistent selections
            // in the current one, so we have our most recent deselection
            // cached in the 'data' variable, which we set to true
            // and then back to false to trigger a change event in the next
            // event loop, and the first item in the list is then set
            // to false in order to trigger change events in the next
            // event loop.
            if (data.length) {
              data[0].selected(true);
              data[0].selected(false);
            }

            options[0].selected(true);

            return;
          }
        } else if (options.length > 1) {
          // In this case, we have to kick off the change event in
          // the next event loop because we have inconsistent selections
          // in the current one, so we have our most recent selection
          // cached in the 'selected' variable, which we set to false
          // and then back to true to trigger a change event in the next
          // event loop, and all of the rest of the selections are set
          // to false in order to trigger change events in the next
          // event loop.
          $.each(options, function (index, item) {
            item.selected(false);
          });

          selected.selected(true);

          return;
        }
      }

      if (this._vars.isBuilt) {
        pathChecked = {};
        $.each(data, $.proxy(function (index, item) {
          parentPath = (pathRegex.test(item._vars.path) ? item._vars.path.replace(pathRegex, '') : null);

          if (parentPath && typeof pathChecked[parentPath] === 'undefined') {
            pathChecked[parentPath] = true;
            parentSelected = CRUX.stringToObject(parentPath, this._vars.list).selected();
            parent = this._html.list.find('[data-path="' + parentPath + '"] > div > label > :checkbox');
            if (parentSelected === 'indeterminate') {
              parent.prop('checked', false).prop('indeterminate', true);
            } else {
              parent.prop('indeterminate', false).prop('checked', parentSelected);
            }
          }

          item.getNode()
            .toggleClass(this._css.selected, item.selected())
              .find('> label > :checkbox')
                .prop('checked', item.selected());
        }, this));
      }

      if (this._vars.isSelect) {
        $.each(data, $.proxy(function (index, item) {
          this.element[0].options[item._vars.index].selected = item.selected();
        }, this));
      }

      this._setLink();

      if (!this._vars.isMultiple) {
        this.hide();
        this._html.link.trigger('focus');
      }

      eventData.deselected = $.map(this._getOptions(function (item) {
        return !item.selected();
      }, data), function (item) {
        return item.value();
      });

      if (eventData.deselected.length) {
        if (!this._vars.isMultiple) {
          eventData.deselected = eventData.deselected[0];
        }

        this._trigger('deselect', null, [eventData.deselected]);
      } else {
        delete eventData.deselected;
      }

      eventData.selected = $.map(this._getOptions(function (item) {
        return item.selected();
      }, data), function (item) {
        return item.value();
      });

      if (eventData.selected.length) {
        if (!this._vars.isMultiple) {
          eventData.selected = eventData.selected[0];
        }

        this._trigger('select', null, [eventData.selected]);
      } else {
        delete eventData.selected;
      }

      this._trigger('change', null, [eventData]);
      this.element.trigger('change');
    },

    _reload: function () {
      this._vars.deferred = $.Deferred();

      this._vars.list.length = 0;

      if (this.element.is(':crux-loadr')) {
        this.element.loadr('reload');

        this._vars.deferred
          .done($.proxy(this._parseLoadrData, this))
          .fail($.proxy(function () {
            this._trigger('error');
          }, this));
      } else {
        this._vars.deferred.resolveWith(this).done($.proxy(this._parseSelectData, this));
      }

      return this._vars.deferred.done(function () {
        this._trigger('listreset');
      }).promise();
    },

    _select: function (e) {
      e.preventDefault();

      var item = CRUX.stringToObject($(e.target).closest('li').attr('data-path'), this._vars.list),
          currentlySelected = (this._vars.isMultiple ? item.selected() : false);

      item.selected(!currentlySelected);
    },

    _selectToggle: function (e) {
      e.preventDefault();

      var that = this,
          target = $(e.target),
          checked = !target.hasClass('none');

      $.each(this._getOptions(function (item) {
        return item.visible();
      }), function (index, item) {
        item.selected(checked);
      });
    },

    _setIndeterminate: function () {
      this._html.list.find('[data-indeterminate]').prop('indeterminate', true).removeAttr('data-indeterminate');
    },

    _setLink: function () {
      var selected = this._getOptions(function (item) {
            return item.selected();
          }),
          allOptions = this._getOptions(function (item) {
            return true;
          }),
          text = '';

      if (selected.length === 1) {
        text = selected[0].text();
      } else if (this._vars.isMultiple) {
        text = this.options.noneselectedtext;

        if (selected.length === 1) {
          text = selected[0].text();
        } else if (selected.length === allOptions.length) {
          text = this.options.allselectedtext;
        } else if (selected.length > 1) {
          text = selected.length + ' Items Selected';
        }
      }

      if (this._html.linktext.is(':crux-ellipsr')) {
        this._html.linktext.ellipsr('update', text);
      }
    },

    _setOption: function (key, value) {
      var oldValue = this.options[key];

      this._super(key, value);

      if ((key === 'url' || key === 'resultsdata') && value && oldValue !== value) {
        if (!this.element.is(':crux-loadr')) {
          this._createLoadr();
        }

        if (key === 'url') {
          this.element.loadr('option', key, value);
        } else {
          // Hack alert, this is something that needs to be changed in loadr, so that
          // modifying the resultsdata option no longer automatically triggers reload
          this.element.data('crux-loadr').options[key] = value;
        }

        this._reload().done(this._populateList);
      }
    },

    _show: function () {
      if (this._html.filter && this._html.filter[0].value.length) {
        this.clear();
      }

      if (!this._vars.isMultiple) {
        this._html.body.scrollTop(0).scrollTop(this._html.list.find('.' + this._css.selected).position().top);
      }
    },

    /**
    Clear the current filter.

    @method clear
    */
    clear: function () {
      if (this._html.filter) {
        this._html.filter.inputSearch('clear');
        if (this._vars.isBuilt) {
          this._filter();
        }
      }

    },
    _destroy: function () {
      if (this._html.link) {
        if (this._html.link.is(':crux-popover')) {
          this._html.link.popover('destroy');
        }
        this._html.link.remove();
      }
      if(this.element.is(':crux-loadr')) {
        this._destroyLoadr();
      }
      if(this._vars.isSelect) {
        this.element.show();
      }
    },


    /**
    Deselects values in the select list by the index of the <code>option</code> in the list.

    @method deselect

    @param {Array | Number} indexes The index(es) to deselect.
    **/
    deselect: function (indexes) {
      if (typeof indexes === 'undefined') {
        return;
      }

      if ($.type(indexes) !== 'array') {
        indexes = [indexes];
      }

      $.each(this._getOptions(function (item) {
        return $.inArray(item._vars.index, indexes) !== -1;
      }), function (index, item) {
        item.selected(false);
      });
    },

    /**
    Hides the list of options available to the selectr.

    @method hide
    */
    hide: function () {
      this._hide();
      if (this._html.link.is(':crux-popover')) {
        this._html.link.popover('hide');
      }
    },

    /**
    Deselects all values in the list.

    @method reset
    **/
    reset: function () {
      $.each(this._getOptions(function (item) {
        return item.selected();
      }), function (index, item) {
        item.selected(false);
      });
    },

    /**
    Selects values in the select list by the index of the <code>option</code> in the list.

    @method select

    @param {Array | Number} indexes The index(es) to select.
    **/
    select: function (indexes) {
      if (typeof indexes === 'undefined') {
        return;
      }

      if ($.type(indexes) !== 'array') {
        indexes = [indexes];
      }

      $.each(this._getOptions(function (item) {
        return $.inArray(item._vars.index, indexes) !== -1;
      }), function (index, item) {
        item.selected(true);
      });
    },

    /**
    Sets the value of the Selectr based on the passed <strong>value</strong>.

    @method set

    @param {Array | String | Number} values The new value(s) to set the Selectr to. Must correspond to a value in the original select list.
    **/
    set: function (values) {
      if (typeof values === 'undefined') {
        return;
      }

      this.reset();

      if ($.type(values) !== 'array') {
        values = [values];
      }

      values = $.map(values, function (value) {
        return value.toString();
      });

      $.each(this._getOptions(function (item) {
        return $.inArray(item.value(), values) !== -1;
      }), function (index, item) {
        item.selected(true);
      });
    },

    /**
    Shows the list of options available to the selectr.

    @method show
    **/
    show: function () {
      if (!this._vars.isBuilt) {
        this._attachList();
      }

      this._vars.isBuilt = true;

      this._delay(function () {
        this._html.link
          .addClass(this._css.focus)
          .popover('show');
      }, 0);
    },

    /**
    Returns the current value of the selectr instance in a normalized fashion, whether it's drawing on a native select element, or an ajax-loaded container.

    @method value
    **/
    value: function () {
      return this._getValue();
    },

    widget: function () {
      return this._html.wrapper;
    }
  });
}));
