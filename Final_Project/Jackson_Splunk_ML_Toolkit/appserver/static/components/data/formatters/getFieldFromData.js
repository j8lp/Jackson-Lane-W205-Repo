(function() {
  define(function(require, exports, module) {
    var getFieldFromData;
    return getFieldFromData = function(data, fieldName) {
      var field, fieldCount, fieldIndex, fieldValue, fields, i, j, len, len1, results, row, rows;
      results = [];
      rows = data.rows;
      fields = data.fields;
      if ((rows == null) || (fields == null)) {
        return results;
      }
      fieldCount = fields.length;
      if (fieldCount === 0) {
        return results;
      }
      fieldIndex = 0;
      for (i = 0, len = fields.length; i < len; i++) {
        field = fields[i];
        if (field === fieldName) {
          break;
        }
        fieldIndex = fieldIndex + 1;
      }
      if (fieldIndex === fieldCount) {
        return results;
      }
      for (j = 0, len1 = rows.length; j < len1; j++) {
        row = rows[j];
        fieldValue = row[fieldIndex];
        if (fieldValue != null) {
          results.push(fieldValue);
        }
      }
      return results;
    };
  });

}).call(this);
