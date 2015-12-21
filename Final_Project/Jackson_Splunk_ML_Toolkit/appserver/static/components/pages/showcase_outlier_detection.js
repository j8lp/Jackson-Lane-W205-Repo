(function() {
  var slice = [].slice;

  require(["jquery", "splunkjs/mvc", "splunkjs/mvc/searchbarview", "splunkjs/mvc/searchcontrolsview", "splunkjs/mvc/dropdownview", "splunkjs/mvc/textinputview", "splunkjs/mvc/checkboxview", "splunkjs/mvc/tableview", "splunkjs/mvc/simpleform/input/submit", "splunkjs/mvc/utils", "components/splunk/Forms", "components/splunk/Searches", "components/plots/OutliersPlot", "components/data/parameters/importSearchQuery", "components/controls/SearchStringDisplay", "components/controls/DrilldownLinker", "components/controls/Messages", "components/controls/Spinners"], function($, mvc, SearchBarView, SearchControlsView, DropdownView, TextInputView, CheckboxView, TableView, SubmitButton, utils, Forms, Searches, OutliersPlot, ImportSearchQuery, SearchStringDisplay, DrilldownLinker, Messages, Spinners) {
    var activateOutlierResultsSearch, controlValidity, createOutliersTable, currentSampleSearch, defaultTokenModel, getControlValidity, getCurrentSearchName, getFields, getFullSearchQueryArray, hideErrorMessage, outlierResultsSearchStringComments, outlierResultsSearchStrings, outlierSearchTypeControl, outlierVariableControl, outliersTable, renderOutliersPlot, sampleSearches, sampleSearchesControl, scaleFactorControl, searchBarControl, setupOutlierResultsSearches, setupOutlierVariableSearch, setupOutliersCountSearch, setupResultsCountSearch, setupSearchBarSearch, showErrorMessage, submitControl, windowSizeControl, windowedAnalysisCheckboxControl;
    defaultTokenModel = mvc.Components.getInstance('default');
    currentSampleSearch = null;
    controlValidity = {};
    getControlValidity = function() {
      var allValid, control, validity;
      allValid = true;
      for (control in controlValidity) {
        validity = controlValidity[control];
        allValid = validity && allValid;
      }
      return allValid;
    };

    /*
    the possible searches, one per analysis function
     */
    outlierResultsSearchStrings = {
      'outlierSearchTypeAvgStreamStats': "| streamstats window=$windowSizeToken$ avg($outlierVariableToken|s$) as avg stdev($outlierVariableToken|s$) as stdev | eval lowerBound=(avg-stdev*$scaleFactorToken$) | eval upperBound=(avg+stdev*$scaleFactorToken$)",
      'outlierSearchTypeMADStreamStats': "| streamstats window=$windowSizeToken$ median($outlierVariableToken|s$) as median | eval absDev=(abs('$outlierVariableToken$'-median)) | streamstats window=$windowSizeToken$ median(absDev) as medianAbsDev | eval lowerBound=(median-medianAbsDev*$scaleFactorToken$) | eval upperBound=(median+medianAbsDev*$scaleFactorToken$)",
      'outlierSearchTypeIQRStreamStats': "| streamstats window=$windowSizeToken$ median($outlierVariableToken|s$) as median p25($outlierVariableToken|s$) as p25 p75($outlierVariableToken|s$) as p75 | eval IQR=(p75-p25) | eval lowerBound=(median-IQR*$scaleFactorToken$) | eval upperBound=(median+IQR*$scaleFactorToken$)",
      'outlierSearchTypeAvgEventStats': "| eventstats avg($outlierVariableToken|s$) as avg stdev($outlierVariableToken|s$) as stdev | eval lowerBound=(avg-stdev*$scaleFactorToken$) | eval upperBound=(avg+stdev*$scaleFactorToken$)",
      'outlierSearchTypeMADEventStats': "| eventstats median($outlierVariableToken|s$) as median | eval absDev=(abs('$outlierVariableToken$'-median)) | eventstats median(absDev) as medianAbsDev | eval lowerBound=(median-medianAbsDev*$scaleFactorToken$) | eval upperBound=(median+medianAbsDev*$scaleFactorToken$)",
      'outlierSearchTypeIQREventStats': "| eventstats median($outlierVariableToken|s$) as median p25($outlierVariableToken|s$) as p25 p75($outlierVariableToken|s$) as p75 | eval IQR=(p75-p25) | eval lowerBound=(median-IQR*$scaleFactorToken$) | eval upperBound=(median+IQR*$scaleFactorToken$)"
    };

    /*
    descriptions of the searches; should map 1-to-1 with the pipes in outlierResultsSearchStrings
     */
    outlierResultsSearchStringComments = {
      'outlierSearchTypeAvgStreamStats': ['calculate the mean and standard deviation using a sliding window', 'calculate the upper bound as a multiple of the standard deviation', 'calculate the lower bound as a multiple of the standard deviation'],
      'outlierSearchTypeMADStreamStats': ['calculate the median value using a sliding window', 'calculate the absolute deviation of each value from the median', 'use the same sliding window to compute the median absolute deviation', 'calculate the upper bound as a multiple of the median absolute deviation', 'calculate the lower bound as a multiple of the median absolute deviation'],
      'outlierSearchTypeIQRStreamStats': ['calculate the first, second, and third quartiles using a sliding window', 'calculate the interquartile range', 'calculate the upper bound as a multiple of the interquartile range', 'calculate the lower bound as a multiple of the interquartile range'],
      'outlierSearchTypeAvgEventStats': ['calculate the mean and standard deviation', 'calculate the upper bound as a multiple of the standard deviation', 'calculate the lower bound as a multiple of the standard deviation'],
      'outlierSearchTypeMADEventStats': ['calculate the median', 'calculate the absolute deviation of each value from the median', 'use the same sliding window to compute the median absolute deviation', 'calculate the upper bound as a multiple of the median absolute deviation', 'calculate the lower bound as a multiple of the median absolute deviation'],
      'outlierSearchTypeIQREventStats': ['calculate the first, second, and third quartiles', 'calculate the interquartile range', 'calculate the upper bound as a multiple of the interquartile range', 'calculate the lower bound as a multiple of the interquartile range']
    };

    /*
    sample searches
     */
    sampleSearches = [
      {
        value: '| inputlookup hostperf.csv | eval _time=strptime(_time, "%Y-%m-%dT%H:%M:%S.%3Q%z") | timechart span=10m max(rtmax) as responsetime | head 1000',
        label: 'Server Response Time',
        outlierVariable: 'responsetime',
        outlierSearchType: 'outlierSearchTypeMAD',
        scaleFactor: 20,
        isWindowed: true,
        windowSize: 200
      }, {
        value: "| inputlookup housing.csv | fit LinearRegression MEDV from LSTAT, RM, PTRATIO, CHAS, CRIM | eval residual=MEDV-'predicted(MEDV)'",
        label: 'Housing (prediction errors)',
        outlierVariable: 'residual',
        outlierSearchType: 'outlierSearchTypeAvg',
        scaleFactor: 4,
        isWindowed: false
      }, {
        value: '| inputlookup housing.csv',
        label: 'Housing Crime Outliers',
        outlierVariable: 'CRIM',
        outlierSearchType: 'outlierSearchTypeAvg',
        scaleFactor: 5,
        isWindowed: false
      }, {
        value: "| inputlookup Batting.csv | search yearID >= 2000 | stats sum(R) as R, sum(AB) as AB, sum(H) as H, sum(2B) as doubles, sum(3B) as triples, sum(HR) as HR, sum(SB) as SB, sum(CS) as CS, sum(BB) as BB, sum(IBB) as IBB, sum(HBP) as HBP, sum(GIDP) as GIDP, sum(SH) as SH, sum(SF) as SF by teamID, yearID, lgID | eval singles=H-doubles - triples - HR, outs=AB-H | fit LinearRegression R from HR, singles, doubles, triples, SB, CS, BB, IBB, HBP, outs, GIDP into SplunkLR | eval residual=R-'predicted(R)'",
        label: 'Runs Scored',
        outlierVariable: 'residual',
        outlierSearchType: 'outlierSearchTypeAvg',
        scaleFactor: 3,
        isWindowed: false
      }
    ];
    setupSearchBarSearch = function() {
      return Searches.setSearch('searchBarSearch', {
        targetJobIdTokenName: 'searchBarSearchJobIdToken',
        onDoneCallback: function() {
          var outlierVariableSearch;
          hideErrorMessage();
          outlierVariableSearch = Searches.getSearchManager("outlierVariableSearch");
          return outlierVariableSearch.startSearch();
        },
        onErrorCallback: function(errorMessage) {
          hideErrorMessage();
          return showErrorMessage(errorMessage);
        }
      });
    };
    setupOutlierVariableSearch = function() {
      return Searches.setSearch("outlierVariableSearch", {
        searchString: "| loadjob $searchBarSearchJobIdToken$ " + "| head 1 " + "| transpose " + "| fields column " + "| search column != \"column\" AND column != \"_*\"",
        onDataCallback: function() {
          return console.log(arguments);
        }
      });
    };
    setupOutlierResultsSearches = function() {
      var baseSearchString, results, searchName, searchString, searchStringEnd;
      baseSearchString = "| loadjob $searchBarSearchJobIdToken$";
      searchStringEnd = "| eval isOutlier=if('$outlierVariableToken$' < lowerBound OR '$outlierVariableToken$' > upperBound, 1, 0)";
      results = [];
      for (searchName in outlierResultsSearchStrings) {
        searchString = outlierResultsSearchStrings[searchName];
        results.push(Searches.setSearch(searchName, {
          searchString: baseSearchString + searchString + searchStringEnd,
          targetJobIdTokenName: 'outlierResultsSearchToken',
          onDoneCallback: function() {
            Spinners.hideLoadingOverlay(['outliersPanel', 'single_outliers_panel', 'single_results_panel']);
            hideErrorMessage();
            return outliersTable.settings.set('fields', getFields());
          },
          onDataCallback: function(data) {
            return renderOutliersPlot(data);
          },
          onErrorCallback: function(errorMessage) {
            Spinners.hideLoadingOverlay(['outliersPanel', 'single_outliers_panel', 'single_results_panel']);
            hideErrorMessage();
            return showErrorMessage(errorMessage);
          }
        }));
      }
      return results;
    };
    activateOutlierResultsSearch = function() {
      var escapedFields, field, fields, filteredOutliersQuery, fullSearchQueryArray, newSearchName, searchManager, searchName, searchStatsType, searchString, searchType, sortedOutliersQuery;
      if (!getControlValidity()) {
        return;
      }
      currentSampleSearch = null;
      searchType = defaultTokenModel.get('outlierSearchTypeToken');
      searchStatsType = defaultTokenModel.get('windowedAnalysisToken');
      newSearchName = searchType + searchStatsType;
      for (searchName in outlierResultsSearchStrings) {
        searchString = outlierResultsSearchStrings[searchName];
        searchManager = Searches.getSearchManager(searchName);
        if (searchManager != null) {
          searchManager.cancel();
        }
      }
      searchManager = Searches.getSearchManager(newSearchName);
      if (searchManager != null) {
        createOutliersTable(searchManager.id);
        Spinners.showLoadingOverlay(['outliersPanel', 'single_outliers_panel', 'single_results_panel']);
        searchManager.startSearch();
        fullSearchQueryArray = getFullSearchQueryArray();
        if ((fullSearchQueryArray != null) && fullSearchQueryArray.length > 0) {
          fields = getFields();
          escapedFields = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = fields.length; i < len; i++) {
              field = fields[i];
              results.push(Forms.escape(field));
            }
            return results;
          })();
          sortedOutliersQuery = fullSearchQueryArray.concat('| fields ' + escapedFields.join(', ') + '| sort - isOutlier').join('');
          filteredOutliersQuery = fullSearchQueryArray.concat('| fields ' + escapedFields.join(', ') + '| where isOutlier=1').join('');
          DrilldownLinker.setPlotQueryStringDrilldown("outliersPanel", filteredOutliersQuery);
          DrilldownLinker.setSingleValueQueryStringDrilldown("single_outliers_panel", filteredOutliersQuery);
          DrilldownLinker.setQueryStringDrilldown($('#outliersTable').prev('h3'), sortedOutliersQuery);
          DrilldownLinker.setSingleValueQueryStringDrilldown("single_results_panel", sortedOutliersQuery);
          return SearchStringDisplay.set($('#searchStringDisplay'), fullSearchQueryArray, slice.call(['prepare the input data']).concat(slice.call(outlierResultsSearchStringComments[newSearchName]), slice.call(['values outside the bounds are outliers', 'use the "isOutlier" field to set up alerts, generate reports, etc.'])));
        }
      }
    };
    setupResultsCountSearch = function() {
      return Searches.setSearch("resultsCountSearch", {
        autostart: true,
        targetJobIdTokenName: "resultsCountSearchToken",
        searchString: "| loadjob $outlierResultsSearchToken$ | stats count",
        onStartCallback: function() {
          return Spinners.showLoadingOverlay(['single_outliers_panel', 'single_results_panel']);
        },
        onDoneCallback: function() {
          return Spinners.hideLoadingOverlay(['single_outliers_panel', 'single_results_panel']);
        }
      });
    };
    setupOutliersCountSearch = function() {
      return Searches.setSearch("outliersCountSearch", {
        autostart: true,
        targetJobIdTokenName: "outliersCountSearchToken",
        searchString: "| loadjob $outlierResultsSearchToken$ | where isOutlier=1 | stats count"
      });
    };
    getFields = function() {
      var newFields, otherVariables, timeIndex;
      otherVariables = Forms.getChoiceViewChoices(outlierVariableControl, true);
      timeIndex = otherVariables.indexOf('_time');
      newFields = [];
      if (timeIndex >= 0) {
        otherVariables.splice(timeIndex, 1);
        newFields.push('_time');
      }
      return newFields.concat(otherVariables, outlierVariableControl.val(), 'lowerBound', 'upperBound', 'isOutlier');
    };
    getCurrentSearchName = function() {
      return defaultTokenModel.get('outlierSearchTypeToken') + defaultTokenModel.get('windowedAnalysisToken');
    };
    getFullSearchQueryArray = function() {
      var outlierResultsSearchQuery, outlierResultsSearchQueryArray, searchBarSearch, searchBarSearchQuery, searchManager;
      outlierResultsSearchQueryArray = [];
      searchBarSearch = Searches.getSearchManager("searchBarSearch");
      searchManager = Searches.getSearchManager(getCurrentSearchName());
      if ((searchBarSearch != null) && (searchManager != null)) {
        searchBarSearchQuery = searchBarSearch.query.attributes.search;
        outlierResultsSearchQuery = searchManager.query.attributes.search;
        if ((searchBarSearchQuery != null) && (outlierResultsSearchQuery != null)) {
          outlierResultsSearchQueryArray = outlierResultsSearchQuery.split(/(?=\|)/g);
          outlierResultsSearchQueryArray[0] = searchBarSearchQuery;
        }
      }
      return outlierResultsSearchQueryArray;
    };
    showErrorMessage = function(errorMessage) {
      var errorDisplay$El;
      errorDisplay$El = $("#errorDisplay");
      return Messages.setAlert(errorDisplay$El, errorMessage, null, null, true);
    };
    hideErrorMessage = function() {
      var errorDisplay$El;
      errorDisplay$El = $("#errorDisplay");
      return Messages.removeAlert(errorDisplay$El, true);
    };
    sampleSearchesControl = (function() {
      var choice, choices, index, sampleSearch, sampleSearchLookup;
      sampleSearchLookup = {};
      choices = (function() {
        var i, len, results;
        results = [];
        for (index = i = 0, len = sampleSearches.length; i < len; index = ++i) {
          sampleSearch = sampleSearches[index];
          choice = {
            value: sampleSearch.value,
            label: sampleSearch.label
          };
          sampleSearchLookup[choice.value] = index;
          results.push(choice);
        }
        return results;
      })();
      sampleSearchesControl = new DropdownView({
        id: 'sampleSearchesControl',
        el: $('#sampleSearchesControl'),
        labelField: 'label',
        valueField: 'value',
        choices: choices
      });
      sampleSearchesControl.on("change", function(value) {
        currentSampleSearch = sampleSearches[sampleSearchLookup[value]];
        outlierSearchTypeControl.val(currentSampleSearch.outlierSearchType);
        scaleFactorControl.val(currentSampleSearch.scaleFactor);
        windowedAnalysisCheckboxControl.val(currentSampleSearch.isWindowed);
        if (currentSampleSearch.windowSize) {
          windowSizeControl.val(currentSampleSearch.windowSize);
        }
        return searchBarControl.val(currentSampleSearch.value);
      });
      sampleSearchesControl.render();
      return sampleSearchesControl;
    })();
    searchBarControl = (function() {
      var searchControlsControl;
      searchBarControl = new SearchBarView({
        "id": "searchBarControl",
        "managerid": "searchBarSearch",
        "el": $("#searchBarControl"),
        "autoOpenAssistant": false
      });
      searchControlsControl = new SearchControlsView({
        "id": "searchControlsControl",
        "managerid": "searchBarSearch",
        "el": $("#searchControlsControl")
      });
      searchBarControl.on("change", function(searchQuery) {
        var searchBarSearch;
        $("#searchBarControl textarea").keyup();
        outlierVariableControl.settings.unset("value");
        searchBarSearch = Searches.getSearchManager("searchBarSearch");
        searchBarSearch.settings.unset("search");
        searchBarSearch.settings.set("search", searchQuery);
        searchBarSearch.search.set(searchBarControl.timerange.val());
        return searchBarSearch.startSearch();
      });
      searchControlsControl.render();
      searchBarControl.render();
      return searchBarControl;
    })();
    outlierVariableControl = (function() {
      outlierVariableControl = new DropdownView({
        "id": "outlierVariableControl",
        "managerid": "outlierVariableSearch",
        "el": $("#outlierVariableControl"),
        "labelField": "column",
        "valueField": "column",
        showClearButton: false
      });
      outlierVariableControl.on('datachange', function() {
        var choices;
        if (currentSampleSearch != null) {
          choices = Forms.getChoiceViewChoices(outlierVariableControl);
          if (choices.indexOf(currentSampleSearch.outlierVariable) >= 0) {
            return outlierVariableControl.val(currentSampleSearch.outlierVariable);
          }
        }
      });
      outlierVariableControl.on("change", function(value) {
        Forms.setToken("outlierVariableToken", value);
        if (value != null) {
          return activateOutlierResultsSearch();
        }
      });
      outlierVariableControl.render();
      return outlierVariableControl;
    })();
    outlierSearchTypeControl = (function() {
      outlierSearchTypeControl = new DropdownView({
        id: 'outlierSearchTypeControl',
        el: $('#outlierSearchTypeControl'),
        labelField: 'label',
        valueField: 'value',
        selectFirstChoice: true,
        showClearButton: false,
        choices: [
          {
            value: 'outlierSearchTypeAvg',
            label: 'Standard Deviation'
          }, {
            value: 'outlierSearchTypeMAD',
            label: 'Median Absolute Deviation'
          }, {
            value: 'outlierSearchTypeIQR',
            label: 'Interquartile Range'
          }
        ]
      });
      outlierSearchTypeControl.on("change", function(value) {
        Forms.setToken("outlierSearchTypeToken", value);
        if (currentSampleSearch == null) {
          return activateOutlierResultsSearch();
        }
      });
      outlierSearchTypeControl.render();
      return outlierSearchTypeControl;
    })();
    windowSizeControl = (function() {
      windowSizeControl = new TextInputView({
        id: 'windowSizeControl',
        el: $('#windowSizeControl')
      });
      controlValidity[windowSizeControl.id] = false;
      windowSizeControl.on('change', function(value) {
        var numValue;
        numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) {
          controlValidity[windowSizeControl.id] = false;
          return Messages.setTextInputMessage(this, 'number of samples must be a positive integer.');
        } else {
          controlValidity[windowSizeControl.id] = true;
          Messages.removeTextInputMessage(this);
          Forms.setToken('windowSizeToken', value);
          if (currentSampleSearch == null) {
            return activateOutlierResultsSearch();
          }
        }
      });
      windowSizeControl.render();
      windowSizeControl.val('100');
      return windowSizeControl;
    })();
    windowedAnalysisCheckboxControl = (function() {
      windowedAnalysisCheckboxControl = new CheckboxView({
        id: 'windowedAnalysisCheckboxControl',
        el: $('#windowedAnalysisCheckboxControl'),
        value: true
      });
      windowedAnalysisCheckboxControl.on('change', function(isWindowed) {
        Forms.setToken('windowedAnalysisToken', isWindowed ? 'StreamStats' : 'EventStats');
        windowSizeControl.settings.set("disabled", !isWindowed);
        if (currentSampleSearch == null) {
          return activateOutlierResultsSearch();
        }
      });
      windowedAnalysisCheckboxControl.render();
      return windowedAnalysisCheckboxControl;
    })();
    scaleFactorControl = (function() {
      scaleFactorControl = new TextInputView({
        id: 'scaleFactorControl',
        el: $('#scaleFactorControl')
      });
      controlValidity[scaleFactorControl.id] = false;
      scaleFactorControl.on('change', function(value) {
        var numValue;
        numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
          controlValidity[scaleFactorControl.id] = false;
          return Messages.setTextInputMessage(this, 'Multiplier must be a number greater than zero.');
        } else {
          controlValidity[scaleFactorControl.id] = true;
          Messages.removeTextInputMessage(this);
          Forms.setToken('scaleFactorToken', value);
          if (currentSampleSearch == null) {
            return activateOutlierResultsSearch();
          }
        }
      });
      scaleFactorControl.render();
      scaleFactorControl.val('2');
      return scaleFactorControl;
    })();
    submitControl = (function() {
      submitControl = new SubmitButton({
        "id": "submitControl",
        "el": $("#submitControl")
      });
      submitControl.on("submit", function() {
        activateOutlierResultsSearch();
        return Forms.submitTokens();
      });
      submitControl.render();
      return submitControl;
    })();
    renderOutliersPlot = (function() {
      var panel$El, plot;
      panel$El = $('#outliersPanel');
      plot = new OutliersPlot(panel$El, {
        legendAlign: 'bottom'
      });
      return function(data) {
        var chartFields, chartIndices, field, index, newRow, newRows, outlierVariable, row;
        if (data != null) {
          outlierVariable = outlierVariableControl.val();
          chartFields = ['_time', outlierVariable, 'lowerBound', 'upperBound', 'isOutlier'];
          chartIndices = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = chartFields.length; i < len; i++) {
              field = chartFields[i];
              results.push(data.fields.indexOf(field));
            }
            return results;
          })();
          newRows = (function() {
            var i, len, ref, results;
            ref = data.rows;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              row = ref[i];
              results.push(newRow = (function() {
                var j, len1, results1;
                results1 = [];
                for (j = 0, len1 = chartIndices.length; j < len1; j++) {
                  index = chartIndices[j];
                  results1.push(row[index]);
                }
                return results1;
              })());
            }
            return results;
          })();
          return plot.setSeries(newRows, outlierVariable, {
            onClick: function() {
              var point, ref, search, searchQuery, searchString, searchUrl, yValue;
              point = this;
              if (!isNaN(point.y) && ((ref = point.marker) != null ? ref.enabled : void 0)) {
                searchQuery = getFullSearchQueryArray().join('');
                yValue = point.originalY != null ? Forms.escape(point.originalY) : Forms.escape(point.y);
                searchString = searchQuery + ' | search $outlierVariableToken|s$=' + yValue;
                search = DrilldownLinker.createSearch(searchString);
                searchUrl = DrilldownLinker.getSearchUrl(search);
                return window.open(searchUrl, "_blank");
              }
            }
          });
        }
      };
    })();
    outliersTable = createOutliersTable = function(managerId) {
      var tableId;
      tableId = 'outliersTable';
      outliersTable = mvc.Components.getInstance(tableId);
      if (outliersTable == null) {
        outliersTable = new TableView({
          id: tableId,
          el: $('#outliersTable'),
          sortKey: 'isOutlier',
          sortDirection: 'desc'
        });
      }
      outliersTable.settings.set('managerid', managerId);
      return outliersTable;
    };
    setupSearchBarSearch();
    setupOutlierVariableSearch();
    setupOutlierResultsSearches();
    setupResultsCountSearch();
    setupOutliersCountSearch();
    return ImportSearchQuery(searchBarControl, sampleSearchesControl);
  });

}).call(this);
