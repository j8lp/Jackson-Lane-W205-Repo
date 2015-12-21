(function() {
  require(["jquery", "components/splunk/Searches", "Options", "components/data/formatters/formatClusteringData", "components/controls/DrilldownLinker", "components/plots/ClusteringPlot"], function($, Searches, Options, formatClusteringData, DrilldownLinker, ClusteringPlot) {
    var Algorithm, DatasetPlot, algorithms, fontSize, largeLoaderFontSize, smallLoaderFontSize;
    smallLoaderFontSize = Options.getOptionByName("smallLoaderFontSize", 10);
    largeLoaderFontSize = Options.getOptionByName("largeLoaderFontSize", 24);
    Algorithm = (function() {
      function Algorithm(name1, parameters1) {
        this.name = name1;
        this.parameters = parameters1;
      }

      return Algorithm;

    })();
    algorithms = [new Algorithm("KMeans", "k=2"), new Algorithm("DBSCAN", "eps=0.2"), new Algorithm("SpectralClustering", "k=2 affinity=\"nearest_neighbors\""), new Algorithm("Birch", "k=2")];
    fontSize = largeLoaderFontSize;
    DatasetPlot = (function() {
      function DatasetPlot(panelId, datasetName) {
        var algorithm, clusteringPlot, clusteringPlot$El, clusteringPlotPanel$El, fn, i, index, len, name, parameters, searchName, searchString;
        clusteringPlotPanel$El = $("#" + panelId);
        index = 0;
        fn = function(searchName, searchString, clusteringPlot) {
          return Searches.setSearch(searchName, true, false, null, searchString, (function(searchManager) {
            var search, title$El;
            search = searchManager.search;
            title$El = clusteringPlot.getTitle$El();
            return DrilldownLinker.setQueryStringDrilldown(title$El, search);
          }), (function(data) {
            var panel$El, pointsList;
            pointsList = formatClusteringData(data, "cluster", "x", "y");
            clusteringPlot.setSeries(pointsList);
            panel$El = clusteringPlot.container$El;
            return panel$El.loader("hide");
          }));
        };
        for (i = 0, len = algorithms.length; i < len; i++) {
          algorithm = algorithms[i];
          name = algorithm.name;
          parameters = algorithm.parameters;
          clusteringPlot$El = $("<div/>");
          clusteringPlotPanel$El.append(clusteringPlot$El);
          clusteringPlot$El.css({
            "display": "inline-block",
            "width": "25%",
            "text-align": "center"
          });
          clusteringPlot = new ClusteringPlot(clusteringPlot$El, name);
          clusteringPlot$El.loader("show", "<i class=\"fa fa-2x fa-spinner fa-spin wobble-fix\" " + "style=\"font-size: " + fontSize + "pt;\"></i>");
          searchName = panelId + "Plot" + index + "LearningSearch";
          searchString = "| inputlookup " + datasetName + " " + "| fit " + name + " " + parameters + " x y";
          fn(searchName, searchString, clusteringPlot);
          index = index + 1;
        }
      }

      return DatasetPlot;

    })();
    new DatasetPlot("clusteringPlotNoisyCirclesDatasetPanel", "sklearn_cluster_noisy_circles.csv");
    new DatasetPlot("clusteringPlotNoisyMoonsDatasetPanel", "sklearn_cluster_noisy_moons.csv");
    new DatasetPlot("clusteringPlotBlobsDatasetPanel", "sklearn_cluster_blobs.csv");
    return new DatasetPlot("clusteringPlotNoStructureDatasetPanel", "sklearn_cluster_no_structure.csv");
  });

}).call(this);
