/*
https://www.facebook.com/?filter=groups&sk=h_chr
https://www.linkedin.com/search/results/content/?keywords=%22I%20attended%22%20or%20%22I%20just%20attended%22&origin=GLOBAL_SEARCH_HEADER&sid=w.y&sortBy=%22date_posted%22
*/


var interceptJs = {
    // flag to pause the interceptor
    paused: false,

    // array of collected data
    data: [],

    // all responses processed by the interceptor - for internal use only
    xhrs: [],

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
            
            var open = XHR.prototype.open;
            var send = XHR.prototype.send;

            XHR.prototype.open = function (method, url, async, user, pass) {
                this._url = url;
                open.call(this, method, url, async, user, pass);
            };

            XHR.prototype.send = function (data) {
                var oldOnReadyStateChange;
                var url = this._url;

                function onReadyStateChange() {
                    if (this.readyState == 4 && this.status == 200) {

                        // add the response to the xhrs array
                        interceptJs.xhrs.push(this);

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

                send.call(this, data);
            };
        })(XMLHttpRequest);
    },
};


// An identifier can start with $, _, or any character in the Unicode categories
// references: 
// - https://stackoverflow.com/questions/1661197/what-characters-are-valid-for-javascript-variable-names
// - https://mothereff.in/js-variables
var $$ = interceptJs;


// ----------------------------

var h = null;

$$.init({
    parse: function(xhr) {
        // show the request url by default
//console.log('- URL: ' + xhr._url);

        var s = null; // complete response text 
        var x = null; // line response text
        var t = null; // response text wrapped in array
        var j = null; // response json
        var o = null; // response json -> data object
        var ar = null;
        var obj = {}; // response json in massprospecting format 

        //console.log("Ready URL: " + xhr._url);

        if (xhr._url == '/api/graphql/') {
            s = xhr.responseText;
            // facebook uses to return many json objects in one response, so we need to split the response by newline
            ar = s.split("\n");
            // iterate array ar
            for (let z = 0; z < ar.length; z++) {
                x = ar[z];
                // set obj to empty object
                obj = {};
                // JSON is not a valid json, you must wrap it in array.
                // reference: https://stackoverflow.com/questions/51172387/json-parse-unexpected-non-whitespace-character-after-json-data-at-line-1-column
                t = '['+x+']';
                j = JSON.parse(t)[0];
                
                if (x.startsWith('{"label":"CometNewsFeed_viewerConnection$stream$CometNewsFeed_viewer_news_feed"')) {
                    o = j.data
                }
                
                if (x.startsWith('{"data":{"viewer":{"news_feed":')) {
                    // post
                    o = j.data.viewer.news_feed.edges[0]; 
                }
    
                if (o != null) {
//console.log('------------------');
                    // post content, 
                    // TODO: VALIDATE MESSAGE IS NOT NULL
                    let a = o.node.comet_sections.content.story.message;
                    if (a == null) {
                        obj['body'] = null;
                    } else {
                        obj['body'] = a.text;
//console.log('BODY: ' + obj['body']);
                    }

                    // URL of all photos in the post,
                    let b = o.node.comet_sections.content.story.attachments; 
                    obj['images'] = [];
                    // iterate array b
                    for (let i = 0; i < b.length; i++) {
                        // if it is an image, add it to the images array
                        let media = b[i].styles.attachment.media;
                        if (media == null || media == undefined) {
                            continue;
                        }
                        let img = media.image;
                        if (img == null || img == undefined) {
                            continue;
                        }                        
                        obj['images'].push( img.uri );
                    }

                    // direct id or link to the post, 
                    let c = o.node.post_id;
                    obj['post_id'] = c;

                    // direct id or link to the Facebook group where such content has been posted,
                    // name of the facebook groups
                    let d = o.node.comet_sections.context_layout.story.comet_sections.actor_photo.story.to;
                    obj['group'] = {}
                    obj['group']['id'] = d.id;
                    obj['group']['name'] = d.name;
//console.log('GROUP: ' + obj['group']['name']);
                    // name of the Facebook user who posted,
                    // link to the Facebook profile of such a user,
                    // URL of the picture of such a Facebook user.
                    //let e = o.node.comet_sections.content.story.actors[0];
                    let e = o.node.comet_sections.context_layout.story.comet_sections.actor_photo.story.actors[0];
                    obj['lead'] = {}
                    obj['lead']['id'] = e.id;
                    obj['lead']['name'] = e.name;
                    obj['lead']['url'] = e.url;
                    obj['lead']['profile_picture'] = e.profile_picture.uri

                    // if not exists and object into $$.data with the same post_id,
                    // add this result to the data array
                    let exists = false;
                    for (let i = 0; i < $$.data.length; i++) {
                        if ($$.data[i]['post_id'] == obj['post_id']) {
                            exists = true;
                        }
                    }
                    if (!exists) {
                        $$.push(obj);
                    }
                }
            }
        }
    }
});