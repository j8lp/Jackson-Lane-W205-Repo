(function() {
  (function() {
    return require(['jquery', 'splunkjs/mvc/simplexml/controller', 'splunkjs/mvc/dropdownview', 'splunk.util', 'RoleStorage', 'json!components/data/ShowcaseInfo.json'], function($, DashboardController, DropdownView, SplunkUtil, RoleStorage, ShowcaseInfo) {
      var setRole, showcaseList, showcaseSummaries, showcasesByRole;
      showcasesByRole = ShowcaseInfo.roles;
      showcaseSummaries = ShowcaseInfo.summaries;
      showcaseList = $('<ul class="showcase-list"></ul>');
      setRole = function(roleName) {
        var app, example, exampleList, exampleText, i, j, len, len1, ref, ref1, results, showcaseDashboard, showcaseId, showcaseImage, showcaseSettings, url, wrapperLink;
        showcaseList.empty();
        app = DashboardController.model.app.get('app');
        if (showcasesByRole[roleName] == null) {
          roleName = 'default';
        }
        RoleStorage.setRole(roleName);
        ref = showcasesByRole[roleName].summaries;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          showcaseId = ref[i];
          showcaseSettings = showcaseSummaries[showcaseId];
          if (showcaseSettings != null) {
            showcaseDashboard = showcaseSettings.dashboard;
            if (showcaseSettings.examples != null) {
              exampleText = showcaseSettings.examples.length > 1 ? 'Examples:' : 'Example:';
              exampleList = $('<ul class="example-list"></ul>');
              ref1 = showcaseSettings.examples;
              for (j = 0, len1 = ref1.length; j < len1; j++) {
                example = ref1[j];
                url = showcaseDashboard + '?ml_toolkit_dataset=' + example.name;
                exampleList.append($('<li></li>').append($('<a></a>').attr('href', url).append(example.label)));
              }
            } else {
              exampleList = '';
              exampleText = '';
            }
            wrapperLink = $('<a></a>').attr('href', showcaseDashboard);
            showcaseImage = showcaseSettings.image != null ? showcaseSettings.image : showcaseDashboard + '.png';
            results.push(showcaseList.append($('<li></li>').append(wrapperLink.clone().append($('<img class="showcase-list-item-image"></img>').attr('src', SplunkUtil.make_url('/static/app/' + app + '/images/content_thumbnails/' + showcaseImage))), $('<div class="showcase-list-item-content"></div>').append(wrapperLink.clone().append($('<h3>' + showcaseSettings.name + '</h3>')), showcaseSettings.description, exampleText, exampleList))));
          } else {
            results.push(void 0);
          }
        }
        return results;
      };
      return DashboardController.onReady(function() {
        return DashboardController.onViewModelLoad(function() {
          var rolePickerControl, rolePickerRow;
          $('.dashboard-body').append(showcaseList);
          if (Object.keys(ShowcaseInfo.roles).length > 1) {
            rolePickerRow = $('#rolePickerRow');
            if (rolePickerRow != null) {
              rolePickerRow.show();
            }
          }
          return rolePickerControl = (function() {
            var choices, roleInfo, roleName;
            choices = (function() {
              var results;
              results = [];
              for (roleName in showcasesByRole) {
                roleInfo = showcasesByRole[roleName];
                results.push({
                  label: roleInfo.label,
                  value: roleName
                });
              }
              return results;
            })();
            rolePickerControl = new DropdownView({
              id: "rolePickerControl",
              el: $("#rolePickerControl"),
              labelField: "label",
              valueField: "value",
              showClearButton: false,
              choices: choices
            });
            rolePickerControl.on('change', function(roleName) {
              return setRole(roleName);
            });
            rolePickerControl.render();
            rolePickerControl.val(RoleStorage.getRole());
            return rolePickerControl;
          })();
        });
      });
    });
  })();

}).call(this);
