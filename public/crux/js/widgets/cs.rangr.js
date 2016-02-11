/*! crux-rangr - v2.9.0 - 2014-11-19
* Copyright (c) 2014 Crux Team; Licensed MIT */

/// <reference path="cs.popover.js" />
/// <reference path="cs.dately.js" />

/*global Modernizr, Handlebars, moment */

/**
Creates a date range picker that uses {{#crossLink "Dately"}}{{/crossLink}} for the calendar component.

<b>HTML Configuration</b><br />
You can automatically initialize this widget through HTML with the <code>deferred-rangr</code> class. It's settings can only be configured. The Rangr can be added to any element and will display when clicked on.
If it is added to a a text input, when a range is selected, the text representation of the range will appear in the input.

@class Rangr
@extends Base
@requires Dately
@module Widgets

@tests rangr/rangr.html
@demo docs/demos/rangr.jade
**/

(function (window, define, factory, undefined) {
    'use strict';

    if (define !== undefined) {
        define(['./cs.base.js', './cs.jquery.js', './cs.popover.js', './cs.dately.js'], factory);
    } else {
        factory();
    }
}(
    this,
    this.define,
    function () {
        'use strict';

        var Increment = 0,
            Namespace = 'cs-rangr-',
            Placement = ['before', 'after'],
            Css = {
                buttons: Namespace + 'buttonpane',
                calendar: Namespace + 'calendar',
                cancel: Namespace + 'cancel',
                container: Namespace + 'container',
                done: Namespace + 'done',
                error: 'message error',
                hover: 'cs-selectr-hover',
                icon: 'cs-selectr-icon',
                line: Namespace + 'line',
                link: 'cs-selectr-link',
                open: Namespace + 'ranges-open',
                options: Namespace + 'options option-list',
                picker: Namespace + 'datepicker',
                placeholder: Namespace + 'placeholder',
                preset: Namespace + 'preset',
                ranges: Namespace + 'ranges clearfix',
                rangeopen: Namespace + 'open',
                selected: Namespace + 'selected',
                wrapper: Namespace + 'wrapper'
            },
            arrow = $('<div></div>', {
                'class': 'caret4 east'
            });

        $.widget('crux.rangr', {
            options: {

                /**
                Depending on your application and/or server call, selecting 'All' for a date range might need to passed as a <code>null</code> value. If that is the case for you, set this option to true. Otherwise, selecting all will send a range from the <code>mindate</code> to the <code>maxdate</code>.

                @property allnull
                @type Boolean
                @default false
                **/
                allnull: false,

                /**
                The format in which you want the date to display and pass to the server if in a form. For a list of available strings to use to format the date please see the <a href="http://momentjs.com/docs/#/parsing/string-format/" target="_blank">Moment.js String + Format Documentation</a>. <i>This format will be the same format that is applied to the {{#crossLink "Dately"}}{{/crossLink}} calendar(s), and will be used in the label or value of the Rangr element.</i>.

                @property format
                @type String
                @default "MM/DD/YYYY"
                **/
                format: 'MM/DD/YYYY',

                /**
                The configuration of the labels that are displayed on the left side of the Rangr widget. These labels can only be set during initialization of the widget. <i>Currently these can only set via JavaScript, adding <code>data-cs-labels="{...}"</code> will not work</i>.

                @property labels
                @type Object
                @default {
                    all: 'All',
                    date: 'On',
                    through: 'Through',
                    before: 'Before',
                    since: 'Since',
                    after: 'After',
                    range: 'Between'
                }
                **/
                labels: {
                    all: 'All',
                    date: 'On',
                    before: 'Before',
                    through: 'Through',
                    after: 'After',
                    since: 'Since',
                    range: 'Between'
                },

                /**
                An array of custom preset date ranges you wish to supply for this Rangr widget. These custom ranges can only be set during initialization of the widget. Examples might include "Last 7 Days" or "Last 6 Months". Each element of the array must be an object map conforming to the following example format (optional properties denoted):

                <pre class="prettyprint">
                {
                    label: [required] [String],
                    start: [optional] [String | Date Object | Momentjs Object | Timestamp] Defaults to mindate option
                    end: [optional] [String | Date Object | Momentjs Object | Timestamp] Defaults to maxdate option
                    placement: [optional] [String] Defaults to 'before'. Where to place this: before or after calendar options.
                }

                // Example initialization
                $('.example').rangr({presets: [{
                    label: 'Last 7 Days',
                    start: moment().subtract('days', 7),
                    end: moment(),
                    placement: 'after'
                }]});
                </pre>

                @property presets
                @type Array
                @default []
                **/
                presets: [],

                /**
                This option can only be set during initialization of the widget. Controls which option or date range to default the widget to after initialization.

                @property selected
                @type Object
                @default {
                    range: 'all',
                    start: null,
                    end: null
                }
                **/
                selected: {
                    range: 'all',
                    start: null,
                    end: null
                },

                /**
                This option can only be set at initialization of the widget. Controls whether the calendar options in the Rangr widget will be month-level displays, or more granular enough for actual date selection.

                @property showdays
                @type Boolean
                @default true
                **/
                showdays: true,

                /**
                This option can only be set at initialization of the widget. Controls the display of the 'All' option in the Rangr list.

                @property showalloption
                @type Boolean
                @default true
                **/
                showalloption: true,

                /**
                This option can only be set at initialization of the widget. Controls the display of the 'Ends On' option in the Rangr list.

                @property showdateoption
                @type Boolean
                @default true
                **/
                showdateoption: true,

                /**
                This option can only be set at initialization of the widget. Controls the display of the 'Ends Before' option in the Rangr list. Inclusive of end date.

                @property showthroughoption
                @type Boolean
                @default true
                **/
                showthroughoption: true,

                /**
                This option can only be set at initialization of the widget. Controls the display of the 'Ends Before' option in the Rangr list. Exclusive of end date.

                @property showbeforeoption
                @type Boolean
                @default true
                **/
                showbeforeoption: false,

                /**
                This option can only be set at initialization of the widget. Controls the display of the 'Ends After' option in the Rangr list. Inclusive of beginning date.

                @property showsinceoption
                @type Boolean
                @default true
                **/
                showsinceoption: true,

                /**
                This option can only be set at initialization of the widget. Controls the display of the 'Ends After' option in the Rangr list. Exclusive of beginning date.

                @property showafteroption
                @type Boolean
                @default true
                **/
                showafteroption: false,

                /**
                This option can only be set at initialization of the widget. Controls the display of the 'Date Range' option in the Rangr list.

                @property showrangeoption
                @type Boolean
                @default true
                **/
                showrangeoption: true,

                /**
                The minimum date the calendar will allow you to pick. Defaults to the first day of the month. When selecting 'All' or 'Ends Before'

                @property mindate
                @type String | Date Object
                @default moment()
                **/
                mindate: moment(),

                /**
                The maximum date the calendar will allow you to pick. Defaults to the last day of the month. When selecting 'All' or 'Ends After' this will be the maximum date for the range.

                @property maxdate
                @type String | Date Object
                @default moment.add('years', 11)
                **/
                maxdate: moment().add('years', 11),

                /**
                A callback that is triggered after pressing the 'Apply' button and selecting a range. Receives an object with label, range, start, and end date information as its 2nd parameter.

                @property select
                @type Function
                @default $.noop
                **/
                select: $.noop
            },

            _create: function () {
                this._html = {
                    buttons: null,
                    cancel: null,
                    caret: null,
                    container: null,
                    done: null,
                    error: null,
                    label: null,
                    list: null,
                    picker: null,
                    rangepicker: null,
                    ranges: null,
                    selectedIcon: null,
                    title: null,
                    wrapper: null
                };

                this._vars = {
                    activeRange: null,
                    id: 0,
                    isText: false,
                    label: null,
                    presets: [],
                    ranges: {
                        all: true,
                        date: true,
                        through: true,
                        before: true,
                        since: true,
                        after: true,
                        range: true
                    },
                    selectedrange: 'all',
                    startDate: null,
                    endDate: null
                };

                this._vars.isText = this.element.is(':text');

                this._vars.id = Namespace + (Increment += 1);

                $.each(this._vars.ranges, $.proxy(function (key, value) {
                    this._vars.ranges[key] = this.options['show' + key + 'option'];
                }, this));

                this._vars.activeRange = this.options.selected.range;
                this._vars.selectedrange = this.options.selected.range;

                if (this.options.selected.start) {
                    this._vars.startDate = this.options.selected.start;
                }
                if (this.options.selected.end) {
                    this._vars.endDate = this.options.selected.end;
                }

                if (this.options.showdays) {
                    this.options.mindate = moment(this.options.mindate, this.options.format);
                    this.options.maxdate = moment(this.options.maxdate, this.options.format);
                } else {
                    this.options.mindate = moment(this.options.mindate, this.options.format).startOf('month');
                    this.options.maxdate = moment(this.options.maxdate, this.options.format).endOf('month');
                }

                this.options.mindate = this.options.mindate.startOf('day');
                this.options.maxdate = this.options.maxdate.startOf('day');

                this._setPresets();

                $.extend(this.options, {
                    classname: Css.wrapper,
                    direction: 'bottom',
                    position: 'left',
                    offset: '-10 2',
                    size: 10,
                    speed: 200,
                    target: null
                });

                this.element.addClass(Css.link);

                this._buildSelectors();
                this._attachEvents();
            },

            _setPresets: function () {
                // strip any useless information based on format (e.g. hh:mm:ss on date comparisons)
                var defaultStart = this.options.mindate,
                    defaultEnd = this.options.maxdate,
                    presets = this.options.presets || [],
                    removeIndexes = [];

                if ($.type(presets) !== 'array') {
                    throw new TypeError('Presets option must be an array');
                }

                $.each(presets, $.proxy(function (index, preset) {
                    preset.label = $.trim(preset.label);

                    if ($.trim(preset.label) === '') {
                        throw new Error('Label property is required for custom presets');
                    }

                    if (preset.placement) {
                        if ($.inArray(preset.placement, Placement) === -1) {
                            throw new RangeError('Placement property for "' + preset.label + '" should be one of the following: "' + Placement.join('", "') + '". It was entered as "' + preset.placement.toString() + '"');
                        }
                    } else {
                        preset.placement = Placement[0];
                    }

                    if (!preset.start) {
                        preset.start = defaultStart;
                    } else {
                        preset.start = moment(moment(preset.start).format(this.options.format), this.options.format);
                    }

                    if (!preset.end) {
                        preset.end = defaultEnd;
                    } else {
                        preset.end = moment(moment(preset.end).format(this.options.format), this.options.format);
                    }

                    if ((preset.start >= defaultStart && preset.start <= defaultEnd) || (preset.end >= defaultStart && preset.end <= defaultEnd)) {
                        if (preset.start < defaultStart) {
                            preset.start = defaultStart;
                        }
                        if (preset.end > defaultEnd) {
                            preset.end = defaultEnd;
                        }
                        presets[index] = preset;
                    } else {
                        removeIndexes.push(index);
                    }
                }, this));

                $.each(removeIndexes, function (index, removeIndex) {
                    presets.splice(removeIndex, 1);
                });

                this._vars.presets = presets;
            },

            _buildSelectors: function () {
                var item = null,
                    beforeCount = 0,
                    afterCount = 0,
                    startDate = null,
                    endDate = null;

                this._html.title = $('<label></label>')
                    .append(this.element.html())
                    .appendTo(this.element.empty());

                this._html.caret = $('<div></div>', {
                    'class': 'caret6 south'
                })
                    .appendTo(this.element);

                this._html.label = $('<div></div>')
                    .insertAfter(this._html.title);

                this._html.wrapper = $('<div></div>');

                this._html.list = $('<ul></ul>',
                    {
                        'class': Css.options
                    })
                    .appendTo(this._html.wrapper);

                this._html.container = $('<div></div>',
                    {
                        'class': Css.container
                    })
                    .appendTo(this._html.wrapper)
                    .hide();

                this._html.error = $('<div></div>',
                    {
                        'class': Css.error
                    })
                    .hide()
                    .appendTo(this._html.container);

                this._html.ranges = $('<div></div>',
                    {
                        'class': Css.ranges
                    })
                    .appendTo(this._html.container);

                // Determine which date to use as the default selection
                if (this._vars.startDate) {
                    if (this._vars.selectedrange === 'date') {
                        startDate = this.options.selected.start || this.options.selected.end;
                    } else if (this._vars.selectedrange === 'before' || this._vars.selectedrange === 'through') {
                        startDate = this.options.selected.end;
                    } else {
                        startDate = this.options.selected.start;
                    }
                    startDate = moment(startDate, this.options.format).format(this.options.format);
                }

                this._html.picker = $('<div></div>',
                    {
                        'class': Css.picker
                    })
                    .appendTo(this._html.ranges)
                    .dately({
                        date: (startDate ? moment(startDate, this.options.format) : moment()),
                        format: this.options.format,
                        mindate: this.options.mindate.format(this.options.format),
                        maxdate: this.options.maxdate.format(this.options.format),
                        showdays: this.options.showdays,
                        startofmonth: false
                    });

                // Determine which date to use as the default selection
                if (this._vars.endDate) {
                    endDate = moment(this._vars.endDate, this.options.format).format(this.options.format);
                }

                this._html.rangepicker = $('<div></div>',
                    {
                        'class': Css.picker + ' ' + Css.picker + '-end'
                    })
                    .appendTo(this._html.ranges)
                    .dately({
                        date: (endDate ? moment(endDate, this.options.format) : moment()),
                        format: this.options.format,
                        mindate: this.options.mindate.format(this.options.format),
                        maxdate: this.options.maxdate.format(this.options.format),
                        showdays: this.options.showdays,
                        startofmonth: false
                    })
                    .hide();

                this._html.buttons = $('<div></div>',
                    {
                        'class': Css.buttons
                    })
                    .appendTo(this._html.container);

                this._html.cancel = $('<button type="reset"></button>',
                    {
                        'class': Css.cancel,
                        type: 'reset'
                    })
                    .text('cancel')
                    .appendTo(this._html.buttons);

                this._html.done = $('<button></button>',
                    {
                        'class': 'primary ' + Css.done,
                        type: 'submit'
                    })
                    .text('Apply')
                    .appendTo(this._html.buttons);

                $.each(this._vars.presets, $.proxy(function (index, preset) {
                    if (preset.placement === 'before') {
                        item = $('<li></li>', {
                            'class': Css.preset + ' ' + Namespace + preset.label.toLowerCase().replace(/\s+/g, '-')
                        })
                        .data('range', preset.label)
                        .text(preset.label)
                        .appendTo(this._html.list);

                        if (this._vars.selectedrange === preset.label) {
                            item.addClass(Css.selected);
                            this._html.label.text(preset.label);
                        }
                        beforeCount++;
                    }
                }, this));

                if (beforeCount) {
                    item = $('<li></li>', {
                        'class': Css.line
                    })
                    .appendTo(this._html.list);
                }

                $.each(this._vars.ranges, $.proxy(function (key, value) {
                    if (value) {
                        item = $('<li></li>', {
                            'class': Css.calendar + ' ' + Namespace + key
                        })
                        .data('range', key)
                        .text(this.options.labels[key])
                        .append(arrow.clone())
                        .appendTo(this._html.list);

                        if (this._vars.selectedrange === key) {
                            item.addClass(Css.selected);
                            this._html.label.text(this.options.labels[key]);
                        }
                        beforeCount++;
                    }
                }, this));

                $.each(this._vars.presets, $.proxy(function (index, preset) {
                    if (preset.placement === 'after') {
                        if (afterCount === 0) {
                            item = $('<li></li>', {
                                'class': Css.line
                            })
                            .appendTo(this._html.list);
                        }

                        item = $('<li></li>', {
                            'class': Css.preset + ' ' + Namespace + preset.label.toLowerCase().replace(/\s+/, '-')
                        })
                        .data('range', preset.label)
                        .text(preset.label)
                        .appendTo(this._html.list);

                        if (this._vars.selectedrange === preset.label) {
                            item.addClass(Css.selected);
                            this._html.label.text(preset.label);
                        }
                        afterCount++;
                    }
                }, this));

                // Bump 'All' option to the top of the list, if it exists
                this._html.list
                    .find('.' + Namespace + 'all')
                    .removeClass(Css.calendar)
                    .prependTo(this._html.list);

                this.element.popover($.extend(this.options, {
                    content: this._html.wrapper
                }));

                this._setRange();

                if (this._vars.selectedrange !== 'all' && this._vars.ranges[this._vars.selectedrange]) {
                    this._showPicker();
                }
            },

            _attachEvents: function () {
                function toggleClass(e) {
                    $(e.target).toggleClass(Css.hover, e.type === 'mouseenter');
                }

                if (this._vars.isText) {
                    this._on(this.element, {
                        // Click-focus is causing the popover the disappear due to the
                        // body listener, so kill the bubbling here to prevent that.
                        click: function (e) {
                            e.stopPropagation();
                        },
                        focus: this.show
                    });
                } else {
                    this._on(this.element, {
                        click: this.show
                    });
                }

                this._on(this._html.list, {
                    'click li': this._chooseRange,
                    'mouseenter li': toggleClass,
                    'mouseleave li': toggleClass
                });

                this._on(this._html.cancel, {
                    click: this.hide
                });

                this._on(this._html.done, {
                    click: this._setRange
                });

                if (this._vars.activeRange === 'all' || this._findPreset(this._vars.activeRange)) {
                    this._setRange();
                }
            },

            _findPreset: function (label) {
                var targetPreset = null;

                $.each(this._vars.presets, function (index, preset) {
                    if (preset.label === label) {
                        targetPreset = preset;
                    }

                    return !targetPreset;
                });

                return targetPreset;
            },

            _chooseRange: function (e) {
                var li = $(e.target).closest('li');

                if (li.hasClass(Css.selected)) {
                    return false;
                }

                li.addClass(Css.selected).siblings().removeClass(Css.selected);

                this._vars.activeRange = li.data('range');
                this._showPicker();

                if (this._vars.activeRange === 'all' || this._findPreset(this._vars.activeRange)) {
                    this._setRange();
                }
            },

            _showError: function (msg) {
                this._html.error.text(msg);

                if (this._html.error.is(':hidden')) {
                    this._html.error.show('blind');
                }

                return false;
            },

            _setRange: function () {
                var preset,
                    sel = this._html.list.find('.' + Css.selected),
                    selectedrange = sel.data('range');

                if (!this._html.picker.dately('get', true) && this._vars.activeRange !== 'all') {
                    return this._showError('You must select a ' + (this._vars.activeRange === 'range' ? 'start' : '') + ' date.');
                }

                if (this._vars.activeRange === 'all') {
                    this._vars.startDate = this.options.allnull ? null : this.options.mindate;
                    this._vars.endDate = this.options.allnull ? null : this.options.maxdate;
                    this._vars.label = this.options.labels[this._vars.activeRange];
                } else if (this._vars.activeRange === 'date') {
                    this._vars.endDate = moment(this._html.picker.dately('get', true));
                    if (!this.options.showdays) {
                        this._vars.endDate.endOf('month');
                    }

                    this._vars.startDate = this._vars.endDate.clone();
                    if (!this.options.showdays) {
                        this._vars.startDate.startOf('month');
                    }

                    this._vars.label = this.options.labels[this._vars.activeRange] + ' ' + this._vars.endDate.format(this.options.format);
                } else if (this._vars.activeRange === 'before') {
                    this._vars.startDate = this.options.mindate;
                    this._vars.endDate = moment(this._html.picker.dately('get', true));
                    if (!this.options.showdays) {
                        this._vars.endDate.subtract('months', 1).endOf('month');
                    } else {
                        this._vars.endDate.subtract('days', 1);
                    }

                    this._vars.label = this.options.labels[this._vars.activeRange] + ' ' + this._vars.endDate.clone().add('days', 1).format(this.options.format);
                } else if (this._vars.activeRange === 'through') {
                    this._vars.startDate = this.options.mindate;
                    this._vars.endDate = moment(this._html.picker.dately('get', true));
                    if (!this.options.showdays) {
                        this._vars.endDate.endOf('month');
                    }

                    this._vars.label = this.options.labels[this._vars.activeRange] + ' ' + this._vars.endDate.clone().format(this.options.format);
                } else if (this._vars.activeRange === 'after') {
                    this._vars.startDate = moment(this._html.picker.dately('get', true));
                    if (!this.options.showdays) {
                        this._vars.startDate.add('months', 1).startOf('month');
                    } else {
                        this._vars.startDate.add('days', 1);
                    }

                    this._vars.endDate = this.options.maxdate;
                    this._vars.label = this.options.labels[this._vars.activeRange] + ' ' + this._vars.startDate.clone().subtract('days', 1).format(this.options.format);
                } else if (this._vars.activeRange === 'since') {
                    this._vars.startDate = moment(this._html.picker.dately('get', true));
                    if (!this.options.showdays) {
                        this._vars.startDate.startOf('month');
                    }

                    this._vars.label = this.options.labels[this._vars.activeRange] + ' ' + this._vars.startDate.clone().format(this.options.format);
                    this._vars.endDate = this.options.maxdate;
                } else if (this._vars.activeRange === 'range') {
                    this._vars.startDate = moment(this._html.picker.dately('get', true));
                    if (!this.options.showdays) {
                        this._vars.startDate.startOf('month');
                    }

                    this._vars.endDate = this._html.rangepicker.dately('get', true);
                    if (this._vars.endDate === null) {
                        return this._showError('You must select an end date.');
                    }

                    this._vars.endDate = moment(this._vars.endDate);

                    if (this._vars.startDate > this._vars.endDate) {
                        return this._showError('The start date must be on or before the end date.');
                    }

                    this._vars.label = this._vars.startDate.format(this.options.format) + ' - ' + this._vars.endDate.format(this.options.format);
                } else if ((preset = this._findPreset(this._vars.activeRange))) {
                    this._vars.startDate = preset.start;
                    this._vars.endDate = preset.end;

                    this._vars.label = selectedrange;
                }

                this._vars.selectedrange = selectedrange;

                if (this._html.error.is(':visible')) {
                    this._html.error.hide('blind');
                }

                if (this._vars.isText) {
                    this.element.val(this._vars.startDate.format(this.options.format) + ' - ' + this._vars.endDate.format(this.options.format));
                } else {
                    this._html.label.text(this._vars.label);
                }

                this._trigger('select', null, this.get());

                this.hide();
            },

            get: function () {
                return {
                    label: this._vars.label,
                    range: this._vars.selectedrange,
                    start: (this.options.allnull ? null : moment(this._vars.startDate).format(this.options.format)),
                    end: (this.options.allnull ? null : moment(this._vars.endDate).format(this.options.format))
                };
            },

            _showPicker: function () {
                if (this._html.error.is(':visible')) {
                    this._html.error.hide(100);
                }

                if (this._html.container.is(':visible')) {
                    if (this._vars.activeRange === 'all' || this._findPreset(this._vars.activeRange)) {
                        this._html.container.hide(300, 'easeInExpo', $.proxy(function () {
                            this._html.ranges.removeClass(Css.open);
                        }, this));
                    } else if (this._vars.activeRange === 'range') {
                        this._html.ranges.animate({ width: 440 });

                        this._html.rangepicker.delay(200).show(400, 'easeOutExpo', $.proxy(function () {
                            this._html.ranges.width('').addClass(Css.open);
                        }, this));
                    } else {
                        if (this._html.rangepicker.is(':visible')) {

                            this._html.rangepicker.hide(400, 'easeOutExpo');

                            this._html.ranges.delay(100).animate({ width: 212 }, function () {
                                $(this).width('auto').removeClass(Css.open);
                            });

                            return false;
                        }
                    }
                } else if (this._vars.activeRange !== 'all' && !this._findPreset(this._vars.activeRange)) {
                    if (this._vars.activeRange === 'range') {
                        this._html.ranges.addClass(Css.open);
                        this._html.rangepicker.show();
                    }
                    this._html.container.show(400, 'easeOutExpo');
                }
            },

            show: function (e) {
                if (e) {
                    e.preventDefault();
                }

                setTimeout($.proxy(function () {
                    this.element.popover('show');
                    this._trigger('show');
                }, this), 1);
            },

            hide: function (e) {
                if (!e) {
                    e = $.Event({
                        type: 'hide'
                    });

                    e.target = this.element[0];
                }

                e.preventDefault();

                setTimeout($.proxy(function () {
                    if (e.type === 'focusout' && $(':focus').closest('#' + this._vars.id).length) {
                        return;
                    }

                    if (this.element.is(':crux-popover')) {
                        this.element.popover('hide');
                    }

                    this._trigger('hide');
                }, this), 1);
            },

            widget: function () {
                return this._html.wrapper;
            },

            _destroy: function () {
                this.element
                    .html(this._html.title.remove().html())
                    .removeClass(Css.link);

                this._html.picker.dately('destroy');
                this._html.rangepicker.dately('destroy');
                this.element.popover('destroy');
            }
        });

        $(function () {
            $('.deferred-rangr').rangr();
        });
    }
));
