"use strict";

var _require = require("./utils"),
    createDoc = _require.createDoc,
    shouldBeSame = _require.shouldBeSame,
    expect = _require.expect;

describe("Docx docprops", function () {
	it("should change values with template data", function (done) {
		var tags = {
			first_name: "Hipp",
			last_name: "Edgar",
			phone: "0652455478",
			description: "New Website"
		};
		createDoc("tag-docprops.docx").then(function (doc) {
			doc.setData(tags);
			doc.render().then(function () {
				var results = [];
				results.push(doc.getFullText().then(function (text) {
					expect(text).to.be.equal("Edgar Hipp");
				}));
				results.push(doc.getFullText("word/header1.xml").then(function (text) {
					expect(text).to.be.equal("Edgar Hipp0652455478New Website");
				}));
				results.push(doc.getFullText("word/footer1.xml").then(function (text) {
					expect(text).to.be.equal("EdgarHipp0652455478");
				}));
				shouldBeSame({ doc: doc, expectedName: "tag-docprops-expected.docx" });
				Promise.all(results).then(function () {
					done();
				});
			});
		});
	});
});