// visit this page: https://www.facebook.com/?filter=groups&sk=h_chr
// use this snippet to get the posts from your groups in the console.
// 
$$.init({
    parse: function(xhr) {
        var s = null; // complete response text 
        var ar = null; // array of lines in the response text
        var x = null; // line in the response text
        var t = null; // response text wrapped in array
        var j = null; // response json

        // get the content of all the posts
        if (xhr._url == '/api/graphql/') {
            s = xhr.responseText;
            ar = s.split("\n");
            for (let z = 0; z < ar.length; z++) {
                x = ar[z];
                // JSON is not a valid json, you must wrap it in array.
                t = '['+x+']';
                j = JSON.parse(t)[0];
                o = null;

                if (x.startsWith('{"label":"CometNewsFeed_viewerConnection$stream$CometNewsFeed_viewer_news_feed"')) {
                    o = j.data
                }
                
                if (x.startsWith('{"data":{"viewer":{"news_feed":')) {
                    // post
                    o = j.data.viewer.news_feed.edges[0]; 
                }

                if (o != null) {
                    // post content, 
                    let a = o.node.comet_sections.content.story.message;
                    if (a != null) {
                        // if not exists and object into $$.data with the same post_id,
                        // add this result to the data array
                        let exists = false;
                        for (let i = 0; i < $$.data.length; i++) {
                            if ($$.data[i] == a) {
                                exists = true;
                            }
                        } // end for
                        if (!exists) {
                            $$.push(a);
                        } // end if
                    } // end if
                } // end if
            }
        } 
    }
});