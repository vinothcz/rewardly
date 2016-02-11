/*! crux-grid - v2.9.2 - 2015-02-20
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />
/// <reference path="cs.pagr.js" />
/// <reference path="cs.scrollr.js" />
/// <reference path="cs.tooltip.js" />

/*global Modernizr, Handlebars */

/**
Creates a sortable, filterable and paginated data grid. Works cloesely with {{#crossLink "Loadr"}}{{/crossLink}} to take data from the server and creates the grid from the results.

To create the columns for the grid the response should be updated to included a <code>ColumnHeaders</code> member. It should be an array of objects that contain either the column
information, or a grouping of columns with its own Description, in a nested ColumnHeaders property.

<pre class="prettyprint">
{
    ColumnHeaders: [
        {
            Description: "Display Text",
            SortColumn: "ColumnID" //Only add this if you want sort data
        },

        // BETA - Grouped column styles still under development!
        {
            Description: "This is a Column Grouping",
            ColumnHeaders: [
                {
                    Description: "Display First Name Text",
                    SortColumn: "FirstName"
                },
                {
                    Description: "Display Last Name Text",
                    SortColumn: "LastName" //Only add this if you want sort data
                }
            ]
        }
    ],
    TotalRecords: 1,
    Results: []
}
</pre>

@class Grid
@extends Pagr
@module Widgets

@tests grid/grid.html
@demo docs/demos/grid.jade
**/

