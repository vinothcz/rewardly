/*! crux-modernizr - v2.9.0 - 2014-12-17
* Copyright (c) 2014 Crux Team; Licensed MIT */

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

      // selectorSupported lovingly lifted from the mad italian genius, diego perini
      // http://javascript.nwbox.com/CSSSupport/

      function selectorSupported(selector) {
          var support, sheet, doc = document,
              root = doc.documentElement,
              head = root.getElementsByTagName('head')[0],
              impl = doc.implementation || {
                  hasFeature: function () {
                      return false;
                  }
              },
              link = doc.createElement("style");

          link.type = 'text/css';

          (head || root).insertBefore(link, (head || root).firstChild);

          sheet = link.sheet || link.styleSheet;

          if (!(sheet && selector)) {
              return false;
          }

          support = impl.hasFeature('CSS2', '') ?

                      function (selector) {
                          try {
                              sheet.insertRule(selector + '{ }', 0);
                              sheet.deleteRule(sheet.cssRules.length - 1);
                          } catch (e) {
                              return false;
                          }
                          return true;

                      } : function (selector) {

                          sheet.cssText = selector + ' { }';
                          return sheet.cssText.length !== 0 && !(/unknown/i).test(sheet.cssText) && sheet.cssText.indexOf(selector) === 0;
                      };

          return support(selector);
      }


      Modernizr.addTest('checkedselector', function () {
          return selectorSupported(':checked');
      });

      /**
       * @name textareapattern
       * @methodOf Modernizr
       * @description <p>Determines if the currently used browser supports the pattern attribute on the textarea element. <i>Note: There are no
                      browsers the currently support this attribute but it is a viable test for our application and our {{#crossLink "Validate"}}{{/crossLink}} plugin
                      test for this screnario</i>.</p>
       */
      Modernizr.addTest('textareapattern', function () {
          var ta = document.createElement('textarea');
          return !!('pattern' in ta);
      });

      Modernizr.addTest('csspositionfixed', function () {
          // no (solid) support on <Android2 and <iOS4
          var ua = navigator.userAgent;
          if (ua.match(/android [0-2]/i) || ua.match(/(iphone|ipad|ipod).+(OS [0-4])/i)) {
              return false;
          }

          var test  = document.createElement('div'),
              control = test.cloneNode(false),
              fake = false,
              root = document.body || (function () {
                  fake = true;
                  return document.documentElement.appendChild(document.createElement('body'));
              }()),
              oldCssText = root.style.cssText,
              ret;

          if (typeof document.body.scrollIntoViewIfNeeded === 'function') {
              var testScrollTop = 20,
                  originalScrollTop = window.pageYOffset;

              root.appendChild(test);
              test.style.cssText = 'position:fixed;top:0px;height:10px;';
              root.style.height = '3000px';

              /* avoided hoisting for clarity */
              var testScroll = function () {
                  if (ret === undefined) {
                      test.scrollIntoViewIfNeeded();
                      if (window.pageYOffset === testScrollTop) {
                          ret = true;
                      } else {
                          ret = false;
                      }
                  }
                  window.removeEventListener('scroll', testScroll, false);
              };

              window.addEventListener('scroll', testScrollTop, false);
              window.scrollTo(0, testScrollTop);
              testScroll();

              root.removeChild(test);
              root.style.cssText = oldCssText;
              window.scrollTo(0, originalScrollTop);
          } else {
              root.style.cssText = 'padding:0;margin:0';
              test.style.cssText = 'position:fixed;top:42px';
              root.appendChild(test);
              root.appendChild(control);

              ret = test.offsetTop !== control.offsetTop;

              root.removeChild(test);
              root.removeChild(control);
              root.style.cssText = oldCssText;
          }

          if (fake) {
              document.documentElement.removeChild(root);
          }

          return ret;
      });

      // Sticky positioning - constrains an element to be positioned inside the
      // intersection of its container box, and the viewport.
      Modernizr.addTest('csspositionsticky', function () {
          var prefixes = ['-webkit-', '-moz-', '-ms-', '-o-', ''],
              el = document.createElement('div');

          el.style.cssText += 'position:' + prefixes.join('sticky;position:') + 'sticky;';

          return el.style.position.indexOf('sticky') !== -1;
      });

      Modernizr.addTest('requestanimationframe', function () {
          var rAF = Modernizr.prefixed('requestAnimationFrame', window);
          if (rAF) {
              window.requestAnimationFrame = rAF;
          }
          return !!rAF;
      });

      // Check for support of the input search clear button in a input[type=search] box. 
      // Adds a no-searchCancel class if not supported by the browser.
      Modernizr.addTest('searchcancel', function () {
        var supported = false;
        var count = Modernizr._prefixes.length,
                i = 0;

        var testSupported = function(el){
              supported = supported || (el.offsetWidth === 9);
        };
        for (i = 0; i < count; i++){
          if (!supported){
            Modernizr.testStyles('#modernizr, x::'+ (Modernizr._prefixes[i] || '-') +'search-cancel-button{ width: 9px }', testSupported);
          }
        }
        return supported;
      });

      return Modernizr;
    }
));
