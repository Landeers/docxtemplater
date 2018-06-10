"use strict";

var traits = require("../traits");

var _require = require("../doc-utils"),
    isContent = _require.isContent;

var _require2 = require("../errors"),
    throwRawTagShouldBeOnlyTextInParagraph = _require2.throwRawTagShouldBeOnlyTextInParagraph;

var moduleName = "rawxml";
var wrapper = require("../module-wrapper");

function getNearestLeft(parsed, elements, index) {
	for (var i = index; i >= 0; i--) {
		var part = parsed[i];
		for (var j = 0, len = elements.length; j < len; j++) {
			var element = elements[j];
			if (part.value.indexOf("<" + element) === 0 && [">", " "].indexOf(part.value[element.length + 1]) !== -1) {
				return elements[j];
			}
		}
	}
	return null;
}

function getNearestRight(parsed, elements, index) {
	for (var i = index, l = parsed.length; i < l; i++) {
		var part = parsed[i];
		for (var j = 0, len = elements.length; j < len; j++) {
			var element = elements[j];
			if (part.value === "</" + element + ">") {
				return elements[j];
			}
		}
	}
	return -1;
}

function getInner(_ref) {
	var part = _ref.part,
	    left = _ref.left,
	    right = _ref.right,
	    postparsed = _ref.postparsed,
	    index = _ref.index;

	var before = getNearestLeft(postparsed, ["w:p", "w:tc"], left - 1);
	var after = getNearestRight(postparsed, ["w:p", "w:tc"], right + 1);
	if (before === after && before === "w:tc") {
		part.emptyValue = "<w:p></w:p>";
	}
	var paragraphParts = postparsed.slice(left + 1, right);
	paragraphParts.forEach(function (p, i) {
		if (i === index - left - 1) {
			return;
		}
		if (isContent(p)) {
			throwRawTagShouldBeOnlyTextInParagraph({ paragraphParts: paragraphParts, part: part });
		}
	});
	return part;
}

var rawXmlModule = {
	name: "RawXmlModule",
	prefix: "@",
	optionsTransformer: function optionsTransformer(options, docxtemplater) {
		this.fileTypeConfig = docxtemplater.fileTypeConfig;
		return options;
	},
	parse: function parse(placeHolderContent) {
		var type = "placeholder";
		if (placeHolderContent[0] !== this.prefix) {
			return null;
		}
		return { type: type, value: placeHolderContent.substr(1), module: moduleName };
	},
	postparse: function postparse(postparsed) {
		return traits.expandToOne(postparsed, {
			moduleName: moduleName,
			getInner: getInner,
			expandTo: this.fileTypeConfig.tagRawXml
		});
	},
	render: function render(part, options) {
		if (part.module !== moduleName) {
			return null;
		}
		var value = options.scopeManager.getValue(part.value, { part: part });
		if (value == null) {
			value = options.nullGetter(part);
		}
		if (!value) {
			return { value: part.emptyValue || "" };
		}
		return { value: value };
	},
	resolve: function resolve(part, options) {
		if (!part.type === "placeholder" || part.module !== moduleName) {
			return null;
		}
		return options.scopeManager.getValueAsync(part.value, { part: part }).then(function (value) {
			if (value == null) {
				return options.nullGetter(part);
			}
			return value;
		});
	}
};

module.exports = function () {
	return wrapper(rawXmlModule);
};