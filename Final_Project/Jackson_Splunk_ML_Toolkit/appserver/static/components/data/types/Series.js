(function() {
  define([], function() {
    var Series;
    return Series = (function() {
      function Series() {
        this.elementArray = [];
      }

      Series.prototype.add = function(element) {
        return this.elementArray.push(element);
      };

      Series.prototype.get = function(index) {
        return this.elementArray[index];
      };

      Series.prototype.toDataArray = function() {
        var element, i, len, ref, results;
        ref = this.elementArray;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          element = ref[i];
          results.push(element);
        }
        return results;
      };

      return Series;

    })();
  });

}).call(this);
