(function() {
  define(["highcharts", "ColorPalette", "Options"], function(Highcharts, ColorPalette, Options) {
    var LinesPlot;
    return LinesPlot = (function() {
      function LinesPlot(container$El1, xAxisLabel, yAxisLabel, showLegend) {
        var container$El;
        this.container$El = container$El1;
        if (showLegend == null) {
          showLegend = false;
        }
        container$El = this.container$El;
        container$El.highcharts({
          credits: false,
          title: {
            text: ""
          },
          legend: {
            enabled: showLegend
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
              return this.series.name + " value: " + this.y;
            }
          }
        });
        this.setSeries = function(seriesList, legendLabels) {
          var _seriesList, chart, chartIndex, i, len, series;
          if (legendLabels == null) {
            legendLabels = null;
          }
          _seriesList = [];
          (function() {
            var colors, i, index, len, maxPointsToPlot, results, series, seriesDataArray;
            index = 0;
            colors = [ColorPalette.getColorByIndex(0), ColorPalette.getColorByIndex(1)];
            maxPointsToPlot = Options.getOptionByName("maxPointsToPlot", 1000);
            results = [];
            for (i = 0, len = seriesList.length; i < len; i++) {
              series = seriesList[i];
              seriesDataArray = series.toDataArray();
              seriesDataArray = seriesDataArray.slice(0, maxPointsToPlot);
              series = {
                type: "line",
                data: seriesDataArray,
                marker: {
                  symbol: "circle"
                }
              };
              if (legendLabels != null) {
                series["name"] = legendLabels[index];
              }
              if (index < colors.length) {
                series["color"] = colors[index];
              }
              _seriesList.push(series);
              results.push(index = index + 1);
            }
            return results;
          })();
          chartIndex = container$El.data("highchartsChart");
          chart = Highcharts.charts[chartIndex];
          while (chart.series.length > 0) {
            chart.series[0].remove(false);
          }
          for (i = 0, len = _seriesList.length; i < len; i++) {
            series = _seriesList[i];
            chart.addSeries(series, false);
          }
          return chart.redraw();
        };
      }

      return LinesPlot;

    })();
  });

}).call(this);
