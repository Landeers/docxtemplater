"use strict";

function moduleResolve(part, options) {
	var moduleResolved = void 0;
	for (var i = 0, l = options.modules.length; i < l; i++) {
		var _module = options.modules[i];
		moduleResolved = _module.resolve(part, options);
		if (moduleResolved) {
			return moduleResolved;
		}
	}
	return false;
}

function resolve(options) {
	var resolved = [];
	var baseNullGetter = options.baseNullGetter;
	var compiled = options.compiled,
	    scopeManager = options.scopeManager;

	var nullGetter = options.nullGetter = function (part, sm) {
		return baseNullGetter(part, sm || scopeManager);
	};
	options.resolved = resolved;
	var errors = [];
	return Promise.all(compiled.map(function (part) {
		var moduleResolved = moduleResolve(part, options);
		if (moduleResolved) {
			return moduleResolved.then(function (value) {
				resolved.push({ tag: part.value, value: value });
			});
		}
		if (part.type === "placeholder") {
			return scopeManager.getValueAsync(part.value, { part: part }).then(function (value) {
				if (value == null) {
					value = nullGetter(part);
				}
				resolved.push({ tag: part.value, value: value });
				return value;
			});
		}
		return;
	}).filter(function (a) {
		return a;
	})).then(function () {
		return { errors: errors, resolved: resolved };
	});
}

module.exports = resolve;