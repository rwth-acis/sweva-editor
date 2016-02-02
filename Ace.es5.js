/* global Y */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function extend(Y) {
  Y.requestModules(['Array']).then(function () {
    var YAce = (function (_Y$Array$class) {
      _inherits(YAce, _Y$Array$class);

      function YAce(os, _model, idArray, valArray) {
        _classCallCheck(this, YAce);

        _get(Object.getPrototypeOf(YAce.prototype), 'constructor', this).call(this, os, _model, idArray, valArray);
        this.instances = [];
      }

      _createClass(YAce, [{
        key: 'toString',
        value: function toString() {
          return this.valArray.map(function (v) {
            if (typeof v === 'string') {
              return v;
            }
          }).join('');
        }
      }, {
        key: 'insert',
        value: function insert(pos, content) {
          var curPos = 0;
          var selection = {};
          for (var i = 0; i < this.valArray.length; i++) {
            if (curPos === pos) {
              break;
            }
            var v = this.valArray[i];
            if (typeof v === 'string') {
              curPos++;
            } else if (v.constructor === Array) {
              if (v[1] === null) {
                delete selection[v[0]];
              } else {
                selection[v[0]] = v[1];
              }
            }
          }
          _get(Object.getPrototypeOf(YAce.prototype), 'insert', this).call(this, i, content.split(''));
          return selection;
        }
      }, {
        key: 'delete',
        value: function _delete(pos, length) {
          /*
            let x = to be deleted string
            let s = some string
            let * = some selection
            E.g.
            sss*s***x*xxxxx***xx*x**ss*s
                 |---delete-range--|
               delStart         delEnd
             We'll check the following
            * is it possible to delete some of the selections?
              1. a dominating selection to the right could be the same as the selection (curSel) to delStart
              2. a selections could be overwritten by another selection to the right
          */
          var curPos = 0;
          var curSel = {};
          var endPos = pos + length;
          if (length <= 0) return;
          var delStart; // relative to valArray
          var delEnd; // ..
          var v, i; // helper variable for elements of valArray

          for (delStart = 0, v = this.valArray[delStart]; curPos < pos && delStart < this.valArray.length; v = this.valArray[++delStart]) {
            if (typeof v === 'string') {
              curPos++;
            } else if (v.constructor === Array) {
              curSel[v[0]] = v[1];
            }
          }
          for (delEnd = delStart, v = this.valArray[delEnd]; curPos < endPos && delEnd < this.valArray.length; v = this.valArray[++delEnd]) {
            if (typeof v === 'string') {
              curPos++;
            }
          }
          if (delEnd === this.valArray.length) {
            // yay, you can delete everything without checking
            for (i = delEnd - 1, v = this.valArray[i]; i >= delStart; v = this.valArray[--i]) {
              _get(Object.getPrototypeOf(YAce.prototype), 'delete', this).call(this, i, 1);
            }
          } else {
            if (typeof v === 'string') {
              delEnd--;
            }
            var rightSel = {};
            for (i = delEnd, v = this.valArray[i]; i >= delStart; v = this.valArray[--i]) {
              if (v.constructor === Array) {
                if (rightSel[v[0]] === undefined) {
                  if (v[1] === curSel[v[0]]) {
                    // case 1.
                    _get(Object.getPrototypeOf(YAce.prototype), 'delete', this).call(this, i, 1);
                  }
                  rightSel[v[0]] = v[1];
                } else {
                  // case 2.
                  _get(Object.getPrototypeOf(YAce.prototype), 'delete', this).call(this, i, 1);
                }
              } else if (typeof v === 'string') {
                // always delete the strings
                _get(Object.getPrototypeOf(YAce.prototype), 'delete', this).call(this, i, 1);
              }
            }
          }
        }
      }, {
        key: 'bind',
        value: function bind(ace, options) {
          this.instances.push(ace);
          var self = this;

          // this function makes sure that either the
          // quill event is executed, or the yjs observer is executed
          var token = true;
          function mutualExcluse(f) {
            if (token) {
              token = false;
              try {
                f();
              } catch (e) {
                token = true;
                throw new Error(e);
              }
              token = true;
            }
          }
          ace.markers = [];
          var disableMarkers = false;

          if (typeof options === 'object') {
            if (typeof options.disableMarkers !== 'undefined') {
              disableMarkers = options.disableMarkers;
            }
          }

          ace.setValue(this.valArray.join(''));

          ace.on('change', function (delta) {
            mutualExcluse(function () {
              var start = 0;
              var length = 0;

              var aceDocument = ace.getSession().getDocument();
              if (delta.action === 'insert') {
                start = aceDocument.positionToIndex(delta.start, 0);
                self.insert(start, delta.lines.join('\n'));
              } else if (delta.action === 'remove') {
                start = aceDocument.positionToIndex(delta.start, 0);
                length = delta.lines.join('\n').length;
                self['delete'](start, length);
              }
            });
          });

          if (!disableMarkers) {
            if (this.inteval) {
              clearInterval(this.inteval);
            }
            this.inteval = setInterval(function () {
              var i = 0;
              var now = Date.now();
              var timeVisible = 800;

              while (i < ace.markers.length) {
                var marker = ace.markers[i];

                if (marker.timestamp + timeVisible < now) {
                  ace.getSession().removeMarker(marker.id);
                  ace.markers.splice(i, 1);
                  i--;
                }
                i++;
              }
            }, 1000);
          }

          function setMarker(start, end, klazz) {
            if (disableMarkers) {
              return;
            }
            var offset = 0;
            if (start.row === end.row && start.column === end.column) {
              offset = 1;
            }
            var range = new ace.Range(start.row, start.column, end.row, end.column + offset);
            var marker = ace.session.addMarker(range, klazz, "text");
            ace.markers.push({ id: marker, timestamp: Date.now() });
          }

          this.observe(function (events) {

            var aceDocument = ace.getSession().getDocument();
            var start = 0;
            var end = 0;
            mutualExcluse(function () {

              for (var i = 0; i < events.length; i++) {
                var event = events[i];
                if (event.type === 'insert') {
                  start = aceDocument.indexToPosition(event.index, 0);
                  end = aceDocument.indexToPosition(event.index + event.value.length, 0);
                  aceDocument.insert(start, event.value);

                  setMarker(start, end, 'inserted');
                } else if (event.type === 'delete') {
                  start = aceDocument.indexToPosition(event.index, 0);
                  end = aceDocument.indexToPosition(event.index + event.length, 0);
                  var range = new ace.Range(start.row, start.column, end.row, end.column);
                  aceDocument.remove(range);

                  setMarker(start, end, 'deleted');
                }
              }
            });
          });
        }
      }, {
        key: '_changed',
        value: regeneratorRuntime.mark(function _changed() {
          var args$4$0 = arguments;
          return regeneratorRuntime.wrap(function _changed$(context$4$0) {
            while (1) switch (context$4$0.prev = context$4$0.next) {
              case 0:
                return context$4$0.delegateYield(Y.Array['class'].prototype._changed.apply(this, args$4$0), 't0', 1);

              case 1:
              case 'end':
                return context$4$0.stop();
            }
          }, _changed, this);
        })
      }, {
        key: 'length',
        get: function get() {
          /*
            TODO: I must not use observe to compute the length.
            But since I inherit from Y.Array, I can't set observe
            the changes at the right momet (for that I would require direct access to EventHandler).
            This is the most elegant solution, for now.
            But at some time you should re-write Y.Richtext more elegantly!!
          */
          return this.toString().length;
        }
      }]);

      return YAce;
    })(Y.Array['class']);

    Y.extend('Ace', new Y.utils.CustomType({
      name: 'Ace',
      'class': YAce,
      struct: 'List',
      initType: regeneratorRuntime.mark(function YTextInitializer(os, model) {
        var valArray, idArray;
        return regeneratorRuntime.wrap(function YTextInitializer$(context$3$0) {
          while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
              valArray = [];
              return context$3$0.delegateYield(Y.Struct.List.map.call(this, model, function (c) {
                valArray.push(c.content);
                return JSON.stringify(c.id);
              }), 't0', 2);

            case 2:
              idArray = context$3$0.t0;
              return context$3$0.abrupt('return', new YAce(os, model.id, idArray, valArray));

            case 4:
            case 'end':
              return context$3$0.stop();
          }
        }, YTextInitializer, this);
      })
    }));
  });
}

module.exports = extend;
if (typeof Y !== 'undefined') {
  extend(Y);
}