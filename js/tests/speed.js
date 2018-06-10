"use strict";

var _require = require("./utils"),
    expect = _require.expect,
    createXmlTemplaterDocx = _require.createXmlTemplaterDocx;

describe("Speed test", function () {
	it("should be fast for simple tags", function (done) {
		var content = "<w:t>tag {age}</w:t>";
		var docs = [];
		for (var i = 0; i < 100; i++) {
			docs.push(createXmlTemplaterDocx(content, { tags: { age: 12 } }));
		}
		Promise.all(docs).then(function (docs) {
			var time = new Date();
			var renderedDoc = [];
			for (var _i = 0; _i < 100; _i++) {
				renderedDoc.push(docs[_i].render());
			}
			Promise.all(renderedDoc).then(function () {
				var duration = new Date() - time;
				expect(duration).to.be.below(400);
				done();
			});
		});
	});
	it("should be fast for simple tags with huge content", function (done) {
		var content = "<w:t>tag {age}</w:t>";
		var i = void 0;
		var result = [];
		for (i = 1; i <= 10000; i++) {
			result.push("bla");
		}
		var prepost = result.join("");
		content = prepost + content + prepost;
		var docs = [];
		for (i = 0; i < 20; i++) {
			docs.push(createXmlTemplaterDocx(content, { tags: { age: 12 } }));
		}
		Promise.all(docs).then(function (docs) {
			var time = new Date();
			var renderedDoc = [];
			for (i = 0; i < 20; i++) {
				renderedDoc.push(docs[i].render());
			}
			Promise.all(renderedDoc).then(function () {
				var duration = new Date() - time;
				expect(duration).to.be.below(400);
				done();
			});
		});
	});
	it("should be fast for loop tags", function (done) {
		var content = "<w:t>{#users}{name}{/users}</w:t>";
		var users = [];
		for (var i = 1; i <= 1000; i++) {
			users.push({ name: "foo" });
		}
		createXmlTemplaterDocx(content, { tags: { users: users } }).then(function (doc) {
			var time = new Date();
			doc.render().then(function () {
				var duration = new Date() - time;
				expect(duration).to.be.below(100);
				done();
			});
		});
	});
	/* eslint-disable no-process-env */
	if (!process.env.FAST) {
		it("should not exceed call stack size for big document with rawxml", function (done) {
			this.timeout(30000);
			var result = [];
			var normalContent = "<w:p><w:r><w:t>foo</w:t></w:r></w:p>";
			var rawContent = "<w:p><w:r><w:t>{@raw}</w:t></w:r></w:p>";

			for (var i = 1; i <= 30000; i++) {
				if (i % 100 === 1) {
					result.push(rawContent);
				}
				result.push(normalContent);
			}
			var content = result.join("");
			var users = [];
			createXmlTemplaterDocx(content, { tags: { users: users } }).then(function (doc) {
				var time = new Date();
				doc.render().then(function () {
					var duration = new Date() - time;
					expect(duration).to.be.below(25000);
					done();
				});
			});
		});
	}
});