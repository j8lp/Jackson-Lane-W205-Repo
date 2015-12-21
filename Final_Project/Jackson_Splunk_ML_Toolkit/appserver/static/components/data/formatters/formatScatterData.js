(function() {
  define(function(require, exports, module) {
    var Point, Points, formatScatterData;
    Point = require("../types/Point");
    Points = require("../types/Points");
    return formatScatterData = function(data, xAxisFieldName, yAxisFieldName) {
      var field, fieldIndex, fields, i, j, len, len1, max, maxDataValue, min, minDataValue, point, points, row, rows, xAxisFieldIndex, xValue, yAxisFieldIndex, yValue;
      rows = data.rows;
      fields = data.fields;
      if ((rows == null) || (fields == null)) {
        return;
      }
      fieldIndex = 0;
      for (i = 0, len = fields.length; i < len; i++) {
        field = fields[i];
        if (field === xAxisFieldName) {
          xAxisFieldIndex = fieldIndex;
        }
        if (field === yAxisFieldName) {
          yAxisFieldIndex = fieldIndex;
        }
        fieldIndex = fieldIndex + 1;
      }
      points = new Points();
      minDataValue = null;
      maxDataValue = null;
      for (j = 0, len1 = rows.length; j < len1; j++) {
        row = rows[j];
        xValue = parseFloat(row[xAxisFieldIndex]);
        yValue = parseFloat(row[yAxisFieldIndex]);
        if (!isNaN(xValue) && !isNaN(yValue)) {
          point = new Point(xValue, yValue, row[xAxisFieldIndex], row[yAxisFieldIndex]);
          points.add(point);
          min = Math.min(xValue, yValue);
          max = Math.max(xValue, yValue);
          if ((minDataValue == null) || minDataValue > min) {
            minDataValue = min;
          }
          if ((maxDataValue == null) || maxDataValue < max) {
            maxDataValue = max;
          }
        }
      }
      return {
        "points": points,
        "minDataValue": minDataValue,
        "maxDataValue": maxDataValue
      };
    };
  });

}).call(this);
