"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var JSZip = require("jszip");

var _require = require("lodash"),
    merge = _require.merge;

var angularParser = require("./angular-parser");
var Docxtemplater = require("../docxtemplater.js");

var _require2 = require("./utils"),
    expect = _require2.expect,
    createXmlTemplaterDocx = _require2.createXmlTemplaterDocx,
    createDoc = _require2.createDoc,
    imageData = _require2.imageData,
    getContent = _require2.getContent;

var inspectModule = require("../inspect-module.js");

function getLength(obj) {
	if (obj instanceof ArrayBuffer) {
		return obj.byteLength;
	}
	return obj.length;
}

describe("Loading", function () {
	describe("ajax done correctly", function () {
		it("doc and img Data should have the expected length", function (done) {
			createDoc("image-example.docx").then(function (doc) {
				expect(getLength(doc.loadedContent)).to.be.equal(729580);
				expect(getLength(imageData["image.png"])).to.be.equal(18062);
				done();
			});
		});
		it("should have the right number of files (the docx unzipped)", function (done) {
			createDoc("image-example.docx").then(function (doc) {
				expect(Object.keys(doc.zip.files).length).to.be.equal(16);
				done();
			});
		});
	});
	describe("basic loading", function () {
		it("should load file image-example.docx", function (done) {
			createDoc("image-example.docx").then(function (doc) {
				expect(typeof doc === "undefined" ? "undefined" : _typeof(doc)).to.be.equal("object");
				done();
			});
		});
	});
	describe("content_loading", function () {
		it("should load the right content for the footer", function (done) {
			createDoc("image-example.docx").then(function (doc) {
				doc.getFullText("word/footer1.xml").then(function (fullText) {
					expect(fullText.length).not.to.be.equal(0);
					expect(fullText).to.be.equal("{last_name}{first_name}{phone}");
					done();
				});
			});
		});
		it("should load the right content for the document", function (done) {
			createDoc("image-example.docx").then(function (doc) {
				doc.getFullText().then(function (fullText) {
					expect(fullText).to.be.equal("");
					done();
				});
			});
		});
		it("should load the right template files for the document", function (done) {
			createDoc("tag-example.docx").then(function (doc) {
				var templatedFiles = doc.getTemplatedFiles();
				expect(templatedFiles).to.be.eql(["word/header1.xml", "word/footer1.xml", "docProps/core.xml", "docProps/app.xml", "word/document.xml", "word/document2.xml"]);
				done();
			});
		});
	});
	describe("output and input", function () {
		it("should be the same", function (done) {
			createDoc("tag-example.docx").then(function (doc) {
				var zip = new JSZip();
				zip.loadAsync(doc.loadedContent).then(function (zip) {
					var doc = new Docxtemplater().loadZip(zip);
					doc.getZip().generateAsync({ type: "base64" }).then(function (output) {
						expect(output.length).to.be.equal(90732);
						expect(output.substr(0, 50)).to.be.equal("UEsDBAoAAAAAAAAAIQAMTxYSlgcAAJYHAAATAAAAW0NvbnRlbn");
						done();
					});
				});
			});
		});
	});
});

describe("Inspect module", function () {
	it("should get main tags", function (done) {
		createDoc("tag-loop-example.docx").then(function (doc) {
			var iModule = inspectModule();
			doc.attachModule(iModule);
			doc.compile().then(function () {
				expect(iModule.getTags()).to.be.deep.equal({
					offre: {
						nom: {},
						prix: {},
						titre: {}
					},
					nom: {},
					prenom: {}
				});
				done();
			});
		});
	});

	it("should get all tags", function (done) {
		createDoc("multi-page.pptx").then(function (doc) {
			var iModule = inspectModule();
			doc.attachModule(iModule);
			doc.compile().then(function () {
				expect(iModule.getAllTags()).to.be.deep.equal({
					tag: {},
					users: {
						name: {}
					}
				});
				done();
			});
		});
	});

	it("should get all tags and merge them", function (done) {
		createDoc("multi-page-to-merge.pptx").then(function (doc) {
			var iModule = inspectModule();
			doc.attachModule(iModule);
			doc.compile().then(function () {
				expect(iModule.getAllTags()).to.be.deep.equal({
					tag: {},
					users: {
						name: {},
						age: {},
						company: {}
					}
				});
				done();
			});
		});
	});
});

