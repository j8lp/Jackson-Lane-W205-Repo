(function() {
  define(["highcharts", "Options"], function(Highcharts, Options) {
    var ClusteringPlot;
    return ClusteringPlot = (function() {
      function ClusteringPlot(container$El1, title) {
        var container$El, plot$El, title$El;
        this.container$El = container$El1;
        title$El = $("<h3/>");
        title$El.text(title);
        this.container$El.append(title$El);
        plot$El = $("<div/>");
        this.container$El.append(plot$El);
        container$El = plot$El;
        this.getTitle$El = function() {
          return title$El;
        };
        container$El.highcharts({
          credits: false,
          title: {
            text: ""
          },
          legend: {
            enabled: false
          },
          tooltip: {
            formatter: function() {
              var xAxisLabel, yAxisLabel;
              xAxisLabel = this.series.xAxis.options.title.text;
              if (xAxisLabel.length === 0) {
                xAxisLabel = "x";
              }
              yAxisLabel = this.series.yAxis.options.title.text;
              if (yAxisLabel.length === 0) {
                yAxisLabel = "y";
              }
              return "Cluster " + this.series.options.clusterIndex + "<br/>" + xAxisLabel + ": " + this.x + "<br/>" + yAxisLabel + ": " + this.y;
            }
          }
        });
        this.setSeries = function(pointsList, xAxisLabel, yAxisLabel) {
          var chart, chartIndex, colors, i, len, series, seriesList;
          if (xAxisLabel == null) {
            xAxisLabel = "";
          }
          if (yAxisLabel == null) {
            yAxisLabel = "";
          }
          seriesList = [];
          colors = (function() {
            var blueValue, greenValue, i, index, radians, redValue, ref, results, seriesCount, value;
            seriesCount = pointsList.length;
            results = [];
            for (index = i = 0, ref = seriesCount; 0 <= ref ? i < ref : i > ref; index = 0 <= ref ? ++i : --i) {
              radians = index;
              redValue = Math.floor(Math.cos(radians) * 127 + 100);
              greenValue = Math.floor(Math.sin(radians * 2 - 1) * 127 + 100);
              blueValue = Math.floor(Math.sin(radians * 3 + 1) * 127 + 100);
              value = ["rgb(", redValue, ",", greenValue, ",", blueValue, ")"];
              value = value.join("");
              results.push(value);
            }
            return results;
          })();
          (function() {
            var clusterIndex, color, colorIndex, dataIndex, i, index, j, k, len, len1, len2, maxPointsToPlot, maxX, maxY, minX, minY, pointDataArray, points, pointsDataArray, pointsDataArrayList, results, sortKey, sortKeyList, x, y;
            pointsDataArrayList = [];
            sortKeyList = [];
            index = 0;
            for (i = 0, len = pointsList.length; i < len; i++) {
              points = pointsList[i];
              pointsDataArray = points.toDataArray();
              pointsDataArrayList.push(pointsDataArray);
              minX = null;
              minY = null;
              maxX = null;
              maxY = null;
              for (j = 0, len1 = pointsDataArray.length; j < len1; j++) {
                pointDataArray = pointsDataArray[j];
                x = pointDataArray[0], y = pointDataArray[1];
                if ((minX == null) || minX > x) {
                  minX = x;
                }
                if ((maxX == null) || maxX < x) {
                  maxX = x;
                }
                if ((minY == null) || minY > y) {
                  minY = y;
                }
                if ((maxY == null) || maxY < y) {
                  maxY = y;
                }
              }
              sortKey = [];
              if (minX < minY) {
                sortKey.push(minX);
                sortKey.push(minY);
              } else {
                sortKey.push(minY);
                sortKey.push(minX);
              }
              if (maxX > maxY) {
                sortKey.push(-maxX);
                sortKey.push(-maxY);
              } else {
                sortKey.push(-maxY);
                sortKey.push(-maxX);
              }
              sortKey.push(index);
              sortKeyList.push(sortKey);
              index = index + 1;
            }
            sortKeyList.sort(function(a, b) {
              var aValue, bValue;
              index = 0;
              while (index < 4) {
                aValue = a[index];
                bValue = b[index];
                if (aValue < bValue) {
                  return -1;
                }
                if (aValue > bValue) {
                  return 1;
                }
                index = index + 1;
              }
              return 0;
            });
            colorIndex = 0;
            maxPointsToPlot = Options.getOptionByName("maxPointsToPlot", 1000);
            results = [];
            for (clusterIndex = k = 0, len2 = sortKeyList.length; k < len2; clusterIndex = ++k) {
              sortKey = sortKeyList[clusterIndex];
              dataIndex = sortKey[4];
              pointsDataArray = pointsDataArrayList[dataIndex];
              pointsDataArray = pointsDataArray.slice(0, maxPointsToPlot);
              color = colors[colorIndex];
              colorIndex = colorIndex + 1;
              results.push(seriesList.push({
                clusterIndex: clusterIndex + 1,
                type: "scatter",
                color: color,
                data: pointsDataArray,
                marker: {
                  symbol: "circle",
                  radius: 4
                }
              }));
            }
            return results;
          })();
          chartIndex = container$El.data("highchartsChart");
          chart = Highcharts.charts[chartIndex];
          chart.xAxis[0].setTitle({
            text: xAxisLabel
          });
          chart.yAxis[0].setTitle({
            text: yAxisLabel
          });
          while (chart.series.length > 0) {
            chart.series[0].remove(false);
          }
          for (i = 0, len = seriesList.length; i < len; i++) {
            series = seriesList[i];
            chart.addSeries(series, false);
          }
          return chart.redraw();
        };
      }

      return ClusteringPlot;

    })();
  });

}).call(this);
