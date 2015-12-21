(function() {
  define(['jquery'], function($) {
    var Messages, getMessage$El, messageClass, wrapperClass;
    wrapperClass = 'textinput-with-message';
    messageClass = 'textinput-message';
    getMessage$El = function(textInput) {
      return $(textInput.el).find('.' + messageClass);
    };
    return Messages = (function() {
      function Messages() {}

      Messages.setTextInputMessage = function(textInput, message) {
        var message$El;
        message$El = getMessage$El(textInput);
        if (message$El.length === 0) {
          message$El = $('<span>').addClass(messageClass);
        }
        return $(textInput.el).addClass(wrapperClass).append(message$El.text(message));
      };

      Messages.removeTextInputMessage = function(textInput) {
        var message$El;
        message$El = getMessage$El(textInput);
        $(textInput).removeClass(wrapperClass);
        if (message$El.length > 0) {
          return message$El.remove();
        }
      };

      Messages.setAlert = function(wrapper$El, alertMessage, alertType, extraClasses, showWrapper) {
        var alert$El, icon$El, message$El;
        if (alertMessage == null) {
          alertMessage = '';
        }
        if (alertType == null) {
          alertType = 'error';
        }
        if (extraClasses == null) {
          extraClasses = '';
        }
        if (wrapper$El != null) {
          if (showWrapper) {
            wrapper$El.show();
          }
          alert$El = $('<div></div>').addClass('alert alert-' + alertType + ' ' + extraClasses);
          icon$El = $('<i></i>').addClass('icon-alert');
          message$El = $('<p></p>').text(alertMessage);
          return wrapper$El.append(alert$El.append(icon$El, message$El));
        }
      };

      Messages.removeAlert = function(wrapper$El, hideWrapper) {
        if (hideWrapper == null) {
          hideWrapper = false;
        }
        if (wrapper$El != null) {
          wrapper$El.children('.alert').remove();
          if (hideWrapper) {
            return wrapper$El.hide();
          }
        }
      };

      return Messages;

    })();
  });

}).call(this);
