"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DocUtils = require("./doc-utils");
DocUtils.traits = require("./traits");
DocUtils.moduleWrapper = require("./module-wrapper");
var defaults = DocUtils.defaults,
    str2xml = DocUtils.str2xml,
    xml2str = DocUtils.xml2str,
    moduleWrapper = DocUtils.moduleWrapper,
    utf8ToWord = DocUtils.utf8ToWord,
    concatArrays = DocUtils.concatArrays,
    unique = DocUtils.unique;

var _require = require("./errors"),
    XTInternalError = _require.XTInternalError,
    throwFileTypeNotIdentified = _require.throwFileTypeNotIdentified,
    throwFileTypeNotHandled = _require.throwFileTypeNotHandled;

var Docxtemplater = function () {
	function Docxtemplater() {
		_classCallCheck(this, Docxtemplater);

		if (arguments.length > 0) {
			throw new Error("The constructor with parameters has been removed in docxtemplater 3, please check the upgrade guide.");
		}
		this.compiled = {};
		this.modules = [];
		this.setOptions({});
	}

	_createClass(Docxtemplater, [{
		key: "setModules",
		value: function setModules(obj) {
			this.modules.forEach(function (module) {
				module.set(obj);
			});
		}
	}, {
		key: "sendEvent",
		value: function sendEvent(eventName) {
			this.modules.forEach(function (module) {
				module.on(eventName);
			});
		}
	}, {
		key: "attachModule",
		value: function attachModule(module) {
			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
			var prefix = options.prefix;

			if (prefix) {
				module.prefix = prefix;
			}
			this.modules.push(moduleWrapper(module));
		}
	}, {
		key: "setOptions",
		value: function setOptions(options) {
			var _this = this;

			if (options.delimiters) {
				options.delimiters.start = utf8ToWord(options.delimiters.start);
				options.delimiters.end = utf8ToWord(options.delimiters.end);
			}
			this.options = options;
			Object.keys(defaults).forEach(function (key) {
				var defaultValue = defaults[key];
				_this.options[key] = _this.options[key] != null ? _this.options[key] : defaultValue;
				_this[key] = _this.options[key];
			});
			if (this.zip) {
				this.updateFileTypeConfig();
			}
		}
	}, {
		key: "loadZip",
		value: function loadZip(zip) {
			if (!zip.loadAsync) {
				throw new XTInternalError("Docxtemplater doesn't handle JSZip version <3, see changelog");
			}
			this.zip = zip;
			this.updateFileTypeConfig();

			this.modules = concatArrays([this.fileTypeConfig.baseModules.map(function (moduleFunction) {
				return moduleFunction();
			}), this.modules]);
			return this;
		}
	}, {
		key: "compileFile",
		value: function compileFile(index) {
			var _this2 = this;

			var fileName = this.templatedFiles[index];
			if (fileName && this.zip.files[fileName]) {
				return this.createTemplateClass(fileName).then(function (currentFile) {
					currentFile.parse();
					_this2.compiled[fileName] = currentFile;
					return _this2.compileFile(index + 1);
				});
			}
			if (index < this.templatedFiles.length) {
				return this.compileFile(index + 1);
			}
			return Promise.resolve();
		}
	}, {
		key: "resolveData",
		value: function resolveData(data) {
			var _this3 = this;

			return Promise.all(Object.keys(this.compiled).map(function (from) {
				var currentFile = _this3.compiled[from];
				return currentFile.resolveTags(data);
			})).then(function (resolved) {
				return concatArrays(resolved);
			});
		}
	}, {
		key: "compile",
		value: function compile() {
			var _this4 = this;

			if (Object.keys(this.compiled).length) {
				return Promise.resolve(this);
			}
			this.options = this.modules.reduce(function (options, module) {
				return module.optionsTransformer(options, _this4);
			}, this.options);
			this.options.xmlFileNames = unique(this.options.xmlFileNames);
			this.xmlDocuments = this.options.xmlFileNames.reduce(function (xmlDocuments, fileName) {
				return _this4.zip.files[fileName].async("string").then(function (content) {
					xmlDocuments[fileName] = str2xml(content);
					return xmlDocuments;
				});
			}, {});
			this.setModules({
				zip: this.zip,
				xmlDocuments: this.xmlDocuments
			});
			this.getTemplatedFiles();
			this.setModules({ compiled: this.compiled });
			// Loop inside all templatedFiles (ie xml files with content).
			// Sometimes they don't exist (footer.xml for example)
			return this.compileFile(0).then(function () {
				return _this4;
			});
		}
	}, {
		key: "updateFileTypeConfig",
		value: function updateFileTypeConfig() {
			var fileType = void 0;
			if (this.zip.files.mimetype) {
				fileType = "odt";
			}
			if (this.zip.files["word/document.xml"] || this.zip.files["word/document2.xml"]) {
				fileType = "docx";
			}
			if (this.zip.files["ppt/presentation.xml"]) {
				fileType = "pptx";
			}

			if (fileType === "odt") {
				throwFileTypeNotHandled(fileType);
			}
			if (!fileType) {
				throwFileTypeNotIdentified();
			}
			this.fileType = fileType;
			this.fileTypeConfig = this.options.fileTypeConfig || Docxtemplater.FileTypeConfig[this.fileType];
		}
	}, {
		key: "render",
		value: function render() {
			var _this5 = this;

			return this.compile().then(function () {
				_this5.setModules({
					data: _this5.data
				});
				_this5.mapper = _this5.modules.reduce(function (value, module) {
					return module.getRenderedMap(value);
				}, {});

				_this5.fileTypeConfig.tagsXmlLexedArray = unique(_this5.fileTypeConfig.tagsXmlLexedArray);
				_this5.fileTypeConfig.tagsXmlTextArray = unique(_this5.fileTypeConfig.tagsXmlTextArray);

				Object.keys(_this5.mapper).forEach(function (to) {
					var _mapper$to = _this5.mapper[to],
					    from = _mapper$to.from,
					    data = _mapper$to.data;

					var currentFile = _this5.compiled[from];
					currentFile.setTags(data);
					currentFile.render(to);
					_this5.zip.file(to, currentFile.content, { createFolders: true });
				});
				_this5.sendEvent("syncing-zip");
				_this5.syncZip();
				return _this5;
			});
		}
	}, {
		key: "syncZip",
		value: function syncZip() {
			var _this6 = this;

			Object.keys(this.xmlDocuments).forEach(function (fileName) {
				_this6.zip.remove(fileName);
				var content = xml2str(_this6.xmlDocuments[fileName]);
				return _this6.zip.file(fileName, content, { createFolders: true });
			});
		}
	}, {
		key: "setData",
		value: function setData(data) {
			this.data = data;
			return this;
		}
	}, {
		key: "getZip",
		value: function getZip() {
			return this.zip;
		}
	}, {
		key: "createTemplateClass",
		value: function createTemplateClass(path) {
			var _this7 = this;

			return this.zip.files[path].async("string").then(function (usedData) {
				return _this7.createTemplateClassFromContent(usedData, path);
			});
		}
	}, {
		key: "createTemplateClassFromContent",
		value: function createTemplateClassFromContent(content, filePath) {
			var _this8 = this;

			var xmltOptions = {
				filePath: filePath
			};
			Object.keys(defaults).forEach(function (key) {
				xmltOptions[key] = _this8[key];
			});
			xmltOptions.fileTypeConfig = this.fileTypeConfig;
			xmltOptions.modules = this.modules;
			return new Docxtemplater.XmlTemplater(content, xmltOptions);
		}
	}, {
		key: "getFullText",
		value: function getFullText(path) {
			return this.createTemplateClass(path || this.fileTypeConfig.textPath(this.zip)).then(function (templateClass) {
				return templateClass.getFullText();
			});
		}
	}, {
		key: "getTemplatedFiles",
		value: function getTemplatedFiles() {
			this.templatedFiles = this.fileTypeConfig.getTemplatedFiles(this.zip);
			return this.templatedFiles;
		}
	}]);

	return Docxtemplater;
}();

Docxtemplater.DocUtils = DocUtils;
Docxtemplater.Errors = require("./errors");
Docxtemplater.XmlTemplater = require("./xml-templater");
Docxtemplater.FileTypeConfig = require("./file-type-config");
Docxtemplater.XmlMatcher = require("./xml-matcher");
module.exports = Docxtemplater;