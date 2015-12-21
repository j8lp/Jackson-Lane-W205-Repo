(function() {
  define(["highcharts", "colorspaces"], function(Highcharts, Colorspaces) {
    var ColorPalette, colorPalette, getColorspaceColorByIndex, interpolate;
    colorPalette = ['#1e93c6', '#f2b827', '#d6563c', '#6a5c9e', '#31a35f', '#ed8440', '#3863a0', '#a2cc3e', '#cc5068', '#73427f', '#11a88b', '#ea9600', '#0e776d', '#ffb380', '#aa3977', '#91af27', '#4453aa', '#99712b', '#553577', '#97bc71', '#d35c2d', '#314d5b', '#99962b', '#844539', '#00b290', '#e2c188', '#a34a41', '#44416d', '#e29847', '#8c8910', '#0b416d', '#774772', '#3d9988', '#bdbd5e', '#5f7396', '#844539', '#AAAAAA', '#ffffff'];
    Highcharts.setOptions({
      colors: colorPalette
    });
    getColorspaceColorByIndex = function(colorIndex) {
      var color;
      color = colorPalette[colorIndex];
      if (color != null) {
        color = Colorspaces.make_color("hex", color);
      }
      return color;
    };
    interpolate = function(arrayA, arrayB, percentage) {
      var count, distance, index, newArray, newValue, position, valueA, valueB;
      count = arrayA.length;
      if (arrayB.length !== count) {
        return;
      }
      newArray = [];
      index = 0;
      while (index < count) {
        valueA = arrayA[index];
        valueB = arrayB[index];
        index = index + 1;
        distance = valueB - valueA;
        position = distance * percentage;
        newValue = position + valueA;
        newArray.push(newValue);
      }
      return newArray;
    };
    return ColorPalette = (function() {
      function ColorPalette() {}

      ColorPalette.getColorByIndex = function(colorIndex) {
        return colorPalette[colorIndex];
      };

      ColorPalette.getGradientColor = function(startingColorIndex, endingColorIndex, gradientPositionPercentage) {
        var arrayA, arrayB, endingColor, newArray, newColor, startingColor;
        startingColor = getColorspaceColorByIndex(startingColorIndex);
        endingColor = getColorspaceColorByIndex(endingColorIndex);
        arrayA = startingColor.as("CIELCH");
        arrayB = endingColor.as("CIELCH");
        newArray = interpolate(arrayA, arrayB, gradientPositionPercentage);
        newColor = Colorspaces.make_color("CIELCH", newArray);
        newColor = newColor.as("hex");
        return newColor;
      };

      return ColorPalette;

    })();
  });

}).call(this);
