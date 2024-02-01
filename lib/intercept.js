var interceptJs = {
    // oroginal XMLHttpRequest methods
    open: null,
    send: null,

    // flag to pause the interceptor
    paused: false,

    // array of data collected from the responses - IT IS NOT THE DATA OM THR REQUEST
    data: [],

    // all calls, including URL, data and response processed by the interceptor - for internal use only
    calls: [],

	// return the version if this interceptJs library.
    version: function() {
        return '0.0.2';
    },

    // resume the interceptor
    play: function() {
        interceptJs.paused = false;
    },

    // pause the interceptor
    pause: function() {
        interceptJs.paused = true;
    },

    // add a json object to the data array
    push: function(obj) {
        interceptJs.data.push(obj);
    },

    // callback function to parse the response to the XHR request.
    parse: function(xhr) {
        // show the request url by default
        console.log('URL: ' + xhr._url);
    },

    // inject javascript code in the webpage.
    init: function(h={}) {
        
        // assign a value to the parse callback function.
        if (h.parse != null) {
            interceptJs.parse = h.parse;
        }

        (function (XHR) {
            "use strict";
            console.log("Intercept.Js v" + interceptJs.version());
            
            $$.open = XHR.prototype.open;
            $$.send = XHR.prototype.send;

            XHR.prototype.open = function (method, url, async, user, pass) {
                this._url = url;
                $$.open.call(this, method, url, async, user, pass);
            };

            XHR.prototype.send = function (data) {
                var oldOnReadyStateChange;
                var url = this._url;

                function onReadyStateChange() {
                    if (this.readyState == 4 && this.status == 200) {

                        // add the call description (url, data and request) to the calls array
                        interceptJs.calls.push({
                            url: url,
                            data: data,
                            xhr: this,
                        });

                        /* This is where you can put code that you want to execute post-complete*/
                        /* URL is kept in this._url */
                        if (interceptJs.parse != null) {
                            interceptJs.parse(this);
                        }
                    }

                    if (oldOnReadyStateChange) {
                        oldOnReadyStateChange();
                    }
                }

                /* Set paused to true to disable the interceptor for a particular call */
                if (!interceptJs.paused) {
                    if (this.addEventListener) {
                        this.addEventListener("readystatechange", onReadyStateChange, false);
                    } else {
                        oldOnReadyStateChange = this.onreadystatechange;
                        this.onreadystatechange = onReadyStateChange;
                    }
                }

                $$.send.call(this, data);
            };
        })(XMLHttpRequest);
    },
};

// An identifier can start with $, _, or any character in the Unicode categories
// references: 
// - https://stackoverflow.com/questions/1661197/what-characters-are-valid-for-javascript-variable-names
// - https://mothereff.in/js-variables
var $$ = interceptJs;