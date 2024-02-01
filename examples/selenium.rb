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

# Get the URL to scrape
url = 'https://www.facebook.com/?filter=groups&sk=h_chr'

# Open the URL
driver.get(url)

# Get source code of inject.js library using OpenURI library
uri = URI.parse('https://raw.githubusercontent.com/leandrosardi/intercept/main/lib/intercept.js')
js = Net::HTTP.get(uri)

# Inject the library into the page
driver.execute_script(js)

# Get the source code of the scraper
js = File.read('./facebook_group_posts.js')

# Execute the scraper
driver.execute_script(js)

