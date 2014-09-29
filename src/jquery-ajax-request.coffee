$ = require 'jquery'
_ = require 'lodash'
URI = require 'URIjs'
stableStringify = require 'json-stable-stringify'

module.exports = (options)->
  defaultFailHandler = options?.defaultFailHandler or ()->
  onBeforeRequestStarts = options?.onBeforeRequestStarts or ()->
  onRequestEnded = options?.onRequestEnded or ()->
  injectData = options?.injectData or (d)-> return d
  storeCache = options?.storeCache or (key, value)->
  retrieveCache = options?.retrieveCache or (key, cb)-> cb(null)
  appendToCacheKey = options?.appendToCacheKey or ""

  class Request
    constructor:(@method, @url)->
      throw new Error("Method must be supported") if not(@method in ["GET", "POST", "DELETE", "PUT"])
      throw new Error("Url must be informed") if not(_.isString(@url))
      @_query = {}
      @options = {acceptsJSON: true, background: false}
      @_json = undefined
      @onFail = defaultFailHandler
      @_cacheKey = undefined
      @_usedCache = false

    # STATIC METHODS

    @post: (url)-> return new Request("POST", url)
    @get: (url)-> return new Request("GET", url)
    @put: (url)-> return new Request("PUT", url)
    @delete: (url)-> return new Request("DELETE", url)
    @del: (url)-> return new Request("DELETE", url)

    # INSTANCE METHODS

    query:(query)=>
      throw new Error("Query must be an object") if !_.isObject(query)
      @_query = _.extend(@_query, query)
      @

    send:(json)=>
      throw new Error("Json must be an object") if !_.isObject(json)
      throw new Error("Json cant be an array") if _.isArray(json)
      @_json = json
      @

    fail:(fn)=>
      throw new Error("Function must be informed") if !_.isFunction(fn)
      @onFail = fn
      @

    acceptsText:()=>
      @options.acceptsJSON = false
      @

    acceptsJSON:()=>
      @options.acceptsJSON = true
      @

    useCache:()=>
      @options.useCache = true
      @

    option:(opt, value)=>
      @options[opt] = value
      @

    end:(userCallback)=>
      throw new Error("Callback must be a function or not defined at all") if !(userCallback is undefined or _.isFunction(userCallback))
      userCallback = userCallback or ->
      callback = @_createSuccessCallback(userCallback)
      if "POST" is @method
        @_executePostRequest(callback)
      else if "GET" is @method
        @_executeGetRequest(callback)
      else throw new Error("Method #{@method} not supported")

    _createSuccessCallback:(callback)=>
      throw new Error("Callback must be a function") if !_.isFunction(callback)
      return (data)=>
        if @options.useCache is true and data? and !@_usedCache
          storeCache @_generateCacheKey(), data
        onRequestEnded(@)
        callback.apply(null, arguments)

    _createErrorCallback:()=>
      return =>
        onRequestEnded(@)
        @onFail.apply(null, [null, arguments[0], @options, arguments[2]])

    _prepareToRequest:()=>
      if !_.isEmpty(@_query)
        @url = URI(@url).query(@_query).toString()
      onBeforeRequestStarts(@)

    _executePostRequest:(callback)=>
      @_prepareToRequest()
      @_useCacheIfPossible (result)=>
        if result
          @_usedCache = true
          return callback(result)
        ajaxOptions =
          cache: false
          type: @method
          url: @url
          data: JSON.stringify(injectData(@_json or {}))
          success: callback
          error: @_createErrorCallback()
          contentType: 'application/json'
          dataType: 'json'
          global: false
        if !@options.acceptsJSON then delete ajaxOptions.dataType
        $.ajax ajaxOptions

    _executeGetRequest:(callback)=>
      @_prepareToRequest()
      @_useCacheIfPossible (result)=>
        if result
          @_usedCache = true
          return callback(result)
        ajaxOptions =
          cache: false
          type: 'GET'
          url: @url
          success: callback
          error: @_createErrorCallback()
          contentType: 'application/json'
          dataType: 'json'
          global: false
        if !@options.acceptsJSON then delete ajaxOptions.dataType
        $.ajax ajaxOptions

    _useCacheIfPossible:(callback)=>
      if @options.useCache is true
        return retrieveCache @_generateCacheKey(), callback
      return callback(null)

    _generateCacheKey:()=>
      if !@_cacheKey?
        @_cacheKey = "#{appendToCacheKey}-#{@method}-#{@url}"
        if !_.isEmpty(@_query)
          @_cacheKey = @_cacheKey + "-" + stableStringify(@_query)
        if !_.isEmpty(@_json)
          @_cacheKey = @_cacheKey + "-" + stableStringify(@_json)
      return @_cacheKey




