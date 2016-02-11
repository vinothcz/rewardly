(function (window, define, factory, undefined) {
    "use strict";

    if (define !== undefined) {
        define(factory);
    } else {
        factory();
    }
}(
    this,
    this.define,
    function () {
        "use strict";

        $(function () {

            /* Enabling Button Menus */
            $(document).on('click', '.btn-menu .btn, .btn-menu button, .btn-menu input', function (e) {
                var el = $(this),
                    menu = el.parent('.btn-menu');

                if (!el.is(':last-of-type')) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                $('.btn-menu.open')
                    .not(menu)
                        .removeClass('open');

                menu.toggleClass('open');
            });
            $(document).on('click', function (e) {
                $('.btn-menu.open').removeClass('open');
            });

            /* Fixing Justified Buttons */
            if ($('html.ie7:first, html.ie8:first').length) {
                var isIE7 = $('html.ie7:first').length;

                $(document)
                    .on('fixbuttons.blueivy', function () {
                        $('.btn-group.justified').trigger('fixbuttons.blueivy');
                    })
                    .on('fixbuttons.blueivy', '.btn-group.justified', function (e) {
                        e.stopImmediatePropagation();

                        $(this)
                            .each(function () {
                                var $this = $(this),
                                    children = $this.children(),
                                    buttonWidth = (100 / children.length),
                                    otherWidth = (98 / children.length);

                                // IE7 doesn't honor box-sizing, and gives our a.btn elements a slightly wider
                                // measurement, so we base those elements on a 98% total width instead of 100%.
                                if (isIE7) {
                                    children.each(function () {
                                        var child = $(this);
                                        if (child.is('button, input')) {
                                            child.css('width', buttonWidth.toString() + '%');
                                        } else {
                                            child.css('width', otherWidth.toString() + '%');
                                        }
                                    });
                                } else {
                                    children.css('width', buttonWidth.toString() + '%');
                                }
                            });
                    })
                    .trigger('fixbuttons.blueivy');
            }
        });
    }
));
