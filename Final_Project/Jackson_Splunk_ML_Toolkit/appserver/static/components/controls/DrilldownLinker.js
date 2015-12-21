(function() {
  define(["splunkjs/mvc", "components/splunk/Forms"], function(mvc, Forms) {
    var DrilldownLinker, createLink$El, createLoadJobLink$El, getDivValueDrilldownLinkContainer$El, getPlotDrilldownLinkContainer$El, getSearchUrl, getSingleValueDrilldownLinkContainer$El, getTableViewDrilldownLinkContainer$El, makeQueryArgument, skipChildAnchor$El;
    makeQueryArgument = function(parameterName, parameterValue, parameterValueIsTokenTemplate) {
      var queryArgument;
      if (parameterValueIsTokenTemplate == null) {
        parameterValueIsTokenTemplate = false;
      }
      if (parameterValue == null) {
        return null;
      }
      if (parameterValueIsTokenTemplate) {
        parameterValue = Forms.parseTemplate(parameterValue);
      }
      parameterName = encodeURIComponent(parameterName);
      parameterValue = encodeURIComponent(parameterValue);
      queryArgument = parameterName + "=" + parameterValue;
      return queryArgument;
    };
    getSearchUrl = function(search) {
      var earliestTime, earliestTimeArgument, latestTime, latestTimeArgument, queryArguments, queryString, searchArgument, searchString, url;
      searchString = search;
      earliestTime = null;
      latestTime = null;
      if (typeof search !== "string") {
        if (search.attributes != null) {
          search = search.attributes;
        }
        searchString = search["searchString"] || search["search"] || search["q"];
        earliestTime = search["earliestTime"] || search["earliest_time"] || search["earliest"];
        latestTime = search["latestTime"] || search["latest_time"] || search["latest"];
      }
      searchArgument = makeQueryArgument("q", searchString, true);
      if (searchArgument == null) {
        return "search";
      }
      queryArguments = [searchArgument];
      earliestTimeArgument = makeQueryArgument("earliest", earliestTime);
      if (earliestTimeArgument != null) {
        queryArguments.push(earliestTimeArgument);
      }
      latestTimeArgument = makeQueryArgument("latest", latestTime);
      if (latestTimeArgument != null) {
        queryArguments.push(latestTimeArgument);
      }
      queryString = queryArguments.join("&");
      url = "search?" + queryString;
      return url;
    };
    createLink$El = function(linkHtml, search) {
      var link$El, url;
      link$El = $("<a/>");
      link$El.attr("target", "_blank");
      link$El.html(linkHtml);
      url = getSearchUrl(search);
      link$El.attr("href", url);
      return link$El;
    };
    createLoadJobLink$El = function(linkHtml, jobId) {
      var link$El, searchString;
      searchString = "| loadjob " + jobId;
      link$El = createLink$El(linkHtml, searchString);
      return link$El;
    };
    skipChildAnchor$El = function($el) {
      var childAnchor$El, childAnchorContents$El, childAnchorCount;
      childAnchor$El = $el.children("a");
      childAnchorCount = childAnchor$El.length;
      if (childAnchorCount === 1) {
        childAnchorContents$El = childAnchor$El.contents();
        childAnchor$El.remove();
        return $el.append(childAnchorContents$El);
      }
    };
    getTableViewDrilldownLinkContainer$El = function(tableViewId) {
      var drilldownLinkContainer$El, panelFooter$El, tableView, tableView$El;
      tableView = mvc.Components.getInstance(tableViewId);
      if (tableView != null) {
        tableView$El = tableView.$el;
        panelFooter$El = tableView$El.find(".panel-footer");
        panelFooter$El.css("display", "none");
        drilldownLinkContainer$El = tableView$El.find(".panel-head h3");
        skipChildAnchor$El(drilldownLinkContainer$El);
        return drilldownLinkContainer$El;
      } else {
        return null;
      }
    };
    getPlotDrilldownLinkContainer$El = function(plotId) {
      var drilldownLinkContainer$El, plot$El;
      plot$El = $("#" + plotId);
      if (plot$El != null) {
        drilldownLinkContainer$El = plot$El.prev("h3");
        skipChildAnchor$El(drilldownLinkContainer$El);
        return drilldownLinkContainer$El;
      } else {
        return null;
      }
    };
    getDivValueDrilldownLinkContainer$El = function(plotId) {
      var drilldownLinkContainer$El, plot$El;
      plot$El = $("#" + plotId);
      if (plot$El != null) {
        drilldownLinkContainer$El = plot$El.prev("h3");
        skipChildAnchor$El(drilldownLinkContainer$El);
        return drilldownLinkContainer$El;
      } else {
        return null;
      }
    };
    getSingleValueDrilldownLinkContainer$El = function(singleId) {
      var singleHeader$El;
      singleHeader$El = $('#' + singleId).find('.panel-head').children('h3');
      if (singleHeader$El != null) {
        skipChildAnchor$El(singleHeader$El);
        return singleHeader$El;
      } else {
        return null;
      }
    };
    return DrilldownLinker = (function() {
      function DrilldownLinker() {}

      DrilldownLinker.setTableViewLoadjobDrilldown = function(tableViewId, jobId) {
        var drilldownLinkContainer$El;
        drilldownLinkContainer$El = getTableViewDrilldownLinkContainer$El(tableViewId);
        return DrilldownLinker.setLoadjobDrilldown(drilldownLinkContainer$El, jobId);
      };

      DrilldownLinker.setTableViewQueryStringDrilldown = function(tableViewId, search) {
        var drilldownLinkContainer$El;
        drilldownLinkContainer$El = getTableViewDrilldownLinkContainer$El(tableViewId);
        return DrilldownLinker.setQueryStringDrilldown(drilldownLinkContainer$El, search);
      };

      DrilldownLinker.setPlotLoadjobDrilldown = function(plotId, jobId) {
        var drilldownLinkContainer$El;
        drilldownLinkContainer$El = getPlotDrilldownLinkContainer$El(plotId);
        return DrilldownLinker.setLoadjobDrilldown(drilldownLinkContainer$El, jobId);
      };

      DrilldownLinker.setPlotQueryStringDrilldown = function(plotId, search) {
        var drilldownLinkContainer$El;
        drilldownLinkContainer$El = getPlotDrilldownLinkContainer$El(plotId);
        return DrilldownLinker.setQueryStringDrilldown(drilldownLinkContainer$El, search);
      };

      DrilldownLinker.setDivValueLoadjobDrilldown = function(plotId, jobId) {
        var drilldownLinkContainer$El;
        drilldownLinkContainer$El = getDivValueDrilldownLinkContainer$El(plotId);
        return DrilldownLinker.setLoadjobDrilldown(drilldownLinkContainer$El, jobId);
      };

      DrilldownLinker.setDivValueQueryStringDrilldown = function(plotId, search) {
        var drilldownLinkContainer$El;
        drilldownLinkContainer$El = getDivValueDrilldownLinkContainer$El(plotId);
        return DrilldownLinker.setQueryStringDrilldown(drilldownLinkContainer$El, search);
      };

      DrilldownLinker.setSingleValueQueryStringDrilldown = function(singleId, search) {
        var drilldownLinkContainer$El;
        drilldownLinkContainer$El = getSingleValueDrilldownLinkContainer$El(singleId);
        return this.setQueryStringDrilldown(drilldownLinkContainer$El, search);
      };

      DrilldownLinker.setLoadjobDrilldown = function(drilldownLinkContainer$El, jobId) {
        var link$El, linkHtml;
        if (drilldownLinkContainer$El != null) {
          skipChildAnchor$El(drilldownLinkContainer$El);
          linkHtml = drilldownLinkContainer$El.html();
          link$El = createLoadJobLink$El(linkHtml, jobId);
          drilldownLinkContainer$El.empty();
          return drilldownLinkContainer$El.append(link$El);
        }
      };

      DrilldownLinker.setQueryStringDrilldown = function(drilldownLinkContainer$El, search) {
        var link$El, linkHtml;
        if (drilldownLinkContainer$El != null) {
          skipChildAnchor$El(drilldownLinkContainer$El);
          linkHtml = drilldownLinkContainer$El.html();
          link$El = createLink$El(linkHtml, search);
          drilldownLinkContainer$El.empty();
          return drilldownLinkContainer$El.append(link$El);
        }
      };

      DrilldownLinker.getSearchUrl = function(search) {
        var url;
        url = getSearchUrl(search);
        return url;
      };

      DrilldownLinker.createSearch = function(searchString, parameters) {
        var parameterName, parameterValue, search;
        search = {
          "searchString": searchString
        };
        if (parameters != null) {
          for (parameterName in parameters) {
            parameterValue = parameters[parameterName];
            search[parameterName] = parameterValue;
          }
        }
        return search;
      };

      return DrilldownLinker;

    })();
  });

}).call(this);
