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


var h = null;

interceptJs.init({
    parse: function(xhr) {
        // show the request url by default
        console.log('- URL: ' + xhr._url);

        var s = null; // response text
        var x = null; // response text first line
        var t = null; // response text wrapped in array
        var j = null; // response json
        var ar = null;
        var obj = {}; // response json in massprospecting format 

        console.log("Ready URL: " + xhr._url);

        if (xhr._url == '/api/graphql/') {
            s = xhr.responseText;
            // if s starts with '{"data":{"viewer":{"news_feed":' and t is null
            //if (s.startsWith('{"data":{"viewer":{"news_feed":') && a == null) {
//if (s.startsWith('{"label":"CometNewsFeed_viewerConnection$stream$CometNewsFeed_viewer_news_feed"')) {
            if (s.startsWith('{"data":{"viewer":{"news_feed":')) {
                // JSON is not a valid json, you must wrap it in array.
                // reference: https://stackoverflow.com/questions/51172387/json-parse-unexpected-non-whitespace-character-after-json-data-at-line-1-column
                ar = s.split("\n");
                x = ar[0];
                t = '['+x+']';
                j = JSON.parse(t);

                // post
                let o = j[0].data.viewer.news_feed.edges[0]; 
//let o = j[0].data

                console.log('POSTS: '+posts.length.toString()+' posts found');

                let o = posts[0];

                // post content, 
                // TODO: VALIDATE MESSAGE IS NOT NULL
                let a = o.node.comet_sections.content.story.message;
                if (a == null) {
                    obj['body'] = null;
                } else {
                    obj['body'] = a.text;
                }

                // URL of all photos in the post,
                let b = o.node.comet_sections.content.story.attachments; 
                obj['images'] = [];
                // iterate array b
                for (let i = 0; i < b.length; i++) {
                    obj['images'].push( b[i].styles.attachment.media.photo_image.uri );
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

                // add this result to the data array
                interceptJs.push(obj);
            }
        }
    }
});