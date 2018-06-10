"use strict";

var wrapper = require("../module-wrapper");

var _require = require("../doc-utils"),
    isTextStart = _require.isTextStart,
    isTextEnd = _require.isTextEnd;

function addXMLPreserve(tag) {
	if (tag.indexOf('xml:space="preserve"') !== -1) {
		return tag;
	}
	return tag.substr(0, tag.length - 1) + ' xml:space="preserve">';
}

var spacePreserve = {
	name: "SpacePreserveModule",
	postparse: function postparse(postparsed) {
		var chunk = [];
		var inChunk = false;
		var endLindex = 0;
		var lastTextTag = 0;
		var result = postparsed.reduce(function (postparsed, part) {
			if (isTextStart(part) && part.tag === "w:t") {
				inChunk = true;
				lastTextTag = chunk.length;
			}
			if (!inChunk) {
				postparsed.push(part);
				return postparsed;
			}
			if (!endLindex && part.type === "placeholder" && !part.module) {
				endLindex = part.endLindex;
				chunk[0].value = addXMLPreserve(chunk[0].value);
			}
			chunk.push(part);
			if (isTextEnd(part)) {
				if (!endLindex) {
					Array.prototype.push.apply(postparsed, chunk);
					inChunk = false;
					lastTextTag = 0;
					endLindex = 0;
					chunk = [];
				} else if (part.lIndex > endLindex) {
					chunk[lastTextTag].value = addXMLPreserve(chunk[lastTextTag].value);
					Array.prototype.push.apply(postparsed, chunk);
					inChunk = false;
					lastTextTag = 0;
					endLindex = 0;
					chunk = [];
				}
			}
			return postparsed;
		}, []);
		Array.prototype.push.apply(result, chunk);
		return result;
	}
};
module.exports = function () {
	return wrapper(spacePreserve);
};