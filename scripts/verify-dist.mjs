import { JSDOM } from "jsdom";
import { pathToFileURL } from "node:url";
import path from "node:path";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://example.test/",
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.customElements = dom.window.customElements;
globalThis.localStorage = dom.window.localStorage;
globalThis.FormData = dom.window.FormData;
globalThis.CustomEvent = dom.window.CustomEvent;

const distEntry = path.resolve(process.cwd(), "dist/xpressui.mjs");
const mod = await import(pathToFileURL(distEntry).href);
const hydrateEntry = path.resolve(process.cwd(), "dist/hydrate.mjs");
const hydrateMod = await import(pathToFileURL(hydrateEntry).href);

const expectedFunctionExports = [
  "createFormConfig",
  "createLocalFormAdmin",
  "createSubmitRequestFromProvider",
  "getProviderDefinition",
  "hydrateFormUI",
  "migratePublicFormConfig",
  "registerProvider",
  "validatePublicFormConfig",
];

const expectedClassExports = [
  "FormUI",
  "FormRuntime",
];

const missing = [
  ...expectedFunctionExports.filter((key) => typeof mod[key] !== "function"),
  ...expectedClassExports.filter((key) => typeof mod[key] !== "function"),
];

if (typeof mod.PUBLIC_FORM_SCHEMA_VERSION !== "number") {
  missing.push("PUBLIC_FORM_SCHEMA_VERSION");
}

if (missing.length) {
  throw new Error(`dist export verification failed: ${missing.join(", ")}`);
}

if (typeof mod.mountFormUI === "function") {
  missing.push("mountFormUI should not be exported from root dist entry");
}

if (typeof mod.createTemplateMarkup === "function") {
  missing.push("createTemplateMarkup should not be exported from root dist entry");
}

if (missing.length) {
  throw new Error(`dist export verification failed: ${missing.join(", ")}`);
}

const expectedHydrateFunctionExports = [
  "createFormConfig",
  "createFormPreset",
  "createSubmitRequestFromProvider",
  "getProviderDefinition",
  "hydrateFormUI",
  "migratePublicFormConfig",
  "registerProvider",
  "validatePublicFormConfig",
];

const hydrateMissing = expectedHydrateFunctionExports.filter((key) => typeof hydrateMod[key] !== "function");

if (typeof hydrateMod.PUBLIC_FORM_SCHEMA_VERSION !== "number") {
  hydrateMissing.push("PUBLIC_FORM_SCHEMA_VERSION");
}

if (typeof hydrateMod.mountFormUI === "function") {
  hydrateMissing.push("mountFormUI should not be exported from ./hydrate");
}

if (hydrateMissing.length) {
  throw new Error(`hydrate dist export verification failed: ${hydrateMissing.join(", ")}`);
}

console.log("dist exports verified");
