# Overview
Just a wrapper around Jquery to perform ajax requests in a browser more easily. Basically copy of ``superagent`` nice api.

Has a built in support for cache of requests, you just have to inform your retrieve/store functions in your cache system.

Bundled with **browserify**

# Required Dependencies
- jquery
- lodash (or underscore)

# Included Dependencies
- URIjs
- json-stable-stringify

# Browser
- can be acessed as global ``window.ajaxRequest``

# Browserify
- Uses browserify-shim as transform.

# Options

- defaultFailHandler *optional*
  + receives same arguments as jquery fail function, should be a function that is going to be called when errors happen. It can be overriden in a single request by calling ``.fail(fn)``
- onBeforeRequestStarts *optional*
  + called before a request is started, it can be used to set up UI
  + receives own request as a parameter, so you can access information
- onRequestEnded *optional*
  + called when a request ends
  + receives own request as a parameter
- injectData *optional*
  + function used to inject data into JSON being sent
  + useful to inject security tokens
  + receives the json as parameter, should return a json
  + **if you use cache option, this wont be used as a cache key**

# Options when using ``request.option('useCache', true)``

- retrieveCache(key, callback) *optional*
  + callback must return data from cache, or falsy value if there is nothing there
- storeCache(key, value) *optional*
  + should store value as key in your cache
- appendToCacheKey
  + String to append to cache key.
  + eg: lets say your user changes website language. Then your cache data could be invalid if data cached depends on the language. Considering language is not specified in your actual request (with a query param), that would solve the issue as well.

# API

- Request(method, url) *constructor*
  + creates a new instance of Request
- Request.post(url)
  + creates a new instance of Request
- Request.get(url)
  + creates a new instance of Request
- Request.put(url)
  + creates a new instance of Request
  + *notice, not all browsers support this, you should probably use POST, and some technique to override methods in your server*
- Request.delete(url)
  + creates a new instance of Request
  + *notice, not all browsers support this, you should probably use POST, and some technique to override methods in your server*
- Request.del(url) *alias of Request.delete*
- query(json)
  + copies all data from json into current Request query object
- send(json)
  + sets post data into request
  + it can be a knockout observable object, it will be converted back to JSON
- option(option, value)
  + sets a option and value into Request.options
  + options supported internally
    * useCache
    * acceptsJSON
- acceptsText() *uses option method*
- acceptsJSON() *default internal option*, *uses option method*
- useCache() *uses option method*
- fail(fn)
  + sets new function as fail handler
- end(callback)
  + performs the request, calling callback with data received, in case of success. In case of failure, it will be handled by the fail handler.

# Request Attributes (can be accessed in a few handlers)
- options
- url
- _query *internal*
- _json *internal*

# Usage

```
Request = require('mmw-cli-request')({})

Request.post("/registration").send({abc:"123"}).end (data)->
  console.log data
```
