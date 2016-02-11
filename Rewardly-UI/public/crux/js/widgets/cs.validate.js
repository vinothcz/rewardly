/*! crux-validate - v2.9.1 - 2015-01-23
* Copyright (c) 2015 Advisory Board Company */

/// <reference path="cs.base.js" />

/*global _, Modernizr */

/**
Adds custom validation to forms/form fields to browsers that currently do no support browser validation. Validation is automatically added to all forms without a <code>novalidate</code> attribute and are available on DOM ready. If a form is created via JavaScript after DOM ready <code>.validate()</code> will beed to be added manually.

For details on how HTML5 form validation works take a look at <a href="http://diveintohtml5.info/forms.html" target="_blank">Dive Into HTML5: Web Forms</a>.

@class Validate
@extends Base
@module Widgets

@tests validate/validate.html
@demo docs/demos/validate.jade
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

        var Namespace = 'cs-validation-',

        Css = {
            error: Namespace + 'error',
            message: Namespace + 'message'
        },

        Positions = {
            top: {
                my: 'left bottom',
                at: 'left top',
                offset: '0 1'
            },
            right: {
                my: 'left center',
                at: 'right center',
                offset: '-1 0'
            },
            bottom: {
                my: 'left top',
                at: 'left bottom',
                offset: '0 -1'
            },
            left: {
                my: 'right center',
                at: 'left center',
                offset: '1 0'
            }
        },

        Filters = {
            boxes: 'input[type=radio], input[type=checkbox], select',
            elements: 'input[type=submit], input[type=reset], :button',
            input: 'input[type!=submit][type!=reset][type!=radio][type!=checkbox], textarea'
        };


        $.widget('crux.validate', {
            options: {
                /**
                After submitting a form a custom check is performed. This can be use to validate date formats, matching fields, etc. The <code>this</code> keyword is the form element in the context of the the function. The <code>customCheck</code> function needs to return <code>true</code> or <code>false</code> depending on tests being done.

                @property customCheck
                @type Function

                @default function () {
                    return true;
                }
                **/
                customCheck: function () {
                    return true;
                },

                /**
                The delay, in milliseconds, before an error message shows up. This delay only relates to when a user is typing in a field, not when the user submits the form or moves to a different field.

                @property delay
                @type Number

                @default 250
                **/
                delay: 250,

                /**
                After submitting a form and having a test come back as invalid the error callback is triggered.

                @property error
                @type Function

                @default null
                **/
                error: null,

                /**
                Location where the error message is displayed relative to the field.

                @property errorposition
                @type String

                @default right
                **/
                errorposition: 'right',

                /**
                Enabled/disable realtime validation of form elements.

                @property realtime
                @type Boolean

                @default true
                **/
                realtime: true,

                /**
                After submitting a form and having all tests come back as valid the success function is called. At this point you can do whatever you want with the form. Returning <code>true</code> (the default) will submit the form using the default form action. Returning <code>false</code> will prevent the default form action from happening and will allow you to submit the form via AJAX.

                @property success
                @type Function

                @default function () {
                    return true;
                }
                **/
                success: function () {
                    return true;
                }
            },

            _create: function () {
                this._vars = {
                    firstError: false,
                    hiddenError: false,
                    isSubmit: false
                };

                this._html = {
                    message: $('<div>', {
                        'class': Css.message + ' message error'
                    })
                };

                this.element
                    .attr('novalidate', 'novalidate')
                    .on('reset.formvalidation', $.proxy(this, 'reset'))
                    .on('submit.formvalidation', $.proxy(this, 'validate'));

                if (this.options.realtime) {
                    this.element.on('change.formvalidation blur.formvalidation', Filters.input, $.proxy(this._testField, this))
                                .on('keyup.formvalidation', Filters.input, _.debounce($.proxy(this._testField, this), this.options.delay))
                                .on('blur.formvalidation change.formvalidation', Filters.boxes, $.proxy(this._testField, this));
                }
            },

            /**
            Validate the form. This does not trigger the form submit event, but will execute and methods attached to the success or error callbacks.

            @method validate
            **/
            validate: function () {
                this.clear();
                if (this._testForm()) {
                    return this.options.success.call(this.element[0]);
                }

                /**
                Event broadcast after the form fails validation.

                <code>
                $('.example').bind( "validateerror", function(event) {});
                </code>

                @event validateerror
                */
                this._trigger('error');
                return false;
            },

            /**
            Removes all errorr messages/states from the form. This does not reset any values added to the form.

            @method clear
            **/
            clear: function () {
                this.element.find('.' + Css.error).removeClass(Css.error);
                this.element.find('.' + Css.message).remove();
            },

            /**
            Resets the form to its original state and clears out any error messages/states.

            @method reset
            **/
            reset: function (e) {
                if (!e) {
                    this.element[0].reset();
                }
                this.clear();
            },

            _testForm: function () {
                var self = this,
                    valid = true,
                    first = this.element.children().eq(0);

                this._vars.isSubmit = true;
                if (first.hasClass(Css.message)) {
                    first.remove();
                }

                this.element.map(function () {
                    return this.elements ? $.makeArray(this.elements) : this;
                }).not(Filters.elements).filter(function () {
                    return this.name && !this.disabled;
                }).each(function (i, field) {
                    if (!self._testField(field)) {
                        valid = false;
                    }
                });

                if (!this.options.customCheck.call(this.element[0], this)) {
                    valid = false;
                }

                if (this._vars.hiddenError) {
                    this._html.message.clone()
                        .text('One or more hidden fields has an error.')
                        .prependTo(this.element)
                        .position({
                            my: 'left top',
                            at: 'left top',
                            of: this.element
                        });
                    this._vars.hiddenError = false;
                }

                this._vars.firstError = false;
                this._vars.isSubmit = false;
                return valid;
            },

            _testField: function (e) {
                if ((e.which && e.which === 9) || (e.type === 'keyup' && document.activeElement !== e.target)) {
                    return;
                }

                var field = e.target || e,
                    $field = $(field),
                    value = $.trim(field.value),
                    // action = $field.data('formaction'),
                    type, test, msg, valid, $fields;//, obj;

                if ($field.is('[type=radio]')) {
                    $fields = $('input[name="' + field.name + '"]');
                }

                if ($fields) {
                    $fields.each($.proxy(function (i, el) {
                        this.removeError($fields.eq(i));
                    }, this));
                } else {
                    this.removeError($field);
                }

                if (field.willValidate && field.checkValidity() === false) {
                    if ($fields) {
                        this.addError($fields.eq(0), field.validationMessage);
                        $fields.slice(1).each(function (i, el) {
                            $(this).addClass(Css.error);
                        });

                        return false;
                    }

                    this.addError($field, field.validationMessage);
                    return false;
                }

                if (field.getAttribute('required')) {
                    msg = 'Please fill out this field.';

                    if ($fields) {
                        valid = true;

                        msg = 'Please select one of these options.';
                        valid = !!$fields.filter(':checked').length;

                        if (!valid) {
                            this.addError($fields.eq(0), msg);
                            return false;
                        }
                    }

                    if (!value.length || ($field.is('input[type=checkbox]') && !field.checked)) {
                        field.value = value;

                        if (field.type === 'checkbox') {
                            msg = 'Please check this box if you want to proceed.';
                        } else if ($field.is('select')) {
                            msg = 'Please choose an option if you want to proceed.';
                        }

                        this.addError($field, msg);
                        return false;
                    }
                }

                if (value.length) {
                    type = field.getAttribute('type') ? field.getAttribute('type').toLowerCase() : false;

                    if (type && Modernizr.inputtypes[type] === false && this['_' + type]) {
                        test = this['_' + type].call(this, field);

                        if (!test.result) {
                            this.addError($field, test.message);
                            return false;
                        }
                    }

                    if ((($field.is('input') && !Modernizr.input.pattern) || ($field.is('textarea') && !Modernizr.textareapattern)) &&
                        $field.attr('pattern') &&
                        !this._pattern.call(this, field)) {
                        this.addError($field, 'Please match the requested format.');
                        return false;
                    }
                }

                /*if (action && !this._vars.isSubmit) {
                    if ($field.data('validating')) {
                        obj = $field.data('validating');
                        if (obj.value === value) {
                            return;
                        }
                        obj.req.abort();
                    }

                    test = $.ajax(action, { data: { value: value} })
                        .done(function () {
                            console.log('done');
                        });

                    $field.data('validating', { req: test, value: value });
                } else {
                    if ($field.data('validating')) {
                        $field.data('validating').req.abort();
                        $field.removeData('validating');
                    }

                    return true;
                }*/

                return true;
            },

            /**
            Will add an error message to a specific field without performing validation.

            @method addError

            @param {jQuery Object} field The field to add the error message to.
            @param {String} msg The message that goes inside the error container.
            **/
            addError: function ($field, msg) {
                $field.addClass(Css.error);

                if ($field.is(':input')) {

                    /**
                    Event broadcast after an individual field has an error.

                    <code>
                    $('.example').bind( "validationerror", function(event, message) {});
                    </code>

                    @event validationerror
                    **/
                    $field.trigger('validationerror', msg);
                }

                if (this._vars.isSubmit) {
                    if ($field.is(':hidden') && !$field.data('ignorehidden')) {
                        this._vars.hiddenError = true;
                        return;
                    }

                    if (this._vars.firstError) {
                        return;
                    }

                    this._vars.firstError = true;
                }

                if ($field.is(':hidden')) {
                    return;
                }

                this._html.message.clone()
                    .text($field.attr('title') || msg)
                    .insertAfter($field)
                    .position($.extend({ of: $field }, Positions[this.options.errorposition]));
            },

            /**
            Will remove an error message from a specific field without performing validation.

            @method removeError

            @param {jQuery Object} field The field to remove the message from.

            **/
            removeError: function ($field) {
                $field.removeClass(Css.error).next('.' + Css.message).remove();
            },

            _email: function (field) {
                var email = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return {
                    result: email.test(field.value),
                    message: 'Please enter an email address.'
                };
            },

            _url: function (field) {
                var url = /https?:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                return {
                    result: url.test(field.value),
                    message: 'Please enter a url.'
                };
            },

            _number: function (field) {
                var value = isNaN(field.value) ? false : parseFloat(field.value),
                    min = value !== false ? isNaN($(field).attr('min')) ? false : parseFloat($(field).attr('min')) : value,
                    max = value !== false ? isNaN($(field).attr('max')) ? false : parseFloat($(field).attr('max')) : value,
                    result = true,
                    msg = 'Please enter a number';

                if (min !== false && max !== false) {
                    result = value >= min && value <= max;
                    msg = 'Please enter a number greater than or equal to ' + min + ' and less than or equal to ' + max + '.';
                } else if (min !== false) {
                    result = value >= min;
                    msg = 'Please enter a number greater than or equal to ' + min + '.';
                } else if (max !== false) {
                    result = value <= max;
                    msg = 'Please enter a number less than or equal to ' + max + '.';
                }

                return {
                    result: value !== false && result,
                    message: msg
                };
            },

            _pattern: function (field) {
                return new RegExp(field.pattern || field.getAttribute('pattern')).test(field.value);
            },

            /**
            Removes custom validation from the form. If the browser in use supports native validation that will be used instead.

            @method destroy
            **/
            destroy: function () {
                this.clear();
                this.element.removeAttr('novalidate').off('.formvalidation');
                $.Widget.prototype.destroy.call(this);
            }
        });

        $(function () {
            $('form:not([novalidate=novalidate])').validate();
        });
    }
));
