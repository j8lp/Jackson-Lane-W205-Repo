(function() {
  define(["splunkjs/mvc", "splunkjs/mvc/utils", "splunkjs/mvc/searchmanager", "components/splunk/Forms"], function(mvc, utils, SearchManager, Forms) {
    var Searches, applyDefaults, defaultSearchAttributes, defaultSearchOptions, defaultSearchResultsOptions, getSearchAttributes, getSearchResults, invalidSearchErrorMessages, log, runCallback, searchErrorContentEventToString, searchErrorEventToString, testValidSearchErrorMessage;
    defaultSearchAttributes = {
      "app": utils.getCurrentApp(),
      "auto_cancel": 90,
      "cache": false,
      "cancelOnUnload": true,
      "preview": true,
      "runWhenTimeIsUndefined": true,
      "status_buckets": 0
    };
    defaultSearchOptions = {
      "tokens": true,
      "tokenNamespace": "submitted"
    };
    defaultSearchResultsOptions = {
      "count": 0,
      "output_mode": "json_rows"
    };
    applyDefaults = function(object, defaultObject) {
      var key, value;
      if (object == null) {
        return defaultObject;
      } else {
        for (key in defaultObject) {
          value = defaultObject[key];
          if (object[key] == null) {
            object[key] = value;
          }
        }
        return object;
      }
    };
    runCallback = function(callback, argumentArray) {
      if (argumentArray == null) {
        argumentArray = [];
      }
      if (typeof callback === "function") {
        return callback.apply(callback, argumentArray);
      }
    };
    getSearchResults = function(searchManager, options) {
      options = applyDefaults(options, defaultSearchResultsOptions);
      return searchManager.data("results", options);
    };
    getSearchAttributes = function(attributes, searchManagerId, autostart, searchString) {
      attributes = applyDefaults(attributes, defaultSearchAttributes);
      attributes["id"] = searchManagerId;
      attributes["autostart"] = autostart;
      attributes["search"] = searchString;
      return attributes;
    };
    log = function(searchManagerId, message) {
      message = ["[", Date.now(), " SEARCH ", searchManagerId, "] ", message];
      message = message.join("");
      return console.log(message);
    };
    searchErrorEventToString = function(searchErrorMessage, searchErrorObject) {
      var data, error, explanationString, i, len, message, messageText, messageType, messages, messagesSet, messagesString, searchErrorIsValid, searchErrorString;
      explanationString = [];
      if (searchErrorObject != null) {
        data = searchErrorObject.data;
        if (data != null) {
          messages = data.messages;
          messagesSet = {};
          if (messages != null) {
            for (i = 0, len = messages.length; i < len; i++) {
              message = messages[i];
              messageText = message.text;
              messageType = message.type;
              if ((messageText != null) && (messageType != null)) {
                if (messageType === "FATAL" || messageType === "ERROR") {
                  messagesSet[messageText] = true;
                }
              }
            }
          }
          messagesString = [];
          for (message in messagesSet) {
            messagesString.push(message);
          }
          messagesString = messagesString.join("; ");
          error = searchErrorObject.error;
          if (error != null) {
            explanationString.push(error);
            if (messagesString.length > 0) {
              explanationString.push(" [");
              explanationString.push(messagesString);
              explanationString.push("]");
            }
          }
        }
      }
      explanationString = explanationString.join("");
      searchErrorString = [];
      if (searchErrorMessage != null) {
        searchErrorIsValid = testValidSearchErrorMessage(searchErrorMessage);
        if (searchErrorIsValid) {
          searchErrorString.push(searchErrorMessage);
          if (explanationString.length > 0) {
            searchErrorString.push(" (");
            searchErrorString.push(explanationString);
            searchErrorString.push(")");
          }
        } else {
          searchErrorString.push(explanationString);
        }
      } else {
        searchErrorString.push(explanationString);
      }
      searchErrorString = searchErrorString.join("");
      return searchErrorString;
    };
    searchErrorContentEventToString = function(searchErrorContentObject) {
      var content, i, len, message, messageText, messageType, messages, messagesSet, messagesString;
      messagesString = [];
      if (searchErrorContentObject != null) {
        content = searchErrorContentObject.content;
        if (content != null) {
          messages = content.messages;
          messagesSet = {};
          if (messages != null) {
            for (i = 0, len = messages.length; i < len; i++) {
              message = messages[i];
              messageText = message.text;
              messageType = message.type;
              if ((messageText != null) && (messageType != null)) {
                if (messageType === "FATAL" || messageType === "ERROR") {
                  messagesSet[messageText] = true;
                }
              }
            }
          }
          for (message in messagesSet) {
            messagesString.push(message);
          }
          messagesString = messagesString.join("; ");
        }
      }
      return messagesString;
    };
    invalidSearchErrorMessages = {
      "No search query provided.": true,
      "Search is waiting for input...": true
    };
    testValidSearchErrorMessage = function(searchErrorMessage) {
      var result;
      result = invalidSearchErrorMessages[searchErrorMessage];
      result = result !== true;
      return result;
    };
    return Searches = (function() {
      function Searches() {}

      Searches.getSearchManager = function(searchManagerId) {
        var searchManager;
        searchManager = mvc.Components.getInstance(searchManagerId);
        return searchManager;
      };

      Searches.getResultCount = function(searchManager) {
        var content, job, resultCount, state;
        resultCount = null;
        if (searchManager) {
          job = searchManager.job;
          if (job != null) {
            state = job.state;
            if (state != null) {
              state = state();
              if (state != null) {
                content = state.content;
                if (content != null) {
                  resultCount = content.resultCount;
                }
              }
            }
          }
        }
        return resultCount;
      };

      Searches.setSearch = function(searchManagerId, autostart, overwrite, targetJobIdTokenName, searchString, onDoneCallback, onDataCallback, onCreateCallback, attributes, onErrorCallback, onStartCallback) {
        var _log, parameters, searchManager, searchResults;
        _log = function(message) {
          return log(searchManagerId, message);
        };
        if ((autostart != null) && typeof autostart === "object") {
          parameters = autostart;
          autostart = parameters["autostart"];
          overwrite = parameters["overwrite"];
          targetJobIdTokenName = parameters["targetJobIdTokenName"];
          searchString = parameters["searchString"];
          onDoneCallback = parameters["onDoneCallback"];
          onDataCallback = parameters["onDataCallback"];
          onCreateCallback = parameters["onCreateCallback"];
          attributes = parameters["attributes"];
          onErrorCallback = parameters["onErrorCallback"];
          onStartCallback = parameters["onStartCallback"];
        }
        if (autostart == null) {
          autostart = false;
        }
        if (overwrite == null) {
          overwrite = false;
        }
        if (searchString == null) {
          searchString = "";
        }
        attributes = getSearchAttributes(attributes, searchManagerId, autostart, searchString);
        searchManager = null;
        if (!overwrite) {
          searchManager = mvc.Components.getInstance(searchManagerId);
        }
        if (searchManager == null) {
          searchManager = new SearchManager(attributes, defaultSearchOptions);
          _log("created search manager");
          runCallback(onCreateCallback, [searchManager]);
          searchManager.on("search:done", function(searchDoneObject) {
            var jobId, searchErrorContentString;
            jobId = searchManager.job.sid;
            _log("search done: job id: " + jobId);
            searchErrorContentString = searchErrorContentEventToString(searchDoneObject);
            if (searchErrorContentString.length > 0) {
              _log("search fail: " + searchErrorContentString);
              return runCallback(onErrorCallback, [searchErrorContentString]);
            } else {
              if (targetJobIdTokenName != null) {
                Forms.setToken(targetJobIdTokenName, jobId);
              }
              return runCallback(onDoneCallback, [searchManager]);
            }
          });
          searchManager.on("search:error", function(searchErrorMessage, searchErrorObject) {
            var searchErrorString;
            searchErrorString = searchErrorEventToString(searchErrorMessage, searchErrorObject);
            if (searchErrorString.length > 0) {
              _log("search error: " + searchErrorString);
              return runCallback(onErrorCallback, [searchErrorString]);
            }
          });
          searchManager.on("search:fail", function(searchFailObject) {
            var searchErrorContentString;
            searchErrorContentString = searchErrorContentEventToString(searchFailObject);
            _log("search fail: " + searchErrorContentString);
            return runCallback(onErrorCallback, [searchErrorContentString]);
          });
          searchManager.on("search:start", function(searchStartObject) {
            _log("search started");
            return runCallback(onStartCallback, [searchStartObject]);
          });
          searchResults = getSearchResults(searchManager);
          searchResults.on("data", function() {
            var data, fieldCount, rowCount;
            data = searchResults.data();
            if (data != null) {
              fieldCount = data.fields != null ? data.fields.length : 0;
              rowCount = data.rows != null ? data.rows.length : 0;
              _log("search results: " + fieldCount + " fields, " + rowCount + " rows");
            } else {
              _log("search results: no results");
            }
            return runCallback(onDataCallback, [data]);
          });
        }
        if (!autostart) {
          searchManager.cancel();
          _log("starting search...");
          return searchManager.startSearch();
        }
      };

      return Searches;

    })();
  });

}).call(this);
