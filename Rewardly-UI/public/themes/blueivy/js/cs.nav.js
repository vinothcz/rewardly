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

        var hidden = false,
            win, header, title, titleHeight, offset, content, padding, footer, footerSize;

        function setNavigation() {
            offset = win.scrollTop();

            if ((hidden && offset > titleHeight) || offset < 0 || window.scrollHeight === window.clientHeight) {
                return;
            }

            if (offset <= titleHeight) {
                hidden = false;
                header.css('top', -offset);
            } else if (offset > titleHeight) {
                header.css('top', -titleHeight);
                hidden = true;
            }
        }

        function setContentHeight() {
            footerSize = footer.length ? footer.outerHeight(true) : 0;
            content.css('min-height', win.height() - padding - footerSize);

            if (footer.length) {
                footer.css('visibility', 'visible');
            }
        }

        $(function () {
            win = $(window);
            header = $('#header');
            content = $('#body');
            footer = $('#footer');
            title = header.children('.title');
            titleHeight = title.innerHeight();
            padding = parseInt(content.css('padding-top'), 10);

            setContentHeight();
            win
                .on('scroll', setNavigation)
                .on('resize', setContentHeight);

            $('html.no-touch')
                .find('#header h1 a, #header li.dropdown div, #header li.dropdown ul a, #nav .primary > li, #nav .focus a')
                    .on('mouseenter mouseleave', function (e) {
                        $(this).toggleClass('hover', e.type === 'mouseenter');
                    });

            $('html.touch')
                .find('#header li.dropdown div, #nav .primary > li')
                    .on('click', function (e) {
                        var $this = $(this);

                        if (!$this.hasClass('hover')) {
                            $this.addClass('hover');

                            setTimeout(function () {
                                $('#body-wrapper').on('click', function (evt) {
                                    $this.removeClass('hover');
                                    $(this).off(evt);
                                });
                            }, 1);
                        }
                    })
                .end()
                .find('body:first')
                    .wrapInner('<div id="body-wrapper"></div>');
        });
    }
));
