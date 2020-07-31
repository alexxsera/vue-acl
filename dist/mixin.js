'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = undefined;

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _checker = require('./checker');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // @ts-check


var EventBus = new _vue2.default();

var currentGlobal = [];
var not = false;

var register = exports.register = function register(initial, acceptLocalRules, globalRules, router, notfound, middleware) {
  currentGlobal = Array.isArray(initial) ? initial : [initial];

  if (router !== null) {
    router.beforeEach(function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(to, from, next) {
        var notFoundPath, routePermission;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!middleware) {
                  _context.next = 3;
                  break;
                }

                _context.next = 3;
                return middleware({
                  change: function change(a) {
                    currentGlobal = a;
                  }
                });

              case 3:

                // to be backwards compatible (notfound could be string)
                notFoundPath = notfound.path || notfound;

                if (to.meta && to.meta.notfound) notFoundPath = to.meta.notfound;

                if (!(to.path === notFoundPath)) {
                  _context.next = 7;
                  break;
                }

                return _context.abrupt('return', next());

              case 7:
                if ('rule' in to.meta) {
                  _context.next = 9;
                  break;
                }

                return _context.abrupt('return', console.error('[vue-acl] ' + to.path + ' not have rule'));

              case 9:
                routePermission = to.meta.rule;


                if (routePermission in globalRules) {
                  routePermission = globalRules[routePermission];
                }

                if ((0, _checker.testPermission)(currentGlobal, routePermission)) {
                  _context.next = 15;
                  break;
                }

                if (!notfound.forwardQueryParams) {
                  _context.next = 14;
                  break;
                }

                return _context.abrupt('return', next({ path: notFoundPath, query: to.query }));

              case 14:
                return _context.abrupt('return', next(notFoundPath));

              case 15:
                return _context.abrupt('return', next());

              case 16:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined);
      }));

      return function (_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      };
    }());
  }

  return {
    /**
     * Called before create component
     */
    beforeCreate: function beforeCreate() {
      var self = this;

      this.$acl = {
        /**
         * Change current permission
         * @param {string|Array} param
         */
        change: function change(param) {
          param = Array.isArray(param) ? param : [param];
          if (currentGlobal.toString() !== param.toString()) {
            EventBus.$emit('vueacl-permission-changed', param);
          }
        },


        /**
         * get current permission
         */
        get get() {
          return currentGlobal;
        },

        /**
         * reverse current acl check
         */
        get not() {
          not = true;
          return this;
        },

        /**
         * Check if rule is valid currently
         * @param {string} ruleName rule name
         */
        check: function check(ruleName) {
          var hasNot = not;
          not = false;

          if (ruleName in globalRules) {
            var result = (0, _checker.testPermission)(this.get, globalRules[ruleName]);
            return hasNot ? !result : result;
          }

          if (ruleName in self) {
            if (!acceptLocalRules) {
              return console.error('[vue-acl] acceptLocalRules is not enabled');
            }

            var _result = (0, _checker.testPermission)(this.get, self[ruleName]);
            return hasNot ? !_result : _result;
          }

          return false;
        }
      };
    },
    created: function created() {
      EventBus.$on('vueacl-permission-changed', this.vue_aclOnChange);
    },
    destroyed: function destroyed() {
      EventBus.$off('vueacl-permission-changed', this.vue_aclOnChange);
    },

    methods: {
      vue_aclOnChange: function vue_aclOnChange(newPermission) {
        currentGlobal = newPermission;
        if ('onChange' in this.$acl) {
          this.$acl.onChange(currentGlobal);
        }
        this.$forceUpdate();
      }
    }
  };
};