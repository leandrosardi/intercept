/*
https://www.facebook.com/?filter=groups&sk=h_chr
https://www.linkedin.com/search/results/content/?keywords=%22I%20attended%22%20or%20%22I%20just%20attended%22&origin=GLOBAL_SEARCH_HEADER&sid=w.y&sortBy=%22date_posted%22
*/

var s = null; // response text
var x = null; // response text first line
var t = null; // response text wrapped in array
var j = null; // response json
var ar = null;

(function (XHR) {
    "use strict";

    var open = XHR.prototype.open;
    var send = XHR.prototype.send;

    XHR.prototype.open = function (method, url, async, user, pass) {
        this._url = url;
        open.call(this, method, url, async, user, pass);
    };

    XHR.prototype.send = function (data) {
        var self = this;
        var oldOnReadyStateChange;
        var url = this._url;

        function onReadyStateChange() {
            if (self.readyState == 4 && self.status == 200) {
                /* This is where you can put code that you want to execute post-complete*/
                /* URL is kept in this._url */
console.log("Ready URL: " + this._url);
                if (this._url == '/api/graphql/') {
s = self.responseText;
// if s starts with '{"data":{"viewer":{"news_feed":' and t is null
if (s.startsWith('{"data":{"viewer":{"news_feed":') /*&& a == null*/) {
    // JSON is not a valid json, you must wrap it in array.
    // reference: https://stackoverflow.com/questions/51172387/json-parse-unexpected-non-whitespace-character-after-json-data-at-line-1-column
    ar = s.split("\n");
    x = ar[0];
    t = '['+x+']';
    j = JSON.parse(t);

    // post
    let posts = j[0].data.viewer.news_feed.edges; 
console.log('POSTS: '+posts.length.toString()+' posts found');
    /*
    let o = posts[0];

    // post content, 
    // TODO: VALIDATE MESSAGE IS NOT NULL
    let a = o.node.comet_sections.content.story.message.text;

    // URL of all photos in the post,
    let b = o.node.comet_sections.content.story.attachments; 

    // direct id or link to the post, 
    let c = o.node.post_id;

    // direct id or link to the Facebook group where such content has been posted,
    // name of the facebook groups
    let d = o.node.comet_sections.context_layout.story.comet_sections.actor_photo.story.to;
    // d.id
    // d.name
    
    // name of the Facebook user who posted,
    // link to the Facebook profile of such a user,
    // URL of the picture of such a Facebook user.
    //let e = o.node.comet_sections.content.story.actors[0];
    let e = o.node.comet_sections.context_layout.story.comet_sections.actor_photo.story.actors[0];
    e.id
    e.name
    e.url
    e.profile_picture.uri
    */
}
                }

            }

            if (oldOnReadyStateChange) {
                oldOnReadyStateChange();
            }
        }

        /* Set xhr.noIntercept to true to disable the interceptor for a particular call */
        if (!this.noIntercept) {
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