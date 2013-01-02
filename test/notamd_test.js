require('/test/assert.js');
require('/lib/notamd.js');

// global leak fix.
window.navigator;

suite('notamd', function() {

  test('presence', function() {
    assert.ok(NotAmd, 'not amd is available');
  });

  suite('.Observer', function() {
    var subject;

    setup(function() {
      subject = new NotAmd.Observer();
    });

    test('multiple tasks', function(done) {
      var fired = [];

      subject.track(function(cb) {
        fired.push('a');
        setTimeout(cb, 0);
      });

      subject.track(function(cb) {
        fired.push('b');
        setTimeout(cb, 0);
      });

      subject.notify(function() {
        assert.deepEqual(fired.sort(), ['a', 'b']);
        done();
      });
    });

    test('successful single action', function(done) {
      var cb;
      var times = 0;

      // wait for this task to complete
      subject.track(function(cb) {
        times++;
        setTimeout(cb, 0);
      });

      // verify we fire notify
      subject.notify(function() {
        assert.ok(subject.complete);
        // ensure we can call it again
        subject.notify(function() {
          assert.ok(subject.complete);
          // but it should not repeat the task
          assert.equal(times, 1);
          done();
        });
      });

      assert.ok(!subject.complete, 'not complete');
    });

    test('one success two failures', function(done) {
      var err1 = new Error();
      var err2 = new Error();
      var gotErrors = [];

      subject.onerror = function(err) {
        gotErrors.push(err);
      };

      subject.track(function(cb) {
        setTimeout(cb, 0, err1);
      });

      subject.track(function(cb) {
        setTimeout(cb, 1, err2);
      });

      subject.track(function(cb) {
        setTimeout(cb, 0, null);
      });

      subject.notify(function() {
        assert.equal(
          gotErrors[0],
          err1
        );

        assert.equal(
          gotErrors[1],
          err2
        );

        done();
      });
    });
  });

  suite('load with plugin', function() {
    var subject;
    var config;
    var loaded;

    var fooCalls = [];
    var barCalls = [];

    setup(function() {
      loaded = {
        foo: [],
        bar: []
      };

      fooCalls.length = 0;
      barCalls.length = 0;

      config = {
        plugins: {
          bar: function(name) {
            loaded.bar.push(name);
            barCalls.push(
              Array.prototype.slice.call(arguments)
            );
          },

          foo: function(name) {
            loaded.foo.push(name);
            fooCalls.push(
              Array.prototype.slice.call(arguments)
            );
          }
        }
      };
    });

    suite('packages', function() {
      setup(function() {
        config = Object.create(config);

        config.packages = {
          one: {
            foo: ['a', 'b'],
            bar: ['c', 'd']
          },

          two: {
            packages: ['one'],
            foo: ['c'],
            bar: ['e']
          }
        };
      });

      function callAll() {
        fooCalls.forEach(function(item) {
          item[2]();
        });

        barCalls.forEach(function(item) {
          item[2]();
        });
      }

      test('no package deps', function(done) {
        subject = NotAmd(config);
        subject.load('packages', 'one', function() {
          assert.deepEqual(
            loaded,
            {
              foo: ['a', 'b'],
              bar: ['c', 'd']
            },
            'loaded objects in order'
          );

          done();
        });

        callAll();
      });

      test('interdeps', function(done) {
        subject = NotAmd(config);
        subject.load('packages', 'two', function() {
          assert.deepEqual(
            loaded,
            {
              foo: ['a', 'b', 'c'],
              bar: ['c', 'd', 'e']
            }
          );
          done();
        });
        callAll();
      });
    });

    test('#load', function(done) {
      subject = NotAmd(config);
      var pending = 2;

      function next(err, type) {
        if (!(--pending)) {
          fooCalls.length = 0;

          subject.load('foo', 'nfoo', function() {
            assert.equal(fooCalls.length, 0);
            done();
          });
        }
      }

      subject.load(
        'foo',
        'nfoo',
        next
      );

      subject.load(
        'foo',
        'zfoo',
        next
      );

      subject.load(
        'foo',
        'zfoo',
        next
      );

      assert.equal(fooCalls.length, 2);

      fooCalls.forEach(function(item) {
        item[2]();
      });
    });
  });

  test('on error', function(done) {
    var error;
    var subject = NotAmd({
      plugins: {
        error: function(name, obs, callback) {
          setTimeout(callback, 0, new Error());
        }
      }
    });

    subject.onerror = function(found) {
      error = found;
    };

    subject.load(
      'error',
      'zfoo',
      function() {
        assert.ok(error instanceof Error, 'sends error');
        done();
      }
    );
  });
});
