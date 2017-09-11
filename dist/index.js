(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', './data', './cookies'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('./data'), require('./cookies'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.data, global.cookies);
    global.index = mod.exports;
  }
})(this, function (exports, _data, _cookies) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var data = _interopRequireWildcard(_data);

  var _cookies2 = _interopRequireDefault(_cookies);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var FORM_ELEMENTS = ['year', 'month', 'day', 'country', 'remember'];

  var AgeGate = function () {
    function AgeGate(opts, cb) {
      _classCallCheck(this, AgeGate);

      this.options = opts;
      this.callback = cb;
      this.isEnabled.data && this.validateData(opts.data);

      // render
      this.isEnabled.countries && this.populate();
      this.options.form.addEventListener('submit', this.submit.bind(this));
    }

    /**
     * Getters & Setters
     */


    _createClass(AgeGate, [{
      key: 'validateData',
      value: function validateData(data) {
        var random = Math.floor(Math.random() * (data.length - 0) + 0);

        // ensure: containing Array and Object keys
        var ok = Array.isArray(data) || data instanceof Array;
        ok = ok && ['code', 'name', 'age'].every(function (k) {
          return data[random].hasOwnProperty(k);
        });

        return ok ? data : this.respond(false, 'Supplied data is invalid');
      }
    }, {
      key: 'populate',
      value: function populate() {
        var select = this.options.form.querySelector('select');
        select.innerHTML = ''; // assume it's not empty

        // attempt to use user-supplied data
        if (this.isEnabled.data) this.data.forEach(function (country) {
          return select.appendChild(createOption(country));
        });

        // fallback to default data (continent-separated)
        else {
            Object.keys(data).forEach(function (continent) {
              var group = document.createElement('optgroup');
              group.label = continent;

              // create the <option> for each country
              for (var i = 0; i < data[continent].length; i++) {
                var country = data[continent][i];
                group.appendChild(createOption(country));
              }

              select.appendChild(group);
            });
          }

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
      value: function submit(e) {
        e.preventDefault();

        var elements = e.target.elements;

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
      value: function verify(formData) {
        var ok = false;
        var legalAge = this.ages[formData.country] || this.legalAge;
        var bday = [parseInt(formData.year, 10), parseInt(formData.month, 10) || 1, parseInt(formData.day, 10) || 1].join('/');
        var age = ~~((new Date().getTime() - +new Date(bday)) / 31557600000);

        if (legalAge !== null && age >= legalAge) {
          var expiry = formData.remember ? this.options.expiry : null;
          this.saveCookie(expiry);

          ok = true;
        }

        return ok;
      }
    }, {
      key: 'saveCookie',
      value: function saveCookie() {
        var expiry = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

        var path = this.options.path || null;
        var domain = this.options.domain || null;

        _cookies2.default.setItem(this.options.name || 'old_enough', true, expiry, path, domain);
      }
    }, {
      key: 'respond',
      value: function respond() {
        var success = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Age verification failure';

        if (success) this.callback(null);else this.callback(new Error('[AgeGate] ' + message));
      }
    }, {
      key: 'isEnabled',
      get: function get() {
        return {
          age: !!this.options.age,
          countries: !!this.options.countries,
          data: !!this.options.data
        };
      }
    }, {
      key: 'legalAge',
      get: function get() {
        var legalAge = this.options.age;

        if (typeof legalAge !== 'undefined' && !legalAge) {
          return null;
        }

        return parseInt(this.options.age, 10) || 18;
      }
    }, {
      key: 'data',
      get: function get() {
        return this.options.data || data;
      }
    }, {
      key: 'ages',
      get: function get() {
        var ages = {};

        if (this.options.data) {
          ages = this.data.reduce(function (total, item) {
            total[item.code] = item.age;
            return total;
          }, ages);
        } else {
          for (var cont in this.data) {
            this.data[cont].map(function (country) {
              ages[country.code] = country.age;
            });
          }
        }

        return ages;
      }
    }]);

    return AgeGate;
  }();

  exports.default = AgeGate;
});