describe("Docxtemplater loops", function () {
	it("should replace all the tags", function (done) {
		var tags = {
			nom: "Hipp",
			prenom: "Edgar",
			telephone: "0652455478",
			description: "New Website",
			offre: [{ titre: "titre1", prix: "1250" }, { titre: "titre2", prix: "2000" }, { titre: "titre3", prix: "1400", nom: "Offre" }]
		};
		createDoc("tag-loop-example.docx").then(function (doc) {
			doc.setData(tags);
			doc.render().then(function () {
				doc.getFullText().then(function (text) {
					expect(text).to.be.equal("Votre proposition commercialeHippPrix: 1250Titre titre1HippPrix: 2000Titre titre2OffrePrix: 1400Titre titre3HippEdgar");
					done();
				});
			});
		});
	});
	it("should work with loops inside loops", function (done) {
		var tags = {
			products: [{
				title: "Microsoft",
				name: "DOS",
				reference: "Win7",
				avantages: [{
					title: "Everyone uses it",
					proof: [{ reason: "it is quite cheap" }, { reason: "it is quit simple" }, { reason: "it works on a lot of different Hardware" }]
				}]
			}, {
				title: "Linux",
				name: "Ubuntu",
				reference: "Ubuntu10",
				avantages: [{
					title: "It's very powerful",
					proof: [{ reason: "the terminal is your friend" }, { reason: "Hello world" }, { reason: "it's free" }]
				}]
			}, {
				title: "Apple",
				name: "Mac",
				reference: "OSX",
				avantages: [{
					title: "It's very easy",
					proof: [{ reason: "you can do a lot just with the mouse" }, { reason: "It's nicely designed" }]
				}]
			}]
		};
		createDoc("tag-product-loop.docx").then(function (doc) {
			doc.setData(tags);
			doc.render().then(function () {
				doc.getFullText().then(function (text) {
					var expectedText = "MicrosoftProduct name : DOSProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed";
					expect(text.length).to.be.equal(expectedText.length);
					expect(text).to.be.equal(expectedText);
					done();
				});
			});
		});
	});
	it("should work with object value", function (done) {
		var content = "<w:t>{#todo}{todo}{/todo}</w:t>";
		var expectedContent = '<w:t xml:space="preserve">abc</w:t>';
		var scope = { todo: { todo: "abc" } };
		createXmlTemplaterDocx(content, { tags: scope }).then(function (xmlTemplater) {
			xmlTemplater.render().then(function () {
				getContent(xmlTemplater).then(function (c) {
					expect(c).to.be.deep.equal(expectedContent);
					done();
				});
			});
		});
	});
	it("should work with string value", function (done) {
		var content = "<w:t>{#todo}{todo}{/todo}</w:t>";
		var expectedContent = '<w:t xml:space="preserve">abc</w:t>';
		var scope = { todo: "abc" };
		createXmlTemplaterDocx(content, { tags: scope }).then(function (xmlTemplater) {
			xmlTemplater.render().then(function () {
				getContent(xmlTemplater).then(function (c) {
					expect(c).to.be.deep.equal(expectedContent);
					done();
				});
			});
		});
	});
	it("should not have sideeffects with inverted with array length 3", function (done) {
		var content = "<w:t>{^todos}No {/todos}Todos</w:t><w:t>{#todos}{.}{/todos}</w:t>";
		var expectedContent = '<w:t>Todos</w:t><w:t xml:space="preserve">ABC</w:t>';
		var scope = { todos: ["A", "B", "C"] };
		createXmlTemplaterDocx(content, { tags: scope }).then(function (xmlTemplater) {
			getContent(xmlTemplater).then(function (c) {
				expect(c).to.be.deep.equal(expectedContent);
				done();
			});
		});
	});
	it("should not have sideeffects with inverted with empty array", function (done) {
		var content = "<w:t>{^todos}No {/todos}Todos</w:t>\n\t\t<w:t>{#todos}{.}{/todos}</w:t>";
		var expectedContent = "<w:t>No Todos</w:t>\n\t\t<w:t xml:space=\"preserve\"></w:t>";
		var scope = { todos: [] };
		createXmlTemplaterDocx(content, { tags: scope }).then(function (xmlTemplater) {
			getContent(xmlTemplater).then(function (c) {
				expect(c).to.be.deep.equal(expectedContent);
				done();
			});
		});
	});

	it("should provide inverted loops", function (done) {
		var promises = [];
		var content = "<w:t>{^products}No products found{/products}</w:t>";
		[{ products: [] }, { products: false }, {}].forEach(function (tags) {
			promises.push(createXmlTemplaterDocx(content, { tags: tags }).then(function (doc) {
				doc.render().then(function () {
					doc.getFullText().then(function (text) {
						expect(text).to.be.equal("No products found");
					});
				});
			}));
		});

		[{ products: [{ name: "Bread" }] }, { products: true }, { products: "Bread" }, { products: { name: "Bread" } }].forEach(function (tags) {
			promises.push(createXmlTemplaterDocx(content, { tags: tags }).then(function (doc) {
				doc.render().then(function () {
					doc.getFullText().then(function (text) {
						expect(text).to.be.equal("");
					});
				});
			}));
		});
		Promise.all(promises).then(function () {
			done();
		});
	});

	it("should be possible to close loops with {/}", function (done) {
		var content = "<w:t>{#products}Product {name}{/}</w:t>";
		var tags = { products: [{ name: "Bread" }] };
		createXmlTemplaterDocx(content, { tags: tags }).then(function (doc) {
			doc.render().then(function () {
				doc.getFullText().then(function (text) {
					expect(text).to.be.equal("Product Bread");
					done();
				});
			});
		});
	});

	it("should be possible to close double loops with {/}", function (done) {
		var content = "<w:t>{#companies}{#products}Product {name}{/}{/}</w:t>";
		var tags = { companies: [{ products: [{ name: "Bread" }] }] };
		createXmlTemplaterDocx(content, { tags: tags }).then(function (doc) {
			doc.render().then(function () {
				doc.getFullText().then(function (text) {
					expect(text).to.be.equal("Product Bread");
					done();
				});
			});
		});
	});

	it("should work with complex loops", function (done) {
		var content = "<w:t>{title} {#users} {name} friends are : {#friends} {.</w:t>TAG..TAG<w:t>},{/friends} {/users</w:t>TAG2<w:t>}</w:t>";
		var scope = {
			title: "###Title###",
			users: [{ name: "John Doe", friends: ["Jane", "Henry"] }, {}],
			name: "Default",
			friends: ["None"]
		};
		createXmlTemplaterDocx(content, { tags: scope }).then(function (doc) {
			doc.render().then(function () {
				doc.getFullText().then(function (text) {
					expect(text).to.be.equal("###Title###  John Doe friends are :  Jane, Henry,  Default friends are :  None, ");
					done();
				});
			});
		});
	});
});

