(function() {
  define(['jquery'], function($) {
    return $.fn.extend({
      setValue: function(value) {
        if (this.data('currentValue') !== value) {
          this.data('previousValue', this.data('currentValue'));
          this.data('currentValue', value);
          return this.val(value);
        }
      }
    });
  });

}).call(this);
