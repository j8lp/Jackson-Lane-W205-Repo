(function() {
  define(["highcharts", "ColorPalette"], function(Highcharts, ColorPalette) {
    var PredictionPlot;
    return PredictionPlot = (function() {
      function PredictionPlot(container$El) {
        container$El.highcharts({
          title: {
            text: ''
          },
          xAxis: {
            type: 'datetime'
          },
          plotOptions: {
            series: {
              marker: {
                enabled: false
              }
            }
          }
        });
        this.setSeries = function(data, variableToPredict, futurePoints) {
          var _time, chart, chartIndex, confidenceIntervalSeries, datum, i, len, lower95, pd, predictionSeries, realData, realSeries, trainingEndTime, trainingPoints, upper95;
          chartIndex = container$El.data("highchartsChart");
          chart = Highcharts.charts[chartIndex];
          chart.xAxis[0].removePlotLine();
          if (futurePoints > 0 && data.length >= 1) {
            trainingPoints = data.length - futurePoints - 1;
            trainingEndTime = Date.parse(data[trainingPoints][0]);
            chart.xAxis[0].addPlotLine({
              color: ColorPalette.getColorByIndex(4),
              width: 2,
              value: trainingEndTime,
              dashStyle: 'DashDot',
              label: {
                text: 'training-test split',
                textAlign: 'center',
                verticalAlign: 'top',
                rotation: 0,
                x: 1
              }
            });
          }
          realSeries = {
            name: variableToPredict,
            type: 'line',
            data: [],
            marker: {
              symbol: 'circle'
            },
            zIndex: 1,
            color: ColorPalette.getColorByIndex(26)
          };
          predictionSeries = {
            name: 'prediction',
            dashStyle: 'shortdot',
            data: [],
            marker: {
              symbol: 'circle'
            },
            zIndex: 1,
            tooltip: {
              valueDecimals: 2
            },
            color: ColorPalette.getColorByIndex(6)
          };
          confidenceIntervalSeries = {
            name: 'confidence interval',
            data: [],
            type: 'arearange',
            lineWidth: 0,
            tooltip: {
              valueDecimals: 2,
              pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.low}</b> to <b>{point.high}</b><br/>'
            },
            color: ColorPalette.getColorByIndex(25)
          };
          for (i = 0, len = data.length; i < len; i++) {
            datum = data[i];
            _time = Date.parse(datum[0]);
            realData = datum[1] == null ? null : parseFloat(datum[1]);
            pd = datum[2] == null ? null : parseFloat(datum[2]);
            lower95 = datum[3] == null ? null : parseFloat(datum[3]);
            upper95 = datum[4] == null ? null : parseFloat(datum[4]);
            realSeries.data.push([_time, realData]);
            predictionSeries.data.push([_time, pd]);
            confidenceIntervalSeries.data.push([_time, lower95, upper95]);
          }
          while (chart.series.length > 0) {
            chart.series[0].remove(false);
          }
          chart.addSeries(realSeries, false);
          chart.addSeries(predictionSeries, false);
          chart.addSeries(confidenceIntervalSeries, false);
          return chart.redraw();
        };
      }

      return PredictionPlot;

    })();
  });

}).call(this);
