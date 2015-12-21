(function() {
  define(["module"], function(module) {
    var Options, config, options;
    options = {};
    config = module.config();
    if (config != null) {
      options = config.options;
    }
    return Options = (function() {
      function Options() {}

      Options.getOptionByName = function(name, defaultValue) {
        var value;
        if (defaultValue == null) {
          defaultValue = null;
        }
        value = options != null ? options[name] : void 0;
        if (value == null) {
          value = defaultValue;
        }
        return value;
      };

      return Options;

    })();
  });

}).call(this);