(function (window, define, factory, undefined) {
    "use strict";

    if (define !== undefined) {
        define(['./cs.base.js', './cs.pagr.js', './cs.scrollr.js', './cs.tooltip.js', './cs.helpers.js'], factory);
    } else {
        factory();
    }
}(
    this,
    this.define,
    function () {
        "use strict";

        var Increment = 0,

            Namespace = 'cs-grid-',

            BulkSelection = {
                SINGLE: -1,
                NONE: 0,
                VISIBLE: 1,
                ALL: 2
            },

            Css = {
                body: Namespace + 'body',
                bulk: Namespace + 'bulk',
                bulkWrapper: Namespace + 'bulk-wrapper',
                bulkCount: Namespace + 'bulk-count',
                bulkLinks: Namespace + 'bulk-links',
                panel: Namespace + 'panel',
                scrolled: Namespace + 'panel-scrolled',
                wrapper: Namespace + 'wrapper',
                superHeader: Namespace + 'super',
                colgroup: Namespace + 'colgroup',
                colgroupStart: Namespace + 'colgroup-start',
                colgroupEnd: Namespace + 'colgroup-end'
            },

            Templates = {
                thead: '<thead>{{#if ColumnSuperHeaders}}<tr class="' + Css.superHeader + '">{{> theadSuper}}</tr>{{/if}}<tr>{{> theadBase}}</tr></thead>',
                bulkHead: '<thead>{{#if ColumnSuperHeaders}}<tr class="' + Css.superHeader + '">{{> theadSuper}}</tr>{{/if}}<tr><th scope="col" class="' + Css.bulk + '"><div class="' + Css.bulkWrapper + '"><div class="' + Css.bulkCount + '"><span></span><i class="caret4 south"></i></div><a href="#"><i class="caret4 south"></i></a>{{> theadBulk}}</div><span>b</span></th>{{> theadBase}}</tr></thead>',
                bulkBody: '<td class="' + Css.bulk + '"><input type="checkbox" {{bulk_checked& $}} name="bulk-{{$}}" id="%-{{$}}" value={{$}}><label for="%-{{$}}"></label></td>',
                bulkLinks: Handlebars.compile('<ul class="' + Css.bulkLinks + '">{{#each links}}<li class="' + Css.bulkLinks + '-{{ClassName}}" data-bulk-selection-value="{{Id}}"><a href="#">{{Label}}</a></li>{{/each}}</ul>')
            },

            BulkLinks = {
                links: [
                    {
                        Id: BulkSelection.NONE,
                        Label: 'Select None',
                        ClassName: 'none'
                    },
                    {
                        Id: BulkSelection.VISIBLE,
                        Label: 'Select Visible',
                        ClassName: 'visible'
                    },
                    {
                        Id: BulkSelection.ALL,
                        Label: 'Select All',
                        ClassName: 'all'
                    }
                ]
            },

            SortDirections = ['north', 'south'],

            Reg = {
                removeClass: /\s*deferred-grid\s*/ig,
                removeSpace: /(<(?:([\w\d]+)\b|\/\1)[^>]*>)[\s\t\r\n]+/gim,
                replaceRow: /(<tr[^>]*>)/g
            },

            EmptySuperHeader = {
                Description: '&nbsp;',
                Attributes: {
                    scope: 'col',
                    colspan: 1
                }
            },

            _clientSort = function (results) {
                var modifier = (this.options.sortdirection ? -1 : 1),
                    sortcolumn = this.options.sortcolumn;

                return results.sort(function (a, b) {
                    if (a[sortcolumn] < b[sortcolumn]) {
                        return -1 * modifier;
                    } else if (a[sortcolumn] > b[sortcolumn]) {
                        return 1 * modifier;
                    }

                    return 0;
                });
            },

            _clientFilter = function (results) {
                var clientsort = this.options.clientsort;

                if (typeof clientsort === 'string') {
                    clientsort = CRUX.stringToFunction(clientsort);
                }

                if (this.options.sortcolumn) {
                    if (this.options.allresults === false && results.Results) {
                        results.Results = clientsort.call(this, results.Results);
                    } else if (this.options.allresults === true) {
                        results = clientsort.call(this, results);
                    }
                }

                return $.crux.pagr.prototype.options.clientfilter.call(this, results);
            };

        Handlebars.registerHelper('eachProperty', function (context, options) {
            var output = [];
            for (var key in context) {
                if (context.hasOwnProperty(key)) {
                    output.push(options.fn({
                        Key: key,
                        Value: context[key]
                    }));
                }
            }
            return output.join('');
        });

        Handlebars.registerPartial('theadSuper', '{{#ColumnSuperHeaders}}<th{{#eachProperty Attributes}} {{Key}}="{{Value}}"{{/eachProperty}}>{{{Description}}}</th>{{/ColumnSuperHeaders}}');
        Handlebars.registerPartial('theadBase', '{{#ColumnHeaders}}<th {{#if SortColumn}}class="sortcolumn"{{/if}}{{#eachProperty Attributes}} {{Key}}="{{Value}}"{{/eachProperty}}>{{#if SortColumn}}<a href="#" data-cs-sortcolumn="{{SortColumn}}"{{#if SortDirection}} data-cs-sortdirection="{{SortDirection}}"{{/if}}>{{Description}} <i class="caret4 north"></i><i class="caret4 south"></i></a>{{else}}{{Description}}{{/if}}</th>{{/ColumnHeaders}}');
        Handlebars.registerPartial('theadBulk', Templates.bulkLinks(BulkLinks));

        $.widget('crux.grid', $.crux.pagr, {
            options: {

                /**
                Toggles bulk selection on the grid rows.

                @property bulk
                @type Boolean

                @default false
                **/
                bulk: false,

                /**
                A function hook that is called after an individual bulk item has been selected. This option does not trigger for bulk menu selections.

                @property bulkdeselected
                @type Function

                @default null
                **/
                bulkdeselected: null,

                /**
                A function hook that is called after an option has been selected from the bulk selection menu, or an individual bulk item has been selected.

                @property bulkselected
                @type Function

                @default null
                **/
                bulkselected: null,

                /**
                Function that is called when a resultsdata lookup is made. Default value returns the full result set if <code>resultsdata</code> is a string, or an interally-paged result set if <code>resultsdata</code> is an object.

                @property clientfilter
                @type Function

                @default _clientFilter
                **/
                clientfilter: _clientFilter,

                /**
                Function that is called when any time a resultsdata sort is applied. Default value uses a standard <code>Array.prototype.sort</code> function to sort on the appropriate field, but this can be overriden to provide custom sort logic on a per-column basis.

                @property clientsort
                @type Function

                @default _clientSort
                **/
                clientsort: _clientSort,

                /**
                Freeze the chosen number of columns starting on the left. If <code>bulk</code> is enabled that column will not count against the number indicated by this property.

                @property freeze
                @type Number

                @default 0
                **/
                freeze: 0,

                /**
                The id of the column that you want to sort by on the initial load of the grid. This value needs to be set for sorting to be enabled on the grid.

                @property sortcolumn
                @type String

                @default null
                **/
                sortcolumn: null,

                /**
                The sort direction for the currently set <code>sortcolumn</code>. 0 is ascending and 1 is descending.

                @property sortdirection
                @type Number

                @default 0
                **/
                sortdirection: 0
            },

            _create: function () {
                this._vars = {
                    autoload: false,
                    bulk: {
                        count: 0,
                        include: true,
                        model: []
                    },
                    defaults: {
                        sortcolumn: this.options.sortcolumn,
                        sortdirection: this.options.sortdirection
                    },
                    grid: {
                        id: Namespace + (Increment += 1),
                        thead: this.options.bulk ? Templates.bulkHead : Templates.thead
                    },
                    staticSuperHead: false,
                    staticHead: false
                };

                this._html = {
                    documentRoot: $('html'), // handle to html element for the sake of an IE9 bug
                    grid: {
                        body: null,
                        panel: null,
                        wrapper: null
                    },
                    count: ''
                };

                if (this.element.find('thead').length) {
                    this._buildHead();
                }

                this._grid();

                if (this.options.bulk) {
                    var self = this;
                    Handlebars.registerHelper('bulk_checked' + Increment, function (value) {
                        var checked = false;
                        if (!self._vars.bulk.include && self._vars.bulk.model.length) {
                            checked = $.inArray(value.toString(), self._vars.bulk.model) === -1;
                        } else if (!self._vars.bulk.include && !self._vars.bulk.model.length) {
                            checked = true;
                        } else if (self._vars.bulk.include && self._vars.bulk.model.length) {
                            checked = $.inArray(value.toString(), self._vars.bulk.model) !== -1;
                        }

                        return checked ? 'checked="checked"' : '';
                    });

                    this._attachBulk();
                }


                this._vars.autoload = this.options.autoload;
                this.options.autoload = false;
                this.options.target = this._html.grid.wrapper;

                this.element.after(this._html.grid.wrapper).width(1).height(1).css({
                    'position': 'absolute',
                    'overflow': 'hidden'
                }).hidden();

                $.crux.loadr.prototype._create.call(this);

                this._pagr();
                this._attachSort();
                this._update();

                if (this._vars.autoload) {
                    this.start();
                }
            },

            _buildHead: function () {
                if (this.element.find('thead tr').length === 2) {
                    this._vars.staticSuperHead = $.map(this.element.find('thead tr:first th'), function (el, i) {
                        var text = $(el).text(),
                            attributes = {},
                            colgroupClasses = [Css.colgroup, Css.colgroupStart, Css.colgroupEnd].join(' ');

                        $.each(el.attributes || [], function () {
                            var name = this.nodeName.toLowerCase();

                            attributes[name] = this.nodeValue;

                            if (name === 'class') {
                                attributes[name] = $.trim(attributes[name] + ' ' + colgroupClasses);
                            }
                        });

                        if (!attributes.colspan) {
                            attributes.colspan = 1;
                        }

                        if (!attributes.scope) {
                            attributes.scope = (text === EmptySuperHeader.Description ? 'colgroup' : 'col');
                        }

                        return {
                            Description: text,
                            Attributes: attributes
                        };
                    });
                }
                this._vars.staticHead = $.map(this.element.find('thead tr:last th'), function (el, i) {
                    var $el = $(el),
                        attributes = {};

                    $.each(el.attributes || [], function () {
                        attributes[this.nodeName.toLowerCase()] = this.nodeValue;
                    });

                    if (!attributes.scope) {
                        attributes.scope = 'col';
                    }

                    return {
                        Description: $el.text(),
                        SortColumn: $el.data('csSortcolumn') || '',
                        Attributes: attributes
                    };
                });
            },

            _modifyTemplate: function (source) {
                if (this.options.bulk) {
                    var body = Templates.bulkBody
                                .replace(/\%/g, this._vars.grid.id)
                                .replace(/\$/g, this.options.bulk)
                                .replace(/\&/, Increment);

                    source = source.replace(Reg.replaceRow, '$1' + body);
                }
                return (this._vars.grid.thead + '<tbody>{{#each_index Results}}' + source + '{{/each_index}}</tbody>').replace(Reg.removeSpace, '$1');
            },

            _processHeaders: function () {
                var self = this,
                    columns = (this.options.freeze ? this.options.freeze + (this.options.bulk ? 1 : 0) : 0);

                if (this._vars.staticHead) {
                    this._vars.resultsData.ColumnHeaders = this._vars.staticHead;

                    if (this._vars.staticSuperHead) {
                        this._vars.resultsData.ColumnSuperHeaders = this._vars.staticSuperHead;
                    }
                } else {
                    var containsGroupings = false,
                        columnSuperHeaders = [],
                        columnHeaders = [],
                        columnHeaderAttributes = {
                            scope: 'col'
                        },
                        columnSuperHeaderAttributes = {
                            scope: 'colgroup',
                            'class': [Css.colgroup, Css.colgroupStart, Css.colgroupEnd].join(' ')
                        };

                    // Initialize ColumnSuperHeaders to false, and only overwrite that if we have valid data.
                    this._vars.resultsData.ColumnSuperHeaders = false;

                    // First, we have to loop through this collection to see if we have *any* ColumnGrouping objects,
                    // so we know if we have to add ColumnSuperHeader padding cells where no groupings exist...
                    $.each(this._vars.resultsData.ColumnHeaders || [], function (index, columnHeaderOrGrouping) {
                        if (columnHeaderOrGrouping.ColumnHeaders) {
                            containsGroupings = true;
                        }
                        return !containsGroupings;
                    });

                    $.each(this._vars.resultsData.ColumnHeaders || [], function (index, columnHeaderOrGrouping) {
                        if (columnHeaderOrGrouping.ColumnHeaders) {
                            // This is a ColumnGrouping item, add it to our columnSuperHeaders collection,
                            // along with its default attributes, and a new attribute to denote its colspan.
                            columnSuperHeaders.push({
                                Description: columnHeaderOrGrouping.Description,
                                Attributes: $.extend(true, {}, columnSuperHeaderAttributes, {
                                    colspan: columnHeaderOrGrouping.ColumnHeaders.length
                                })
                            });

                            // Now loop through each of its ColumnHeader objects and add
                            // them to columnHeaders, along with its default attributes.
                            $.each(columnHeaderOrGrouping.ColumnHeaders || [], function (i, columnHeader) {
                                columnHeaders.push($.extend(true, {}, columnHeader, {
                                    Attributes: columnHeaderAttributes
                                }));
                            });
                        } else {
                            // Typical ColumnHeader object, add it to our columnHeaders
                            // collection, along with its default attributes.
                            columnHeaders.push($.extend(true, {}, columnHeaderOrGrouping, {
                                Attributes: columnHeaderAttributes
                            }));

                            // If we have any column groups, we need to an EmptySuperHeader object
                            // here to pad out the legitimate columnSuperHeaders to the right column.
                            if (containsGroupings) {
                                columnSuperHeaders.push($.extend(true, {}, EmptySuperHeader));
                            }
                        }
                    });

                    this._vars.resultsData.ColumnHeaders = columnHeaders;

                    // Only overwrite ColumnSuperHeaders if we have valid columnSuperHeaders data.
                    if (containsGroupings) {
                        this._vars.resultsData.ColumnSuperHeaders = columnSuperHeaders;
                    }
                }

                // If we have frozen columns, make sure there's no superHeader overlap. If there is, split the
                // superheader column at the overlap point, and duplicate the info between table sections.
                if (this._vars.resultsData.ColumnSuperHeaders) {
                    if (this.options.bulk) {
                        this._vars.resultsData.ColumnSuperHeaders.splice(0, 0, $.extend(true, {}, EmptySuperHeader));
                    }

                    if (columns) {
                        var totalColspan = 0;

                        $.each(this._vars.resultsData.ColumnSuperHeaders || [], function (index, columnSuperHeader) {
                            totalColspan += columnSuperHeader.Attributes.colspan;

                            if (totalColspan === columns) { // Clean delineation, no overlap, exit loop
                                return false;
                            } else if (totalColspan > columns) { // Overlap, compensate for it here
                                // Split off a newColumnSuperHeader for the overflow
                                var newColumnSuperHeader = $.extend(true, {}, columnSuperHeader);

                                newColumnSuperHeader.Attributes.colspan = totalColspan - columns;

                                // Cut off the original columnSuperHeader at the overflow point
                                columnSuperHeader.Attributes.colspan -= newColumnSuperHeader.Attributes.colspan;

                                // Add the newColumnSuperHeader into the ColumnSuperHeaders array
                                self._vars.resultsData.ColumnSuperHeaders.splice(index + 1, 0, newColumnSuperHeader);

                                return false;
                            }
                        });
                    }
                }
            },

            _processOutputWithColumnGroupings: function (table, head, body) {
                var totalColspan = 0,
                    selectorIndexes = {
                        group: [],
                        start: [],
                        end: []
                    };

                if (this._vars.resultsData.ColumnSuperHeaders) {
                    // Loop through our superheader to find column groupings
                    head
                        .find('tr.' + Css.superHeader + ' th')
                            .filter(function (index) {
                                var $this = $(this),
                                    colspan = Number($this.attr('colspan')) || 1;

                                if ($this.hasClass(Css.colgroup)) {
                                    selectorIndexes.start.push(totalColspan);
                                    selectorIndexes.end.push(totalColspan + colspan - 1);

                                    for (var i = 0, j = colspan; i < j; i++) {
                                        selectorIndexes.group.push(totalColspan + i);
                                    }
                                }

                                totalColspan += colspan;
                            });

                    // Set grouping classes as appropriate on thead th's
                    head
                        .find('tr:not(.' + Css.superHeader + ')')
                            .each(function () {
                                $(this)
                                    .find('th:eq(' + selectorIndexes.group.join('), th:eq(') + ')')
                                        .addClass(Css.colgroup)
                                        .end()
                                    .find('th:eq(' + selectorIndexes.start.join('), th:eq(') + ')')
                                        .addClass(Css.colgroupStart)
                                        .end()
                                    .find('th:eq(' + selectorIndexes.end.join('), th:eq(') + ')')
                                        .addClass(Css.colgroupEnd);
                            });

                    // Set grouping classes as appropriate on tbody td's
                    body
                        .find('tr')
                            .each(function () {
                                $(this)
                                    .children('td:eq(' + selectorIndexes.group.join('), td:eq(') + ')')
                                        .addClass(Css.colgroup)
                                        .end()
                                    .children('td:eq(' + selectorIndexes.start.join('), td:eq(') + ')')
                                        .addClass(Css.colgroupStart)
                                        .end()
                                    .children('td:eq(' + selectorIndexes.end.join('), td:eq(') + ')')
                                        .addClass(Css.colgroupEnd);
                            });
                }

                // Account for IE9 phantom table cell bug
                if (this._html.documentRoot.hasClass('ie9')) {
                    table.append(head.html(head.html().replace(Reg.removeSpace, '$1')), body.html(body.html().replace(Reg.removeSpace, '$1')));
                } else {
                    table.append(head, body);
                }
            },

            _processOutput: function () {
                var self = this,
                    columns = (this.options.freeze ? this.options.freeze + (this.options.bulk ? 1 : 0) : 0);

                this._processHeaders();

                if (this._html.grid.body.is(':crux-scrollr')) {
                    this._html.grid.body.scrollr('destroy');
                    this._html.grid.body.css('padding-bottom', '');
                }

                var table = $('<table>', {
                        'class': this.element[0].className.replace(Reg.removeClass, '')
                    }),
                    body = this._vars.template(this._vars.resultsData),
                    panel = body,
                    bodyHead,
                    bodyBody;

                if (columns) {
                    panel = $(panel);
                    body = $(body);

                    var panelHead = $(panel.get(0)),
                        panelBody = $(panel.get(1)),
                        panelTable = table.clone();

                    bodyHead = $(body.get(0));
                    bodyBody = $(body.get(1));

                    panelHead
                        .find('tr')
                            .each(function () {
                                var totalColspan = 0;

                                $(this)
                                    .find('th')
                                        .filter(function () {
                                            totalColspan += Number($(this).attr('colspan')) || 1;

                                            return (totalColspan > columns);
                                        })
                                            .remove();
                            });

                    panelBody
                        .find('tr')
                            .each(function () {
                                $(this)
                                    .find('td:gt(' + (columns - 1) + ')')
                                        .remove();
                            });

                    this._processOutputWithColumnGroupings(panelTable, panelHead, panelBody);

                    bodyHead
                        .find('tr')
                            .each(function () {
                                var totalColspan = 0;

                                $(this)
                                    .find('th')
                                        .filter(function () {
                                            totalColspan += Number($(this).attr('colspan')) || 1;

                                            return (totalColspan <= columns);
                                        })
                                            .remove();
                            });

                    bodyBody
                        .find('tr')
                            .each(function () {
                                $(this)
                                    .find('td:lt(' + columns + ')')
                                        .remove();
                            });

                    this._processOutputWithColumnGroupings(table, bodyHead, bodyBody);

                    this._html.grid.panel.html(panelTable);
                    this._html.grid.body.html(table);
                    this._html.grid.wrapper.addClass(Css.scrolled).append(this._html.grid.panel, this._html.grid.body);
                } else {
                    body = $(body);
                    bodyHead = $(body.get(0));
                    bodyBody = $(body.get(1));

                    this._processOutputWithColumnGroupings(table, bodyHead, bodyBody);

                    this.options.target.append(this._html.grid.body.html(table));
                }

                if (this.options.sortcolumn) {
                    this._setSort();
                }

                if (this.options.bulk && this._vars.bulk.count) {
                    $('.cs-grid-bulk-count', this._html.grid.wrapper).show().children('span').text(this._vars.bulk.count);
                }

                this._html.grid.body.scrollr();

                // Fix to keep IE7 from overlapping our scrollable content with a scrollbar
                if (this._html.documentRoot.is('.ie7')) {
                    if (this._html.grid.body.is(':crux-scrollr') && this._html.grid.body[0].scrollWidth > this._html.grid.body.width()) {
                        this._html.grid.body.css('padding-bottom', '17px');
                    }
                }
            },

            _setSort: function () {
                this._html.grid.wrapper.find('a[data-cs-sortcolumn="' + this.options.sortcolumn + '"]').addClass('current').find('.'+SortDirections[this.options.sortdirection]).addClass('sortdirection');
            },

            _grid: function () {
                var grid = this._html.grid;
                grid.wrapper = $('<div>', {
                    'class': Css.wrapper
                });

                grid.body = $('<div>', {
                    'class': Css.body
                });

                if (this.options.freeze) {
                    grid.panel = $('<div>', {
                        'class': Css.panel
                    });
                }
            },

            _attachSort: function () {
                this._html.grid.wrapper.on('click', 'th:not(.' + Css.bulk + ') a[data-cs-sortcolumn]', $.proxy(this._sort, this));
            },

            _attachBulk: function () {
                this._html.grid.wrapper.on('click.bulk', 'th.' + Css.bulk + ' a', $.proxy(this._bulkMenu, this));
                this._html.grid.wrapper.on('click.bulk', 'td.' + Css.bulk + ' input', $.proxy(this._handleBulk, this));
            },

            _bulkMenu: function (e) {
                e.preventDefault();
                var target = $(e.currentTarget);

                target.next().on('click', 'a', $.proxy(this._bulkSelect, this));

                if (!target.is(':crux-tooltip')) {
                    target.tooltip({
                        autoshow: true,
                        event: 'click',
                        content: target.next(),
                        position: 'center'
                    });
                }
            },

            _bulkSelect: function (e) {
                e.preventDefault();

                var bulkSelectionValue = $(e.target).parent().data('bulkSelectionValue'),
                    self = this;

                switch (bulkSelectionValue) {
                case BulkSelection.NONE:
                    this._vars.bulk.include = true;
                    this._vars.bulk.model = [];
                    this._vars.bulk.count = 0;
                    this._html.grid.wrapper.find('.' + Css.bulk + ' input:checked').prop('checked', false).removeClass('checked');
                    break;

                case BulkSelection.VISIBLE:
                    if (!this._vars.bulk.include) {
                        this._vars.bulk.model = [];
                    }
                    this._vars.bulk.include = true;
                    this._html.grid.wrapper.find('.' + Css.bulk + ' input').each(function (i, el) {
                        if ($.inArray(el.value, self._vars.bulk.model) === -1) {
                            self._vars.bulk.model.push(el.value);
                        }
                    }).prop('checked', true);
                    this._vars.bulk.count = this._vars.bulk.model.length;
                    break;

                case BulkSelection.ALL:
                    this._vars.bulk.model = [];
                    this._vars.bulk.include = false;
                    this._html.grid.wrapper.find('.' + Css.bulk + ' input:unchecked').prop('checked', true);
                    this._vars.bulk.count =  this._vars.resultsData.TotalRecords;
                    break;
                }

                if (this._vars.bulk.count === 0) {
                    $('.cs-grid-bulk-count', this._html.grid.wrapper).hide();
                } else {
                    $('.cs-grid-bulk-count', this._html.grid.wrapper).show().children('span').text(this._vars.bulk.count);
                }

                this._html.grid.wrapper.find('th.' + Css.bulk + ' a').tooltip('hide');

                this._trigger('bulkselected', null, {
                    bulkdata: this.bulk(),
                    selection: null,
                    type: bulkSelectionValue
                });
            },

            _handleBulk: function (e) {
                var target = e.target,
                    value = target.value.toString();

                if (target.checked) {
                    if (this._vars.bulk.include) {
                        this._vars.bulk.model.push(value);
                    } else {
                        this._vars.bulk.model = $.grep(this._vars.bulk.model, function (val, i) {
                            return val !== value;
                        });
                    }
                    this._vars.bulk.count += 1;
                } else {
                    if (this._vars.bulk.include) {
                        this._vars.bulk.model = $.grep(this._vars.bulk.model, function (val, i) {
                            return val !== value;
                        });
                    } else {
                        this._vars.bulk.model.push(value);
                    }
                    this._vars.bulk.count -= 1;
                }

                if (this._vars.bulk.count === 0) {
                    $('.cs-grid-bulk-count', this._html.grid.wrapper).hide();
                } else {
                    $('.cs-grid-bulk-count', this._html.grid.wrapper).show().children('span').text(this._vars.bulk.count);
                }

                this._trigger('bulk' + (target.checked ? '' : 'de') + 'selected', null, {
                    bulkdata: this.bulk(),
                    selection: target,
                    type: BulkSelection.SINGLE
                });
            },

            _update: function () {
                if (this.options.sortcolumn !== null) {
                    this.options.data.sortcolumn = this.options.sortcolumn;
                }

                if (this.options.sortdirection !== null) {
                    this.options.data.sortdirection = this.options.sortdirection;
                }

                $.crux.pagr.prototype._update.call(this);
            },

            _sort: function (e) {
                e.preventDefault();

                if (this._vars.isLoading) {
                    return;
                }

                var link = $(e.currentTarget),
                    sortColumn = link.data('csSortcolumn'),
                    sortDirection = link.data('csSortdirection');

                if (sortColumn !== this.options.sortcolumn) {
                    this.options.sortcolumn = sortColumn;
                    this.options.sortdirection = (sortDirection !== undefined ? sortDirection : this._vars.defaults.sortdirection);
                } else {
                    this.options.sortdirection = +!this.options.sortdirection;
                }

                this._reset();
                this._update();
                this.reload();
            },

            /**
            Gets the information about the currently selected bulk items.

            @method bulk
            @return {Object} Returns an object with three members.
            <ol>
                <li>The <code>count</code> member contains number of items currently selected</li>
                <li>The <code>data</code> member is an an array containing the selected (or deselected) items from the grid.</li>
                <li>The <code>include</code> member specifies whether to include or exclude the items in <code>data</code>.</li>
            </ol>
            <pre>
            <code>
            {
                count: 1,
                data: [],
                include: true/false
            }
            </code>
            </pre>
            **/
            bulk: function () {
                if (this.options.bulk !== false) {
                    return {
                        count: this._vars.bulk.count,
                        data: this._vars.bulk.model,
                        include: this._vars.bulk.include
                    };
                }
            },

            /**
            Removes all checked items from the grid.

            @method bulkreset
            **/
            bulkreset: function () {
                if (this.options.bulk === false) {
                    return;
                }

                this._vars.bulk.count = 0;
                this._vars.bulk.include = true;
                this._vars.bulk.model = [];
                this._html.grid.wrapper.find('.' + Css.bulk + ' input:checked').prop('checked', false);
            },

            destroy: function () {
                this.element.insertBefore(this._html.grid.wrapper);
                $.crux.pagr.prototype.destroy.call(this);
                this._html.grid.wrapper.remove();
            },

            widget: function () {
                return this._html.grid.wrapper;
            }
        });

        $(function () {
            $('.deferred-grid').grid();
        });
    }
));
