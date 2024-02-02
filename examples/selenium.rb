require 'net/http'
require 'adspower-client'

# Set the API key for AdsPower
key = '00db0bb239d8c95acbfdf03ab8eb1414'

# Create a new client
client = AdsPowerClient.new(key: key);

# Set the ID of the browser profile
id = 'jdus77h'

# Starting and Operating browser
driver = client.driver(id)

# Get source code of inject.js library using OpenURI library
uri = URI.parse('https://raw.githubusercontent.com/leandrosardi/intercept/main/lib/intercept.js')
js1 = Net::HTTP.get(uri)

# Get the source code of the scraper
js2 = File.read('./facebook_group_posts.js')

# Execute the scraper
# Inject the library into the page
#
# Selenium: How to Inject/execute a Javascript in to a Page before loading/executing any other scripts of the page?
#
# Reference:
# - https://stackoverflow.com/questions/31354352/selenium-how-to-inject-execute-a-javascript-in-to-a-page-before-loading-executi
# 
# Documentation:
# - https://www.selenium.dev/documentation/webdriver/bidirectional/chrome_devtools/cdp_endpoint/
# 
driver.execute_cdp("Page.addScriptToEvaluateOnNewDocument", source: js1+js2)

# Get the URL to scrape
url = 'https://www.facebook.com/?filter=groups&sk=h_chr'

# Open the URL
driver.get(url)
