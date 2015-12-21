(function() {
  define(["components/splunk/Forms"], function(Forms) {
    var Slider;
    return Slider = (function() {
      function Slider() {}

      Slider.set = function(container$El, tokenName, minimumValue, maximumValue, initialValue, increment, slideCallback, changeCallback) {
        if (slideCallback == null) {
          slideCallback = null;
        }
        if (changeCallback == null) {
          changeCallback = null;
        }
        container$El.slider({
          value: initialValue,
          min: minimumValue,
          max: maximumValue,
          step: increment,
          slide: function(event, ui) {
            if (slideCallback != null) {
              return slideCallback(ui.value);
            }
          },
          change: function(event, ui) {
            if (tokenName != null) {
              Forms.setToken(tokenName, ui.value);
            }
            if (changeCallback != null) {
              return changeCallback(ui.value);
            }
          }
        });
        if (changeCallback != null) {
          return changeCallback(initialValue);
        } else if (slideCallback != null) {
          return slideCallback(initialValue);
        }
      };

      return Slider;

    })();
  });

}).call(this);
