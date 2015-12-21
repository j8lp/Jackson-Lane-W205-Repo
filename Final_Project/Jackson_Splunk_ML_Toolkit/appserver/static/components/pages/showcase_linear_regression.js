(function() {
  require(["jquery", "splunkjs/mvc/searchbarview", "splunkjs/mvc/searchcontrolsview", "splunkjs/mvc/dropdownview", "splunkjs/mvc/multidropdownview", "splunkjs/mvc/simpleform/input/submit", "components/splunk/Forms", "components/splunk/Searches", "Options", "components/data/parameters/importSearchQuery", "components/data/formatters/formatHistogramData", "components/data/formatters/formatScatterData", "components/data/formatters/formatLinesData", "components/data/formatters/getFieldFromData", "components/controls/Slider", "components/controls/DrilldownLinker", "components/controls/Messages", "components/controls/Spinners", "components/plots/HistogramPlot", "components/plots/ScatterLinePlot", "components/plots/LinesPlot"], function($, SearchBarView, SearchControlsView, DropdownView, MultiDropdownView, SubmitButton, Forms, Searches, Options, importSearchQuery, formatHistogramData, formatScatterData, formatLinesData, getFieldFromData, Slider, DrilldownLinker, Messages, Spinners, HistogramPlot, ScatterLinePlot, LinesPlot) {
    var applyControl, baseSearchString, baseTimerange, currentSampleSearch, defaultHistogramBinCount, defaultModelName, defaultPanelIds, disableApplyControl, disableFeaturesVariableControl, disableFitInSearchControl, disableSubmitControl, enableApplyControl, enableFeaturesVariableControl, enableFitInSearchControl, enableSubmitControl, featuresVariableControl, fitInSearchControl, hideErrorMessage, hideLoadingOverlay, hidePanels, largeLoaderFontSize, lastFeaturesVariableValue, modelNameInputControl$El, modelNamePrompt, panelLoaderTimeouts, readyForFit, renderActualPredictedLinesPanel, renderActualVsPredictedScatterLinePanel, renderResidualsHistogramPanel, renderResidualsLinePanel, renderStatisticPanel, renderTrainingSetFractionSliderPanel, sampleSearches, sampleSearchesControl, searchBarControl, setupActualPredictedTrainingLinesSearch, setupActualVsPredictedTrainingScatterSearch, setupDataLoaderSearch, setupFeaturesVariableSearch, setupFitSummaryTrainingTableSearch, setupR2StatisticTrainingSearch, setupResidualsTrainingHistogramSearch, setupResidualsTrainingLineSearch, setupRootMeanSquaredErrorStatisticTrainingSearch, setupSearchBarSearch, setupTargetVariableSearch, setupTestingSearch, setupTrainingSearch, showErrorMessage, showLoadingOverlay, showPanels, smallLoaderFontSize, submitControl, submitForm, targetVariableControl, updateSubmitControl;
    defaultHistogramBinCount = Options.getOptionByName("defaultHistogramBinCount", 10);
    modelNamePrompt = Options.getOptionByName("modelNamePrompt", "(optional)");
    defaultModelName = Options.getOptionByName("defaultModelName", "default_model_name");
    smallLoaderFontSize = Options.getOptionByName("smallLoaderFontSize", 10);
    largeLoaderFontSize = Options.getOptionByName("largeLoaderFontSize", 24);
    lastFeaturesVariableValue = null;
    baseSearchString = null;
    baseTimerange = null;
    currentSampleSearch = null;
    readyForFit = false;
    defaultPanelIds = ["actualVsPredictedScatterLinePanel", "residualsHistogramPanel", "r2StatisticPanel", "rootMeanSquaredErrorStatisticPanel", "actualPredictedLinesPanel", "residualsLinePanel"];
    panelLoaderTimeouts = {};
    sampleSearches = [
      {
        label: "Housing",
        value: "| inputlookup housing.csv",
        targetVariable: "MEDV",
        featuresVariables: ["LSTAT", "RM", "PTRATIO", "CHAS", "CRIM"],
        modelName: "example_housing"
      }, {
        label: "Runs Scored",
        value: "| inputlookup Batting.csv | where yearID >= 2000 | stats sum(R) as R, sum(AB) as AB, sum(H) as H, sum(2B) as doubles, sum(3B) as triples, sum(HR) as HR, sum(SB) as SB, sum(CS) as CS, sum(BB) as BB, sum(IBB) as IBB, sum(HBP) as HBP, sum(GIDP) as GIDP, sum(SH) as SH, sum(SF) as SF by teamID, yearID, lgID | eval singles=H-doubles - triples - HR, outs=AB-H",
        targetVariable: "R",
        featuresVariables: ["doubles", "triples", "HR", "SB", "CS", "BB", "IBB", "HBP", "GIDP", "SH", "SF", "singles", "outs"],
        modelName: "example_runs_scored"
      }, {
        label: "App Usage",
        value: "| inputlookup Apps.csv",
        targetVariable: "RemoteAccess",
        featuresVariables: ["CRM", "HR1(View Only)", "Webmail", "CloudDrive"],
        modelName: "example_app_usage"
      }
    ];
    setupSearchBarSearch = function() {
      return Searches.setSearch("searchBarSearch", {
        targetJobIdTokenName: "searchBarSearchJobIdToken",
        onDoneCallback: function(searchManager) {
          var search;
          hideErrorMessage();
          search = searchManager.search;
          DrilldownLinker.setTableViewQueryStringDrilldown("datasetPreviewPanel", search);
          return setupTargetVariableSearch();
        },
        onErrorCallback: function(errorMessage) {
          Forms.clearChoiceViewOptions(targetVariableControl);
          showErrorMessage(errorMessage);
          return hidePanels();
        }
      });
    };
    setupTargetVariableSearch = function() {
      return Searches.setSearch("targetVariableSearch", {
        searchString: "| loadjob $searchBarSearchJobIdToken$ | head 1 | transpose | fields column | search column != \"column\" AND column != \"_*\"",
        onDoneCallback: function(searchManager) {
          return setupDataLoaderSearch();
        }
      });
    };
    setupDataLoaderSearch = function() {
      return Searches.setSearch("dataLoaderSearch", {
        targetJobIdTokenName: "dataLoaderJobIdToken",
        searchString: "| loadjob $searchBarSearchJobIdToken$ | eval randomKey_ = random() | eval partitionKey_ = if(randomKey_ / 2147483647 > $trainingSetFractionToken$, 1, 0)"
      });
    };
    setupFeaturesVariableSearch = function() {
      return Searches.setSearch("featuresVariableSearch", {
        searchString: "| loadjob $searchBarSearchJobIdToken$ | head 1 | transpose | fields column | search column != \"column\" AND column != $regressionTargetToken|s$ AND (column != \"_*\" OR column = \"_time\")",
        onDoneCallback: function(searchManager) {
          return enableFeaturesVariableControl();
        }
      });
    };
    setupTrainingSearch = function() {
      return Searches.setSearch("trainingSearch", {
        targetJobIdTokenName: "trainingJobIdToken",
        searchString: "| loadjob $dataLoaderJobIdToken$ | search partitionKey_ = 0 | fields - randomKey_ partitionKey_ | fit LinearRegression into $modelNameToken|s$ $regressionTargetToken|s$ from $regressionFeaturesToken$",
        onDoneCallback: function(searchManager) {
          var search, searchString;
          hideErrorMessage();
          searchString = baseSearchString + " | apply $modelNameToken|s$";
          search = DrilldownLinker.createSearch(searchString, baseTimerange);
          DrilldownLinker.setTableViewQueryStringDrilldown("fittedDataSampleSnapshotPanel", search);
          enableApplyControl();
          enableFitInSearchControl();
          setupActualVsPredictedTrainingScatterSearch();
          setupActualPredictedTrainingLinesSearch();
          setupResidualsTrainingLineSearch();
          setupResidualsTrainingHistogramSearch();
          setupFitSummaryTrainingTableSearch();
          setupR2StatisticTrainingSearch();
          return setupRootMeanSquaredErrorStatisticTrainingSearch();
        },
        onErrorCallback: function(errorMessage) {
          showErrorMessage(errorMessage);
          return hidePanels();
        }
      });
    };
    setupTestingSearch = function() {
      return Searches.setSearch("testingSearch", {
        targetJobIdTokenName: "testingJobIdToken",
        searchString: "| loadjob $dataLoaderJobIdToken$ | search partitionKey_ = 1 | fields - randomKey_ partitionKey_ | apply $modelNameToken|s$",
        onErrorCallback: function(errorMessage) {
          showErrorMessage(errorMessage);
          return hidePanels();
        }
      });
    };
    setupActualVsPredictedTrainingScatterSearch = function() {
      return Searches.setSearch("actualVsPredictedTrainingScatterSearch", {
        searchString: "| loadjob $trainingJobIdToken$ | fields $regressionTargetToken|s$ $regressionPredictionToken|s$ | rename $regressionTargetToken|s$ as actual | rename $regressionPredictionToken|s$ as predicted",
        onStartCallback: function() {
          return showLoadingOverlay("actualVsPredictedScatterLinePanel", largeLoaderFontSize);
        },
        onDoneCallback: function(searchManager) {
          var search, searchString;
          hideLoadingOverlay("actualVsPredictedScatterLinePanel");
          searchString = baseSearchString + " | apply $modelNameToken|s$ | fields $regressionTargetToken|s$ $regressionPredictionToken|s$ | rename $regressionTargetToken|s$ as actual | rename $regressionPredictionToken|s$ as predicted";
          search = DrilldownLinker.createSearch(searchString, baseTimerange);
          return DrilldownLinker.setPlotQueryStringDrilldown("actualVsPredictedScatterLinePanel", search);
        },
        onDataCallback: function(data) {
          return renderActualVsPredictedScatterLinePanel(data);
        },
        onErrorCallback: function(errorMessage) {
          showErrorMessage(errorMessage);
          return hidePanels();
        }
      });
    };
    setupActualPredictedTrainingLinesSearch = function() {
      return Searches.setSearch("actualPredictedTrainingLinesSearch", {
        searchString: "| loadjob $trainingJobIdToken$ | table $regressionTargetToken|s$ $regressionPredictionToken|s$ | rename $regressionTargetToken|s$ as actual | rename $regressionPredictionToken|s$ as predicted ",
        onStartCallback: function() {
          return showLoadingOverlay("actualPredictedLinesPanel", largeLoaderFontSize);
        },
        onDoneCallback: function(searchManager) {
          var search, searchString;
          hideLoadingOverlay("actualPredictedLinesPanel");
          searchString = baseSearchString + " | apply $modelNameToken|s$ | fields $regressionTargetToken|s$ $regressionPredictionToken|s$ | rename $regressionTargetToken|s$ as actual | rename $regressionPredictionToken|s$ as predicted";
          search = DrilldownLinker.createSearch(searchString, baseTimerange);
          return DrilldownLinker.setPlotQueryStringDrilldown("actualPredictedLinesPanel", search);
        },
        onDataCallback: function(data) {
          return renderActualPredictedLinesPanel(data);
        },
        onErrorCallback: function(errorMessage) {
          showErrorMessage(errorMessage);
          return hidePanels();
        }
      });
    };
    setupResidualsTrainingLineSearch = function() {
      return Searches.setSearch("residualsTrainingLineSearch", {
        searchString: "| loadjob $trainingJobIdToken$ | eval residual_ = '$regressionTargetToken$' - '$regressionPredictionToken$' | table residual_ | rename residual_ as residual",
        onStartCallback: function() {
          return showLoadingOverlay("residualsLinePanel", largeLoaderFontSize);
        },
        onDoneCallback: function(searchManager) {
          var search, searchString;
          hideLoadingOverlay("residualsLinePanel");
          searchString = baseSearchString + " | apply $modelNameToken|s$ | eval residual = '$regressionTargetToken$' - '$regressionPredictionToken$' | fields residual";
          search = DrilldownLinker.createSearch(searchString, baseTimerange);
          return DrilldownLinker.setPlotQueryStringDrilldown("residualsLinePanel", search);
        },
        onDataCallback: function(data) {
          return renderResidualsLinePanel(data);
        },
        onErrorCallback: function(errorMessage) {
          showErrorMessage(errorMessage);
          return hidePanels();
        }
      });
    };
    setupResidualsTrainingHistogramSearch = function() {
      return Searches.setSearch("residualsTrainingHistogramSearch", {
        searchString: "| loadjob $trainingJobIdToken$ | eval residual = '$regressionTargetToken$' - '$regressionPredictionToken$' | eventstats min(residual) as minResidual, max(residual) as maxResidual | eval span = (maxResidual - minResidual) / $histogramBucketCountToken$ | eval bucket = floor((residual - minResidual) / span) | eventstats max(bucket) as maxBucket | eval bucket = if(bucket = maxBucket, bucket - 1, bucket) | eval bucket = bucket * span + minResidual + span / 2 | stats avg(bucket) as value, count(bucket) as count, min(residual) as minResidual, max(residual) as maxResidual by bucket | sort + bucket",
        onStartCallback: function() {
          return showLoadingOverlay("residualsHistogramPanel", largeLoaderFontSize);
        },
        onDoneCallback: function(searchManager) {
          var resultCount, search, searchString;
          hideLoadingOverlay("residualsHistogramPanel");
          resultCount = Searches.getResultCount(searchManager);
          if ((resultCount == null) || resultCount === 0) {
            renderResidualsHistogramPanel();
          }
          searchString = baseSearchString + " | apply $modelNameToken|s$ | eval residual = '$regressionTargetToken$' - '$regressionPredictionToken$' | eventstats min(residual) as minResidual, max(residual) as maxResidual | eval span = (maxResidual - minResidual) / $histogramBucketCountToken$ | eval bucket = floor((residual - minResidual) / span) | eventstats max(bucket) as maxBucket | eval bucket = if(bucket = maxBucket, bucket - 1, bucket) | eval bucket = bucket * span + minResidual + span / 2 | stats avg(bucket) as value, count(bucket) as count, min(residual) as minResidual, max(residual) as maxResidual by bucket | sort + bucket";
          search = DrilldownLinker.createSearch(searchString, baseTimerange);
          return DrilldownLinker.setPlotQueryStringDrilldown("residualsHistogramPanel", search);
        },
        onDataCallback: function(data) {
          return renderResidualsHistogramPanel(data);
        },
        onErrorCallback: function(errorMessage) {
          showErrorMessage(errorMessage);
          return hidePanels();
        }
      });
    };
    setupFitSummaryTrainingTableSearch = function() {
      return Searches.setSearch("fitSummaryTrainingTableSearch", {
        searchString: "| summary $modelNameToken|s$ | table * | fields feature coefficient | rename feature as \"Prediction Feature\" | rename coefficient as \"Linear Regression Coefficient\"",
        onDoneCallback: function(searchManager) {
          var search;
          search = searchManager.search;
          return DrilldownLinker.setTableViewQueryStringDrilldown("fitModelParametersSummaryPanel", search);
        },
        onErrorCallback: function(errorMessage) {
          showErrorMessage(errorMessage);
          return hidePanels();
        }
      });
    };
    setupR2StatisticTrainingSearch = function() {
      return Searches.setSearch("r2StatisticTrainingSearch", {
        searchString: "| loadjob $trainingJobIdToken$ | eventstats avg($regressionTargetToken$) as averageObservation_ | eval observationMinusAverageObservation_ = '$regressionTargetToken$' - averageObservation_ | eval predictionMinusAverageObservation_ = '$regressionPredictionToken$' - averageObservation_ | stats sumsq(observationMinusAverageObservation_) as observationMinusAverageObservationSumSq_, sumsq(predictionMinusAverageObservation_) as predictionMinusAverageObservationSumSq_ | eval result = predictionMinusAverageObservationSumSq_ / observationMinusAverageObservationSumSq_ | fieldformat result = tostring(round(result * 10) / 10, \"commas\")",
        onStartCallback: function() {
          return showLoadingOverlay("r2StatisticPanel", smallLoaderFontSize);
        },
        onDoneCallback: function(searchManager) {
          var search, searchString;
          hideLoadingOverlay("r2StatisticPanel");
          searchString = baseSearchString + " | apply $modelNameToken|s$ | eventstats avg($regressionTargetToken$) as averageObservation_ | eval observationMinusAverageObservation_ = '$regressionTargetToken$' - averageObservation_ | eval predictionMinusAverageObservation_ = '$regressionPredictionToken$' - averageObservation_ | stats sumsq(observationMinusAverageObservation_) as observationMinusAverageObservationSumSq_, sumsq(predictionMinusAverageObservation_) as predictionMinusAverageObservationSumSq_ | eval result = predictionMinusAverageObservationSumSq_ / observationMinusAverageObservationSumSq_ | fieldformat result = tostring(round(result * 10) / 10, \"commas\")";
          search = DrilldownLinker.createSearch(searchString, baseTimerange);
          return DrilldownLinker.setDivValueQueryStringDrilldown("r2StatisticPanel", search);
        },
        onDataCallback: function(data) {
          return renderStatisticPanel(data, "result", "r2StatisticPanel");
        },
        onErrorCallback: function(errorMessage) {
          showErrorMessage(errorMessage);
          return hidePanels();
        }
      });
    };
    setupRootMeanSquaredErrorStatisticTrainingSearch = function() {
      return Searches.setSearch("rootMeanSquaredErrorStatisticTrainingSearch", {
        searchString: "| loadjob $trainingJobIdToken$ | eval residual_ = '$regressionTargetToken$' - '$regressionPredictionToken$' | stats sumsq(residual_) as residualSumSq_, count(residual_) as sampleCount_ | eval result = sqrt(residualSumSq_ / sampleCount_) | fieldformat result = tostring(result, \"commas\")",
        onStartCallback: function() {
          return showLoadingOverlay("rootMeanSquaredErrorStatisticPanel", smallLoaderFontSize);
        },
        onDoneCallback: function(searchManager) {
          var search, searchString;
          hideLoadingOverlay("rootMeanSquaredErrorStatisticPanel");
          searchString = baseSearchString + " | apply $modelNameToken|s$ | eval residual_ = '$regressionTargetToken$' - '$regressionPredictionToken$' | stats sumsq(residual_) as residualSumSq_, count(residual_) as sampleCount_ | eval result = sqrt(residualSumSq_ / sampleCount_) | fieldformat result = tostring(result, \"commas\")";
          search = DrilldownLinker.createSearch(searchString, baseTimerange);
          return DrilldownLinker.setDivValueQueryStringDrilldown("rootMeanSquaredErrorStatisticPanel", search);
        },
        onDataCallback: function(data) {
          return renderStatisticPanel(data, "result", "rootMeanSquaredErrorStatisticPanel");
        },
        onErrorCallback: function(errorMessage) {
          showErrorMessage(errorMessage);
          return hidePanels();
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
      searchBarControl.on("change", function() {
        var searchBarSearch;
        $("#searchBarControl textarea").keyup();
        hideErrorMessage();
        hidePanels();
        lastFeaturesVariableValue = null;
        Forms.clearChoiceView(targetVariableControl);
        Forms.clearChoiceView(featuresVariableControl);
        Forms.unsetToken("regressionTargetToken");
        Forms.unsetToken("regressionFeaturesToken");
        Forms.unsetToken("regressionPredictionToken");
        disableApplyControl();
        disableFitInSearchControl();
        disableSubmitControl();
        baseSearchString = searchBarControl.val();
        searchBarSearch = Searches.getSearchManager("searchBarSearch");
        searchBarSearch.settings.unset("search");
        searchBarSearch.settings.set("search", baseSearchString);
        baseTimerange = searchBarControl.timerange.val();
        searchBarSearch.search.set(baseTimerange);
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
        if (currentSampleSearch.modelName != null) {
          modelNameInputControl$El.setValue(currentSampleSearch.modelName);
        }
        return searchBarControl.val(value);
      });
      sampleSearchesControl.render();
      return sampleSearchesControl;
    })();
    targetVariableControl = (function() {
      targetVariableControl = new DropdownView({
        "id": "targetVariableControl",
        "managerid": "targetVariableSearch",
        "el": $("#targetVariableControl"),
        "labelField": "column",
        "valueField": "column"
      });
      targetVariableControl.on("datachange", function() {
        var choices, targetVariable;
        if (currentSampleSearch != null) {
          targetVariable = currentSampleSearch.targetVariable;
          choices = Forms.getChoiceViewChoices(targetVariableControl);
          if (choices.indexOf(targetVariable) >= 0) {
            return targetVariableControl.val(targetVariable);
          }
        }
      });
      targetVariableControl.on("change", function() {
        var value;
        disableApplyControl();
        disableFitInSearchControl();
        disableSubmitControl();
        Forms.unsetToken("regressionFeaturesToken");
        Forms.unsetToken("regressionTargetToken");
        Forms.unsetToken("regressionPredictionToken");
        Forms.clearChoiceView(featuresVariableControl);
        value = targetVariableControl.val();
        if ((value != null) && value.length > 0) {
          Forms.setToken("regressionTargetToken", value);
          value = "predicted(" + value + ")";
          Forms.setToken("regressionPredictionToken", value);
          return setupFeaturesVariableSearch();
        } else {
          return disableFeaturesVariableControl();
        }
      });
      targetVariableControl.render();
      return targetVariableControl;
    })();
    featuresVariableControl = (function() {
      var featuresVariableClearControl, featuresVariableClearControl$El, featuresVariableSelectAllControl, featuresVariableSelectAllControl$El;
      featuresVariableControl = new MultiDropdownView({
        "id": "featuresVariableControl",
        "managerid": "featuresVariableSearch",
        "el": $("#featuresVariableControl"),
        "labelField": "column",
        "valueField": "column",
        "width": 400
      });
      featuresVariableControl.on("datachange", function() {
        var choices, featuresVariables, validChoices;
        if (currentSampleSearch != null) {
          featuresVariables = currentSampleSearch.featuresVariables;
          choices = Forms.getChoiceViewChoices(featuresVariableControl);
          validChoices = Forms.intersect(choices, featuresVariables);
          if (validChoices.length > 0) {
            featuresVariableControl.val(validChoices);
            return submitControl.trigger("submit");
          }
        }
      });
      featuresVariableControl.on("change", function() {
        var value, values;
        disableApplyControl();
        disableFitInSearchControl();
        Forms.unsetToken("modelNameToken");
        values = featuresVariableControl.val();
        if ((values != null) && values.length > 0) {
          value = values.join("\" \"");
          value = "\"" + value + "\"";
          Forms.setToken("regressionFeaturesToken", value);
        } else {
          Forms.unsetToken("regressionFeaturesToken");
          Forms.clearChoiceView(featuresVariableControl);
        }
        return updateSubmitControl();
      });
      featuresVariableControl.render();
      featuresVariableSelectAllControl = new SubmitButton({
        "id": "featuresVariableSelectAllControl",
        "el": $("#featuresVariableSelectAllControl")
      });
      featuresVariableSelectAllControl.on("submit", function() {
        return Forms.selectAllChoiceViewOptions(featuresVariableControl);
      });
      featuresVariableSelectAllControl.render();
      featuresVariableSelectAllControl$El = $("#featuresVariableSelectAllControl button");
      featuresVariableSelectAllControl$El.addClass("disabled");
      featuresVariableSelectAllControl$El.text("Select All Fields");
      featuresVariableClearControl = new SubmitButton({
        "id": "featuresVariableClearControl",
        "el": $("#featuresVariableClearControl")
      });
      featuresVariableClearControl.on("submit", function() {
        return Forms.clearChoiceView(featuresVariableControl);
      });
      featuresVariableClearControl.render();
      featuresVariableClearControl$El = $("#featuresVariableClearControl button");
      featuresVariableClearControl$El.addClass("disabled");
      featuresVariableClearControl$El.text("Clear Fields");
      return featuresVariableControl;
    })();
    updateSubmitControl = function() {
      var changed, featuresVariableValue, modelNameInputControl$El, modelNameValue, ready;
      changed = false;
      ready = 2;
      featuresVariableValue = featuresVariableControl.val();
      if ((featuresVariableValue != null) && featuresVariableValue.length > 0) {
        ready = ready - 1;
        featuresVariableValue = featuresVariableValue.join("\t");
        if (featuresVariableValue !== lastFeaturesVariableValue) {
          changed = true;
        }
      }
      modelNameInputControl$El = $("#modelNameInputControl");
      modelNameValue = modelNameInputControl$El.val();
      if ((modelNameValue != null) && modelNameValue.length > 0) {
        ready = ready - 1;
        if (modelNameValue !== modelNameInputControl$El.data('previousValue')) {
          changed = true;
        }
      }
      if (ready === 0 && changed) {
        return enableSubmitControl();
      } else {
        disableSubmitControl();
        return Forms.unsetToken("modelNameToken");
      }
    };
    submitControl = (function() {
      var submitControl$El;
      submitControl = new SubmitButton({
        "id": "submitControl",
        "el": $("#submitControl")
      });
      submitControl.on("submit", function() {
        return submitForm();
      });
      submitControl.render();
      submitControl$El = $("#submitControl button");
      submitControl$El.text("Fit Model");
      return submitControl;
    })();
    modelNameInputControl$El = (function() {
      var eventNames;
      modelNameInputControl$El = $("#modelNameInputControl");
      eventNames = "propertychange change keyup input paste";
      modelNameInputControl$El.on("focus", function() {
        var value;
        modelNameInputControl$El.css("color", "black");
        value = modelNameInputControl$El.val();
        if (value === modelNamePrompt) {
          return modelNameInputControl$El.setValue("");
        }
      });
      modelNameInputControl$El.css("color", "gray");
      modelNameInputControl$El.setValue(modelNamePrompt);
      modelNameInputControl$El.on(eventNames, function(event) {
        var value;
        value = modelNameInputControl$El.val();
        if (value !== modelNameInputControl$El.data('currentValue')) {
          modelNameInputControl$El.setValue(value);
          disableApplyControl();
          disableFitInSearchControl();
          updateSubmitControl();
        }
        if (event.type === 'keyup' && event.keyCode === 13) {
          return submitForm();
        }
      });
      return modelNameInputControl$El;
    })();
    submitForm = function() {
      var featuresVariableValue, modelNameValue;
      if (readyForFit) {
        currentSampleSearch = null;
        hideErrorMessage();
        showPanels();
        featuresVariableValue = featuresVariableControl.val();
        featuresVariableValue = featuresVariableValue.join("\t");
        lastFeaturesVariableValue = featuresVariableValue;
        modelNameInputControl$El = $("#modelNameInputControl");
        modelNameValue = modelNameInputControl$El.val();
        if (modelNameValue === modelNamePrompt) {
          modelNameInputControl$El.setValue(defaultModelName);
          modelNameInputControl$El.css("color", "black");
          modelNameValue = defaultModelName;
        }
        Forms.setToken("modelNameToken", modelNameValue);
        Forms.setToken("showResultPanelsToken", "true");
        disableSubmitControl();
        return setupTrainingSearch();
      }
    };
    enableFeaturesVariableControl = function() {
      var featuresVariableClearControl$El, featuresVariableSelectAllControl$El;
      featuresVariableSelectAllControl$El = $("#featuresVariableSelectAllControl button");
      featuresVariableClearControl$El = $("#featuresVariableClearControl button");
      featuresVariableSelectAllControl$El.removeClass("disabled");
      return featuresVariableClearControl$El.removeClass("disabled");
    };
    disableFeaturesVariableControl = function() {
      var featuresVariableClearControl$El, featuresVariableSelectAllControl$El;
      Forms.clearChoiceViewOptions(featuresVariableControl);
      featuresVariableSelectAllControl$El = $("#featuresVariableSelectAllControl button");
      featuresVariableClearControl$El = $("#featuresVariableClearControl button");
      featuresVariableSelectAllControl$El.addClass("disabled");
      return featuresVariableClearControl$El.addClass("disabled");
    };
    enableApplyControl = function() {
      var applyControlButton$El;
      applyControlButton$El = applyControl.$el.find("button");
      return applyControlButton$El.removeClass("disabled");
    };
    disableApplyControl = function() {
      var applyControlButton$El;
      applyControlButton$El = applyControl.$el.find("button");
      return applyControlButton$El.addClass("disabled");
    };
    enableFitInSearchControl = function() {
      var fitInSearchControlButton$El;
      fitInSearchControlButton$El = fitInSearchControl.$el.find("button");
      return fitInSearchControlButton$El.removeClass("disabled");
    };
    disableFitInSearchControl = function() {
      var fitInSearchControlButton$El;
      fitInSearchControlButton$El = fitInSearchControl.$el.find("button");
      return fitInSearchControlButton$El.addClass("disabled");
    };
    enableSubmitControl = function() {
      var submitControlButton$El;
      submitControlButton$El = submitControl.$el.find("button");
      submitControlButton$El.removeClass("disabled");
      return readyForFit = true;
    };
    disableSubmitControl = function() {
      var submitControlButton$El;
      submitControlButton$El = submitControl.$el.find("button");
      submitControlButton$El.addClass("disabled");
      return readyForFit = false;
    };
    applyControl = (function() {
      var applyControl$El;
      applyControl = new SubmitButton({
        "id": "applyControl",
        "el": $("#applyControl")
      });
      applyControl.on("submit", function() {
        var modelName, queryString, searchString;
        modelName = modelNameInputControl$El.val();
        searchString = searchBarControl.val();
        if ((modelName != null) && modelName.length > 0 && (searchString != null) && searchString.length > 0) {
          queryString = searchString + "| apply \"" + modelName + "\"";
          queryString = encodeURIComponent(queryString);
          queryString = "search?q=" + queryString;
          return window.open(queryString, "_blank");
        }
      });
      applyControl.render();
      applyControl$El = $("#applyControl button");
      applyControl$El.text("Apply Model in Search");
      return applyControl;
    })();
    fitInSearchControl = (function() {
      var fitInSearchControl$El;
      fitInSearchControl = new SubmitButton({
        "id": "fitInSearchControl",
        "el": $("#fitInSearchControl")
      });
      fitInSearchControl.on("submit", function() {
        var queryString, searchString;
        baseSearchString = searchBarControl.val();
        if ((baseSearchString != null) && baseSearchString.length > 0) {
          searchString = baseSearchString + " " + "| fit LinearRegression " + "$regressionTargetToken|s$ from $regressionFeaturesToken$";
          queryString = Forms.parseTemplate(searchString);
          queryString = encodeURIComponent(queryString);
          queryString = "search?q=" + queryString;
          return window.open(queryString, "_blank");
        }
      });
      fitInSearchControl.render();
      fitInSearchControl$El = $("#fitInSearchControl button");
      fitInSearchControl$El.text("Fit Model in Search");
      return fitInSearchControl;
    })();
    hidePanels = function() {
      var i, len, results1, row$El, rowId, rowIds;
      rowIds = ["row2", "row3", "row4"];
      results1 = [];
      for (i = 0, len = rowIds.length; i < len; i++) {
        rowId = rowIds[i];
        row$El = $("#" + rowId);
        results1.push(row$El.hide());
      }
      return results1;
    };
    showPanels = function() {
      var i, len, results1, row$El, rowId, rowIds;
      rowIds = ["row2", "row3", "row4"];
      results1 = [];
      for (i = 0, len = rowIds.length; i < len; i++) {
        rowId = rowIds[i];
        row$El = $("#" + rowId);
        results1.push(row$El.show());
      }
      return results1;
    };
    showLoadingOverlay = function(panelIds, fontSize) {
      if (panelIds == null) {
        panelIds = defaultPanelIds;
      }
      return Spinners.showLoadingOverlay(panelIds, fontSize);
    };
    hideLoadingOverlay = function(panelIds) {
      if (panelIds == null) {
        panelIds = defaultPanelIds;
      }
      return Spinners.hideLoadingOverlay(panelIds);
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
    renderActualPredictedLinesPanel = (function() {
      var panel$El, plot;
      panel$El = $("#actualPredictedLinesPanel");
      plot = new LinesPlot(panel$El, "", "", true);
      return function(data) {
        var formattedData;
        formattedData = formatLinesData(data);
        return plot.setSeries(formattedData.seriesList, ["Actual", "Predicted"]);
      };
    })();
    renderResidualsLinePanel = (function() {
      var panel$El, plot;
      panel$El = $("#residualsLinePanel");
      plot = new LinesPlot(panel$El, "", "", true);
      return function(data) {
        var formattedData;
        if (data != null) {
          formattedData = formatLinesData(data);
          return plot.setSeries(formattedData.seriesList, ["Residual"]);
        }
      };
    })();
    renderActualVsPredictedScatterLinePanel = (function() {
      var panel$El, plot;
      panel$El = $("#actualVsPredictedScatterLinePanel");
      plot = new ScatterLinePlot(panel$El, "Actual", "Predicted");
      return function(data) {
        var formattedData, options;
        if (data != null) {
          formattedData = formatScatterData(data, "actual", "predicted");
          options = {
            "minDataValue": formattedData.minDataValue,
            "maxDataValue": formattedData.maxDataValue,
            "onClick": function() {
              var actualValue, point, predictedValue, search, searchString, searchUrl;
              point = this;
              actualValue = point.originalX != null ? Forms.escape(point.originalX) : Forms.escape(point.x);
              predictedValue = point.originalX != null ? Forms.escape(point.originalY) : Forms.escape(point.y);
              searchString = baseSearchString + " " + "| apply $modelNameToken|s$ " + "| search $regressionTargetToken|s$=" + actualValue + " " + "$regressionPredictionToken|s$=" + predictedValue;
              search = DrilldownLinker.createSearch(searchString, baseTimerange);
              searchUrl = DrilldownLinker.getSearchUrl(search);
              return window.open(searchUrl, "_blank");
            }
          };
          return plot.setSeries(formattedData.points, options);
        }
      };
    })();
    renderResidualsHistogramPanel = (function() {
      var defaultSliderValue, lastSliderValue, panel$El, plot, slider$El, sliderContainer$El, sliderTokenName, sliderValue$El;
      sliderTokenName = "histogramBucketCountToken";
      defaultSliderValue = defaultHistogramBinCount;
      lastSliderValue = defaultSliderValue;
      Forms.setToken(sliderTokenName, defaultSliderValue);
      slider$El = $("#residualsHistogramBinCountSizeSlider");
      sliderValue$El = $("#residualsHistogramBinCountSizeSliderValue");
      sliderValue$El.text(defaultSliderValue);
      sliderContainer$El = $("#residualsHistogramBinControlContainer");
      Slider.set(slider$El, sliderTokenName, 1, 20, defaultSliderValue, 1, (function(value) {
        return sliderValue$El.text(value);
      }), (function(value) {
        if (value !== lastSliderValue) {
          setupResidualsTrainingHistogramSearch();
          return lastSliderValue = value;
        }
      }));
      panel$El = $("#residualsHistogramPanel");
      plot = new HistogramPlot(panel$El, "Residual Error", "Sample Count");
      return function(data) {
        var formattedData;
        if (data != null) {
          sliderContainer$El.show();
          formattedData = formatHistogramData(data, "bucket", "count", "value", "minResidual", "maxResidual");
          return plot.setSeries(formattedData.points, formattedData.minValue, formattedData.maxValue, formattedData.totalCount, formattedData.maxBucketCount);
        } else {
          sliderContainer$El.hide();
          return plot.setMessage("No residual error");
        }
      };
    })();
    renderTrainingSetFractionSliderPanel = (function() {
      var defaultSliderValue, slider$El, sliderTokenName, sliderValue$El;
      sliderTokenName = "trainingSetFractionToken";
      defaultSliderValue = 1.0;
      Forms.setToken(sliderTokenName, defaultSliderValue);
      slider$El = $("#trainingSetFractionSlider");
      return sliderValue$El = $("#trainingSetFractionSliderValue");
    })();
    renderStatisticPanel = function(data, fieldName, panelId) {
      var result, results;
      results = getFieldFromData(data, fieldName);
      result = 0;
      if (results.length > 0) {
        result = results[0];
      }
      return $("#" + panelId).text(result);
    };
    setupSearchBarSearch();
    return importSearchQuery(searchBarControl, sampleSearchesControl);
  });

}).call(this);
