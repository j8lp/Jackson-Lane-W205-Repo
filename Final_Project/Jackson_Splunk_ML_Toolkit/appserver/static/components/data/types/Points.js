(function() {
  define([], function() {
    var Points;
    return Points = (function() {
      function Points() {
        this.pointArray = [];
      }

      Points.prototype.add = function(point) {
        return this.pointArray.push(point);
      };

      Points.prototype.get = function(index) {
        return this.pointArray[index];
      };

      Points.prototype.getAll = function() {
        return this.pointArray.slice();
      };

      Points.prototype.toDataArray = function() {
        var i, len, point, ref, results;
        ref = this.pointArray;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          point = ref[i];
          results.push(point.toDataArray());
        }
        return results;
      };

      return Points;

    })();
  });

}).call(this);
