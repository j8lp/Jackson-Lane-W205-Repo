(function() {
  define(["underscore", "splunkjs/mvc", "splunkjs/mvc/simpleform/formutils", "splunkjs/mvc/tokenutils"], function(_, mvc, FormUtils, TokenUtils) {
    var Forms, defaultTokenModel, submittedTokenModel;
    defaultTokenModel = mvc.Components.getInstance("default");
    submittedTokenModel = mvc.Components.getInstance("submitted");
    return Forms = (function() {
      function Forms() {}

      Forms.submitTokens = function() {
        return FormUtils.submitForm();
      };

      Forms.setToken = function(name, value) {
        defaultTokenModel.set(name, value);
        return submittedTokenModel.set(name, value);
      };

      Forms.getToken = function(name) {
        var value;
        value = defaultTokenModel.get(name);
        if (value == null) {
          value = submittedTokenModel.get(name);
        }
        return value;
      };

      Forms.parseTemplate = function(template) {
        var parsedTemplate, tokenNamespace, tokenRegistry;
        tokenRegistry = mvc.Components;
        tokenNamespace = "default";
        parsedTemplate = TokenUtils.replaceTokens(template, tokenRegistry, tokenNamespace);
        return parsedTemplate;
      };

      Forms.unsetToken = function(name) {
        defaultTokenModel.unset(name);
        return submittedTokenModel.unset(name);
      };

      Forms.escape = function(string) {
        var escapeFunction, escapedString;
        escapeFunction = TokenUtils.getEscaper("s");
        escapedString = escapeFunction(string);
        return escapedString;
      };

      Forms.clearChoiceView = function(choiceViewControl) {
        var settings;
        if (choiceViewControl != null) {
          settings = choiceViewControl.settings;
          if (settings != null) {
            return settings.unset("value");
          }
        }
      };

      Forms.clearChoiceViewOptions = function(choiceViewControl) {
        if (choiceViewControl != null) {
          choiceViewControl._data = [];
          return choiceViewControl.render();
        }
      };

      Forms.intersect = function(arrayA, arrayB) {
        var i, intersectionArray, intersectionSet, j, largerArray, len, len1, smallerArray, smallerArraySet, value;
        if (arrayB.length < arrayA.length) {
          largerArray = arrayA;
          smallerArray = arrayB;
        } else {
          largerArray = arrayB;
          smallerArray = arrayA;
        }
        smallerArraySet = {};
        for (i = 0, len = smallerArray.length; i < len; i++) {
          value = smallerArray[i];
          smallerArraySet[value] = true;
        }
        intersectionArray = [];
        intersectionSet = {};
        for (j = 0, len1 = largerArray.length; j < len1; j++) {
          value = largerArray[j];
          if ((smallerArraySet[value] != null) && (intersectionSet[value] == null)) {
            intersectionArray.push(value);
            intersectionSet[value] = true;
          }
        }
        return intersectionArray;
      };

      Forms.selectAllChoiceViewOptions = function(choiceViewControl) {
        var choices;
        if (choiceViewControl != null) {
          choices = this.getChoiceViewChoices(choiceViewControl);
          if (choices.length > 0) {
            return choiceViewControl.val(choices);
          }
        }
      };

      Forms.getChoiceViewChoices = function(choiceViewControl, skipSelected) {
        var choice, choices, selected;
        if (skipSelected == null) {
          skipSelected = false;
        }
        choices = [];
        if (choiceViewControl != null) {
          choices = (function() {
            var i, len, ref, results;
            ref = choiceViewControl.getDisplayedChoices();
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              choice = ref[i];
              results.push(choice.value);
            }
            return results;
          })();
          if (skipSelected) {
            selected = choiceViewControl.val();
            if (!_.isArray(selected)) {
              selected = [selected];
            }
            choices = _.difference(choices, selected);
          }
        }
        return choices;
      };

      Forms.setChoiceViewByLabel = function(choiceViewControl, label) {
        var choice, choices, i, len, value;
        if (choiceViewControl != null) {
          choices = choiceViewControl.getDisplayedChoices();
          value = null;
          for (i = 0, len = choices.length; i < len; i++) {
            choice = choices[i];
            if (choice.label === label) {
              value = choice.value;
            }
          }
          if (value != null) {
            return choiceViewControl.val(value);
          }
        }
      };

      Forms.getChoiceViewSearchBarMatch = function(choiceViewControl, searchBarControl) {
        var currentChoiceViewValue, currentSearchBarValue, matchingChoice;
        currentChoiceViewValue = choiceViewControl.val();
        currentSearchBarValue = searchBarControl.val();
        matchingChoice;
        if ((choiceViewControl._displayedChoices != null) && currentChoiceViewValue === currentSearchBarValue) {
          matchingChoice = _.first(_.partition(choiceViewControl._displayedChoices, function(choice) {
            return choice.value === currentChoiceViewValue;
          })[0]);
        }
        return matchingChoice;
      };

      return Forms;

    })();
  });

}).call(this);
