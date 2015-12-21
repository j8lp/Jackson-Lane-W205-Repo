(function() {
  define(['Options'], function(Options) {
    var Spinners, largeLoaderFontSize;
    largeLoaderFontSize = Options.getOptionByName("largeLoaderFontSize", 24);
    return Spinners = (function() {
      function Spinners() {}

      Spinners.panelLoaderTimeouts = {};

      Spinners.showLoadingOverlay = function(panelIds, fontSize) {
        var i, len, panel$El, panelId;
        if (panelIds == null) {
          panelIds = [];
        }
        if (fontSize == null) {
          fontSize = largeLoaderFontSize;
        }
        if (typeof panelIds === "string") {
          panelIds = [panelIds];
        }
        for (i = 0, len = panelIds.length; i < len; i++) {
          panelId = panelIds[i];
          panel$El = $("#" + panelId);
          if (panel$El != null) {
            if (Spinners.panelLoaderTimeouts[panelId] != null) {
              clearTimeout(Spinners.panelLoaderTimeouts[panelId]);
              delete Spinners.panelLoaderTimeouts[panelId];
            } else {
              panel$El.loader("show", "<i class=\"fa fa-2x fa-spinner fa-spin wobble-fix\" style=\"font-size: " + fontSize + "pt;\"></i>");
            }
          }
        }
        return Spinners.hideLoadingOverlay = function(panelIds) {
          var j, len1, results;
          if (panelIds == null) {
            panelIds = [];
          }
          if (typeof panelIds === "string") {
            panelIds = [panelIds];
          }
          results = [];
          for (j = 0, len1 = panelIds.length; j < len1; j++) {
            panelId = panelIds[j];
            panel$El = $("#" + panelId);
            if (panel$El != null) {
              clearTimeout(Spinners.panelLoaderTimeouts[panelId]);
              results.push(Spinners.panelLoaderTimeouts[panelId] = setTimeout(function(panel$El, panelId) {
                if (panel$El != null) {
                  panel$El.loader("hide");
                }
                return delete Spinners.panelLoaderTimeouts[panelId];
              }, 500, panel$El, panelId));
            } else {
              results.push(void 0);
            }
          }
          return results;
        };
      };

      return Spinners;

    })();
  });

}).call(this);
