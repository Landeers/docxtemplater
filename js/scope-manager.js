"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("./errors"),
    getScopeParserExecutionError = _require.getScopeParserExecutionError;

function find(list, fn) {
	var length = list.length >>> 0;
	var value = void 0;

	for (var i = 0; i < length; i++) {
		value = list[i];
		if (fn.call(this, value, i, list)) {
			return value;
		}
	}
	return undefined;
}

// This class responsibility is to manage the scope
var ScopeManager = function () {
	function ScopeManager(options) {
		_classCallCheck(this, ScopeManager);

		this.scopePath = options.scopePath;
		this.scopePathItem = options.scopePathItem;
		this.scopeList = options.scopeList;
		this.parser = options.parser;
		this.resolved = options.resolved;
	}

	_createClass(ScopeManager, [{
		key: "loopOver",
		value: function loopOver(tag, callback, inverted, meta) {
			inverted = inverted || false;
			return this.loopOverValue(this.getValue(tag, meta), callback, inverted);
		}
	}, {
		key: "functorIfInverted",
		value: function functorIfInverted(inverted, functor, value, i) {
			if (inverted) {
				functor(value, i);
			}
		}
	}, {
		key: "isValueFalsy",
		value: function isValueFalsy(value, type) {
			return value == null || !value || type === "[object Array]" && value.length === 0;
		}
	}, {
		key: "loopOverValue",
		value: function loopOverValue(value, functor, inverted) {
			var type = Object.prototype.toString.call(value);
			var currentValue = this.scopeList[this.num];
			if (this.isValueFalsy(value, type)) {
				return this.functorIfInverted(inverted, functor, currentValue, 0);
			}
			if (type === "[object Array]") {
				for (var i = 0, scope; i < value.length; i++) {
					scope = value[i];
					this.functorIfInverted(!inverted, functor, scope, i);
				}
				return;
			}
			if (type === "[object Object]") {
				return this.functorIfInverted(!inverted, functor, value, 0);
			}
			return this.functorIfInverted(!inverted, functor, currentValue, 0);
		}
	}, {
		key: "getValue",
		value: function getValue(tag, meta, num) {
			var _this = this;

			this.num = num == null ? this.scopeList.length - 1 : num;
			var scope = this.scopeList[this.num];
			if (this.resolved) {
				var w = this.resolved;
				this.scopePath.forEach(function (p, index) {
					w = find(w, function (r) {
						return r.tag === p;
					});
					w = w.value[_this.scopePathItem[index]];
				});
				return find(w, function (r) {
					return r.tag === tag;
				}).value;
			}
			// search in the scopes (in reverse order) and keep the first defined value
			var result = void 0;
			var parser = this.parser(tag, { scopePath: this.scopePath });
			try {
				result = parser.get(scope, this.getContext(meta));
			} catch (error) {
				throw getScopeParserExecutionError({ tag: tag, scope: scope, error: error });
			}
			if (result == null && this.num > 0) {
				return this.getValue(tag, meta, this.num - 1);
			}
			return result;
		}
	}, {
		key: "getContext",
		value: function getContext(meta) {
			return {
				num: this.num,
				meta: meta,
				scopeList: this.scopeList,
				resolved: this.resolved,
				scopePath: this.scopePath,
				scopePathItem: this.scopePathItem
			};
		}
	}, {
		key: "getValueAsync",
		value: function getValueAsync(tag, meta, num) {
			var _this2 = this;

			this.num = num == null ? this.scopeList.length - 1 : num;
			var scope = this.scopeList[this.num];
			// search in the scopes (in reverse order) and keep the first defined value
			var parser = this.parser(tag, { scopePath: this.scopePath });
			return Promise.resolve(parser.get(scope, this.getContext(meta))).catch(function (error) {
				throw getScopeParserExecutionError({ tag: tag, scope: scope, error: error });
			}).then(function (result) {
				if (result == null && _this2.num > 0) {
					return _this2.getValueAsync(tag, meta, _this2.num - 1);
				}
				return result;
			});
		}
	}, {
		key: "createSubScopeManager",
		value: function createSubScopeManager(scope, tag, i) {
			return new ScopeManager({
				resolved: this.resolved,
				parser: this.parser,
				scopeList: this.scopeList.concat(scope),
				scopePath: this.scopePath.concat(tag),
				scopePathItem: this.scopePathItem.concat(i)
			});
		}
	}]);

	return ScopeManager;
}();

module.exports = function (options) {
	options.scopePath = [];
	options.scopePathItem = [];
	options.scopeList = [options.tags];
	return new ScopeManager(options);
};