(function() {
  define(function(require, exports, module) {
    var Point, Points, formatHistogramData;
    Point = require("../types/Point");
    Points = require("../types/Points");
    return formatHistogramData = function(data, bucketFieldName, countFieldName, avgValueFieldName, minValueFieldName, maxValueFieldName) {
      var avgValueFieldIndex, bucket, bucketFieldIndex, bucketSplit, count, countFieldIndex, fieldIndex, fieldName, fieldNameToIndex, fields, highPoint, i, j, k, len, len1, len2, lowPoint, matcher, maxBucketCount, maxBucketValue, maxValue, maxValueFieldIndex, midPoint, midPointAndCount, midPointAndCountList, minBucketValue, minValue, minValueFieldIndex, point, points, row, rows, totalCount;
      rows = data.rows;
      fields = data.fields;
      if ((rows == null) || (fields == null)) {
        return null;
      }
      fieldIndex = 0;
      fieldNameToIndex = {};
      for (i = 0, len = fields.length; i < len; i++) {
        fieldName = fields[i];
        fieldNameToIndex[fieldName] = fieldIndex;
        fieldIndex = fieldIndex + 1;
      }
      bucketFieldIndex = fieldNameToIndex[bucketFieldName];
      countFieldIndex = fieldNameToIndex[countFieldName];
      avgValueFieldIndex = fieldNameToIndex[avgValueFieldName];
      minValueFieldIndex = fieldNameToIndex[minValueFieldName];
      maxValueFieldIndex = fieldNameToIndex[maxValueFieldName];
      if ((bucketFieldIndex == null) || (countFieldIndex == null)) {
        return null;
      }
      matcher = new RegExp("(-?[0-9.]+)-(-?[0-9.]+)");
      maxBucketCount = 0;
      totalCount = 0;
      minValue = null;
      maxValue = null;
      midPointAndCountList = [];
      for (j = 0, len1 = rows.length; j < len1; j++) {
        row = rows[j];
        bucket = row[bucketFieldIndex];
        count = row[countFieldIndex];
        if ((bucket != null) && (count != null)) {
          bucketSplit = bucket.match(matcher);
          count = parseInt(count);
          if (!isNaN(count)) {
            if (count > maxBucketCount) {
              maxBucketCount = count;
            }
            midPoint = parseFloat(bucket);
            if (avgValueFieldIndex != null) {
              midPoint = row[avgValueFieldIndex];
              midPoint = parseFloat(midPoint);
            } else if (bucketSplit != null) {
              lowPoint = parseFloat(bucketSplit[1]);
              highPoint = parseFloat(bucketSplit[2]);
              midPoint = (lowPoint + highPoint) / 2;
            }
            if ((minValueFieldIndex != null) && (maxValueFieldIndex != null)) {
              minBucketValue = row[minValueFieldIndex];
              minBucketValue = parseFloat(minBucketValue);
              if ((minValue == null) || minBucketValue < minValue) {
                minValue = minBucketValue;
              }
              maxBucketValue = row[maxValueFieldIndex];
              maxBucketValue = parseFloat(maxBucketValue);
              if ((maxValue == null) || maxBucketValue > maxValue) {
                maxValue = maxBucketValue;
              }
            }
            midPointAndCount = [midPoint, count];
            midPointAndCountList.push(midPointAndCount);
            totalCount = totalCount + count;
          }
        }
      }
      midPointAndCountList.sort(function(a, b) {
        return a[0] - b[0];
      });
      points = new Points();
      for (k = 0, len2 = midPointAndCountList.length; k < len2; k++) {
        midPointAndCount = midPointAndCountList[k];
        midPoint = midPointAndCount[0];
        count = midPointAndCount[1];
        point = new Point(midPoint, count);
        points.add(point);
      }
      return {
        "points": points,
        "totalCount": totalCount,
        "maxBucketCount": maxBucketCount,
        "minValue": minValue,
        "maxValue": maxValue
      };
    };
  });

}).call(this);
