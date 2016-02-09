/*! crux-konami - v2.10.0 - 2015-03-26
* Copyright (c) 2015 Advisory Board Company */

/**
@module Widgets
@main
**/

(function (window, define, factory, undefined) {
    'use strict';

    if (define !== undefined) {
        define(['./cs.base.js'], factory);
    } else {
        factory();
    }
}(
this, this.define, function () {
    'use strict';

    $.widget('crux.konami', {
        options: {
            code: '3838404037393739666513',
            input: '',
            success: function () {
                var video = $('<iframe id="CrUX-video" width="800" height="600" style="display: none !important;" src="//www.youtube.com/embed/yP4qdefD2To?rel=0&autoplay=1&html5=1" frameborder="0"></iframe>'),
                    dialog = '<div style="height: 250px !important; width: 400px !important;"><div>Could you whisper in my ear<br/>The things you wanna feel<br/>I&#39;d give you anythin&#39;<br/>To feel it comin&#39;<br/><br/>Do you wake up on your own<br/>And wonder where you are?<br/>You live with all your faults<br/><br/>I wanna wake up where you are<br/>I won&#39;t say anything at all<br/>So why don&#39;t you slide<br/><br/>Yeah, I&#39;m gonna let it slide<br/><br/>Don&#39;t you love the life you killed?<br/>The priest is on the phone<br/>Your father hit the wall<br/>Your ma disowned you<br/><br/>Don&#39;t supposed I&#39;ll ever know<br/>What it means to be a man<br/>It&#39;s somethin&#39; I can&#39;t change<br/>I&#39;ll live around it<br/><br/>I wanna wake up where you are<br/>I won&#39;t say anything at all<br/>So why don&#39;t you slide<br/>Ooh, slide<br/><br/>And I&#39;ll do anythin&#39; you ever dreamed to be complete<br/>Little pieces of the nothin&#39; that fall<br/>Oh, May<br/>Put your arms around me<br/>What you feel is what you are<br/>And what you are is beautiful<br/>Oh, May<br/>Do you wanna get married Or run away?<br/><br/>And I&#39;ll do anythin&#39; you ever dreamed to be complete<br/>Little pieces of the nothin&#39; that fall<br/>Oh, May<br/>Put your arms around me<br/>What you feel is what you are<br/>And what you are is beautiful<br/>Oh, May<br/>Do you wanna get married<br/>Or run away?<br/><br/>I wanna wake up where you are<br/>I won&#39;t say anything<br/><br/>And I&#39;ll do anythin&#39; you ever dreamed to be complete<br/>(Yeah, slide)<br/>Little pieces of the nothin&#39; that fall<br/>(yeah slide)<br/>And I&#39;ll do anythin&#39; you ever dreamed to be complete<br/>(Yeah slide)<br/>Little pieces of the nothin&#39; that fall<br/>(Oh, oh slide)<br/>Yeah, slide between the sheets of all them beds you never knew<br/>(Yeah slide)<br/>Why don&#39;t you slide into my room<br/>Just slide into my room<br/>Oh, we&#39;ll run away, run away, run away</div></div>';

                setTimeout(function () {
                    $(dialog)
                        .dialog({
                            autoOpen: true,
                            modal: true,
                            closeText: 'x',
                            title: 'CrUX 2.10.0 (Goo Goo Dolls)',
                            width: 420,
                            height: 300,
                            create: function () {
                                if (!$('html').hasClass('oldie')) {
                                    $('body').append(video);
                                }
                            },
                            close: function () {
                                $(this).remove();
                                video.remove();
                            }
                        });
                }, 1);
            }
        },

        _create: function () {
            this._on({
              keydown: this._handle
            });
        },

        _handle: function (e) {
            var code = this.options.code;

            this.options.input += e.which;

            if (this.options.input === code) {
                this._clearInput();
                this.options.success.call(this);
                return;
            } else if (this.options.input.length < code.length && this.options.input === code.substr(0, this.options.input.length)) {
                return;
            } else {
                this._clearInput();
                return;
            }
        },

        _clearInput: function () {
            this.options.input = '';
        }
    });

    $(function () {
        $('body').konami();
    });
}));
