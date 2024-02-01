**THIS LIBRARY IS UNDER CONSTRUCTION**

# intercept.js
Intercept AJAX / XHR calls for data extraction / scraping.

**Outline:**

1. [Getting Started](#1-getting-started)
2. [Processing AJAX Responses](#2-processing-ajax-responses)
3. [Pause Interception](#3-pause-interception)
4. [Working with Selnium](#4-working-with-selenium)
5. [Disclaimer](#disclaimer)

## 1. Getting Started

1. Open a browser where you can access your Facebook profile.

2. Go to [this URL](https://www.facebook.com/?filter=groups&sk=h_chr) to see the latest posts in the Facebook groups where you are joined to:

![Scraping Facebook Posts](./docu/pics/scraping-facebook-posts-1.png)

3. Press CTRL+SHIFT+I to open the Developer Tools:

![Scraping Facebook Posts](./docu/pics/scraping-facebook-posts-2.png)

4. Inject **intercept.js** the the webpage.

In the console tab, paste [the source code of **intercept.js**](https://github.com/leandrosardi/intercept/blob/main/lib/intercept.js) and press ENTER.

![Scraping Facebook Posts](./docu/pics/scraping-facebook-posts-3.png)

5. Initialize **intercept.js**:

```javascript
$$.init();
```

![Scraping Facebook Posts](./docu/pics/scraping-facebook-posts-4.png)

6. Scroll down to load new posts, and see the URLs of the AJAX calls in the console.

![Scraping Facebook Posts](./docu/pics/scraping-facebook-posts-5.png)


## 2. Processing AJAX Responses

Initialize **intercept.js** with a custom parsing function.

**E.g.:** The code below extract the content of each post from the AJAX response.

```javascript
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

                if (x.startsWith('{"label":"CometNewsFeed_viewerConnection$stream$CometNewsFeed_viewer_news_feed"')) {

                    let a = j.data.node.comet_sections.content.story.message;
                    if (a != null) {
                        console.log('POST: ' + a.text);
                    }
                }
            }
        } 
    }
});
```

![Scraping Facebook Posts](./docu/pics/scraping-facebook-posts-6.png)

## 3. Pause Interception

You can pause interception:

```javascript
$$.pause();
```

You can resume interception:

```javascript
$$.play();
```

You can check if interception is running or not:

```javascript
$$.paused
// => true
```

## 4. Working with Selenium

_pending to write_

## Disclaimer

Use this library at your own risk.

