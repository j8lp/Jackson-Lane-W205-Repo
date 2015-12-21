(function() {
  define(function(require, exports, module) {
    var importSearchQuery;
    return importSearchQuery = function(searchBarControl, datasetDropdownControl) {
      var Forms, earliestTime, getQueryParameters, getSplunkSearchParameters, latestTime, ref, ref1, referrer, searchStart, searchString, timeRange, url, urlParams, urlSearch;
      getQueryParameters = require("./getQueryParameters");
      Forms = require("./../../splunk/Forms");
      url = require("url");
      urlParams = getQueryParameters(window.location.search);
      getSplunkSearchParameters = function(queryParams) {
        return [queryParams.q || '', queryParams.earliest || '', queryParams.latest || ''];
      };
      if ((datasetDropdownControl != null) && (urlParams.ml_toolkit_dataset != null)) {
        return Forms.setChoiceViewByLabel(datasetDropdownControl, urlParams.ml_toolkit_dataset);
      } else if (searchBarControl != null) {
        ref = getSplunkSearchParameters(urlParams), searchString = ref[0], earliestTime = ref[1], latestTime = ref[2];
        if (searchString.length === 0 && earliestTime.length === 0 && latestTime.length === 0) {
          referrer = new URL(document.referrer);
          urlSearch = '';
          if (referrer.search.length > 0) {
            urlSearch = referrer.search;
          } else if (referrer.hash.length > 0) {
            searchStart = referrer.hash.indexOf('?');
            if (searchStart > -1) {
              urlSearch = referrer.hash.slice(searchStart);
            }
          }
          if (window.location.host === referrer.host) {
            ref1 = getSplunkSearchParameters(getQueryParameters(urlSearch)), searchString = ref1[0], earliestTime = ref1[1], latestTime = ref1[2];
          }
        }
        timeRange = {
          earliest_time: earliestTime,
          latest_time: latestTime
        };
        searchBarControl.timerange.val(timeRange);
        return searchBarControl.val(searchString);
      }
    };
  });

}).call(this);
