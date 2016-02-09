(function (window, define, factory, undefined) {
  'use strict';

  if (define !== undefined) {
    define(['jquery'], factory);
  } else {
    factory(jQuery);
  }
}(
  this,
  this.define,
  function ($) {
    'use strict';

    $(function () {
      /* Enabling Button Menus */
      $(document)
        .on('click', function (e) {
          $('.btn-menu.open').removeClass('open');
        })
        .on('click', '.btn-menu .btn, .btn-menu button, .btn-menu input', function (e) {
          var el = $(this),
            menu = el.parent('.btn-menu');

          if (!el.is(':last-of-type')) {
            return;
          }

          // Debouncing this by 1ms to prevent its own click from closing it
          setTimeout(function () {
            menu.toggleClass('open');
          }, 1);
        });

      /* Fixing Justified Buttons */
      if ($('html.ie8:first').length) {
        $(document)
          .on('fixbuttons.blueivy', function () {
            $('.btn-group.justified').trigger('fixbuttons.blueivy');
          })
          .on('fixbuttons.blueivy', '.btn-group.justified', function (e) {
            e.stopImmediatePropagation();

            $(this).each(function () {
              var $this = $(this),
                children = $this.children(),
                buttonWidth = (100 / children.length);

              children.css('width', buttonWidth.toString() + '%');
            });
          })
          .trigger('fixbuttons.blueivy');
      }
    });
  }
));
