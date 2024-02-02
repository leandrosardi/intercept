require 'net/http'
require 'adspower-client'
require 'json'
require 'simple_cloud_logging'
require 'colorize'

# creating logger
l = BlackStack::LocalLogger.new('selenium.log')

# Set the API key for AdsPower
l.logs "Setting the API key for AdsPower... "
key = '00db0bb239d8c95acbfdf03ab8eb1414'
l.logf "done".green

# Create a new client
l.logs "Creating AdsPower client... "
client = AdsPowerClient.new(key: key);
l.logf "done".green

# Set the ID of the browser profile
l.logs "Setting the ID of the browser profile... "
id = 'jdus77h'
l.logf "done".green

# Starting and Operating browser
l.logs "Starting and Operating browser... "
driver = client.driver(id)
l.logf "done".green

# Get source code of intercept.js library
l.logs "Getting source code of intercept.js library... "
uri = URI.parse('https://raw.githubusercontent.com/leandrosardi/intercept/main/lib/intercept.js')
js1 = Net::HTTP.get(uri)
l.logf "done".green

# Get the source code of the scraper
l.logs "Getting source code of the scraper... "
uri = URI.parse('https://raw.githubusercontent.com/leandrosardi/intercept/main/lib/facebook_group_posts.js')
js2 = Net::HTTP.get(uri)
l.logf "done".green

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
l.logs "Injecting the library into the page... "
driver.execute_cdp("Page.addScriptToEvaluateOnNewDocument", source: js1+js2)
l.logf "done".green

# Get the URL to scrape
l.logs "Setting the URL to scrape... "
url = 'https://www.facebook.com/?filter=groups&sk=h_chr'
l.logf "done".green

# Open the URL
l.logs "Opening the URL... "
driver.get(url)
l.logf "done".green

# wait for the page to load
l.logs "Waiting for the page to load... "
sleep(5)
l.logf "done".green

# reset the intercepter
l.logs "Resetting the intercepter... "
driver.execute_script('$$.reset();')
l.logf "done".green

# click to load posts with ajax, by clicking on an anchor with href='/?filter=groups&sk=h_chr'
l.logs "Clicking to load posts with ajax... "
a = driver.find_element(:css, 'a[href="/?filter=groups&sk=h_chr"]')
a.click
l.logf "done".green

# scroll down
l.logs "Scrolling down... "
i = 0
while i<2
  driver.execute_script('window.scrollTo(0, document.body.scrollHeight)')
  sleep(1)
  i += 1
end
l.logf "done".green

# wait for the AJAX to load
l.logs "Waiting for the AJAX to load... "
sleep(10)
l.logf "done".green

# Get the list of scraped posts
l.logs "Getting the list of scraped posts... "
s = driver.execute_script('return JSON.stringify($$.data)')
arr = JSON.parse(s)
l.logf "done".green

l.log "Scraped posts: #{arr.length}"

arr.each { |post|
    l.log "Post: #{post.to_s.blue}"
}