import { ErrorObject } from "ajv";
import TFormConfig from "./TFormConfig";
import { ajv } from "./frontend";

export const PUBLIC_FORM_SCHEMA_VERSION = 1;

const PUBLIC_FORM_SCHEMA = {
  type: "object",
  required: ["version", "id", "uid", "type", "name", "title", "sections"],
  additionalProperties: true,
  properties: {
    version: { type: "integer", minimum: 1 },
    id: { type: "string", minLength: 1 },
    uid: { type: "string", minLength: 1 },
    type: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1 },
    timestamp: { type: "integer" },
    rules: {
      type: "array",
      items: {
        type: "object",
        required: ["conditions", "actions"],
        additionalProperties: true,
        properties: {
          logic: { type: "string", enum: ["AND", "OR"] },
          conditions: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["field"],
              additionalProperties: true,
              properties: {
                field: { type: "string", minLength: 1 },
                operator: { type: "string", enum: ["equals", "not_equals"] },
              },
            },
          },
          actions: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["type", "field"],
              additionalProperties: true,
              properties: {
                type: { type: "string", enum: ["show", "hide", "clear-value"] },
                field: { type: "string", minLength: 1 },
              },
            },
          },
        },
      },
    },
    sections: {
      type: "object",
      minProperties: 1,
      additionalProperties: {
        type: "array",
        items: {
          type: "object",
          required: ["type", "name", "label"],
          additionalProperties: true,
          properties: {
            type: { type: "string", minLength: 1 },
            name: { type: "string", minLength: 1 },
            label: { type: "string", minLength: 1 },
          },
        },
      },
    },
  },
} as const;

const validateSchema = ajv.compile(PUBLIC_FORM_SCHEMA);

function cloneObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function migratePublicFormConfig(input: Record<string, any>): TFormConfig {
  const config = cloneObject(input) as Record<string, any>;

  if (!config.version) {
    config.version = PUBLIC_FORM_SCHEMA_VERSION;
  }

  if (!config.title && typeof config.label === "string" && config.label) {
    config.title = config.label;
  }

  return config as TFormConfig;
}

export function getPublicFormSchemaErrors(): ErrorObject[] | null | undefined {
  return validateSchema.errors;
}

export function validatePublicFormConfig(input: Record<string, any>): TFormConfig {
  const migrated = migratePublicFormConfig(input);
  const valid = validateSchema(migrated);

  if (!valid) {
    const details = (validateSchema.errors || [])
      .map((error) => `${error.instancePath || "/"} ${error.message}`)
      .join("; ");
    throw new Error(`Invalid public form config: ${details}`);
  }

  return migrated;
}