describe("Changing the parser", function () {
	it("should work with uppercassing", function (done) {
		var content = "<w:t>Hello {name}</w:t>";
		var scope = { name: "Edgar" };
		function parser(tag) {
			return _defineProperty({}, "get", function get(scope) {
				return scope[tag].toUpperCase();
			});
		}
		createXmlTemplaterDocx(content, {
			tags: scope,
			parser: parser
		}).then(function (xmlTemplater) {
			xmlTemplater.render().then(function () {
				xmlTemplater.getFullText().then(function (text) {
					expect(text).to.be.equal("Hello EDGAR");
					done();
				});
			});
		});
	});
	it("should work when setting from the Docxtemplater interface", function (done) {
		createDoc("tag-example.docx").then(function (doc) {
			var zip = new JSZip();
			zip.loadAsync(doc.loadedContent).then(function (zip) {
				var d = new Docxtemplater().loadZip(zip);
				var tags = {
					first_name: "Hipp",
					last_name: "Edgar",
					phone: "0652455478",
					description: "New Website"
				};
				d.setData(tags);
				d.parser = function (tag) {
					return _defineProperty({}, "get", function get(scope) {
						return scope[tag].toUpperCase();
					});
				};
				d.render().then(function () {
					var results = [];
					results.push(d.getFullText().then(function (text) {
						expect(text).to.be.equal("EDGAR HIPP");
					}));
					results.push(d.getFullText("word/header1.xml").then(function (text) {
						expect(text).to.be.equal("EDGAR HIPP0652455478NEW WEBSITE");
					}));
					results.push(d.getFullText("word/footer1.xml").then(function (text) {
						expect(text).to.be.equal("EDGARHIPP0652455478");
					}));
					Promise.all(results).then(function () {
						done();
					});
				});
			});
		});
	});

	it("should work with angular parser", function (done) {
		var tags = {
			person: {
				first_name: "Hipp",
				last_name: "Edgar",
				birth_year: 1955,
				age: 59
			}
		};
		createDoc("angular-example.docx").then(function (doc) {
			doc.setData(tags);
			doc.setOptions({ parser: angularParser });
			doc.render().then(function () {
				doc.getFullText().then(function (text) {
					expect(text).to.be.equal("Hipp Edgar 2014");
					done();
				});
			});
		});
	});

	it("should work with loops", function (done) {
		var content = "<w:t>Hello {#person.adult}you{/person.adult}</w:t>";
		var scope = { person: { name: "Edgar", adult: true } };
		createXmlTemplaterDocx(content, {
			tags: scope,
			parser: angularParser
		}).then(function (xmlTemplater) {
			xmlTemplater.render().then(function () {
				xmlTemplater.getFullText().then(function (text) {
					expect(text).to.be.equal("Hello you");
					done();
				});
			});
		});
	});

	it("should be able to access meta to get the index", function (done) {
		var content = "<w:t>Hello {#users}{$index} {name} {/users}</w:t>";
		var scope = {
			users: [{ name: "Jane" }, { name: "Mary" }]
		};
		createXmlTemplaterDocx(content, {
			tags: scope,
			parser: function parser(tag) {
				return {
					get: function get(scope, context) {
						if (tag === "$index") {
							var indexes = context.scopePathItem;
							return indexes[indexes.length - 1];
						}
						return scope[tag];
					}
				};
			}
		}).then(function (xmlTemplater) {
			xmlTemplater.render().then(function () {
				xmlTemplater.getFullText().then(function (text) {
					expect(text).to.be.equal("Hello 0 Jane 1 Mary ");
					done();
				});
			});
		});
	});

	it("should be able to access meta to get the type of tag", function (done) {
		var content = "<w:p><w:t>Hello {#users}{name}{/users}</w:t></w:p>\n\t\t<w:p><w:t>{@rrr}</w:t></w:p>\n\t\t";
		var scope = {
			users: [{ name: "Jane" }],
			rrr: ""
		};
		var contexts = [];
		createXmlTemplaterDocx(content, {
			tags: scope,
			parser: function parser(tag) {
				return {
					get: function get(scope, context) {
						contexts.push(context);
						if (tag === "$index") {
							var indexes = context.scopePathItem;
							return indexes[indexes.length - 1];
						}
						return scope[tag];
					}
				};
			}
		}).then(function (xmlTemplater) {
			xmlTemplater.getFullText().then(function (text) {
				expect(text).to.be.equal("Hello Jane");
				var values = contexts.map(function (_ref3) {
					var _ref3$meta$part = _ref3.meta.part,
					    type = _ref3$meta$part.type,
					    value = _ref3$meta$part.value,
					    module = _ref3$meta$part.module;

					return { type: type, value: value, module: module };
				});
				expect(values).to.be.deep.equal([{
					type: "placeholder",
					value: "users",
					module: "loop"
				}, {
					type: "placeholder",
					value: "name",
					module: undefined
				}, {
					type: "placeholder",
					value: "rrr",
					module: "rawxml"
				}]);
				done();
			});
		});
	});
});

