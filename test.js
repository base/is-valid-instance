'use strict';

require('mocha');
var assert = require('assert');
var isValidInstance = require('./');
var Templates = require('templates');
var File = require('vinyl');
var Base = require('base');
var collection;
var app;
var view;
var file;

describe('is-valid-instance', function() {
  describe('main export', function() {
    beforeEach(function() {
      app = new Base();
    });

    it('should export a function', function() {
      assert.equal(typeof isValidInstance, 'function');
    });

    it('should false true if the value is not an object', function() {
      assert(!isValidInstance());
      assert(!isValidInstance(null));
      assert(!isValidInstance('foo'));
      assert(!isValidInstance([]));
      assert(!isValidInstance(42));
    });

    it('should return false if the value is not an instance of Base', function() {
      assert(!isValidInstance({}));
      assert(!isValidInstance({isApp: true}));
      function Foo() {};
      assert(new Foo());
    });

    it('should return false if `isApp` is not true', function() {
      var app = new Base();
      assert(!isValidInstance(app));
    });

    it('should return true if `isApp` is true', function() {
      var app = new Base();
      app.isApp = true;
      assert(isValidInstance(app));
    });

    it('should validate using the given `types`', function() {
      var app = new Base();
      app.isApp = true;
      assert(!isValidInstance(app, ['foo', 'bar']));
      app.isFoo = true;
      assert(isValidInstance(app, ['foo', 'bar']));
      app.isFoo = false;
      assert(!isValidInstance(app, ['foo', 'bar']));
      app.isBar = false;
      assert(!isValidInstance(app, ['foo', 'bar']));
      app.isBar = true;
      assert(isValidInstance(app, ['foo', 'bar']));
      assert(!isValidInstance(app, ['qux']));
      app._name = 'qux';
      assert(isValidInstance(app, ['qux']));
    });
  });

  describe('vinyl', function() {
    beforeEach(function() {
      file = new File({path: 'foo', contents: new Buffer('bar')});
    });

    it('should return false when a vinyl file is passed', function() {
      assert(!isValidInstance(file));
    });

    it('should return true when type is `vinyl`', function() {
      assert(isValidInstance(file, ['vinyl']));
    });

    it('should return true when type is `file`', function() {
      assert(isValidInstance(file, ['file']));
    });
  });

  describe('templates', function() {
    beforeEach(function() {
      app = new Templates();
    });

    it('should return true when an instance of Templates is passed', function() {
      assert(isValidInstance(app));
    });

    it('should return true when any is defined', function() {
      var app = new Templates();
      var Collection = Templates.Collection;
      var collection = new Collection();
      var View = Templates.View;
      var view = new View();
      assert(isValidInstance(app, ['*']));
      assert(isValidInstance(app, '*'));
      assert(isValidInstance(app, 'any'));
      assert(isValidInstance(app, ['any']));
      assert(isValidInstance(collection, ['*']));
      assert(isValidInstance(collection, '*'));
      assert(isValidInstance(collection, 'any'));
      assert(isValidInstance(collection, ['any']));
      assert(isValidInstance(view, ['*']));
      assert(isValidInstance(view, '*'));
      assert(isValidInstance(view, 'any'));
      assert(isValidInstance(view, ['any']));
    });

    it('should return false for an instance of Collection is passed', function() {
      var Collection = Templates.Collection;
      var collection = new Collection();
      assert(!isValidInstance(collection));
    });

    it('should return true for an instance of Collection when defined on types', function() {
      var Collection = Templates.Collection;
      var collection = new Collection();
      assert(isValidInstance(collection, ['collection']));
    });

    it('should return false for an instance of View is passed', function() {
      var View = Templates.View;
      var view = new View();
      assert(!isValidInstance(view));
    });

    it('should return true for an instance of View when defined on types', function() {
      var View = Templates.View;
      var view = new View();
      assert(isValidInstance(view, ['view']));
    });
  });

  describe('instance plugins', function() {
    beforeEach(function() {
      app = new Templates();
      app._name = 'app';
      collection = new Templates.Collection();
      view = new Templates.View({path: 'foo'});
    });

    it('should work for an instance of Templates', function() {
      var hits = [];
      var misses = [];
      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this)) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      app.use(plugin());
      collection.use(plugin());
      view.use(plugin());

      assert.deepEqual(hits, ['app']);
      assert.deepEqual(misses, ['collection', 'view']);
    });

    it('should work for an instance of Collection', function() {
      var hits = [];
      var misses = [];
      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this, ['collection'])) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      app.use(plugin());
      collection.use(plugin());
      view.use(plugin());

      assert.deepEqual(hits, ['collection']);
      assert.deepEqual(misses, ['app', 'view']);
    });

    it('should work for an instance of View', function() {
      var hits = [];
      var misses = [];
      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this, ['view'])) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      app.use(plugin());
      collection.use(plugin());
      view.use(plugin());

      assert.deepEqual(hits, ['view']);
      assert.deepEqual(misses, ['app', 'collection']);
    });

    it('should work for App and View', function() {
      var hits = [];
      var misses = [];
      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this, ['view', 'app'])) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      app.use(plugin());
      collection.use(plugin());
      view.use(plugin());

      assert.deepEqual(hits, ['app', 'view']);
      assert.deepEqual(misses, ['collection']);
    });

    it('should work for App and Collection', function() {
      var hits = [];
      var misses = [];
      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this, ['collection', 'app'])) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      app.use(plugin());
      collection.use(plugin());
      view.use(plugin());

      assert.deepEqual(hits, ['app', 'collection']);
      assert.deepEqual(misses, ['view']);
    });

    it('should work for App, Collection, and View', function() {
      var hits = [];
      var misses = [];
      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this, ['app', 'collection', 'view'])) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      app.use(plugin());
      collection.use(plugin());
      view.use(plugin());

      assert.deepEqual(hits, ['app', 'collection', 'view']);
      assert.deepEqual(misses, []);
    });

    it('should recurse down when defined on App', function() {
      var hits = [];
      var misses = [];
      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this, ['view'])) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      app.use(plugin())
        .run(collection)
        .run(view)

      assert.deepEqual(hits, ['view']);
      assert.deepEqual(misses, ['app', 'collection']);
    });

    it('should recurse down when defined on Collection', function() {
      var hits = [];
      var misses = [];

      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this, ['view'])) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      collection.use(plugin())
        .run(view)

      assert.deepEqual(hits, ['view']);
      assert.deepEqual(misses, ['collection']);
    });
  });

  describe('app view-collection plugin', function() {
    beforeEach(function() {
      app = new Templates();
      app._name = 'app';
      collection = app.create('pages');
      collection._name = 'pages';
      view = collection.addView('foo', {path: 'bar'});
      view._name = 'page';
    });

    it('should work on app with view collections', function() {
      var hits = [];
      var misses = [];
      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this)) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      app.use(plugin());
      assert.deepEqual(hits, ['app']);
      assert.deepEqual(misses, ['pages', 'page']);
    });

    it('should work on app with a view-collection view', function() {
      var hits = [];
      var misses = [];
      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this, 'page')) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      app.use(plugin());

      assert.deepEqual(hits, ['page']);
      assert.deepEqual(misses, ['app', 'pages']);
    });

    it('should work on app with a view', function() {
      var hits = [];
      var misses = [];
      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this, 'view')) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      app.use(plugin());

      assert.deepEqual(hits, ['page']);
      assert.deepEqual(misses, ['app', 'pages']);
    });

    it('should work on view collections', function() {
      var hits = [];
      var misses = [];
      function plugin() {
        return function fn(app) {
          if (!isValidInstance(this, ['views'])) {
            misses.push(this._name.toLowerCase());
            return fn;
          }
          hits.push(this._name.toLowerCase());
          return fn;
        };
      }

      collection.use(plugin());

      assert.deepEqual(hits, ['pages']);
      assert.deepEqual(misses, ['page']);
    });
  });
});
