(function() {
  var appCssPath, appName, appPath, options, pageCssPath, pageName, pageScriptPath, ref, requireConfigOptions, root, scriptPath;

  options = {
    "maxPointsToPlot": 1000,
    "smallLoaderFontSize": 10,
    "largeLoaderFontSize": 24,
    "defaultHistogramBinCount": 10,
    "modelNamePrompt": "(optional)",
    "defaultModelName": "default_model_name"
  };

  ref = (function() {
    var appIndex, appName, pageName, path, pathComponents, ref;
    path = location.pathname;
    ref = path.split("?"), path = ref[0];
    pathComponents = path.split("/");
    appIndex = pathComponents.indexOf("app");
    appName = pathComponents[appIndex + 1];
    pageName = pathComponents[appIndex + 2];
    return [appName, pageName];
  })(), appName = ref[0], pageName = ref[1];

  root = "../app";

  appPath = root + "/" + appName;

  scriptPath = "components/pages/" + pageName;

  pageScriptPath = appPath + "/" + scriptPath;

  appCssPath = "css!" + appPath + "/style/app";

  pageCssPath = "css!" + appPath + "/style/" + pageName;

  requireConfigOptions = {
    paths: {
      "app": root,
      "components": appPath + "/components",
      "views/shared/jobstatus/Count": appPath + "/components/splunk/JobStatusCountPatch",
      "vendor": appPath + "/vendor",
      "text": appPath + "/vendor/text/text",
      "json": appPath + "/vendor/json/json",
      "css": appPath + "/vendor/require-css/css",
      "jquery.ui.slider": appPath + "/vendor/jquery.ui/jquery-ui-slider",
      "jquery.center-loader": appPath + "/vendor/jquery.center-loader/center-loader",
      "highcharts": appPath + "/vendor/highcharts/highcharts-main",
      "highcharts-more": appPath + "/vendor/highcharts/highcharts-more",
      "highcharts-exporting": appPath + "/vendor/highcharts/highcharts-exporting",
      "prettify": appPath + "/vendor/prettify/prettify",
      "showdown": appPath + "/vendor/showdown/showdown",
      "srcviewer": appPath + "/vendor/srcviewer/srcviewer",
      "codeview": appPath + "/vendor/srcviewer/codeview",
      "colorspaces": appPath + "/vendor/colorspaces/colorspaces",
      "ColorPalette": appPath + "/components/data/parameters/ColorPalette",
      "Options": appPath + "/components/data/parameters/Options",
      "PreviousValueStore": appPath + "/components/controls/PreviousValueStore",
      "RoleStorage": appPath + "/components/data/parameters/RoleStorage",
      "bootstrapSourceViewer": appPath + "/components/controls/bootstrapSourceViewer",
      "DependencyChecker": appPath + "/components/controls/DependencyChecker",
      "url": appPath + "/vendor/url/url"
    },
    shim: {
      "highcharts-exporting": {
        deps: ["highcharts"]
      },
      "highcharts-more": {
        deps: ["highcharts"]
      },
      "highcharts": {
        deps: ["jquery", "splunkjs/ready!"],
        exports: "Highcharts"
      },
      "jquery.center-loader": {
        deps: ["jquery"]
      },
      "url": {
        deps: []
      }
    },
    config: {
      "bootstrapSourceViewer": {
        "pageName": pageName,
        "scriptPath": scriptPath
      },
      "Options": {
        "options": options
      }
    }
  };

  if ((typeof runInDevelopMode !== "undefined" && runInDevelopMode !== null) && runInDevelopMode) {
    requireConfigOptions["urlArgs"] = "bust=" + Date.now();
  }

  require.config(requireConfigOptions);

  require(["jquery", "jquery.ui.slider", "jquery.center-loader", "splunkjs/ready!", "highcharts", "highcharts-more", "ColorPalette", "bootstrapSourceViewer", "PreviousValueStore", appCssPath, pageCssPath], function() {
    return require(["DependencyChecker", "RoleStorage"], function(DependencyChecker, RoleStorage) {
      return DependencyChecker.check(function(success) {
        if (success) {
          RoleStorage.updateMenu();
          return require([pageScriptPath]);
        }
      });
    });
  });

}).call(this);