describe("Change the delimiters", function () {
	it("should work with lt and gt delimiter < and >", function (done) {
		createDoc("delimiter-gt.docx").then(function (doc) {
			doc.setOptions({
				delimiters: {
					start: "<",
					end: ">"
				}
			});
			doc.setData({
				user: "John"
			});
			doc.render().then(function () {
				doc.getFullText().then(function (fullText) {
					expect(fullText).to.be.equal("Hello John");
					done();
				});
			});
		});
	});
});

describe("Special characters", function () {
	it("should parse placeholder containing special characters", function (done) {
		var content = "<w:t>Hello {&gt;name}</w:t>";
		var scope = { ">name": "Edgar" };
		createXmlTemplaterDocx(content, { tags: scope }).then(function (xmlTemplater) {
			getContent(xmlTemplater).then(function (c) {
				expect(c).to.be.deep.equal('<w:t xml:space="preserve">Hello Edgar</w:t>');
				done();
			});
		});
	});

	it("should render placeholder containing special characters", function (done) {
		var content = "<w:t>Hello {name}</w:t>";
		var scope = { name: "<Edgar>" };
		createXmlTemplaterDocx(content, { tags: scope }).then(function (xmlTemplater) {
			getContent(xmlTemplater).then(function (c) {
				expect(c).to.be.deep.equal('<w:t xml:space="preserve">Hello &lt;Edgar&gt;</w:t>');
				done();
			});
		});
	});

	it("should read full text correctly", function (done) {
		createDoc("cyrillic.docx").then(function (doc) {
			doc.getFullText().then(function (fullText) {
				expect(fullText.charCodeAt(0)).to.be.equal(1024);
				expect(fullText.charCodeAt(1)).to.be.equal(1050);
				expect(fullText.charCodeAt(2)).to.be.equal(1048);
				expect(fullText.charCodeAt(3)).to.be.equal(1046);
				expect(fullText.charCodeAt(4)).to.be.equal(1044);
				expect(fullText.charCodeAt(5)).to.be.equal(1045);
				expect(fullText.charCodeAt(6)).to.be.equal(1039);
				expect(fullText.charCodeAt(7)).to.be.equal(1040);
				done();
			});
		});
	});
	it("should still read full text after applying tags", function (done) {
		createDoc("cyrillic.docx").then(function (doc) {
			doc.setData({ name: "Edgar" });
			doc.render().then(function () {
				doc.getFullText().then(function (fullText) {
					expect(fullText.charCodeAt(0)).to.be.equal(1024);
					expect(fullText.charCodeAt(1)).to.be.equal(1050);
					expect(fullText.charCodeAt(2)).to.be.equal(1048);
					expect(fullText.charCodeAt(3)).to.be.equal(1046);
					expect(fullText.charCodeAt(4)).to.be.equal(1044);
					expect(fullText.charCodeAt(5)).to.be.equal(1045);
					expect(fullText.charCodeAt(6)).to.be.equal(1039);
					expect(fullText.charCodeAt(7)).to.be.equal(1040);
					expect(fullText.indexOf("Edgar")).to.be.equal(9);
					done();
				});
			});
		});
	});
	it("should insert russian characters", function (done) {
		var russianText = [1055, 1091, 1087, 1082, 1080, 1085, 1072];
		var russian = russianText.map(function (char) {
			return String.fromCharCode(char);
		}).join("");
		createDoc("tag-example.docx").then(function (doc) {
			var zip = new JSZip();
			zip.loadAsync(doc.loadedContent).then(function (zip) {
				var d = new Docxtemplater().loadZip(zip);
				d.setData({ last_name: russian });
				d.render().then(function () {
					d.getFullText().then(function (outputText) {
						expect(outputText.substr(0, 7)).to.be.equal(russian);
						done();
					});
				});
			});
		});
	});
});

