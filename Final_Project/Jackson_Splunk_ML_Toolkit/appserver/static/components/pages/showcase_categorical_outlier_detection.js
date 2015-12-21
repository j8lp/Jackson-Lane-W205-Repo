(function() {
  var slice = [].slice;

  require(["jquery", "underscore", "splunkjs/mvc", "splunkjs/mvc/tableview", "splunkjs/mvc/dropdownview", "splunkjs/mvc/multidropdownview", "splunkjs/mvc/searchbarview", "splunkjs/mvc/searchcontrolsview", "splunkjs/mvc/simpleform/input/submit", "components/splunk/Searches", "components/splunk/Forms", "components/data/parameters/importSearchQuery", "ColorPalette", "components/controls/DrilldownLinker", "components/controls/Messages", "Options", "components/controls/SearchStringDisplay"], function($, _, mvc, TableView, DropdownView, MultiDropdownView, SearchBarView, SearchControlsView, SubmitButton, Searches, Forms, ImportSearchQuery, ColorPalette, DrilldownLinker, Messages, Options, SearchStringDisplay) {
    var anomalyFieldsControl, currentSampleSearch, disableFieldsToPredictControl, disableSubmitControl, enableFieldsToPredictControl, enableSubmitControl, fieldsCache, hideErrorMessage, hideLoadingOverlay, highlightedTable, largeLoaderFontSize, outlierFieldIndexArray, sampleSearches, sampleSearchesControl, searchBarControl, setupAnomalousEventsCountSearch, setupAnomalyDetectionResultsCountSearch, setupAnomalyDetectionResultsSearch, setupAnomalyFieldsSearch, setupSearchBarSearch, showErrorMessage, showLoadingOverlay, smallLoaderFontSize, submitControl;
    smallLoaderFontSize = Options.getOptionByName("smallLoaderFontSize", 10);
    largeLoaderFontSize = Options.getOptionByName("largeLoaderFontSize", 24);
    outlierFieldIndexArray = Options.getOptionByName("outlierFieldIndexArray", []);
    fieldsCache = Options.getOptionByName("fieldsCache", []);
    sampleSearches = [
      {
        label: "Mortgage Loans Data - New York",
        value: "| inputlookup mortgage_loan_ny.csv",
        anomalyFields: ["Year", "Contract_interest_rate(%)", "Initial_fees_and_charges(%)", "Effective_interest_rate(%)", "Term_to_maturity", "Purchase_price", "Loan_to_price_ratio(%)", "Adjustable_rate_loans(%)"]
      }, {
        label: "Diabetic Data",
        value: "| inputlookup diabetic.csv | fields num_lab_procedures num_medications num_procedures number_diagnoses number_inpatient number_outpatient number_emergency",
        anomalyFields: ["num_lab_procedures", "num_medications", "num_procedures", "number_diagnoses", "number_inpatient", "number_outpatient", "number_emergency"]
      }, {
        label: "Congressional Voting Records",
        value: "| inputlookup vote.csv",
        anomalyFields: ["party", "handicapped-infants", "water-project-cost-sharing", "adoption-of-the-budget-resolution", "physician-fee-freeze", "el-salvador-aid", "religious-groups-in-schools", "anti-satellite-test-ban", "aid-to-nicaraguan-contras", "mx-missile", "immigration", "synfuels-corporation-cutback", "education-spending", "superfund-right-to-sue", "crime", "duty-free-exports", "export-administration-act-south-africa"]
      }
    ];
    currentSampleSearch = null;
    setupSearchBarSearch = function() {
      return Searches.setSearch("searchBarSearch", {
        targetJobIdTokenName: "searchBarSearchJobIdToken",
        onDoneCallback: function(searchManager) {
          var anomalyFieldsSearch, search;
          hideErrorMessage();
          search = searchManager.search;
          DrilldownLinker.setTableViewQueryStringDrilldown("datasetPreviewPanel", search);
          anomalyFieldsSearch = Searches.getSearchManager("anomalyFieldsSearch");
          return anomalyFieldsSearch.startSearch();
        },
        onErrorCallback: function(errorMessage) {
          hideErrorMessage();
          Forms.clearChoiceViewOptions(anomalyFieldsControl);
          return showErrorMessage(errorMessage);
        }
      });
    };
    setupAnomalyFieldsSearch = function() {
      return Searches.setSearch("anomalyFieldsSearch", {
        searchString: "| loadjob $searchBarSearchJobIdToken$ | head 1 | transpose | table column | search column != \"column\" AND column != \"_*\"",
        onDoneCallback: function() {
          return enableFieldsToPredictControl();
        }
      });
    };
    setupAnomalousEventsCountSearch = function() {
      return Searches.setSearch("anomalousEventsCountSearch", {
        targetJobIdTokenName: "anomalousEventsCountToken",
        searchString: "| loadjob $searchBarSearchJobIdToken$ | anomalydetection $anomalyFieldToken$ | stats count",
        onDataCallback: function(data) {
          return hideLoadingOverlay("single_outliers_panel");
        },
        onDoneCallback: function() {
          var search, searchBarSearch;
          searchBarSearch = Searches.getSearchManager("searchBarSearch");
          search = searchBarSearch.query.attributes.search + "| anomalydetection $anomalyFieldToken$";
          return DrilldownLinker.setSingleValueQueryStringDrilldown("single_outliers_panel", search);
        }
      });
    };
    setupAnomalyDetectionResultsSearch = function() {
      return Searches.setSearch("anomalyDetectionResultsSearch", {
        targetJobIdTokenName: "anomalyDetectionResultsToken",
        searchString: "| loadjob $searchBarSearchJobIdToken$ | anomalydetection $anomalyFieldToken$ action=annotate | eval isOutlier = if (probable_cause != \"\", \"1\", \"0\") | table  $anomalyFieldToken$, probable_cause, isOutlier | sort probable_cause",
        onDoneCallback: function() {
          var anomalyDetectionQuery, anomalyDetectionQueryArray, ref, searchBarSearch, searchBarSearchQuery, searchManager;
          searchManager = Searches.getSearchManager("anomalyDetectionResultsSearch");
          searchBarSearch = Searches.getSearchManager("searchBarSearch");
          if ((searchManager != null) && (searchBarSearch != null)) {
            searchBarSearchQuery = searchBarSearch.query.attributes.search;
            anomalyDetectionQueryArray = (ref = searchManager.query.attributes.search) != null ? ref.split(/(?=\|)/g) : void 0;
            if (anomalyDetectionQueryArray != null) {
              anomalyDetectionQueryArray[0] = searchBarSearchQuery;
              SearchStringDisplay.set($('#searchStringDisplay'), anomalyDetectionQueryArray, slice.call(['prepare the input data']).concat(slice.call(['compute the categorical outliers']), slice.call(['(optional) add a field to identify the outlier events']), slice.call(['(optional) remove fields added by this algorithm']), slice.call(['(optional) reorder the fields']), slice.call(['(optional) sort the results to make outlier events appear at the top'])));
              anomalyDetectionQuery = anomalyDetectionQueryArray.join('');
              return DrilldownLinker.setTableViewQueryStringDrilldown("anomaly_detection_results", anomalyDetectionQuery);
            }
          }
        }
      });
    };
    setupAnomalyDetectionResultsCountSearch = function() {
      return Searches.setSearch("anomalyDetectionResultsCountSearch", {
        targetJobIdTokenName: "anomalyDetectionResultsCountToken",
        searchString: "| loadjob $searchBarSearchJobIdToken$ | anomalydetection $anomalyFieldToken$ action=annotate | stats count",
        onDataCallback: function(data) {
          return hideLoadingOverlay("single_results_panel");
        },
        onDoneCallback: function() {
          var search, searchBarSearch;
          searchBarSearch = Searches.getSearchManager("searchBarSearch");
          search = searchBarSearch.query.attributes.search + "| anomalydetection $anomalyFieldToken$ action=annotate";
          return DrilldownLinker.setSingleValueQueryStringDrilldown("single_results_panel", search);
        }
      });
    };
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
      searchBarControl.on("change", function(value) {
        var searchBarSearch, searchQuery;
        Forms.clearChoiceView(anomalyFieldsControl);
        Forms.clearChoiceViewOptions(anomalyFieldsControl);
        Forms.unsetToken("anomalyFieldToken");
        disableSubmitControl();
        disableFieldsToPredictControl();
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
        value = sampleSearchesControl.val();
        currentSampleSearch = choiceValueToSampleSearch[value];
        return searchBarControl.val(value);
      });
      sampleSearchesControl.render();
      return sampleSearchesControl;
    })();
    anomalyFieldsControl = (function() {
      anomalyFieldsControl = new MultiDropdownView({
        "id": "anomalyFieldsControl",
        "managerid": "anomalyFieldsSearch",
        "el": $("#anomalyFieldsControl"),
        "labelField": "column",
        "valueField": "column",
        "width": 400
      });
      anomalyFieldsControl.on("datachange", function() {
        var anomalyFields, choices, validChoices;
        if ((anomalyFieldsControl._data == null) || anomalyFieldsControl._data.length === 0) {
          disableSubmitControl();
          disableFieldsToPredictControl();
        }
        if (currentSampleSearch != null) {
          anomalyFields = currentSampleSearch.anomalyFields;
          choices = Forms.getChoiceViewChoices(anomalyFieldsControl);
          validChoices = Forms.intersect(choices, anomalyFields);
          if (validChoices.length > 0) {
            anomalyFieldsControl.val(validChoices);
            return submitControl.trigger("submit");
          }
        }
      });
      anomalyFieldsControl.on("change", function(value) {
        if ((value != null) && value.length > 0) {
          Forms.setToken("anomalyFields", value);
          return enableSubmitControl();
        } else {
          return disableSubmitControl();
        }
      });
      anomalyFieldsControl.render();
      return anomalyFieldsControl;
    })();
    submitControl = (function() {
      var clearControl, clearControl$El, selectAllControl, selectAllControl$El;
      selectAllControl = new SubmitButton({
        "id": "selectAllControl",
        "el": $("#selectAllControl")
      });
      selectAllControl.on("submit", function() {
        return Forms.selectAllChoiceViewOptions(anomalyFieldsControl);
      });
      selectAllControl.render();
      selectAllControl$El = $("#selectAllControl button");
      selectAllControl$El.text("Select All Fields");
      clearControl = new SubmitButton({
        "id": "clearControl",
        "el": $("#clearControl")
      });
      clearControl.on("submit", function() {
        return Forms.clearChoiceView(anomalyFieldsControl);
      });
      clearControl.render();
      clearControl$El = $("#clearControl button");
      clearControl$El.text("Clear Fields");
      submitControl = new SubmitButton({
        "id": "submitControl",
        "el": $("#submitControl")
      });
      submitControl.on("submit", function() {
        var value, values;
        values = anomalyFieldsControl.val();
        value = values.join("\" \"");
        value = "\"" + value + "\"";
        if (value === "\"\"") {
          value = " ";
        }
        Forms.setToken("anomalyFieldToken", value);
        showLoadingOverlay();
        setupAnomalousEventsCountSearch();
        setupAnomalyDetectionResultsSearch();
        return setupAnomalyDetectionResultsCountSearch();
      });
      submitControl.render();
      return submitControl;
    })();
    enableSubmitControl = function() {
      var submitControlButton$El;
      submitControlButton$El = submitControl.$el.find("button");
      return submitControlButton$El.removeClass("disabled");
    };
    enableFieldsToPredictControl = function() {
      var clearControl$El, selectAllControl$El;
      selectAllControl$El = $("#selectAllControl button");
      selectAllControl$El.removeClass("disabled");
      clearControl$El = $("#clearControl button");
      return clearControl$El.removeClass("disabled");
    };
    disableSubmitControl = function() {
      var submitControlButton$El;
      submitControlButton$El = submitControl.$el.find("button");
      return submitControlButton$El.addClass("disabled");
    };
    disableFieldsToPredictControl = function() {
      var clearControlButton$El, selectAllControl$El;
      Forms.clearChoiceViewOptions(anomalyFieldsControl);
      clearControlButton$El = $("#clearControl button");
      clearControlButton$El.addClass("disabled");
      selectAllControl$El = $("#selectAllControl button");
      return selectAllControl$El.addClass("disabled");
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
    showLoadingOverlay = function(panelIds) {
      var fontSize, i, len, panel$El, panelId, results;
      if (panelIds == null) {
        panelIds = ["single_outliers_panel", "single_results_panel"];
      }
      results = [];
      for (i = 0, len = panelIds.length; i < len; i++) {
        panelId = panelIds[i];
        panel$El = $('#' + panelId);
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
      panel$El = $('#' + panelId);
      if (panel$El != null) {
        return panel$El.loader("hide");
      }
    };
    setupSearchBarSearch();
    setupAnomalyFieldsSearch();
    highlightedTable = TableView.BaseCellRenderer.extend({
      canRender: function(cell) {

        /* iterate all cells */
        return true;
      },
      render: function($td, cell) {
        fieldsCache.push(cell.field);
        if (cell.field === "probable_cause" && (cell.value != null)) {
          outlierFieldIndexArray.push(fieldsCache.indexOf(cell.value));
          $td.addClass('outlier-event string').css("font-weight", "bold");
        }
        $td.text(cell.value);
        if (cell.field === "isOutlier") {
          fieldsCache = [];
          if (cell.value === "1") {
            return $td.addClass('icon-inline string').html(_.template('<i class="icon-<%-icon%>" style="color: <%-color%>"></i> &#160 <%- text %>', {
              icon: 'alert',
              text: cell.value,
              color: ColorPalette.getColorByIndex(1)
            }));
          } else {
            return $td.addClass('icon-inline string').html(_.template('<i class="icon-<%-icon%>" style="color: <%-color%>"></i> &#160 <%- text %> ', {
              icon: 'check',
              text: cell.value,
              color: ColorPalette.getColorByIndex(7)
            }));
          }
        }
      }
    });
    mvc.Components.get('anomaly_detection_results').getVisualization(function(tableView) {

      /*Add custom cell renderer */
      var highlightRenderer;
      highlightRenderer = new highlightedTable();
      tableView.table.addCellRenderer(highlightRenderer);
      tableView.on('rendered', function() {
        tableView.$el.find('td.outlier-event.string').each(function(index) {
          var fieldIndex;
          if (outlierFieldIndexArray[index] != null) {
            fieldIndex = outlierFieldIndexArray[index];
            return $(this).parents('tr').find('td:eq(' + fieldIndex + ')').css("background-color", ColorPalette.getColorByIndex(1));
          }
        });
        return outlierFieldIndexArray = [];
      });
      return tableView.table.render();
    });
    return ImportSearchQuery(searchBarControl, sampleSearchesControl);
  });

}).call(this);
