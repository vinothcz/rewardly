/*! crux-logo - v3.0.0 - 2015-01-23
* Copyright (c) 2015 Advisory Board Company */

(function (window, define, factory, undefined) {
    'use strict';

    if (define !== undefined) {
        define(factory);
    } else {
        factory();
    }
}(
this, this.define, function () {
    'use strict';

    function Logo(wrapper) {
        this.logo = new Image();
        this.logo.src = 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAA0CAYAAAAzMZ5zAAACMklEQVR42u2ava4BQRiG3dGJQiSi8JNQsgkaxBYqpeoQQkmo/V2G39riAtCdiivAFezJ2ygUnJN3Z+yOeSvZrJnve3eeL/PNrs/nkFarlc1ou93aPtV0u90oU6rVqlqmtNttypDr9areKtntdpQpy+VSLVPC4fAPi065XFbLlFarpdHR6LxQKBSyWHRyuZxapvT7fcqQ8/msHjrH45EyZTKZqGVKMpm0WWWzWY2ORufT0EkkEjQ6GEMpU/CUGR0OB/XQQT1g1Ov11DIlk8lodB41Ho81OhodCegEg8FvpUxBR8tos9mohw7OPhg1m021TDFNkzLkcrnYgUDAVMqUxWKh0dHoaH2oUNQYNRqN+1LHb7bAvtWM+XzueDHENUaI6S1mlEol+t2L3+//ehwX19gCi9g8jcqjPIfOaDQSvm9AR8sIMUoxwzAMuimLx+Mvg8U9rBCrcENOpxMVZLfb/XOQuJcRYhVqxnA4lH6ww6KDmF2LSiwW+3dw+I8r0ZGJiuvR6XQ6b3/zxh45IgdHzIhGo/SSTafTdDAYgxVyoQ3Z7/euKWpsUUcunkfFNehEIhF6iaZSKccNwZiskJt0VAaDgbBNEcaWik69Xnf3DtGBI0fkKK2TLRaLwg3BHFI64vV6TU00m82ktd6YixFyfTpBrVbz3Ae3LDrIWRgqhUJBuiGYUwg6XkJFODqVSsXz36az6OTzedsxVJ5yKEls/bujM51OqYEsy3LNK0TEwghe/AJ+5mulZMXwaAAAAABJRU5ErkJggg==';
        this.logo.setAttribute('width', '100%');

        while (wrapper.firstChild) {
            wrapper.removeChild(wrapper.firstChild);
        }
        wrapper.appendChild(this.logo);
    }

    function createLogo() {
        var logo = document.getElementById('abclogo');

        if (logo) {
            logo = new Logo(logo);
        }
    }

    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', createLogo, false);
    } else if (document.attachEvent) {
        window.attachEvent('onload', createLogo);
    }
}));
