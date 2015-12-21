(function() {
  define([], function() {
    var Line;
    return Line = (function() {
      function Line(startPoint, endPoint) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;
      }

      Line.prototype.toDataArray = function() {
        return [this.startPoint.toDataArray(), this.endPoint.toDataArray()];
      };

      return Line;

    })();
  });

}).call(this);
