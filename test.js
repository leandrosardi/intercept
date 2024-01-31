/*
FGP
https://www.facebook.com/?filter=groups&sk=h_chr
FPF
https://www.facebook.com/search/posts?q=marketing&filters=eyJyZWNlbnRfcG9zdHM6MCI6IntcIm5hbWVcIjpcInJlY2VudF9wb3N0c1wiLFwiYXJnc1wiOlwiXCJ9In0%3D
LPF
https://www.linkedin.com/search/results/content/?keywords=%22I%20attended%22%20or%20%22I%20just%20attended%22&origin=GLOBAL_SEARCH_HEADER&sid=w.y&sortBy=%22date_posted%22
*/


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

// ----------------------------
var facebook_group_posts = {
    // browser must be located at this URL: https://www.facebook.com/?filter=groups&sk=h_chr
    // perform an AJAX request to reload the list of posts.
    load: function () {
        // TODO: Code Me!
    },

    // process a response to a XHR request.
    // if it is about a post, parse it and add it to the data array.
    scrape: function (xhr) {
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
                    // add the raw json descriptor to the object
                    // for further analysis and debugging.
                    obj['raw'] = o;

                    //console.log('------------------');

                    // # of comments
                    obj['comments'] = o.node.comet_sections.feedback.story.feedback_context.feedback_target_with_context.ufi_renderer.feedback.total_comment_count

                    // # of reactions
                    obj['reactions'] = o.node.comet_sections.feedback.story.feedback_context.feedback_target_with_context.ufi_renderer.feedback.comet_ufi_summary_and_actions_renderer.feedback.i18n_reaction_count

                    // # of shares
                    obj['shares'] = o.node.comet_sections.feedback.story.feedback_context.feedback_target_with_context.ufi_renderer.feedback.comet_ufi_summary_and_actions_renderer.feedback.i18n_share_count

                    // post content, 
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
                        let attachment = b[i].styles.attachment;
                        if (attachment != null && attachment != undefined) {
                            let media = attachment.media;
                            if (media != null && media != undefined) {
                                let img = media.photo_image;
                                if (img != null && img != undefined) {
                                    obj['images'].push( img.uri );
                                }                        
                            }
                            // if the is a list of sub-attachments, iterate it
                            let subattachments = attachment.all_subattachments;
                            if (subattachments != null && subattachments != undefined) {
                                for (let i2 = 0; i2 < subattachments.nodes.length; i2++) {
                                    let img = subattachments.nodes[i2].media.image;
                                    if (img != null && img != undefined) {
                                        obj['images'].push( img.uri );
                                    }                        
                                }
                            }
                        } // end if attachment
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
    },
};

