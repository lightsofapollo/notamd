(function(window) {

  window.MyGlobal = {};

  function camelize(str) {
    return str.replace(/(?:^|[-_])(\w)/g, function(_, c) {
      return c ? c.toUpperCase() : '';
    });
  }

  function loadElement(el, callback) {
    el.onerror = function() {
      callback(new Error('could not load a file'));
    };

    el.onload = function() {
      callback();
    };

    document.head.appendChild(el);
  }

  var config = {

    plugins: {
      html: function(file, obs, callback) {
      },

      js: function(file, obs, callback) {
        var name = camelize(file);

        // only needed if loader is used in addition to
        // directly sourcing scripts.
        if (name in MyGlobal) {
          setTimeout(callback, 0);
          return;
        }

        var el = document.createElement('script');

        el.async = false;
        el.src = './js/' + file + '.js';
        el.type = 'text/javascript';

        loadElement(el, callback);
      },

      style: function(file, obs, callback) {
        var el = document.createElement('link');
        el.setAttribute('rel', 'stylesheet');
        el.setAttribute('type', 'text/css');
        el.href = './style/' + file + '.css';

        loadElement(el, callback);
      },

      template: function(file, obs, callback) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', './templates/magic.html', true);
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            var el = document.createElement('div');
            el.innerHTML = xhr.responseText;
            if (el.children.length) {
              document.body.appendChild(el.children[0]);
              callback();
            }
          }
        };

        xhr.send();
      }
    },

    packages: {
      'one': {
        js: ['one', 'one_dep']
      },

      two: {
        js: ['two'],
        template: ['magic'],
        style: ['magic']
      },

      three: {
        js: ['three']
      }
    }
  };

  var loader = NotAmd(config);

  function init() {
    loader.load('packages', 'one', function() {
      loader.load('packages', 'two', function() {
        loader.load('packages', 'three', function() {
          console.log('DONE!');
        });
      });
    });
  }

  window.onload = init;

}(this));
