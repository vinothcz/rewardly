/*! crux-dately - v2.9.1 - 2015-01-30
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />
/*global moment, CRUX, _ */

/**
Creates a date picker that is either inserted into the DOM or opens when an input has focus. To parse the dates we use the <a href="http://momentjs.com/" target="_blank">Moment.js</a> library.

@class Dately
@extends Base
@module Widgets

@tests dately/dately.html
@demo docs/demos/dately.jade
**/

(function (window, define, factory, undefined) {
    "use strict";

    if (define !== undefined) {
        define(['./cs.core.js', './cs.base.js', './cs.jquery.js'], factory);
    } else {
        factory(CRUX);
    }
}(
this, this.define, function (core) {
    "use strict";

    var Increment = 0,

        Namespace = 'cs-dately-',

        Css = {
            active: Namespace + 'active',
            body: Namespace + 'body',
            dates: Namespace + 'dates',
            days: {
                next: Namespace + 'other-next',
                other: Namespace + 'other-month',
                prev: Namespace + 'other-prev',
                thismonth: Namespace + 'this-month'
            },
            dir: Namespace + 'dir',
            disabled: Namespace + 'disabled',
            empty: Namespace + 'empty',
            input: Namespace + 'input',
            months: Namespace + 'months',
            navigation: Namespace + 'navigation',
            next: Namespace + 'next',
            popover: Namespace + 'popover',
            prev: Namespace + 'prev',
            selected: Namespace + 'selected',
            title: Namespace + 'title',
            today: Namespace + 'today',
            wrapper: Namespace + 'wrapper',
            years: Namespace + 'years'
        },

        Days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],

        Direction = {
            bottom: {
                my: 'left top',
                at: 'left bottom+14px',
                caret: 'north'
            },
            left: {
                my: 'right top',
                at: 'left-14px top',
                caret: 'east'
            },
            right: {
                my: 'left top',
                at: 'right+14px top',
                caret: 'west'
            },
            top: {
                my: 'left top',
                at: 'left top-256px',
                caret: 'south'
            }
        },

        Effect = {
            slide: '_slide',
            transition: '_transition'
        },

        Months = moment.langData("en")._months,

        AbbrevMonths = moment.langData("en")._monthsShort,

        View = {
            date: 0,
            month: 1,
            year: 2
        };

    $.widget('crux.dately', {
        options: {

            /**
                If using the default dately calendar, you can specify if the input should be auto-populated with the current date initially. If set to false, the date input will be empty upon initialization.

                @property autopopulate
                @type Boolean

                @default true
                **/
            autopopulate: true,

            /**
                The default date the datepicker is set to. This can the value of the input or a text string in the div (if using inline datepicker).

                @property date
                @type Date

                @default Current Date
                **/
            date: moment().startOf('day'),

            /**
                The format in which you want the date to display and pass to the server if in a form. For a list of available strings to use to format the date, please see the <a href="http://momentjs.com/docs/#/displaying/format/" target="_blank">Moment.js Format Specifiers</a>.

                @property format
                @type String

                @default "MM/DD/YYYY"
                **/
            format: 'MM/DD/YYYY',

            /**
                The maximum date the calendar will allow you to pick.

                @property maxdate
                @type Date

                @default 12/31/2099
                **/
            maxdate: new Date(2099, 11, 31),

            /**
                The minimum date the calendar will allow you to pick. Defaults to the first day of the month.

                @property mindate
                @type Date

                @default 01/01/2000
                **/
            mindate: new Date(2000, 0, 1),

            /**
                If using an inline dately calendar you can specify the name of the hidden input field that is generated.

                @property name
                @type String

                @default ""
                **/
            name: '',

            /**
                A callback that is triggered if the date supplied cannot be parsed. The function passes the event and the value that could not be parsed.

                @property parseerror
                @type Function

                @default null
                **/
            parseerror: null,

            /**
                If using the default dately calendar you can specify where to display the popover of the date picker.

                @property position
                @type String

                @default "bottom"
                **/
            position: 'bottom',

            /**
                A callback that gets invoked when a date is selected. This can happen either by using the calendar or calling the {{#crossLink "Dately/set"}}{{/crossLink}} method.

                @property select
                @type Function

                @default null
                **/
            select: null,

            /**
                Show the days of the month in the datepicker. When false it only lets you pick the month and the year.

                @property showdays
                @type Boolean

                @default true
                **/
            showdays: true,

            /**
                Time (in milliseconds) it takes to animate the movement of the calendar from one state to the next.

                @property speed
                @type Number

                @default 300
                **/
            speed: 300,

            /**
                When true this will make the selected date the first of the month. When false the last day of the month will be selected.

                <i>This property only takes effect when <code>showdays</code> is false.</i>

                @property startofmonth
                @type Boolean

                @default true
                **/
            startofmonth: true,

            /**
                Sets the z-index CSS property of the date picker when it appears in a popover.

                @property zindex
                @type Number

                @default null
                **/
            zIndex: null
        },

        _create: function () {
            var today = moment().startOf('day'),
                preset = $.trim(this.element[0].value || this.element.text()) || false;

            if (preset && moment(preset).isValid()) {
                this.element.data('datelypreset', preset);

                preset = moment(preset).startOf('day');
                this.options.date = moment(preset);
            }

            $.each(['date', 'maxdate', 'mindate'], $.proxy(function (i, opt) {
                this.options[opt] = moment(this.options[opt]).startOf('day');
            }, this));

            if (this.options.date.diff(this.options.mindate) < 0) {
                this.options.date = moment(this.options.mindate);
            } else if (this.options.date.diff(this.options.maxdate) > 0) {
                this.options.date = moment(this.options.maxdate);
            }

            if (!this.options.showdays) {
                if (this.options.startofmonth) {
                    this.options.date.date(1);
                } else {
                    this.options.date.add('months', 1).date(0);
                }
            }

            this._html = {
                body: null,
                caret: null,
                input: null,
                navigation: {
                    next: null,
                    prev: null,
                    title: null,
                    wrapper: null
                },
                wrapper: null
            };

            this._vars = {
                animated: false,
                current: {
                    month: this.options.date.month(),
                    year: this.options.date.year()
                },
                initialized: {
                    date: this.options.date.date(),
                    month: this.options.date.month(),
                    year: this.options.date.year()
                },
                highlight: null,
                id: Namespace + (Increment += 1),
                isInput: true,
                position: Direction[this.options.position],
                selected: {
                    date: this.options.date.date(),
                    month: this.options.date.month(),
                    year: this.options.date.year()
                },
                today: {
                    date: today.date(),
                    month: today.month(),
                    year: today.year()
                },
                view: this.options.showdays ? View.date : View.month,
                wrapperFocus: false
            };

            this._build();
        },

        _build: function () {
            var html = this._html;

            html.wrapper = $('<div>', {
                'class': Css.wrapper
            });

            html.navigation.wrapper = $('<div>', {
                'class': Css.navigation
            }).prependTo(html.wrapper);

            html.caret = $('<div>', {
                'class': 'caret6 ' + this._vars.position.caret
            }).prependTo(html.wrapper);

            $(html.caret).append('<i></i>');

            html.body = $('<div>', {
                'class': Css.body
            }).appendTo(html.wrapper);

            this._buildNav();

            if (this.options.showdays) {
                this._buildDays();
            } else {
                this._buildMonths();
            }

            this._setDisabled();

            if (!this.element.is('input')) {
                this.element.html(html.wrapper);

                this._vars.isInput = false;
                html.input = $('<input />', {
                    'class': Css.input,
                    name: this.options.name || Css.input + Increment
                }).hide().insertAfter(html.wrapper);
            } else {
                var index = core.zIndexCurrent += 1;

                html.input = this.element.addClass(Css.input);

                html.wrapper.addClass(Css.popover).css({
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    zIndex: this.options.zindex || index
                });

                $(document.body).append(html.wrapper);
            }

            if (this._vars.isInput) {
                html.wrapper.hide();
            }

            this._attachEvents();

            if (this.options.autopopulate) {
                this._setDate();
            }
        },

        _buildNav: function () {
            var nav = this._html.navigation;

            nav.prev = $('<a>', {
                'class': Css.prev + ' ' + Css.dir,
                href: '#'
            }).data('dir', -1).html('&#139;').appendTo(nav.wrapper);

            nav.title = $('<a>', {
                'class': Css.title,
                href: '#'
            }).text((this.options.showdays ? Months[this._vars.current.month] + ' ' : '') + this._vars.current.year).appendTo(nav.wrapper);

            nav.next = $('<a>', {
                'class': Css.next + ' ' + Css.dir,
                href: '#'
            }).data('dir', 1).html('&#155;').appendTo(nav.wrapper);
        },

        _attachEvents: function () {
            this._on(this._html.wrapper, {'click a': '_dispatch'});

            if (this._vars.isInput) {
                this._on(this.element, {
                    keydown: '_inputDispatch',
                    focus: 'show',
                    click: 'show'
                });

                this._on(document.body, {click: '_hide'});
            }
        },

        _inputDispatch: function (e) {
            switch (e.which) {
            case $.ui.keyCode.ENTER:
            case $.ui.keyCode.TAB:
            case $.ui.keyCode.ESCAPE:
                this.hide();
                break;
            case $.ui.keyCode.LEFT:
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this._html.navigation.prev.trigger('click');
                // } else if (e.altKey) {
                //     e.preventDefault();
                //     this._highlight(-1);
                }
                break;
            case $.ui.keyCode.PAGE_DOWN:
                this._html.navigation.prev.trigger('click');
                break;
            case $.ui.keyCode.RIGHT:
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this._html.navigation.next.trigger('click');
                // } else if (e.altKey) {
                //     e.preventDefault();
                //     this._highlight(1);
                }
                break;
            case $.ui.keyCode.PAGE_UP:
                this._html.navigation.next.trigger('click');
                break;
            case $.ui.keyCode.DOWN:
                if (e.ctrlKey || e.metaKey) {
                    this._html.navigation.title.trigger('click');
                // } else if (e.altKey) {
                //     this._highlight(this._vars.view === View.date ? 7 : 4);
                }
                break;
            case $.ui.keyCode.UP:
                if (e.ctrlKey || e.metaKey) {
                    if (this._vars.view === View.year) {
                        this._selectYear();
                    } else if (this._vars.view === View.month) {
                        this._selectMonth();
                    }
                // } else if (e.altKey) {
                //     this._highlight(this._vars.view === View.date ? -7 : -4);
                }
                this._setDisabled();
                break;
            default:
                break;
            }
        },

        _adjustCaret: function (caret, el) {
            $(el).children('[class^=caret]').removeClass('north east south west alignright').addClass(caret);
        },

        _adjustPosition: function (data, el) {
            var caret;

            if (data.horizontal !== 'center') {
                caret = data.horizontal === 'left' ? 'west' : 'east';
                this._adjustCaret(caret, el);
            } else {
                caret = data.vertical === 'top' ? 'north' : 'south';
                this._adjustCaret(caret, el);
            }

            if (Math.round(data.element.left) !== Math.round(data.target.left)) {
                $(el).children('[class^=caret]').addClass('alignright');
            }
        },

        _highlight: function (dir) {
            /*var body = this._html.body.find('td'),
                item = body.filter('.' + Css.active).removeClass(Css.active),
                index;

                if (this._vars.highlight !== null && !item.length) {
                body.eq(this._vars.highlight).addClass(Css.active);
                return;
                }

                this._vars.highlight = null;
                if (!item.length) {
                item = body.filter('.' + Css.selected).addClass(Css.active);

                if (!item.length) {
                body.eq(0).addClass(Css.active);
                }

                return;
                }

                index = body.index(item) + dir;

                if (index > body.length - 1) {
                this._html.navigation.next.trigger('click');
                this._vars.highlight = index - body.length;
                return;
                }

                if (index < 0) {
                this._html.navigation.prev.trigger('click');
                this._vars.highlight = index;
                return;
                }

                body.eq(index).addClass(Css.active);*/
        },

        _dispatch: function (e) {
            e.preventDefault();

            var target = $(e.target),
                view;

            if (this._vars.isInput) {
                this.element.focus();
            }

            if (target.hasClass(Css.disabled) || target.parent().hasClass(Css.disabled)) {
                return false;
            }

            if (target.parent().hasClass(Css.navigation)) {
                if (target.hasClass(Css.dir)) {
                    this._navigate(e);
                }

                if (target.hasClass(Css.title)) {
                    this._switch(e);
                }
            } else {
                view = (function (currentview) {
                    for (var key in View) {
                        if (View.hasOwnProperty(key) && View[key] === currentview) {
                            return key.charAt(0).toUpperCase() + key.slice(1);
                        }
                    }
                }(this._vars.view));

                this['_select' + view](e);
            }

            this._setDisabled();
        },

        _setDisabled: function () {
            var current = this._vars.current,
                nav = this._html.navigation,
                currentview = this._vars.view,
                minDate = this.options.mindate,
                maxDate = this.options.maxdate;

            nav.wrapper.find('.' + Css.disabled).removeClass(Css.disabled);

            if (currentview === View.year) {
                this._html.navigation.title.addClass(Css.disabled);
            }

            if (current.year === minDate.year()) {
                if ((currentview === View.date && current.month === minDate.month()) || currentview === View.month || currentview === View.year) {
                    nav.prev.addClass(Css.disabled);
                }
            }

            if (current.year === maxDate.year()) {
                if ((currentview === View.date && current.month === maxDate.month()) || currentview === View.month) {
                    nav.next.addClass(Css.disabled);
                }
            }

            if (current.year + 12 >= maxDate.year() && currentview === View.year) {
                nav.next.addClass(Css.disabled);
            }
        },

        _navigate: function (e) {
            e.preventDefault();

            if (this._vars.animated) {
                return false;
            }

            var target = $(e.target),
                dir = target.data('dir'),
                diff = 0,
                date = moment([this._vars.current.year, this._vars.current.month]).startOf('day');

            if (this._vars.view === View.date) {
                date.add('months', dir);
                this._vars.current.year = date.year();
                this._vars.current.month = date.month();

                this._navigateDate(dir);
            } else if (this._vars.view === View.month) {
                date.add('years', dir);
                this._vars.current.year = date.year();

                this._navigateMonth(dir);
            } else {
                diff = 12 - ((this._vars.current.year - this.options.mindate.year()) % 12);
                this._vars.current.year += diff * dir;
                this._buildYears(Effect.slide, dir);
            }
        },

        _navigateDate: function (dir) {
            var self = this;

            this._html.navigation.title.text(Months[this._vars.current.month] + ' ' + this._vars.current.year);

            /*
             * Pushing to bottom of call stack to make sure
             * that buildDays gets the correct date
             */
            setTimeout(function () {
                self._buildDays(Effect.slide, dir);
            }, 0);
        },

        _navigateMonth: function (dir) {
            var self = this;

            this._html.navigation.title.text(this._vars.current.year);

            /*
             * Pushing to bottom of call stack to make sure
             * that buildMonths gets the correct date
             */
            setTimeout(function () {
                self._buildMonths(Effect.slide, dir);
            }, 0);
        },

        _switch: function (e) {
            e.preventDefault();

            var diff = 0;

            if (this._vars.animated) {
                return false;
            }

            if (this._vars.view === View.date) {
                this._html.navigation.title.text(this._vars.current.year);
                this._buildMonths(Effect.transition, 1);
                this._vars.view = View.month;
            } else if (this._vars.view === View.month) {
                diff = (this._vars.current.year - this.options.mindate.year()) % 12;
                this._vars.current.year -= diff;
                this._buildYears(Effect.transition, 1);
                this._vars.view = View.year;
            }
        },

        _buildDays: function (effect, dir) {
            var current = this._vars.current,
                currentDate = moment([current.year, current.month]).startOf('day'),
                selected = this._vars.selected,
                daysInMonth = currentDate.daysInMonth(),
                today = this._vars.today,
                prevMonth = moment(currentDate).subtract('months', 1),
                prevMonthDays = prevMonth.daysInMonth(),
                totalDays = 42,
                x = 0,
                calendar = '<table class="' + Css.dates + '"><thead><tr>',
                minDate = this.options.mindate,
                minDay = minDate.date(),
                minMonth = minDate.month(),
                minYear = minDate.year(),
                maxDate = this.options.maxdate,
                maxDay = maxDate.date(),
                maxMonth = maxDate.month(),
                maxYear = maxDate.year(),
                firstDay = currentDate.day(),
                day,
                classes;

            for (x; x < 7; x += 1) {
                calendar += '<th>' + Days[x] + '</th>';
            }

            calendar += '</tr></thead><tbody>';
            x = 0;
            for (x; x < totalDays; x += 1) {
                classes = Css.days.other + ' ' + Css.days.prev;

                if (x > 0 && x % 7 === 0) {
                    calendar += '</tr><tr>';
                }

                if (x < firstDay) {
                    day = prevMonthDays - firstDay + x + 1;
                }

                if (x >= firstDay) {
                    classes = Css.days.thismonth;
                    day = x - firstDay + 1;
                }

                if (x - firstDay >= daysInMonth) {
                    classes = Css.days.other + ' ' + Css.days.next;
                    day -= daysInMonth;
                }

                if (current.month === today.month && current.year === today.year && today.date === day && classes === Css.days.thismonth) {
                    classes += ' ' + Css.today;
                }

                if (current.month === selected.month && current.year === selected.year && selected.date === day && classes.indexOf(Css.days.thismonth) !== -1) {
                    classes += ' ' + Css.selected;
                }

                if ((current.year === minYear && current.month === minMonth &&
                        ((day > minDay && classes.indexOf(Css.days.prev) !== -1) || // disable appropriate days in prev months
                        (day < minDay && classes.indexOf(Css.days.thismonth) !== -1))) || // disable appropriate days in current month less than min day
                    (current.year === minYear && current.month === minMonth + 1 && day < minDay && classes.indexOf(Css.days.prev) !== -1) || // disable appropriate days in prev months
                    (current.year === maxYear && current.month === maxMonth &&
                        ((daysInMonth >= maxDay && classes.indexOf(Css.days.next) !== -1) || // disable all days in next month if last day of current month disabled
                        (day > maxDay && classes.indexOf(Css.days.thismonth) !== -1))) || // disable appropriate days in current month greater than max day
                    (current.year === maxYear && current.month === maxMonth - 1 && day > maxDay && classes.indexOf(Css.days.next) !== -1)) {

                    classes = Css.disabled;
                }

                calendar += '<td class="' + classes + '"><a href="#">' + day + '</a></td>';
            }
            calendar += '</tr></tbody></table>';

            if (effect) {
                this[effect](calendar, dir);
            } else {
                this._html.body.html(calendar);
            }
        },

        _buildMonths: function (effect, dir) {
            var current = this._vars.current,
                selected = this._vars.selected,
                today = this._vars.today,
                minDate = this.options.mindate,
                minMonth = minDate.month(),
                minYear = minDate.year(),
                maxDate = this.options.maxdate,
                maxMonth = maxDate.month(),
                maxYear = maxDate.year(),
                calendar = '<table class="' + Css.months + '"><tr>',
                totalMonths = 12,
                x = 0,
                name;

            for (x; x < totalMonths; x += 1) {
                name = '';

                if (x > 0 && x % 3 === 0) {
                    calendar += '</tr><tr>';
                }

                if (current.year === today.year && today.month === x) {
                    name = Css.today;
                }

                if (current.year === selected.year && selected.month === x) {
                    name += (name.length ? ' ' : '') + Css.selected;
                }

                if ((current.year === maxYear && x > maxMonth) || (current.year === minYear && x < minMonth)) {
                    name = Css.disabled;
                }

                calendar += '<td class="' + name + '"><a href="#">' + AbbrevMonths[x] + '</a></td>';
            }
            calendar += '</tr></table>';

            if (effect) {
                this[effect](calendar, dir);
            } else {
                this._html.body.html(calendar);
            }
        },

        _buildYears: function (effect, dir) {
            var maxYear = this.options.maxdate.year(),
                minYear = this.options.mindate.year(),
                curFromMin = this._vars.current.year - minYear,
                totalYears = 12,
                page = Math.floor(curFromMin / totalYears),
                calendar = '<table class="' + Css.years + '"><tr>',
                x = 0,
                startYear = minYear + totalYears * page,
                endYear = startYear + totalYears - 1,
                name;

            this._html.navigation.title.text(startYear + ' - ' + (endYear < maxYear ? endYear : maxYear));

            for (x; x < totalYears; x += 1) {
                name = '';

                if (x > 0 && x % 3 === 0) {
                    calendar += '</tr><tr>';
                }

                if (startYear + x === this._vars.today.year) {
                    name = Css.today;
                }

                if (startYear + x === this._vars.selected.year) {
                    name = Css.selected;
                }

                if (startYear + x > maxYear) {
                    name = Css.disabled;
                }

                calendar += '<td class="' + name + '"><a href="#">' + (startYear + x) + '</a></td>';
            }
            calendar += '</tr></table>';

            if (effect) {
                this[effect](calendar, dir);
            }
        },

        _parseerror: function () {
            var value = this._html.input.val();

            if (this.options.autopopulate) {
                this._vars.selected = this._vars.initialized;
                this._setDate();
            } else {
                this._html.input.val('');
            }

            /**
            Triggered if the date cannot be parsed.

            <code>
            $('.example').on( "datelyparseerror", function(event) {});
            </code>

            @event datelyparseerror
            **/
            this._trigger('parseerror', null, value);
        },

        _selectDate: function (e) {
            e.preventDefault();

            var target = $(e.target),
                parent = target.parent(),
                day = parseInt(target.text(), 10),
                nav = this._html.navigation.wrapper,
                date, dir;

            if (parent.hasClass(Css.days.other)) {
                date = moment([this._vars.current.year, this._vars.current.month]).startOf('day');

                if (parent.hasClass(Css.days.prev)) {
                    dir = nav.find('.cs-dately-prev');
                } else if (parent.hasClass(Css.days.next)) {
                    dir = nav.find('.cs-dately-next');
                }

                dir = dir.data('dir');
                date.add('months', dir);

                this._vars.current.year = date.year();
                this._vars.current.month = date.month();

                this._delay(function () {
                  this._navigateDate(dir);
                }, this.options.speed);
            }

            this._html.body.find('.' + Css.selected).removeClass(Css.selected);
            target.parent().addClass(Css.selected);

            this._vars.selected.date = day;
            this._vars.selected.month = this._vars.current.month;
            this._vars.selected.year = this._vars.current.year;

            this._setDate();

            /**
                Event broadcast after a date is selected.

                <code>
                $('.example').bind( "datelyselect", function(event) {});
                </code>

                @event datelyselect
                **/
            this._trigger('select');

            if (this._vars.isInput) {
                this.hide();
            }
        },

        _selectMonth: function (e) {
            e.preventDefault();

            var target = $(e.target),
                text = target.text(),
                month = _.indexOf(moment.langData("en")._monthsShort, text);

            this._vars.current.month = month;

            if (this.options.showdays) {
                this._vars.view = View.date;
                this._html.navigation.title.text(Months[this._vars.current.month] + ' ' + this._vars.current.year);
                this._buildDays(Effect.transition, -1);
            } else if (e) {
                this._html.body.find('.' + Css.selected).removeClass(Css.selected);
                target.parent().addClass(Css.selected);

                this._vars.selected.month = this._vars.current.month;
                this._vars.selected.year = this._vars.current.year;

                if (!this.options.showdays && !this.options.startofmonth) {
                    this._vars.selected.date = moment([this._vars.current.year, this._vars.current.month]).endOf('month').date();
                }

                this._setDate();
                this._trigger('select');
                if (this._vars.isInput) {
                    this.hide();
                }
            }
        },

        _selectYear: function (e) {
            if (e) {
                e.preventDefault();

                var target = $(e.target),
                    text = target.text(),
                    year = parseInt(text, 10);

                this._vars.current.year = year;
            }

            this._vars.view = View.month;
            this._html.navigation.title.text(this._vars.current.year);

            this._buildMonths(Effect.transition, -1);
        },

        _set: function () {
            var date = moment(this._html.input[0].value);

            if (!date || !moment(date).isValid()) {
                this._parseerror();
                return;
            }

            date.startOf('day');

            if (date.diff(this.get(true)) === 0) {
                return;
            }

            if (date.diff(this.options.mindate) < 0) {
                date = moment(this.options.mindate);
            } else if (date.diff(this.options.maxdate) > 0) {
                date = moment(this.options.maxdate);
            }

            if (!this.options.showdays) {
                if (this.options.startofmonth) {
                    date.date(1);
                } else {
                    date.add('months', 1).date(0);
                }
            }

            this.set(date.toDate());

            return false;
        },

        _setDate: function () {
            this._html.input.val(this.get());
        },

        _setOption: function (key, value) {
            this.options[key] = value;

            if (key === 'disabled') {
                this._html.input.prop("readonly", value);

                if (this._html.wrapper.is(':visible')) {
                    this.hide();
                }
            }

            return this;
        },

        _slide: function (calendar, dir) {
            this._vars.animated = true;

            var table = this._html.body.find('table'),
                width = table.outerWidth(true),
                placeholder = $.effects.createWrapper(table),
                wrapper = $.effects.createWrapper(placeholder).css('overflow', 'hidden'),
                cal = $(calendar),
                self = this;

            placeholder.width(width * 2).css('position', 'absolute').append(cal);

            table.width(width).css({
                position: 'absolute',
                left: 0
            });

            cal.width(width).css({
                position: 'absolute',
                left: width * dir
            });

            placeholder.animate({
                left: -width * dir
            }, this.options.speed, function () {
                wrapper.replaceWith(calendar);
                self._highlight(dir);
                self._vars.animated = false;
            });
        },

        _transition: function (calendar, dir) {
            this._vars.animated = true;

            var table = this._html.body.find('table'),
                height = table.outerHeight(true),
                placeholder = $.effects.createWrapper(table),
                wrapper = $.effects.createWrapper(placeholder).css('overflow', 'hidden'),
                cal = $(calendar),
                self = this;

            placeholder.height(height * 2).css('position', 'absolute').append(cal);

            cal.css({
                position: 'absolute',
                top: height * dir
            });

            placeholder.animate({
                top: -height * dir
            }, this.options.speed, function () {
                wrapper.replaceWith(calendar);
                self._vars.animated = false;
            });
        },

        /**
            Get the currently selected date. If returning the date as a string it will be in the format specified by the <code>format</code> parameter.

            @method get

            @param {Boolean} [obj] If <code>true</code> the function returns a Date Object instead of a formatted string.
            @return {Date | String} The currently selected date.
            */
        get: function (obj) {
            var selected = this._vars.selected,
                date = moment([selected.year, selected.month, selected.date]).startOf('day');

            return obj ? date.toDate() : date.format(this.options.format);
        },

        /**
            Sets the currently selected date to the one supplied. This will update the calendar and fire the <code>datelyselect</code> event. If you supply a date that is earlier than the <code>mindate</code> or later than the <code>maxdate</code> the supplied date will fail silently and be converted to the min or max date, respectively. If provided as a string you can put it in any format the <a href="http://momentjs.com/" target="_blank">Moment.js</a> will be able to parse.</p>

            @method set
            @param {String | Date} date The new date to set.
            */
        set: function (date) {
            if (!date || !moment(date).isValid()) {
                return;
            }

            var olddate = moment(this.get(true)).startOf('day');

            date = moment(date).startOf('day');

            if (date.diff(this.options.mindate) < 0) {
                date = moment(this.options.mindate);
            } else if (date.diff(this.options.maxdate) > 0) {
                date = moment(this.options.maxdate);
            }

            if (!this.options.showdays) {
                if (this.options.startofmonth) {
                    date.date(1);
                } else {
                    date.add('months', 1).date(0);
                }
            }

            this._vars.selected.date = this._vars.current.date = date.date();
            this._vars.selected.month = this._vars.current.month = date.month();
            this._vars.selected.year = this._vars.current.year = date.year();

            this._setDate();
            this._trigger('select');

            if (!this.options.showdays) {
                this._vars.view = View.month;
                this._navigateMonth(olddate.diff(date) > 0 ? -1 : 1);
            } else {
                this._vars.view = View.date;
                this._navigateDate(olddate.diff(date) > 0 ? -1 : 1);
            }
            this._setDisabled();
        },


        /**
            Changes the currently selected date to whatever date is currently set via the <code>date</code> property.

            @method reset
            */
        reset: function () {
            var selected = this._vars.selected,
                current = this._vars.current,
                date = this.options.date,
                olddate = moment(this.get(true)).startOf('day');

            selected.date = current.date = date.date();
            selected.month = current.month = date.month();
            selected.year = current.year = date.year();


            this._setDate();
            this._vars.view = View.date;
            this._navigateDate(olddate.diff(date) > 0 ? -1 : 1);
            this._setDisabled();
        },

        /**
            Shows the date picker. If the Dately is inline this method has no effect.

            @method show
            */
        show: function () {
            var that = this;

            if (this._html.wrapper.is(':visible') || !this._vars.isInput || this.options.disabled) {
                return;
            }

            this._html.wrapper.show().position({
                my: this._vars.position.my,
                at: this._vars.position.at,
                of: this.element,
                using: function (position, data) {
                    that._adjustPosition(data, this);
                    $(this).css(position);
                }
            }).hide().fadeIn(this.options.speed);
        },

        _hide: function (e) {
            if (e.target !== this.element[0] && !$(e.target).closest(this._html.wrapper).length) {
                this.hide();
            }
        },

        /**
            Hides the date picker. If the Dately is inline this method has no effect.

            @method hide
            */
        hide: function () {
            if (!this._vars.isInput) {
                return;
            }

            if (this.element[0].getAttribute('required') || this._html.input[0].value) {
                this._set();
            }

            this._html.wrapper.fadeOut(this.options.speed);
        },

        _destroy: function () {
            this._html.wrapper.remove();
            this._html.input.val('');

            if (!this._vars.isInput) {
                this._html.input.remove();
            }

            if (this.element.data('datelypreset')) {
                if (this._vars.isInput) {
                    this.element.val(this.element.data('datelypreset'));
                } else {
                    this.element.html(this.element.data('datelypreset'));
                }

                this.element.removeData('datelypreset');
            }
        },

        widget: function () {
            return (this._vars.isInput ? this.element : this._html.wrapper);
        }
    });
}));
