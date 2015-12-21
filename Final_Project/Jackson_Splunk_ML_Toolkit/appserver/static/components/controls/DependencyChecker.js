(function() {
  define(['splunkjs/mvc', 'components/splunk/Searches', 'components/controls/Messages'], function(mvc, Searches, Messages) {
    var DependencyChecker, collectionPath, getCollection, handleDependencyStatus, keyName, service, setCollection, setupDependencySearch;
    service = mvc.createService({
      owner: 'nobody'
    });
    keyName = 'Splunk_Scientific_Python';
    collectionPath = 'storage/collections/data/dependency_checker/';
    getCollection = function(callback) {
      if (callback == null) {
        callback = function() {};
      }
      return service.request(collectionPath, 'GET', null, null, null, {
        'Content-Type': 'application/json'
      }, callback);
    };
    setCollection = function(collectionValues, callback) {
      if (callback == null) {
        callback = function() {};
      }
      return service.request(collectionPath, 'POST', null, null, JSON.stringify(collectionValues), {
        'Content-Type': 'application/json'
      }, callback);
    };
    setupDependencySearch = function(callback) {
      if (callback == null) {
        callback = function() {};
      }
      return Searches.setSearch('dependencyChecker', {
        searchString: '| fit',
        autostart: true,
        onDoneCallback: function() {
          return callback(true);
        },
        onErrorCallback: function(error) {
          if ((error != null) && error.indexOf('Failed to load Splunk_SA_Scientific_Python') >= 0) {
            return callback(false);
          } else {
            return callback(true);
          }
        }
      });
    };
    handleDependencyStatus = function(callback, hasDependency) {
      var body, errorWrapper;
      if (callback == null) {
        callback = function() {};
      }
      if (!hasDependency) {
        body = $(".dashboard-body");
        body.empty();
        errorWrapper = $('<div>').addClass("dependency-checker-error");
        body.append(errorWrapper);
        Messages.setAlert(errorWrapper, 'You must have Splunk_SA_Scientific_Python (Python for Scientific Computing App) installed to use the ML Toolkit and Showcase.', null, 'alert-inline');
        body.append($('<div style="width:700px; margin: auto; font-size: 14px;"> <p><i>Python for Scientific Computing</i> is a Splunk Add-on that includes several Python libraries for scientific computing, including numpy, scipy, pandas, scikit-learn, and statsmodels. Several of the dashboards included in the ML Toolkit and Showcase require these modules.</p> <p>Please download and install the platform-specific version of this add-on that is appropriate for your Splunk Search Head: <ul><li>Python for Scientific Computing (Mac): <a href="https://splunkbase.splunk.com/app/2881/">https://splunkbase.splunk.com/app/2881/</a> <li>Python for Scientific Computing (Linux 64-bit): <a href="https://splunkbase.splunk.com/app/2882/">https://splunkbase.splunk.com/app/2882/</a> <li>Python for Scientific Computing (Linux 32-bit): <a href="https://splunkbase.splunk.com/app/2884/">https://splunkbase.splunk.com/app/2884/</a> <li>Python for Scientific Computing (Windows 64-bit): <a href="https://splunkbase.splunk.com/app/2883/">https://splunkbase.splunk.com/app/2883/</a> </ul> </p> <p>After installing <i>Python for Scientific Computing</i>, please refresh this page.</p> </div>'));
      }
      return callback(hasDependency);
    };
    return DependencyChecker = (function() {
      function DependencyChecker() {}

      DependencyChecker.check = function(callback) {
        return getCollection(function(error, response) {
          var datum, hasDeps, i, len, ref;
          if (response != null) {
            hasDeps = false;
            ref = response.data;
            for (i = 0, len = ref.length; i < len; i++) {
              datum = ref[i];
              if (datum[keyName] === true) {
                hasDeps = true;
              }
            }
            if (hasDeps) {
              return handleDependencyStatus(callback, hasDeps);
            } else {
              return setupDependencySearch(function(hasPython) {
                handleDependencyStatus(callback, hasPython);
                if (hasPython) {
                  return setCollection({
                    Splunk_Scientific_Python: true
                  });
                }
              });
            }
          } else {
            return handleDependencyStatus(callback, true);
          }
        });
      };

      return DependencyChecker;

    })();
  });

}).call(this);
