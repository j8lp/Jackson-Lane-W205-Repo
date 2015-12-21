(function() {
  define(['json!components/data/ShowcaseInfo.json'], function(ShowcaseInfo) {
    var RoleStorage, roleKey;
    roleKey = 'mlts-role';
    return RoleStorage = (function() {
      function RoleStorage() {}

      RoleStorage.getRole = function() {
        return localStorage.getItem(roleKey);
      };

      RoleStorage.setRole = function(role) {
        if (role != null) {
          localStorage.setItem(roleKey, role);
        } else {
          localStorage.deleteItem(roleKey);
        }
        return this.updateMenu();
      };

      RoleStorage.updateMenu = function() {
        var contentsMenuItem, menuItemText, role, roleDetails;
        contentsMenuItem = $('a[href*="Splunk_ML_Toolkit/contents"]');
        if (contentsMenuItem != null) {
          role = this.getRole();
          roleDetails = ShowcaseInfo.roles[role];
          if (role !== 'default' && (roleDetails != null)) {
            menuItemText = 'Overview (' + roleDetails.label + ')';
          } else {
            menuItemText = 'Overview';
          }
          contentsMenuItem.text(menuItemText);
          return contentsMenuItem.attr('title', menuItemText);
        }
      };

      return RoleStorage;

    })();
  });

}).call(this);
