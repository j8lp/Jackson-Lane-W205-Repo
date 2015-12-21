(function() {
  define(["highcharts", "ColorPalette", "Options", "../controls/Messages"], function(Highcharts, ColorPalette, Options, Messages) {
    var OutliersPlot;
    return OutliersPlot = (function() {
      function OutliersPlot(container$El, options) {
        var chartOptions, errorWrapper$El;
        if (options == null) {
          options = {};
        }
        chartOptions = {
          title: {
            text: ''
          },
          yAxis: {
            title: ''
          }
        };
        if (options.legendAlign != null) {
          if (options.legendAlign === 'left' || options.legendAlign === 'right') {
            chartOptions.legend = {
              align: options.legendAlign,
              verticalAlign: 'middle'
            };
          } else if (options.legendAlign === 'top' || options.legendAlign === 'bottom') {
            chartOptions.legend = {
              align: 'center',
              verticalAlign: options.legendAlign
            };
          }
        }
        container$El.highcharts(chartOptions);
        errorWrapper$El = $('<div></div>').css('text-align', 'center');
        container$El.append(errorWrapper$El);
        this.setSeries = function(data, seriesName, options) {
          var chart, datum, firstPoint, firstPointHasTimestamp, hasTimestamps, i, index, isOutlier, lastPoint, lastPointHasTimestamp, len, lower, mainSeries, maxPointsToPlot, nonNumericYVals, outlierSeries, upper, xVal, yVal;
          if (options == null) {
            options = {};
          }
          chart = container$El.highcharts();
          maxPointsToPlot = Options.getOptionByName("maxPointsToPlot", 1000);
          Messages.removeAlert(errorWrapper$El);
          if (data.length > maxPointsToPlot) {
            Messages.setAlert(errorWrapper$El, 'Results are truncated. This visualization is configured to display a maximum of ' + maxPointsToPlot + ' points, and that limit has been reached.', 'warning', 'alert-inline');
            data = data.slice(0, maxPointsToPlot);
          }
          firstPoint = data[0][0];
          lastPoint = data.length > 1 ? data[data.length - 1][0] : null;
          firstPointHasTimestamp = (firstPoint != null) && !isNaN(new Date(firstPoint).valueOf());
          lastPointHasTimestamp = (lastPoint != null) && !isNaN(new Date(lastPoint).valueOf());
          hasTimestamps = firstPointHasTimestamp && lastPointHasTimestamp && firstPoint !== lastPoint;
          chart.xAxis[0].update({
            type: hasTimestamps ? 'datetime' : 'linear'
          });
          mainSeries = {
            name: seriesName,
            data: [],
            color: ColorPalette.getColorByIndex(0),
            turboThreshold: maxPointsToPlot + 1,
            point: {
              events: {
                click: options.onClick || function() {}
              }
            },
            tooltip: {
              valueDecimals: 2
            }
          };
          outlierSeries = {
            name: 'Confidence Interval',
            type: 'arearange',
            color: ColorPalette.getColorByIndex(0),
            lineWidth: 0,
            linkedTo: ':previous',
            fillOpacity: 0.3,
            zIndex: 0,
            tooltip: {
              valueDecimals: 2,
              pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.low}</b> to <b>{point.high}</b><br/>'
            },
            data: []
          };
          nonNumericYVals = 0;
          for (index = i = 0, len = data.length; i < len; index = ++i) {
            datum = data[index];
            xVal = hasTimestamps ? new Date(datum[0]).valueOf() : index;
            yVal = parseFloat(datum[1]);
            if (isNaN(yVal)) {
              yVal = null;
              nonNumericYVals++;
            }
            lower = parseFloat(datum[2]);
            if (isNaN(lower)) {
              lower = null;
            }
            upper = parseFloat(datum[3]);
            if (isNaN(upper)) {
              upper = null;
            }
            isOutlier = parseInt(datum[4], 10);
            if (isNaN(isOutlier)) {
              isOutlier = yVal !== null && (lower !== null && yVal < lower || upper !== null && yVal > upper);
            }
            mainSeries.data.push({
              x: xVal,
              y: yVal,
              originalY: datum[1],
              color: isOutlier ? ColorPalette.getColorByIndex(1) : void 0,
              marker: {
                enabled: isOutlier,
                symbol: 'circle'
              }
            });
            outlierSeries.data.push([xVal, lower, upper]);
          }
          if (nonNumericYVals === data.length) {
            Messages.setAlert(errorWrapper$El, 'All values in "' + seriesName + '" are non-numeric. You may be able to analyze this data in the "Detect Categorical Outliers" dashboard.', 'error', 'alert-inline');
          }
          while (chart.series.length > 0) {
            chart.series[0].remove(false);
          }
          chart.addSeries(mainSeries, false);
          chart.addSeries(outlierSeries, false);
          return chart.redraw();
        };
      }

      return OutliersPlot;

    })();
  });

}).call(this);
