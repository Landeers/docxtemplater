// Type definition for Docxtemplater
// TypeScript Version: 2.3
import * as JSZip from 'jszip';

declare interface InspectModule {}

declare interface XmlTemplater {
  getFullText(): string;
}

interface DocUtils {
  isContent();
  isParagraphStart();
  isParagraphEnd();
  isTagStart();
  isTagEnd();
  isTextStart();
  isTextEnd();
  unique();
  chunkBy();
  last();
  mergeObjects();
  xml2str();
  str2xml();
  getRight();
  getLeft();
  pregMatchAll();
  convertSpaces();
  escapeRegExp();
  charMapRegexes();
  hasCorruptCharacters();
  defaults();
  wordToUtf8();
  utf8ToWord();
  concatArrays();
  charMap();
}

declare namespace Docxtemplater {
  const DocUtils: DocUtils;
  // Docxtemplater.Errors = require("./errors");
  // Docxtemplater.XmlTemplater = require("./xml-templater");
  // Docxtemplater.FileTypeConfig = require("./file-type-config");
  // Docxtemplater.XmlMatcher = require("./xml-matcher");
}

declare class Docxtemplater {
  constructor();

  setModules(obj: object): void;

  sendEvent(eventName: string): void;

  attachModule(module: InspectModule, options?: object): void;

  setOptions(options: object): void;

  loadZip(zip: JSZip): Docxtemplater;

  compileFile(index: number): Promise<void>;

  resolveData(data: object): Promise<Array<any>>;

  compile(): Promise<any>;

  updateFileTypeConfig(): void;

  render(): Promise<any>;

  syncZip(): void;

  setData(data: object): Docxtemplater;

  getZip(): JSZip;

  createTemplateClass(path: string): Promise<XmlTemplater>;

  createTemplateClassFromContent(content: any, filePath: string): Promise<XmlTemplater>;

  getFullText(path: string): Promise<string>;

  getTemplatedFiles(): Array<string>;
}

export = Docxtemplater;
