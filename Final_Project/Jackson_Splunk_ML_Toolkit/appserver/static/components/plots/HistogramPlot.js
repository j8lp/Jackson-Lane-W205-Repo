(function() {
  define(["highcharts", "ColorPalette"], function(Highcharts, ColorPalette) {
    var HistogramPlot;
    return HistogramPlot = (function() {
      function HistogramPlot(container$El1, xAxisLabel, yAxisLabel) {
        var chart, container$El, createChart;
        this.container$El = container$El1;
        container$El = this.container$El;
        chart = null;
        createChart = function() {
          var chart$El, chartIndex;
          if (chart == null) {
            container$El.empty();
            chart$El = $("<div/>");
            container$El.append(chart$El);
            chart$El.highcharts({
              plotOptions: {
                column: {
                  pointPadding: 0,
                  borderWidth: 0,
                  groupPadding: 0,
                  shadow: false
                }
              },
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
            chartIndex = chart$El.data("highchartsChart");
            return chart = Highcharts.charts[chartIndex];
          }
        };
        createChart();
        this.setMessage = function(message) {
          var messageAlertContainer$El, messageInnerContainer$El, messageOuterContainer$El;
          container$El.empty();
          messageOuterContainer$El = $("<div/>");
          messageOuterContainer$El.addClass("msg");
          messageInnerContainer$El = $("<div/>");
          messageInnerContainer$El.addClass("splunk-message-container");
          messageAlertContainer$El = $("<div/>");
          messageAlertContainer$El.addClass("alert alert-info");
          messageAlertContainer$El.text(message);
          messageInnerContainer$El.append(messageAlertContainer$El);
          messageOuterContainer$El.append(messageInnerContainer$El);
          container$El.append(messageOuterContainer$El);
          return chart = null;
        };
        this.setSeries = function(points, minValue, maxValue, totalCount, zeroCrossingLineHeight) {
          var i, len, series, seriesList, xAxis;
          if (minValue == null) {
            minValue = null;
          }
          if (maxValue == null) {
            maxValue = null;
          }
          if (totalCount == null) {
            totalCount = null;
          }
          if (zeroCrossingLineHeight == null) {
            zeroCrossingLineHeight = null;
          }
          createChart();
          seriesList = [];
          (function() {
            var pointsDataArray, series;
            pointsDataArray = points.toDataArray();
            series = {
              type: "column",
              data: pointsDataArray,
              color: ColorPalette.getColorByIndex(0),
              animation: false
            };
            return seriesList.push(series);
          })();
          (function() {
            var zeroCrossingLine;
            if ((zeroCrossingLineHeight != null) && zeroCrossingLineHeight > 0) {
              zeroCrossingLine = [
                {
                  x: 0,
                  y: 0,
                  marker: {
                    enabled: false
                  }
                }, {
                  x: 0,
                  y: zeroCrossingLineHeight,
                  marker: {
                    enabled: true,
                    symbol: "triangle",
                    color: ColorPalette.getColorByIndex(1)
                  }
                }
              ];
              return seriesList.push({
                type: "line",
                data: zeroCrossingLine,
                color: ColorPalette.getColorByIndex(1)
              });
            }
          })();
          while (chart.series.length > 0) {
            chart.series[0].remove(false);
          }
          for (i = 0, len = seriesList.length; i < len; i++) {
            series = seriesList[i];
            chart.addSeries(series, false);
          }
          if ((minValue != null) && (maxValue != null)) {
            xAxis = chart.xAxis[0];
            xAxis.setExtremes(minValue, maxValue);
          }
          return chart.redraw();
        };
      }

      return HistogramPlot;

    })();
  });

}).call(this);
