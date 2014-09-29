var $, URI, stableStringify, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

$ = require('jquery');

_ = require('lodash');

URI = require('URIjs');

stableStringify = require('json-stable-stringify');

module.exports = function(options) {
  var Request, appendToCacheKey, defaultFailHandler, injectData, onBeforeRequestStarts, onRequestEnded, retrieveCache, storeCache;
  defaultFailHandler = (options != null ? options.defaultFailHandler : void 0) || function() {};
  onBeforeRequestStarts = (options != null ? options.onBeforeRequestStarts : void 0) || function() {};
  onRequestEnded = (options != null ? options.onRequestEnded : void 0) || function() {};
  injectData = (options != null ? options.injectData : void 0) || function(d) {
    return d;
  };
  storeCache = (options != null ? options.storeCache : void 0) || function(key, value) {};
  retrieveCache = (options != null ? options.retrieveCache : void 0) || function(key, cb) {
    return cb(null);
  };
  appendToCacheKey = (options != null ? options.appendToCacheKey : void 0) || "";
  return Request = (function() {
    function Request(method, url) {
      var _ref;
      this.method = method;
      this.url = url;
      this._generateCacheKey = __bind(this._generateCacheKey, this);
      this._useCacheIfPossible = __bind(this._useCacheIfPossible, this);
      this._executeGetRequest = __bind(this._executeGetRequest, this);
      this._executePostRequest = __bind(this._executePostRequest, this);
      this._prepareToRequest = __bind(this._prepareToRequest, this);
      this._createErrorCallback = __bind(this._createErrorCallback, this);
      this._createSuccessCallback = __bind(this._createSuccessCallback, this);
      this.end = __bind(this.end, this);
      this.option = __bind(this.option, this);
      this.useCache = __bind(this.useCache, this);
      this.acceptsJSON = __bind(this.acceptsJSON, this);
      this.acceptsText = __bind(this.acceptsText, this);
      this.fail = __bind(this.fail, this);
      this.send = __bind(this.send, this);
      this.query = __bind(this.query, this);
      if (!((_ref = this.method) === "GET" || _ref === "POST" || _ref === "DELETE" || _ref === "PUT")) {
        throw new Error("Method must be supported");
      }
      if (!(_.isString(this.url))) {
        throw new Error("Url must be informed");
      }
      this._query = {};
      this.options = {
        acceptsJSON: true,
        background: false
      };
      this._json = void 0;
      this.onFail = defaultFailHandler;
      this._cacheKey = void 0;
      this._usedCache = false;
    }

    Request.post = function(url) {
      return new Request("POST", url);
    };

    Request.get = function(url) {
      return new Request("GET", url);
    };

    Request.put = function(url) {
      return new Request("PUT", url);
    };

    Request["delete"] = function(url) {
      return new Request("DELETE", url);
    };

    Request.del = function(url) {
      return new Request("DELETE", url);
    };

    Request.prototype.query = function(query) {
      if (!_.isObject(query)) {
        throw new Error("Query must be an object");
      }
      this._query = _.extend(this._query, query);
      return this;
    };

    Request.prototype.send = function(json) {
      if (!_.isObject(json)) {
        throw new Error("Json must be an object");
      }
      if (_.isArray(json)) {
        throw new Error("Json cant be an array");
      }
      this._json = json;
      return this;
    };

    Request.prototype.fail = function(fn) {
      if (!_.isFunction(fn)) {
        throw new Error("Function must be informed");
      }
      this.onFail = fn;
      return this;
    };

    Request.prototype.acceptsText = function() {
      this.options.acceptsJSON = false;
      return this;
    };

    Request.prototype.acceptsJSON = function() {
      this.options.acceptsJSON = true;
      return this;
    };

    Request.prototype.useCache = function() {
      this.options.useCache = true;
      return this;
    };

    Request.prototype.option = function(opt, value) {
      this.options[opt] = value;
      return this;
    };

    Request.prototype.end = function(userCallback) {
      var callback;
      if (!(userCallback === void 0 || _.isFunction(userCallback))) {
        throw new Error("Callback must be a function or not defined at all");
      }
      userCallback = userCallback || function() {};
      callback = this._createSuccessCallback(userCallback);
      if ("POST" === this.method) {
        return this._executePostRequest(callback);
      } else if ("GET" === this.method) {
        return this._executeGetRequest(callback);
      } else {
        throw new Error("Method " + this.method + " not supported");
      }
    };

    Request.prototype._createSuccessCallback = function(callback) {
      if (!_.isFunction(callback)) {
        throw new Error("Callback must be a function");
      }
      return (function(_this) {
        return function(data) {
          if (_this.options.useCache === true && (data != null) && !_this._usedCache) {
            storeCache(_this._generateCacheKey(), data);
          }
          onRequestEnded(_this);
          return callback.apply(null, arguments);
        };
      })(this);
    };

    Request.prototype._createErrorCallback = function() {
      return (function(_this) {
        return function() {
          onRequestEnded(_this);
          return _this.onFail.apply(null, [null, arguments[0], _this.options, arguments[2]]);
        };
      })(this);
    };

    Request.prototype._prepareToRequest = function() {
      if (!_.isEmpty(this._query)) {
        this.url = URI(this.url).query(this._query).toString();
      }
      return onBeforeRequestStarts(this);
    };

    Request.prototype._executePostRequest = function(callback) {
      this._prepareToRequest();
      return this._useCacheIfPossible((function(_this) {
        return function(result) {
          var ajaxOptions;
          if (result) {
            _this._usedCache = true;
            return callback(result);
          }
          ajaxOptions = {
            cache: false,
            type: _this.method,
            url: _this.url,
            data: JSON.stringify(injectData(_this._json || {})),
            success: callback,
            error: _this._createErrorCallback(),
            contentType: 'application/json',
            dataType: 'json',
            global: false
          };
          if (!_this.options.acceptsJSON) {
            delete ajaxOptions.dataType;
          }
          return $.ajax(ajaxOptions);
        };
      })(this));
    };

    Request.prototype._executeGetRequest = function(callback) {
      this._prepareToRequest();
      return this._useCacheIfPossible((function(_this) {
        return function(result) {
          var ajaxOptions;
          if (result) {
            _this._usedCache = true;
            return callback(result);
          }
          ajaxOptions = {
            cache: false,
            type: 'GET',
            url: _this.url,
            success: callback,
            error: _this._createErrorCallback(),
            contentType: 'application/json',
            dataType: 'json',
            global: false
          };
          if (!_this.options.acceptsJSON) {
            delete ajaxOptions.dataType;
          }
          return $.ajax(ajaxOptions);
        };
      })(this));
    };

    Request.prototype._useCacheIfPossible = function(callback) {
      if (this.options.useCache === true) {
        return retrieveCache(this._generateCacheKey(), callback);
      }
      return callback(null);
    };

    Request.prototype._generateCacheKey = function() {
      if (this._cacheKey == null) {
        this._cacheKey = "" + appendToCacheKey + "-" + this.method + "-" + this.url;
        if (!_.isEmpty(this._query)) {
          this._cacheKey = this._cacheKey + "-" + stableStringify(this._query);
        }
        if (!_.isEmpty(this._json)) {
          this._cacheKey = this._cacheKey + "-" + stableStringify(this._json);
        }
      }
      return this._cacheKey;
    };

    return Request;

  })();
};
