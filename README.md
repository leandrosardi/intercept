**THIS LIBRARY IS UNDER CONSTRUCTION**

# intercept.js
Intercept AJAX / XHR calls for data extraction / scraping.

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

_pending to write_

