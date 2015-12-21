(function() {
  require(["jquery", "splunkjs/mvc/searchbarview", "splunkjs/mvc/searchcontrolsview", "splunkjs/mvc/dropdownview", "splunkjs/mvc/multidropdownview", "splunkjs/mvc/simpleform/input/submit", "components/splunk/Forms", "components/splunk/Searches", "components/splunk/Components", "Options", "ColorPalette", "components/data/parameters/importSearchQuery", "components/controls/Slider", "components/controls/DrilldownLinker", "components/controls/Messages", "components/controls/Spinners"], function($, SearchBarView, SearchControlsView, DropdownView, MultiDropdownView, SubmitButton, Forms, Searches, Components, Options, ColorPalette, importSearchQuery, Slider, DrilldownLinker, Messages, Spinners) {
    var applyControl, baseSearchString, baseTimerange, currentSampleSearch, defaultModelName, defaultPanelIds, defaultTrainingSetFraction, disableApplyControl, disableFeaturesVariableControl, disableFitInSearchControl, disableSubmitControl, enableApplyControl, enableFeaturesVariableControl, enableFitInSearchControl, enableSubmitControl, featuresVariableControl, fitInSearchControl, hideErrorMessage, hideLoadingOverlay, hidePanels, largeLoaderFontSize, lastFeaturesVariableValue, modelNameInputControl$El, modelNamePrompt, panelLoaderTimeouts, readyForFit, renderConfusionMatrixCells, renderEvaluationStatisticsPanel, renderTrainingSetFractionSliderPanel, round, sampleSearches, sampleSearchesControl, searchBarControl, setupConfusionMatrixTablePostProcessing, setupConfusionMatrixTableTestSearch, setupDataLoaderSearch, setupEvaluationStatisticsTestSearch, setupFeaturesVariableSearch, setupSearchBarSearch, setupTargetVariableSearch, setupTestingSearch, setupTrainingSearch, showErrorMessage, showLoadingOverlay, showPanels, smallLoaderFontSize, submitControl, submitForm, targetVariableControl, updateSubmitControl;
    defaultTrainingSetFraction = Options.getOptionByName("defaultTrainingSetFraction", 0.8);
    modelNamePrompt = Options.getOptionByName("modelNamePrompt", "(optional)");
    defaultModelName = Options.getOptionByName("defaultModelName", "default_model_name");
    smallLoaderFontSize = Options.getOptionByName("smallLoaderFontSize", 10);
    largeLoaderFontSize = Options.getOptionByName("largeLoaderFontSize", 24);
    lastFeaturesVariableValue = null;
    baseSearchString = null;
    baseTimerange = null;
    currentSampleSearch = null;
    readyForFit = true;
    defaultPanelIds = ["precisionStatisticPanel", "recallStatisticPanel", "accuracyStatisticPanel", "fOneStatisticPanel", "classificationResultsPanel"];
    panelLoaderTimeouts = {};
    sampleSearches = [
      {
        label: "Churn",
        value: "| inputlookup churn.csv",
        targetVariable: "Churn?",
        featuresVariables: ["Day Mins", "Eve Mins", "Night Mins", "Night Charge", "Int'l Plan", "Intl Mins", "Intl Calls", "Intl Charge", "CustServ Calls", "VMail Plan"],
        modelName: "example_churn"
      }, {
        label: "Iris",
        value: "| inputlookup iris.csv",
        targetVariable: "species",
        featuresVariables: ["petal_length", "petal_width", "sepal_length", "sepal_width"],
        modelName: "example_iris"
      }, {
        label: "Diabetes",
        value: "| inputlookup diabetes.csv",
        targetVariable: "response",
        featuresVariables: ["number_pregnant", "glucose_concentration", "BMI", "diabetes_pedigree", "age", "blood_pressure"],
        modelName: "example_diabetes"
      }
    ];
    round = function(value) {
      value = Math.round(value * 100) / 100;
      return value;
    };
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
        searchString: "| loadjob $searchBarSearchJobIdToken$ | eval randomKey_ = random() | eval partitionKey_ = if(randomKey_ / 2147483647 > $trainingSetFractionToken$, 1, 0)",
        onDoneCallback: function(searchManager) {
          return setupTrainingSearch();
        }
      });
    };
    setupFeaturesVariableSearch = function() {
      return Searches.setSearch("featuresVariableSearch", {
        searchString: "| loadjob $searchBarSearchJobIdToken$ | head 1 | transpose | fields column | search column != \"column\" AND column != $classificationTargetToken|s$ AND (column != \"_*\" OR column = \"_time\")",
        onDoneCallback: function(searchManager) {
          return enableFeaturesVariableControl();
        }
      });
    };
    setupTrainingSearch = function() {
      return Searches.setSearch("trainingSearch", {
        targetJobIdTokenName: "trainingJobIdToken",
        searchString: "| loadjob $dataLoaderJobIdToken$ | search partitionKey_ = 0 | fields - randomKey_ partitionKey_ | fit LogisticRegressionWithSpark into $modelNameToken|s$ $classificationTargetToken|s$ from $classificationFeaturesToken$",
        onStartCallback: function() {
          showLoadingOverlay("classificationResultsPanel", largeLoaderFontSize);
          return showLoadingOverlay(["precisionStatisticPanel", "recallStatisticPanel", "accuracyStatisticPanel", "fOneStatisticPanel"], smallLoaderFontSize);
        },
        onDoneCallback: function(searchManager) {
          hideErrorMessage();
          enableApplyControl();
          enableFitInSearchControl();
          hideLoadingOverlay();
          return setupTestingSearch();
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
        onStartCallback: function() {
          showLoadingOverlay("classificationResultsPanel", largeLoaderFontSize);
          return showLoadingOverlay(["precisionStatisticPanel", "recallStatisticPanel", "accuracyStatisticPanel", "fOneStatisticPanel"], smallLoaderFontSize);
        },
        onDoneCallback: function(searchManager) {
          var jobId;
          jobId = searchManager.job.sid;
          DrilldownLinker.setTableViewLoadjobDrilldown("predictedDataSampleSnapshotPanel", jobId);
          hideLoadingOverlay();
          setupConfusionMatrixTableTestSearch();
          return setupEvaluationStatisticsTestSearch();
        },
        onErrorCallback: function(errorMessage) {
          showErrorMessage(errorMessage);
          return hidePanels();
        }
      });
    };
    setupConfusionMatrixTableTestSearch = function() {
      return Searches.setSearch("confusionMatrixTableTestSearch", {
        searchString: "| loadjob $testingJobIdToken$ | stats count by $classificationTargetToken|s$ $classificationPredictionToken|s$ | xyseries $classificationTargetToken|s$ $classificationPredictionToken|s$ count | rename * as \"Predicted *\" | rename \"Predicted $classificationTargetToken$\" as \"Actual $classificationTargetToken$\" | fillnull value=0",
        onStartCallback: function() {
          return showLoadingOverlay("classificationResultsPanel", largeLoaderFontSize);
        },
        onDoneCallback: function(searchManager) {
          var search, searchString;
          hideLoadingOverlay("classificationResultsPanel");
          searchString = baseSearchString + " | apply $modelNameToken|s$ | stats count by $classificationTargetToken|s$ $classificationPredictionToken|s$ | xyseries $classificationTargetToken|s$ $classificationPredictionToken|s$ count | rename * as \"Predicted *\" | rename \"Predicted $classificationTargetToken$\" as \"Actual $classificationTargetToken$\" | fillnull value=0";
          search = DrilldownLinker.createSearch(searchString, baseTimerange);
          return DrilldownLinker.setTableViewQueryStringDrilldown("classificationResultsPanel", search);
        },
        onErrorCallback: function(errorMessage) {
          showErrorMessage(errorMessage);
          return hidePanels();
        }
      });
    };
    setupEvaluationStatisticsTestSearch = function() {
      return Searches.setSearch("evaluationStatisticsTestSearch", {
        searchString: "| loadjob $testingJobIdToken$ | `classificationstatistics($classificationTargetToken|s$, $classificationPredictionToken|s$)`",
        onStartCallback: function() {
          return showLoadingOverlay(["precisionStatisticPanel", "recallStatisticPanel", "accuracyStatisticPanel", "fOneStatisticPanel"], smallLoaderFontSize);
        },
        onDoneCallback: function(searchManager) {
          var search, searchString;
          searchString = baseSearchString + " | apply $modelNameToken|s$ | `classificationstatistics($classificationTargetToken|s$, $classificationPredictionToken|s$)`";
          search = DrilldownLinker.createSearch(searchString, baseTimerange);
          DrilldownLinker.setDivValueQueryStringDrilldown("precisionStatisticPanel", search);
          DrilldownLinker.setDivValueQueryStringDrilldown("recallStatisticPanel", search);
          DrilldownLinker.setDivValueQueryStringDrilldown("accuracyStatisticPanel", search);
          return DrilldownLinker.setDivValueQueryStringDrilldown("fOneStatisticPanel", search);
        },
        onDataCallback: function(data) {
          renderEvaluationStatisticsPanel(data);
          return hideLoadingOverlay(["precisionStatisticPanel", "recallStatisticPanel", "accuracyStatisticPanel", "fOneStatisticPanel"]);
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
        Forms.unsetToken("classificationTargetToken");
        Forms.unsetToken("classificationFeaturesToken");
        Forms.unsetToken("classificationPredictionToken");
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
      var choice, choiceValueToSampleSearch, choices, j, label, len, sampleSearch, value;
      choiceValueToSampleSearch = {};
      choices = [];
      for (j = 0, len = sampleSearches.length; j < len; j++) {
        sampleSearch = sampleSearches[j];
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
        Forms.unsetToken("classificationFeaturesToken");
        Forms.unsetToken("classificationTargetToken");
        Forms.unsetToken("classificationPredictionToken");
        Forms.clearChoiceView(featuresVariableControl);
        value = targetVariableControl.val();
        if ((value != null) && value.length > 0) {
          Forms.setToken("classificationTargetToken", value);
          value = "predicted(" + value + ")";
          Forms.setToken("classificationPredictionToken", value);
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
          Forms.setToken("classificationFeaturesToken", value);
        } else {
          Forms.unsetToken("classificationFeaturesToken");
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
          modelNameInputControl$El.val(defaultModelName);
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
          searchString = baseSearchString + " " + "| fit LogisticRegressionWithSpark " + "$classificationTargetToken|s$ from $classificationFeaturesToken$";
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
      var j, len, results, row$El, rowId, rowIds;
      rowIds = ["row2"];
      results = [];
      for (j = 0, len = rowIds.length; j < len; j++) {
        rowId = rowIds[j];
        row$El = $("#" + rowId);
        results.push(row$El.hide());
      }
      return results;
    };
    showPanels = function() {
      var j, len, results, row$El, rowId, rowIds;
      rowIds = ["row2"];
      results = [];
      for (j = 0, len = rowIds.length; j < len; j++) {
        rowId = rowIds[j];
        row$El = $("#" + rowId);
        results.push(row$El.show());
      }
      return results;
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
    renderTrainingSetFractionSliderPanel = (function() {
      var defaultSliderValue, lastSliderValue, slider$El, sliderTokenName, sliderValue$El;
      sliderTokenName = "trainingSetFractionToken";
      defaultSliderValue = defaultTrainingSetFraction;
      lastSliderValue = defaultSliderValue;
      Forms.setToken(sliderTokenName, defaultSliderValue);
      slider$El = $("#trainingSetFractionSlider");
      sliderValue$El = $("#trainingSetFractionSliderValue");
      sliderValue$El.text(defaultSliderValue);
      return Slider.set(slider$El, sliderTokenName, 0.1, 0.9, defaultSliderValue, 0.1, (function(value) {
        return sliderValue$El.text(value);
      }), (function(value) {
        if (value !== lastSliderValue) {
          showLoadingOverlay("classificationResultsPanel", largeLoaderFontSize);
          showLoadingOverlay(["precisionStatisticPanel", "recallStatisticPanel", "accuracyStatisticPanel", "fOneStatisticPanel"], smallLoaderFontSize);
          setupDataLoaderSearch();
          return lastSliderValue = value;
        }
      }));
    })();
    renderEvaluationStatisticsPanel = (function() {
      return function(data) {
        var evaluationStatistics, fieldName, i, j, len, ref, ref1;
        evaluationStatistics = {
          precision: 0,
          recall: 0,
          accuracy: 0,
          f1: 0
        };
        if ((data.fields != null) && ((ref = data.rows) != null ? ref.length : void 0) > 0) {
          ref1 = data.fields;
          for (i = j = 0, len = ref1.length; j < len; i = ++j) {
            fieldName = ref1[i];
            evaluationStatistics[fieldName] = round(data.rows[0][i]);
          }
          $("#precisionStatisticPanel").text(evaluationStatistics.precision);
          $("#recallStatisticPanel").text(evaluationStatistics.recall);
          $("#accuracyStatisticPanel").text(evaluationStatistics.accuracy);
          return $("#fOneStatisticPanel").text(evaluationStatistics.f1);
        }
      };
    })();
    renderConfusionMatrixCells = function() {
      var confusionMatrixRows$El, rowCount;
      confusionMatrixRows$El = $("#classificationResultsPanel .shared-resultstable-resultstablerow");
      rowCount = confusionMatrixRows$El.length;
      return confusionMatrixRows$El.each(function(rowIndex) {
        var cell$El, cellCount, cellValue, confusionMatrixRow$El, confusionMatrixRowCells$El, index, total;
        confusionMatrixRow$El = $(this);
        confusionMatrixRowCells$El = confusionMatrixRow$El.children();
        cellCount = confusionMatrixRowCells$El.length;
        if (cellCount > 1) {
          index = 1;
          total = 0;
          while (index < cellCount) {
            cell$El = $(confusionMatrixRowCells$El[index]);
            cellValue = parseInt(cell$El.text());
            total = total + cellValue;
            index = index + 1;
          }
          return confusionMatrixRowCells$El.each(function(cellIndex) {
            var color, confusionMatrixCell$El, count, newValue, percentage;
            if (cellIndex < 1) {
              return;
            }
            confusionMatrixCell$El = $(this);
            count = parseInt(confusionMatrixCell$El.text());
            percentage = 0;
            if (total > 0) {
              percentage = count / total;
              color = ColorPalette.getGradientColor(37, 36, percentage);
              confusionMatrixCell$El.css("background-color", color);
              percentage = Math.round(percentage * 1000) / 10;
            }
            newValue = count + " (" + percentage + "%)";
            return confusionMatrixCell$El.text(newValue);
          });
        }
      });
    };
    setupConfusionMatrixTablePostProcessing = (function() {
      var tableComponent;
      tableComponent = Components.getComponent("classificationResultsPanel");
      return tableComponent.on("rendered", renderConfusionMatrixCells);
    })();
    setupSearchBarSearch();
    return importSearchQuery(searchBarControl, sampleSearchesControl);
  });

}).call(this);
