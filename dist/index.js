(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', './data', './cookies'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('./data'), require('./cookies'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.data, global.cookies);
    global.index = mod.exports;
  }
})(this, function (exports, module, _data, _cookies) {
  'use strict';

  var _interopRequire = function (obj) { return obj && obj.__esModule ? obj['default'] : obj; };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _data2 = _interopRequire(_data);

  var _cookies2 = _interopRequire(_cookies);

  var FORM_ELEMENTS = ['year', 'month', 'day', 'country', 'remember'];

  var AgeGate = (function () {
    function AgeGate(opts, cb) {
      _classCallCheck(this, AgeGate);

      // set options
      this.options = opts;
      this.callback = cb;

      this.isEnabled.data && this.validateData(opts.data); // validate data

      // render
      this.isEnabled.countries && this.populate();
      this.options.form.addEventListener('submit', this.submit.bind(this));
    }

    _createClass(AgeGate, [{
      key: 'isEnabled',

      /**
       * Getters & Setters
       */
      get: function () {
        return {
          age: !!this.options.age,
          countries: !!this.options.countries,
          data: !!this.options.data
        };
      }
    }, {
      key: 'legalAge',
      get: function () {
        return parseFloat(this.options.age) || 18;
      }
    }, {
      key: 'data',
      get: function () {
        return this.options.data || _data2;
      }
    }, {
      key: 'ages',

      /**
       * Convert age data into usable key => value
       */
      get: function () {
        var ages = {};

        if (this.options.data) {
          ages = this.data.reduce(function (total, item) {
            total[item.code] = item.age;
            return total;
          }, ages);
        } else {
          for (var cont in this.data) {
            this.data[cont].map(function (country) {
              return ages[country.code] = country.age;
            });
          }
        }

        return ages;
      }
    }, {
      key: 'validateData',

      /**
       * Check data structure of supplied data
       *
       * @param {Array} data
       */
      value: function validateData(data) {
        var random = Math.floor(Math.random() * (data.length - 0) + 0);

        // ensure: containing Array and Object keys
        var ok = Array.isArray(data) || data instanceof Array;
        ok = ok && ['code', 'name', 'age'].every(function (k) {
          return data[random].hasOwnProperty(k);
        });

        if (ok) {
          return data;
        } else this.respond(false, 'Supplied data is invalid');
      }
    }, {
      key: 'populate',

      /**
       * Add countries to <select> element
       */
      value: function populate() {
        var _this = this;

        var select = this.options.form.querySelector('select');
        select.innerHTML = ''; // assume it's not empty

        // attempt to use user-supplied data
        if (this.isEnabled.data) Object.keys(this.data).forEach(function (i) {
          return select.appendChild(createOption(_this.data[i]));
        });

        // fallback to default data (continent-separated)
        else Object.keys(_data2).forEach(function (continent) {
          var group = document.createElement('optgroup');
          group.label = continent;

          // create the <option> for each country
          for (var i = 0; i < _data2[continent].length; i++) {
            var country = _data2[continent][i];
            group.appendChild(createOption(country));
          }

          select.appendChild(group);
        });

        // create the <option> element
        function createOption(country) {
          var option = document.createElement('option');

          for (var attr in country) {
            option.dataset[attr] = country[attr];
          }
          option.value = country.code;
          option.textContent = country.name;

          return option;
        }
      }
    }, {
      key: 'submit',

      /**
       * Serialize form data on submit,
       * and pass onto validation
       *
       * @param {Event} e - form submit event
       */
      value: function submit(e) {
        e.preventDefault();

        var elements = e.srcElement.elements;

        // create an object from the form data
        this.formData = FORM_ELEMENTS.reduce(function (collection, key) {
          if (!elements[key]) return collection;

          switch (key) {
            case 'remember':
              collection[key] = elements[key].checked;
              break;
            default:
              collection[key] = elements[key].value;
              break;
          }

          return collection;
        }, {});

        this.respond(this.verify(this.formData));
      }
    }, {
      key: 'verify',

      /**
       * Parse form data
       * Calculate the age and insert cookie if needed
       * Age calculator by Kristoffer Dorph
       * http://stackoverflow.com/a/15555947/362136
       *
       * @param {Object} formData
       */
      value: function verify(formData) {
        var ok = false,
            legalAge = this.ages[formData.country] || this.legalAge;
        var date = [parseFloat(formData.year), parseFloat(formData.month) || 1, parseFloat(formData.day) || 1].join('/');
        var age = ~ ~((new Date().getTime() - +new Date(date)) / 31557600000);

        // set cookie if desired
        if (!!formData.remember) this.saveCookie(this.options.expiry);else this.saveCookie();

        if (age >= legalAge) ok = true;

        return ok;
      }
    }, {
      key: 'saveCookie',

      /**
       * Create a cookie to remember age
       *
       * @param {*} expiry - Cookie expiration (0|Infinity|Date)
       */
      value: function saveCookie() {
        var expiry = arguments[0] === undefined ? null : arguments[0];

        _cookies2.setItem('old_enough', true, expiry);
      }
    }, {
      key: 'respond',

      /**
       * Issue the callback with final verdict
       *
       * @param {boolean} success - Age verification verdict
       * @param {string} message - Error message
       */
      value: function respond() {
        var success = arguments[0] === undefined ? false : arguments[0];
        var message = arguments[1] === undefined ? 'Age verification failure' : arguments[1];

        if (success) this.callback(null);else this.callback(new Error('[AgeGate] ' + message));
      }
    }]);

    return AgeGate;
  })();

  module.exports = AgeGate;
});