/*! crux-helpers - v2.9.1 - 2015-01-23
* Copyright (c) 2015 Advisory Board Company */

/**
CrUX includes Handlebars.js to render client side templates.

@class Handlebars
**/
(function (factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        factory();
    }

}(function () {
    'use strict';

    /**
    Helper that iterates over each item in an array. Each item in the array must be an object and this helper adds the member _index to each object.

    <pre class="prettyprint lang-html"><code>
    {{#each_index data}}
        &lt;p&gt;{{_index}} {{item}}&lt;/p&gt;
    {{/each_index}}
    </code></pre>

    @method each_index
    @param {Array} arr The data to iterate over
    @type Helper
    **/
    Handlebars.registerHelper('each_index', function (arr, fn) {
        var buffer = '';
        for (var i = 0, j = arr.length; i < j; i++) {
            var item = arr[i];
            item._index = i;
            buffer += fn.fn(item);
        }

        return buffer;
    });

    /**
    When iterating over data that needs to be displayed in columns this helper will add new row tags to the output.

    <pre class="prettyprint lang-html"><code>
    {{#each_index data}}
        {{insert_row mod=3}}
            &lt;div class="col4"&gt;{{_index}} {{item}}&lt;/div&gt;
        {{/insert_row}}
    {{/each_index}}
    </code></pre>

    @method insert_row
    @param {Number} mod The number of items to render before starting a new row.
    @type Helper
    **/
    Handlebars.registerHelper('insert_row', function (options) {
        if (this._index % options.hash.mod === 0) {
            if (this._index > 0) {
                return '</div><div class="row">' + options.fn(this);
            }

            return '<div class="row">' + options.fn(this);
        }

        return options.fn(this);
    });
}));
