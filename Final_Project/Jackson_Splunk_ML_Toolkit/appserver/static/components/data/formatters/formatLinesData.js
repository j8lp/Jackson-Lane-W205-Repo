(function() {
  define(function(require, exports, module) {
    var Series, formatLinesData;
    Series = require("../types/Series");
    return formatLinesData = function(data) {
      var field, fields, i, index, j, k, len, len1, len2, row, rows, series, seriesList, value;
      rows = data.rows;
      fields = data.fields;
      if ((rows == null) || (fields == null)) {
        return;
      }
      seriesList = [];
      for (i = 0, len = fields.length; i < len; i++) {
        field = fields[i];
        series = new Series();
        seriesList.push(series);
      }
      for (j = 0, len1 = rows.length; j < len1; j++) {
        row = rows[j];
        index = 0;
        for (k = 0, len2 = row.length; k < len2; k++) {
          value = row[k];
          series = seriesList[index];
          value = parseFloat(value);
          if (isNaN(value)) {
            value = null;
          }
          series.add(value);
          index = index + 1;
        }
      }
      return {
        "seriesList": seriesList
      };
    };
  });

}).call(this);
