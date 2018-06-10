/* index.d.ts (C) 2015-present SheetJS and contributors */
// TypeScript Version: 2.2
interface InspectModule {}

interface XmlTemplater {
  getFullText(): string;
}

declare class Docxtemplater {
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

// Docxtemplater.DocUtils = DocUtils;
// Docxtemplater.Errors = require("./errors");
// Docxtemplater.XmlTemplater = require("./xml-templater");
// Docxtemplater.FileTypeConfig = require("./file-type-config");
// Docxtemplater.XmlMatcher = require("./xml-matcher");

export = Docxtemplater;