// ----------------------------
var facebook_public_feed = {
    // browser must be located at this URL: https://www.facebook.com/?filter=groups&sk=h_chr
    // perform an AJAX request to reload the list of posts.
    load: function () {
        // TODO: Code Me!
    },

    // process a response to a XHR request.
    // if it is about a post, parse it and add it to the data array.
    scrape: function (xhr) {
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
                
                // JSON is not a valid json, you must wrap it in array.
                // reference: https://stackoverflow.com/questions/51172387/json-parse-unexpected-non-whitespace-character-after-json-data-at-line-1-column
                t = '['+x+']';
                j = JSON.parse(t)[0];

// log the first 50 chars of x
//console.log('------------------');
//console.log(x.substring(0, 50));
//console.log(x.includes('BOOK BINDING LINE'));

                if (x.startsWith('{"data":{"serpResponse":{"results":{"edges":') == false) {
//console.log('not matched')
                } else {
//console.log('matched')
                    edges = j.data.serpResponse.results.edges;
    
                    // iterate array edges
                    for (let i0 = 0; i0 < edges.length; i0++) {
//console.log(' - edge #' + i0);
                        o = edges[i0];

                        // set obj to empty object
                        obj = {};

                        // add the raw json descriptor to the object
                        // for further analysis and debugging.
                        obj['raw'] = o;

                        // # of comments
                        obj['comments'] = o.relay_rendering_strategy.view_model.click_model.story.comet_sections.feedback.story.feedback_context.feedback_target_with_context.ufi_renderer.feedback.comet_ufi_summary_and_actions_renderer.feedback.comments_count_summary_renderer.feedback.total_comment_count

                        // # of reactions
                        obj['reactions'] = o.relay_rendering_strategy.view_model.click_model.story.comet_sections.feedback.story.feedback_context.feedback_target_with_context.ufi_renderer.feedback.comet_ufi_summary_and_actions_renderer.feedback.reaction_count.count

                        // # of shares
                        obj['shares'] = o.relay_rendering_strategy.view_model.click_model.story.comet_sections.feedback.story.feedback_context.feedback_target_with_context.ufi_renderer.feedback.comet_ufi_summary_and_actions_renderer.feedback.i18n_share_count

                        // post content, 
                        let a0 = o.relay_rendering_strategy.view_model.click_model.story.comet_sections.content
                        if (a0 != null && a0 != undefined) {
                            let a = a0.story.message
                            if (a == null) {
                                obj['body'] = null;
                            } else {
                                obj['body'] = a.text;
                                //console.log('BODY: ' + obj['body']);
                            }
                        }
//console.log(' - body: ' + obj['body'].substring(0, 50).split('\n').join(' - ') + '...');
                        // URL of all photos in the post,
                        let b = o.relay_rendering_strategy.view_model.click_model.story.comet_sections.content.story.attachments;
                        obj['images'] = [];
                        // iterate array b
                        for (let i = 0; i < b.length; i++) {
                            // if it is an image, add it to the images array
                            let attachment = b[i].styles.attachment;
                            if (attachment != null && attachment != undefined) {
                                let media = attachment.media;
                                if (media != null && media != undefined) {
                                    let img = media.photo_image;
                                    if (img != null && img != undefined) {
                                        obj['images'].push( img.uri );
                                    }                        
                                }
                                // if the is a list of sub-attachments, iterate it
                                let subattachments = attachment.all_subattachments;
                                if (subattachments != null && subattachments != undefined) {
                                    for (let i2 = 0; i2 < subattachments.nodes.length; i2++) {
                                        let img = subattachments.nodes[i2].media.image;
                                        if (img != null && img != undefined) {
                                            obj['images'].push( img.uri );
                                        }                        
                                    }
                                }
                            } // end if attachment
                        } // end for attachments

                        // direct id or link to the post, 
                        let c = o.relay_rendering_strategy.view_model.click_model.story.post_id                         
                        obj['post_id'] = c;
//console.log(' - post_id: ' + obj['post_id']);
                        // direct id or link to the Facebook group where such content has been posted,
                        // name of the facebook groups
                        let d = o.relay_rendering_strategy.view_model.click_model.story.comet_sections.context_layout.story.comet_sections.actor_photo.story.to;
                        obj['group'] = null;
                        if (d != null && d != undefined) {
                            obj['group'] = {}
                            obj['group']['id'] = d.id;
                            obj['group']['name'] = d.name;
                        }

                        //console.log('GROUP: ' + obj['group']['name']);
                        
                        // name of the Facebook user who posted,
                        // link to the Facebook profile of such a user,
                        // URL of the picture of such a Facebook user.
                        //let e = o.node.comet_sections.content.story.actors[0];
                        //
                        // if it is a reel, it is not a post from a lead (eg: a reel from a page)
                        obj['lead'] = null;
                        let e0 = o.relay_rendering_strategy.view_model.click_model.story.comet_sections.content.story.comet_sections.context_layout;
                        if (e0 != null && e0 != undefined) {
                            let e = e0.story.comet_sections.actor_photo.story.actors[0]
                            obj['lead'] = {}
                            obj['lead']['id'] = e.id;
                            obj['lead']['name'] = e.name;
                            obj['lead']['url'] = e.url;
                            obj['lead']['profile_picture'] = e.profile_picture.uri
                        }

                        // if not exists and object into $$.data with the same post_id,
                        // add this result to the data array
                        //
                        // if it is a reel, it is not a post from a lead (eg: a reel from a page)
                        if (obj['lead'] == null) {
//console.log('lead not found :(')
                        } else {
                            let exists = false;
                            for (let i = 0; i < $$.data.length; i++) {
                                if ($$.data[i]['post_id'] == obj['post_id']) {
                                    exists = true;
                                }
                            }
    
                            if (!exists) {
//console.log(' - added!');
                                $$.push(obj);
                            }    
                        }
                    } // end for edges
                }
            }
        }
    },
};

// ----------------------------

$$.init({
    parse: function(xhr) {
        facebook_public_feed.scrape(xhr);
    }
});



// Selenium: How to Inject/execute a Javascript in to a Page before loading/executing any other scripts of the page?
// reference: https://stackoverflow.com/questions/31354352/selenium-how-to-inject-execute-a-javascript-in-to-a-page-before-loading-executi
/*
old = window.onload;
window.location.href = 'https://www.facebook.com/?filter=groups&sk=h_chr';
window.onload = function() {
    // call the original onload event
    if (old != null) {
        old();
    }
    // add some code to the onload event
    console.log('injected code!');
};
*/

/*
// inject a script into the page on load
window.onload = function() {
    // inject a script into the page
    var s = document.createElement('script');
    //s.src = chrome.extension.getURL('test.js');
    //s.src = 'https://raw.githubusercontent.com/rodrigopivi/intercept.js/master/test.js';
    s.innerHTML = "console.log('injected!');";
    //s.onload = function() {
    //    this.remove();
    //};
    (document.head || document.documentElement).appendChild(s);
}
*/