describe("Complex table example", function () {
	it("should not do anything special when loop outside of table", function (done) {
		var promises = [];
		["<w:t>{#tables}</w:t><w:table><w:tr><w:tc><w:t>{user}</w:t></w:tc></w:tr></w:table><w:t>{/tables}</w:t>"].forEach(function (content) {
			var scope = {
				tables: [{ user: "John" }, { user: "Jane" }]
			};
			promises.push(createXmlTemplaterDocx(content, { tags: scope }).then(function (doc) {
				doc.render().then(function () {
					getContent(doc).then(function (c) {
						expect(c).to.be.equal('<w:t></w:t><w:table><w:tr><w:tc><w:t xml:space="preserve">John</w:t></w:tc></w:tr></w:table><w:t></w:t><w:table><w:tr><w:tc><w:t xml:space="preserve">Jane</w:t></w:tc></w:tr></w:table><w:t></w:t>');
					});
				});
			}));
		});
		Promise.all(promises).then(function () {
			done();
		});
	});

	it("should work when looping inside tables", function (done) {
		var tags = {
			table1: [1],
			key: "value"
		};
		var template = "<w:tr>\n\t\t<w:tc><w:t>{#table1}Hi</w:t></w:tc>\n\t\t<w:tc><w:t>{/table1}</w:t> </w:tc>\n\t\t</w:tr>\n\t\t<w:tr>\n\t\t<w:tc><w:p><w:t>{#table1}Ho</w:t></w:p></w:tc>\n\t\t<w:tc><w:p><w:t>{/table1}</w:t></w:p></w:tc>\n\t\t</w:tr>\n\t\t<w:t>{key}</w:t>\n\t\t";
		createXmlTemplaterDocx(template, { tags: tags }).then(function (doc) {
			doc.render().then(function () {
				doc.getFullText().then(function (fullText) {
					expect(fullText).to.be.equal("HiHovalue");
					var expected = "<w:tr>\n\t\t<w:tc><w:t>Hi</w:t></w:tc>\n\t\t<w:tc><w:t></w:t> </w:tc>\n\t\t</w:tr>\n\t\t<w:tr>\n\t\t<w:tc><w:p><w:t>Ho</w:t></w:p></w:tc>\n\t\t<w:tc><w:p><w:t></w:t></w:p></w:tc>\n\t\t</w:tr>\n\t\t<w:t xml:space=\"preserve\">value</w:t>\n\t\t";
					getContent(doc).then(function (c) {
						expect(c).to.be.equal(expected);
						done();
					});
				});
			});
		});
	});
});
describe("Raw Xml Insertion", function () {
	it("should work with simple example", function (done) {
		var inner = "<w:p><w:r><w:t>{@complexXml}</w:t></w:r></w:p>";
		var content = "<w:document>" + inner + "</w:document>";
		var scope = {
			complexXml: '<w:p w:rsidR="00612058" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val="FF0000"/></w:rPr><w:t>My custom XML</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblStyle w: val="Grilledutableau"/><w:tblW w: w="0" w:type="auto"/><w:tblLook w: val="04A0" w: firstRow="1" w: lastRow="0" w: firstColumn="1" w: lastColumn="0" w: noHBand="0" w: noVBand="1"/></w:tblPr><w:tblGrid><w: gridCol w: w="2952"/><w: gridCol w: w="2952"/><w: gridCol w: w="2952"/></w:tblGrid><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: b/><w: color w: val="000000" w:themeColor="text1"/></w:rPr></w:pPr><w:r><w:rPr><w: b/><w: color w: val="000000" w:themeColor="text1"/></w:rPr><w:t>Test</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: b/><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w: b/><w: color w: val="FF0000"/></w:rPr><w:t>Xml</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val="FF0000"/></w:rPr><w:t>Generated</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="000000" w:themeColor="text1"/><w: u w: val="single"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w: color w: val="000000" w:themeColor="text1"/><w: u w: val="single"/></w:rPr><w:t>Underline</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w: color w: val="FF0000"/><w: highlight w: val="yellow"/></w:rPr><w:t>Highlighting</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:rFonts w: ascii="Bauhaus 93" w: hAnsi="Bauhaus 93"/><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:rFonts w: ascii="Bauhaus 93" w: hAnsi="Bauhaus 93"/><w: color w: val="FF0000"/></w:rPr><w:t>Font</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00EA4B08"><w:pPr><w: jc w: val="center"/><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val="FF0000"/></w:rPr><w:t>Centering</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: i/><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w: i/><w: color w: val="FF0000"/></w:rPr><w:t>Italic</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl>'
		};
		createXmlTemplaterDocx(content, { tags: scope }).then(function (doc) {
			doc.render().then(function () {
				getContent(doc).then(function (c) {
					expect(c.length).to.be.equal(content.length + scope.complexXml.length - inner.length);
					expect(c).to.contain(scope.complexXml);
					done();
				});
			});
		});
	});

	it("should work even when tags are after the xml", function (done) {
		var content = "<w:tbl>\n\t\t<w:tr>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{@complexXml}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t</w:tr>\n\t\t<w:tr>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{name}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t</w:tr>\n\t\t<w:tr>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{first_name}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t</w:tr>\n\t\t<w:tr>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{#products} {year}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{name}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{company}{/products}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t</w:tr>\n\t\t</w:tbl>\n\t\t";
		var scope = {
			complexXml: "<w:p><w:r><w:t>Hello</w:t></w:r></w:p>",
			name: "John",
			first_name: "Doe",
			products: [{ year: 1550, name: "Moto", company: "Fein" }, { year: 1987, name: "Water", company: "Test" }, { year: 2010, name: "Bread", company: "Yu" }]
		};
		createXmlTemplaterDocx(content, { tags: scope }).then(function (doc) {
			doc.render().then(function () {
				getContent(doc).then(function (c) {
					expect(c).to.contain(scope.complexXml);
					doc.getFullText().then(function (text) {
						expect(text).to.be.equal("HelloJohnDoe 1550MotoFein 1987WaterTest 2010BreadYu");
						done();
					});
				});
			});
		});
	});

	it("should work with closing tag in the form of <w:t>}{/body}</w:t>", function (done) {
		var scope = { body: [{ paragraph: "hello" }] };
		var content = "<w:t>{#body}</w:t>\n\t\t<w:t>{paragraph</w:t>\n\t\t\t<w:t>}{/body}</w:t>";
		createXmlTemplaterDocx(content, { tags: scope }).then(function (xmlTemplater) {
			xmlTemplater.render().then(function () {
				getContent(xmlTemplater).then(function (c) {
					expect(c).not.to.contain("</w:t></w:t>");
					done();
				});
			});
		});
	});
	it("should work with simple example and given options", function (done) {
		var scope = {
			xmlTag: '<w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom</w:t></w:r><w:r><w:rPr><w:color w:val="00FF00"/></w:rPr><w:t>XML</w:t></w:r>'
		};
		createDoc("one-raw-xml-tag.docx").then(function (doc) {
			doc.setOptions({
				fileTypeConfig: merge({}, Docxtemplater.FileTypeConfig.docx, {
					tagRawXml: "w:r"
				})
			});
			doc.setData(scope);
			doc.render().then(function () {
				doc.getFullText().then(function (text) {
					expect(text).to.be.equal("asdfMy customXMLqwery");
					done();
				});
			});
		});
	});
});

describe("Serialization", function () {
	it("should be serialiazable (useful for logging)", function (done) {
		createDoc("tag-example.docx").then(function (doc) {
			JSON.stringify(doc);
			done();
		});
	});
});