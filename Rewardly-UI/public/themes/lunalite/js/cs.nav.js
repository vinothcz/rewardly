(function (window, define, factory, undefined) {
  'use strict';

  if (define !== undefined) {
    define(factory);
  } else {
    factory();
  }
}(
  this,
  this.define,
  function () {
    'use strict';

    $(function () {
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
