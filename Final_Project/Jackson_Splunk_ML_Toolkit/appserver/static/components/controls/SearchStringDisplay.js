(function() {
  define(["components/controls/DrilldownLinker", "ColorPalette"], function(DrilldownLinker, ColorPalette) {
    var SearchStringDisplay;
    return SearchStringDisplay = (function() {
      function SearchStringDisplay() {}

      SearchStringDisplay.set = function(container$El, searchLines, commentLines) {
        var commentColor, drilldownLink$El, i, index, len, results, searchLine, tbody;
        if (commentLines == null) {
          commentLines = [];
        }
        drilldownLink$El = container$El.prev("h3");
        DrilldownLinker.setQueryStringDrilldown(drilldownLink$El, searchLines.join(''));
        container$El.empty();
        tbody = $('<tbody>');
        container$El.append($('<table>').addClass('search-string-display-table table table-striped').append(tbody));
        commentColor = ColorPalette.getColorByIndex(15);
        results = [];
        for (index = i = 0, len = searchLines.length; i < len; index = ++i) {
          searchLine = searchLines[index];
          results.push(tbody.append($('<tr>').css('font-family', 'monospace').append($('<td>').text(searchLine), $('<td>').css('color', commentColor).text(commentLines[index] != null ? '// ' + commentLines[index] : void 0))));
        }
        return results;
      };

      return SearchStringDisplay;

    })();
  });

}).call(this);
