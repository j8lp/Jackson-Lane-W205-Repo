(function() {
  define(["highcharts", "ColorPalette", "Options"], function(Highcharts, ColorPalette, Options) {
    var ScatterLinePlot;
    return ScatterLinePlot = (function() {
      function ScatterLinePlot(container$El1, xAxisLabel, yAxisLabel) {
        var container$El;
        this.container$El = container$El1;
        container$El = this.container$El;
        container$El.highcharts({
          credits: false,
          title: {
            text: ""
          },
          legend: {
            enabled: false
          },
          xAxis: {
            title: {
              text: xAxisLabel
            }
          },
          yAxis: {
            title: {
              text: yAxisLabel
            }
          },
          tooltip: {
            formatter: function() {
              return xAxisLabel + ": " + this.x + "<br/>" + yAxisLabel + ": " + this.y;
            }
          }
        });
        this.setSeries = function(points, options) {
          var chart, chartIndex, i, len, line, maxDataValue, minDataValue, onClick, series, seriesList;
          if (options == null) {
            options = {};
          }
          line = options["line"];
          minDataValue = options["minDataValue"];
          maxDataValue = options["maxDataValue"];
          onClick = options["onClick"] || function() {};
          seriesList = [];
          (function() {
            var lineDataArray;
            if (line != null) {
              lineDataArray = line.toDataArray();
              return seriesList.push({
                type: "line",
                color: ColorPalette.getColorByIndex(15),
                data: lineDataArray,
                marker: {
                  enabled: false
                }
              });
            }
          })();
          (function() {
            var referenceLine;
            if ((minDataValue != null) && (maxDataValue != null)) {
              referenceLine = [[minDataValue, minDataValue], [maxDataValue, maxDataValue]];
              return seriesList.push({
                type: "line",
                color: ColorPalette.getColorByIndex(1),
                data: referenceLine,
                marker: {
                  enabled: false
                },
                states: {
                  hover: {
                    enabled: false
                  }
                },
                enableMouseTracking: false
              });
            }
          })();
          (function() {
            var allPoints, maxPointsToPlot;
            maxPointsToPlot = Options.getOptionByName("maxPointsToPlot", 1000);
            allPoints = points.getAll();
            allPoints = allPoints.slice(0, maxPointsToPlot);
            return seriesList.push({
              type: "scatter",
              data: allPoints,
              turboThreshold: maxPointsToPlot + 1,
              color: ColorPalette.getColorByIndex(0),
              marker: {
                symbol: "circle",
                radius: 4
              },
              point: {
                events: {
                  click: onClick
                }
              }
            });
          })();
          chartIndex = container$El.data("highchartsChart");
          chart = Highcharts.charts[chartIndex];
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

      return ScatterLinePlot;

    })();
  });

}).call(this);
