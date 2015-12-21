(function() {
  var slice = [].slice;

  require(["jquery", "underscore", "splunkjs/mvc", "splunkjs/mvc/dropdownview", "splunkjs/mvc/searchbarview", "splunkjs/mvc/searchcontrolsview", "splunkjs/mvc/textinputview", "splunkjs/mvc/checkboxview", "splunkjs/mvc/tableview", "splunkjs/mvc/simpleform/input/submit", "components/splunk/Searches", "components/splunk/Forms", "components/plots/PredictionPlot", "components/data/parameters/importSearchQuery", "components/controls/DrilldownLinker", "components/controls/Messages", "Options", "components/controls/SearchStringDisplay"], function($, _, mvc, DropdownView, SearchBarView, SearchControlsView, TextInputView, CheckboxView, TableView, SubmitButton, Searches, Forms, PredictionPlot, ImportSearchQuery, DrilldownLinker, Messages, Options, SearchStringDisplay) {
    var activatePredictionSearch, controlValidity, currentSampleSearch, disableSubmitControl, enableSubmitControl, futureTimespanControl, getControlValidity, hideErrorMessage, hideLoadingOverlay, hidePanels, holdbackControl, largeLoaderFontSize, periodCheckboxControl, periodValueControl, predictAlgorithmControl, predictFieldsControl, renderPredictionPlot, sampleSearches, sampleSearchesControl, searchBarControl, searchString, searchStringWithPeriod, setupPredictSearch, setupPredictWithPeriodSearch, setupPredictionFieldsSearch, setupSearchBarSearch, showErrorMessage, showLoadingOverlay, showPanels, smallLoaderFontSize, submitControl;
    smallLoaderFontSize = Options.getOptionByName("smallLoaderFontSize", 10);
    largeLoaderFontSize = Options.getOptionByName("largeLoaderFontSize", 24);
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
    searchString = "| loadjob $searchBarSearchJobIdToken$ " + "| predict $predictFieldsToken$ as prediction algorithm=$predictAlgorithmToken$ " + " future_timespan=$futureTimespanToken$ holdback=$holdbackToken$ ";
    searchStringWithPeriod = "| loadjob $searchBarSearchJobIdToken$ " + "| predict $predictFieldsToken$ as prediction algorithm=$predictAlgorithmToken$ " + " future_timespan=$futureTimespanToken$ holdback=$holdbackToken$ period=$periodValueToken$";
    sampleSearches = [
      {
        label: "Cow Milk Production Data",
        value: "| inputlookup milk.csv | timechart span=1mon values(milk_production) as milk_production ",
        fieldToPredict: "milk_production",
        algorithm: "LLP5",
        holdback: "24",
        futureTimespan: "24"
      }, {
        label: "Iron Production Data",
        value: "| inputlookup iron.csv | eval _time=strptime(month, \"%Y-%m-%d\") | timechart span=1mon values(iron_production) as iron_production ",
        fieldToPredict: "iron_production",
        algorithm: "LLT",
        holdback: "0",
        futureTimespan: "0"
      }
    ];
    currentSampleSearch = null;
    setupSearchBarSearch = function() {
      return Searches.setSearch("searchBarSearch", {
        targetJobIdTokenName: "searchBarSearchJobIdToken",
        onDoneCallback: function(searchManager) {
          var predictionFieldsSearch, search;
          hideErrorMessage();
          search = searchManager.search;
          DrilldownLinker.setTableViewQueryStringDrilldown("datasetPreviewPanel", search);
          predictionFieldsSearch = Searches.getSearchManager("predictionFieldsSearch");
          predictionFieldsSearch.startSearch();
          return enableSubmitControl();
        },
        onErrorCallback: function(errorMessage) {
          hideErrorMessage();
          Forms.clearChoiceViewOptions(predictFieldsControl);
          return showErrorMessage(errorMessage);
        }
      });
    };
    setupPredictionFieldsSearch = function() {
      return Searches.setSearch("predictionFieldsSearch", {
        searchString: "| loadjob $searchBarSearchJobIdToken$ | head 1 | transpose | fields column | search column != \"column\" AND column != \"_*\""
      });
    };
    setupPredictSearch = function() {
      return Searches.setSearch("predictSearch", {
        targetJobIdTokenName: "predictJobIdToken",
        searchString: searchString,
        onDoneCallback: function(searchManager) {
          var search, searchBarSearch, searchBarSearchString, searchStringArray;
          hideErrorMessage();
          hideLoadingOverlay("predictionPanel");
          showPanels();
          searchBarSearch = Searches.getSearchManager("searchBarSearch");
          searchBarSearchString = searchBarSearch.search.attributes.search;
          searchStringArray = searchManager.search.attributes.search.split(/(?=\|)/g);
          searchStringArray[0] = searchBarSearchString;
          searchString = searchStringArray.join('');
          search = DrilldownLinker.createSearch(searchString);
          return DrilldownLinker.setPlotQueryStringDrilldown("predictionPanel", search);
        },
        onDataCallback: function(data) {
          currentSampleSearch = null;
          return renderPredictionPlot(data);
        },
        onErrorCallback: function(errorMessage) {
          hideErrorMessage();
          hideLoadingOverlay("predictionPanel");
          hidePanels(2);
          return showErrorMessage(errorMessage);
        }
      });
    };
    setupPredictWithPeriodSearch = function() {
      return Searches.setSearch("predictWithPeriodSearch", {
        targetJobIdTokenName: "predictWithPeriodJobIdToken",
        searchString: searchStringWithPeriod,
        onDoneCallback: function(searchManager) {
          var search, searchBarSearch, searchBarSearchString, searchStringArray;
          hideErrorMessage();
          hideLoadingOverlay("predictionPanel");
          showPanels();
          searchBarSearch = Searches.getSearchManager("searchBarSearch");
          searchBarSearchString = searchBarSearch.search.attributes.search;
          searchStringArray = searchManager.search.attributes.search.split(/(?=\|)/g);
          searchStringArray[0] = searchBarSearchString;
          searchString = searchStringArray.join('');
          search = DrilldownLinker.createSearch(searchString);
          return DrilldownLinker.setPlotQueryStringDrilldown("predictionPanel", search);
        },
        onDataCallback: function(data) {
          currentSampleSearch = null;
          return renderPredictionPlot(data);
        },
        onErrorCallback: function(errorMessage) {
          hideErrorMessage();
          hideLoadingOverlay("predictionPanel");
          hidePanels(2);
          return showErrorMessage(errorMessage);
        }
      });
    };
    activatePredictionSearch = function() {
      var predictResultsSearchQueryArray, predictSearch, predictWithPeriodSearch, ref, searchBarSearch, searchBarSearchQuery, searchManager;
      if (!getControlValidity()) {
        return;
      }
      if ((typeof periodValueControl !== "undefined" && periodValueControl !== null) && (periodValueControl.val() != null)) {
        searchManager = Searches.getSearchManager("predictWithPeriodSearch");
        predictSearch = Searches.getSearchManager("predictSearch");
        if (predictSearch != null) {
          predictSearch.cancel();
        }
      } else {
        searchManager = Searches.getSearchManager("predictSearch");
        predictWithPeriodSearch = Searches.getSearchManager("predictWithPeriodSearch");
        if (predictWithPeriodSearch != null) {
          predictWithPeriodSearch.cancel();
        }
      }
      if (searchManager != null) {
        showLoadingOverlay();
        searchManager.startSearch();
        searchBarSearch = Searches.getSearchManager("searchBarSearch");
        if ((searchManager != null) && (searchBarSearch != null)) {
          searchBarSearchQuery = searchBarSearch.query.attributes.search;
          predictResultsSearchQueryArray = (ref = searchManager.query.attributes.search) != null ? ref.split(/(?=\|)/g) : void 0;
          if (predictResultsSearchQueryArray != null) {
            predictResultsSearchQueryArray[0] = searchBarSearchQuery;
            return SearchStringDisplay.set($('#searchStringDisplay'), predictResultsSearchQueryArray, slice.call(['prepare the input data by transforming it into a time series. Specify an appropriate "span" (bin size) for the data.']).concat(slice.call(['compute the predictions using the given parameters'])));
          }
        }
      }
    };
    sampleSearchesControl = (function() {
      var choice, choiceValueToSampleSearch, choices, i, label, len, sampleSearch, value;
      choiceValueToSampleSearch = {};
      choices = [];
      for (i = 0, len = sampleSearches.length; i < len; i++) {
        sampleSearch = sampleSearches[i];
        label = sampleSearch["label"];
        value = sampleSearch["value"];
        choiceValueToSampleSearch[value] = sampleSearch;
        choice = {
          "value": value,
          "label": label
        };
        choices.push(choice);
      }
      sampleSearchesControl = new DropdownView({
        "id": "sampleSearchesControl",
        "el": $("#sampleSearchesControl"),
        "labelField": "label",
        "valueField": "value",
        "choices": choices
      });
      sampleSearchesControl.on("change", function() {
        var algorithm, futureTimespan, holdback, period;
        value = sampleSearchesControl.val();
        searchBarControl.val(value);
        currentSampleSearch = choiceValueToSampleSearch[value];
        holdback = currentSampleSearch.holdback;
        futureTimespan = currentSampleSearch.futureTimespan;
        algorithm = currentSampleSearch.algorithm;
        if (currentSampleSearch.period != null) {
          period = currentSampleSearch.period;
          if ((typeof periodCheckboxControl !== "undefined" && periodCheckboxControl !== null) && (typeof periodValueControl !== "undefined" && periodValueControl !== null)) {
            periodCheckboxControl.val(true);
            periodValueControl.val(period);
          }
        } else {
          if ((typeof periodCheckboxControl !== "undefined" && periodCheckboxControl !== null) && (typeof periodValueControl !== "undefined" && periodValueControl !== null)) {
            periodCheckboxControl.val(false);
            periodValueControl.settings.set("disabled", true);
            periodValueControl.settings.unset("value");
          }
        }
        if (typeof holdbackControl !== "undefined" && holdbackControl !== null) {
          holdbackControl.val(holdback);
        }
        if (typeof futureTimespanControl !== "undefined" && futureTimespanControl !== null) {
          futureTimespanControl.val(futureTimespan);
        }
        if (typeof predictAlgorithmControl !== "undefined" && predictAlgorithmControl !== null) {
          return predictAlgorithmControl.val(algorithm);
        }
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
      searchBarControl.on("change", function() {
        var searchBarSearch, searchQuery;
        Forms.clearChoiceView(predictFieldsControl);
        Forms.unsetToken("predictFieldsToken");
        disableSubmitControl();
        searchQuery = searchBarControl.val();
        searchBarSearch = Searches.getSearchManager("searchBarSearch");
        searchBarSearch.settings.unset("search");
        searchBarSearch.settings.set("search", searchQuery);
        searchBarSearch.search.set(searchBarControl.timerange.val());
        return searchBarSearch.startSearch();
      });
      searchBarControl.render();
      searchControlsControl.render();
      return searchBarControl;
    })();
    predictFieldsControl = (function() {
      predictFieldsControl = new DropdownView({
        "id": "predictFieldsControl",
        "el": $("#predictFieldsControl"),
        "managerid": "predictionFieldsSearch",
        "labelField": "column",
        "valueField": "column"
      });
      predictFieldsControl.on("datachange", function() {
        var choices, fieldToPredict;
        if (currentSampleSearch != null) {
          fieldToPredict = currentSampleSearch.fieldToPredict;
          choices = Forms.getChoiceViewChoices(predictFieldsControl);
          if (choices.indexOf(fieldToPredict) >= 0) {
            return predictFieldsControl.val(fieldToPredict);
          }
        }
      });
      predictFieldsControl.on("change", function(value) {
        Forms.setToken("predictFieldsToken", value);
        return activatePredictionSearch();
      });
      predictFieldsControl.render();
      return predictFieldsControl;
    })();
    predictAlgorithmControl = (function() {
      predictAlgorithmControl = new DropdownView({
        "id": "predictAlgorithmControl",
        "el": $("#predictAlgorithmControl"),
        "labelField": "label",
        "valueField": "value",
        "selectFirstChoice": true,
        "showClearButton": false,
        "choices": [
          {
            "label": "LLP5 (combines LLT and LLP)",
            "value": "LLP5"
          }, {
            "label": "LL (local level)",
            "value": "LL"
          }, {
            "label": "LLP (seasonal local level)",
            "value": "LLP"
          }, {
            "label": "LLT (local level trend)",
            "value": "LLT"
          }
        ]
      });
      predictAlgorithmControl.on("change", function(value) {
        Forms.setToken("predictAlgorithmToken", value);
        return activatePredictionSearch();
      });
      predictAlgorithmControl.render();
      return predictAlgorithmControl;
    })();
    holdbackControl = (function() {
      holdbackControl = new TextInputView({
        id: 'holdbackControl',
        el: $('#holdbackControl')
      });
      holdbackControl.on('change', function(value) {
        var futureTimespan, holdback;
        holdback = parseInt(value, 10);
        if (isNaN(holdback) || holdback < 0) {
          controlValidity[holdbackControl.id] = false;
          return Messages.setTextInputMessage(this, 'Withhold value must be a positive integer.');
        } else {
          controlValidity[holdbackControl.id] = true;
          Messages.removeTextInputMessage(this);
          holdbackControl.val(holdback);
          Forms.setToken('holdbackToken', holdback);
          if (typeof futureTimespanControl !== "undefined" && futureTimespanControl !== null) {
            futureTimespan = parseInt(futureTimespanControl.val(), 10);
            if (!isNaN(futureTimespan) && futureTimespan >= 0) {
              Forms.setToken('futureTimespanToken', holdback + futureTimespan);
            }
          }
          return activatePredictionSearch();
        }
      });
      holdbackControl.settings.set("value", 0);
      holdbackControl.render();
      return holdbackControl;
    })();
    futureTimespanControl = (function() {
      futureTimespanControl = new TextInputView({
        id: 'futureTimespanControl',
        el: $('#futureTimespanControl')
      });
      futureTimespanControl.on('change', function(value) {
        var actualFutureTimespan, futureTimespan, holdback;
        futureTimespan = parseInt(value, 10);
        if (isNaN(futureTimespan) || futureTimespan < 0) {
          controlValidity[futureTimespanControl.id] = false;
          return Messages.setTextInputMessage(this, 'Forecast value must be a positive integer.');
        } else {
          controlValidity[futureTimespanControl.id] = true;
          Messages.removeTextInputMessage(this);
          futureTimespanControl.val(futureTimespan);
          if (holdbackControl != null) {
            holdback = parseInt(holdbackControl.val(), 10);
            if (!isNaN(holdback) && holdback >= 0) {
              actualFutureTimespan = futureTimespan + holdback;
              Forms.setToken('futureTimespanToken', actualFutureTimespan);
            }
          }
          return activatePredictionSearch();
        }
      });
      futureTimespanControl.settings.set("value", 0);
      futureTimespanControl.render();
      return futureTimespanControl;
    })();
    periodCheckboxControl = (function() {
      periodCheckboxControl = new CheckboxView({
        id: 'periodCheckboxControl',
        el: $('#periodCheckboxControl'),
        "default": false
      });
      periodCheckboxControl.on('change', function(value) {
        if (value === true) {
          return periodValueControl.settings.set("disabled", false);
        } else {
          periodValueControl.settings.set("disabled", true);
          periodValueControl.settings.unset("value");
          return activatePredictionSearch();
        }
      });
      periodCheckboxControl.render();
      return periodCheckboxControl;
    })();
    periodValueControl = (function() {
      periodValueControl = new TextInputView({
        id: 'periodValueControl',
        disabled: true,
        el: $('#periodValueControl')
      });
      periodValueControl.on('change', function(value) {
        var periodValue;
        periodValue = parseInt(value, 10);
        if (periodCheckboxControl.val() === true && (isNaN(periodValue) || periodValue <= 0)) {
          controlValidity[periodValueControl.id] = false;
          Messages.setTextInputMessage(this, 'Period value must be a positive integer.');
        } else {
          controlValidity[periodValueControl.id] = true;
          Messages.removeTextInputMessage(this);
        }
        periodValueControl.val(periodValue);
        Forms.setToken('periodValueToken', periodValue);
        return activatePredictionSearch();
      });
      periodValueControl.render();
      return periodValueControl;
    })();
    submitControl = (function() {
      submitControl = new SubmitButton({
        "id": "submitControl",
        "el": $("#submitControl")
      });
      submitControl.on("submit", function() {
        return Forms.submitTokens();
      });
      submitControl.render();
      return submitControl;
    })();
    renderPredictionPlot = (function() {
      var panel$El, plot;
      panel$El = $('#predictionPanel');
      plot = new PredictionPlot(panel$El);
      return function(data) {
        var chartFields, chartIndices, field, futurePoints, index, newRow, newRows, row, variableToPredict;
        if (data != null) {
          variableToPredict = predictFieldsControl.val();
          chartFields = ['_time', variableToPredict, 'prediction', 'lower95(prediction)', 'upper95(prediction)'];
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
          futurePoints = Forms.getToken('futureTimespanToken') || 0;
          return plot.setSeries(newRows, variableToPredict, futurePoints);
        }
      };
    })();
    enableSubmitControl = function() {
      var submitControlButton$El;
      submitControlButton$El = submitControl.$el.find("button");
      return submitControlButton$El.removeClass("disabled");
    };
    disableSubmitControl = function() {
      var submitControlButton$El;
      submitControlButton$El = submitControl.$el.find("button");
      return submitControlButton$El.addClass("disabled");
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
    hidePanels = function(index) {
      var i, len, results, row$El, rowId, rowIds;
      rowIds = ["row2", "row3", "row4"];
      if (!index) {
        results = [];
        for (i = 0, len = rowIds.length; i < len; i++) {
          rowId = rowIds[i];
          row$El = $("#" + rowId);
          results.push(row$El.hide());
        }
        return results;
      } else {
        row$El = $("#row" + index);
        return row$El.hide();
      }
    };
    showPanels = function() {
      var i, len, results, row$El, rowId, rowIds;
      rowIds = ["row2", "row3", "row4"];
      results = [];
      for (i = 0, len = rowIds.length; i < len; i++) {
        rowId = rowIds[i];
        row$El = $("#" + rowId);
        results.push(row$El.show());
      }
      return results;
    };
    showLoadingOverlay = function(panelIds) {
      var fontSize, i, len, panel$El, panelId, results;
      if (panelIds == null) {
        panelIds = ["predictionPanel"];
      }
      results = [];
      for (i = 0, len = panelIds.length; i < len; i++) {
        panelId = panelIds[i];
        panel$El = $("#" + panelId);
        fontSize = smallLoaderFontSize;
        if (panel$El != null) {
          if (panel$El.is("div")) {
            fontSize = largeLoaderFontSize;
          }
          results.push(panel$El.loader("show", "<i class=\"fa fa-2x fa-spinner fa-spin wobble-fix\" " + "style=\"font-size: " + fontSize + "pt;\"></i>"));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
    hideLoadingOverlay = function(panelId) {
      var panel$El;
      panel$El = $("#" + panelId);
      if (panel$El != null) {
        return panel$El.loader("hide");
      }
    };
    setupSearchBarSearch();
    setupPredictionFieldsSearch();
    setupPredictSearch();
    setupPredictWithPeriodSearch();
    return ImportSearchQuery(searchBarControl, sampleSearchesControl);
  });

}).call(this);
