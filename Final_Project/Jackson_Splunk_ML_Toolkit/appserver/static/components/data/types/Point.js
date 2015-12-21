(function() {
  define([], function() {
    var Point;
    return Point = (function() {
      function Point(x, y, originalX, originalY) {
        this.x = x;
        this.y = y;
        this.originalX = originalX;
        this.originalY = originalY;
      }

      Point.prototype.toDataArray = function() {
        return [this.x, this.y];
      };

      return Point;

    })();
  });

}).call(this);
