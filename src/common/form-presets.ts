import TFieldConfig from "./TFieldConfig";
import TFormConfig, { TFormProviderRequest, TFormRule, TFormStorageConfig, TFormSubmitRequest } from "./TFormConfig";
import { CAMERA_PHOTO_TYPE, DOCUMENT_SCAN_TYPE, EMAIL_TYPE, QR_SCAN_TYPE, SELECT_MULTIPLE_TYPE, SELECT_ONE_TYPE, TEL_TYPE, TEXTAREA_TYPE, TEXT_TYPE, normalizeFieldName } from "./field";
import { createFormConfig, TSimpleFieldInput, TSimpleFormInput } from "./form-builder";

type TFieldOverrides = Partial<TFieldConfig>;

export type TFormPresetName =
  | "contact"
  | "booking-request"
  | "payment-request"
  | "identity-check";

export type TCreateFormPresetOptions = {
  name?: string;
  title?: string;
  submit?: TFormSubmitRequest;
  provider?: TFormProviderRequest;
  storage?: TFormStorageConfig;
  rules?: TFormRule[];
  fields?: TSimpleFieldInput[];
  sectionName?: string;
  sectionLabel?: string;
  successMsg?: string;
  errorMsg?: string;
};

function buildField(
  type: string,
  name: string,
  label: string,
  overrides?: TFieldOverrides,
): TSimpleFieldInput {
  return {
    type,
    name: normalizeFieldName(name),
    label,
    ...(overrides || {}),
  };
}

export const fieldFactory = {
  text(name: string, label: string, overrides?: TFieldOverrides): TSimpleFieldInput {
    return buildField(TEXT_TYPE, name, label, overrides);
  },

  email(name: string, label: string, overrides?: TFieldOverrides): TSimpleFieldInput {
    return buildField(EMAIL_TYPE, name, label, overrides);
  },

  phone(name: string, label: string, overrides?: TFieldOverrides): TSimpleFieldInput {
    return buildField(TEL_TYPE, name, label, overrides);
  },

  textarea(name: string, label: string, overrides?: TFieldOverrides): TSimpleFieldInput {
    return buildField(TEXTAREA_TYPE, name, label, overrides);
  },

  selectOne(
    name: string,
    label: string,
    choices: NonNullable<TFieldConfig["choices"]>,
    overrides?: TFieldOverrides,
  ): TSimpleFieldInput {
    return buildField(SELECT_ONE_TYPE, name, label, {
      choices,
      ...(overrides || {}),
    });
  },

  selectMultiple(
    name: string,
    label: string,
    choices: NonNullable<TFieldConfig["choices"]>,
    overrides?: TFieldOverrides,
  ): TSimpleFieldInput {
    return buildField(SELECT_MULTIPLE_TYPE, name, label, {
      choices,
      ...(overrides || {}),
    });
  },

  file(name: string, label: string, overrides?: TFieldOverrides): TSimpleFieldInput {
    return buildField("file", name, label, overrides);
  },

  cameraPhoto(name: string, label: string, overrides?: TFieldOverrides): TSimpleFieldInput {
    return buildField(CAMERA_PHOTO_TYPE, name, label, overrides);
  },

  documentScan(name: string, label: string, overrides?: TFieldOverrides): TSimpleFieldInput {
    return buildField(DOCUMENT_SCAN_TYPE, name, label, overrides);
  },

  qrScan(name: string, label: string, overrides?: TFieldOverrides): TSimpleFieldInput {
    return buildField(QR_SCAN_TYPE, name, label, overrides);
  },
};

function getBasePresetInput(preset: TFormPresetName): TSimpleFormInput {
  switch (preset) {
    case "booking-request":
      return {
        name: "booking-request-form",
        title: "Booking Request",
        fields: [
          fieldFactory.text("first_name", "First Name", { required: true }),
          fieldFactory.text("last_name", "Last Name", { required: true }),
          fieldFactory.email("email", "Email", { required: true }),
          buildField("date", "booking_date", "Booking Date", { required: true }),
          fieldFactory.selectOne(
            "service",
            "Service",
            [
              { value: "consultation", label: "Consultation" },
              { value: "onsite", label: "On-site Visit" },
              { value: "follow_up", label: "Follow-up" },
            ],
            { required: true },
          ),
          fieldFactory.textarea("notes", "Notes"),
        ],
      };

    case "payment-request":
      return {
        name: "payment-request-form",
        title: "Payment Request",
        fields: [
          fieldFactory.email("email", "Email", { required: true }),
          buildField("number", "amount", "Amount", {
            required: true,
            min: 0,
            step: 0.01,
          }),
          fieldFactory.selectOne(
            "currency",
            "Currency",
            [
              { value: "EUR", label: "EUR" },
              { value: "USD", label: "USD" },
              { value: "GBP", label: "GBP" },
            ],
            { required: true },
          ),
          fieldFactory.text("reference", "Reference"),
        ],
      };

    case "identity-check":
      return {
        name: "identity-check-form",
        title: "Identity Check",
        provider: {
          type: "identity-verification",
          endpoint: "/api/identity/verify",
        },
        submit: {
          endpoint: "/api/identity/verify",
          includeDocumentData: true,
          documentDataMode: "summary",
          documentFieldPaths: [
            "mrz.documentNumber",
            "mrz.nationality",
            "mrz.birthDate",
            "mrz.expiryDate",
            "mrz.valid",
            "fields.firstName",
            "fields.lastName",
          ],
        },
        fields: [
          fieldFactory.email("email", "Email", { required: true }),
          fieldFactory.documentScan("passport", "Passport", {
            required: true,
            enableDocumentOcr: true,
            requireValidDocumentMrz: true,
            documentFirstNameTargetField: "first_name",
            documentLastNameTargetField: "last_name",
            documentNumberTargetField: "document_number",
            documentNationalityTargetField: "nationality",
            documentBirthDateTargetField: "birth_date",
            documentExpiryDateTargetField: "expiry_date",
          }),
          fieldFactory.text("first_name", "First Name", { required: true }),
          fieldFactory.text("last_name", "Last Name", { required: true }),
          fieldFactory.text("document_number", "Document Number", { required: true }),
          fieldFactory.text("nationality", "Nationality"),
          buildField("date", "birth_date", "Birth Date"),
          buildField("date", "expiry_date", "Expiry Date"),
        ],
      };

    case "contact":
    default:
      return {
        name: "contact-form",
        title: "Contact Us",
        fields: [
          fieldFactory.text("full_name", "Full Name", { required: true }),
          fieldFactory.email("email", "Email", { required: true }),
          fieldFactory.phone("phone", "Phone"),
          fieldFactory.textarea("message", "Message", { required: true }),
        ],
      };
  }
}

export function createFormPreset(
  preset: TFormPresetName,
  options: TCreateFormPresetOptions = {},
): TFormConfig {
  const base = getBasePresetInput(preset);

  return createFormConfig({
    ...base,
    ...options,
    name: options.name || base.name,
    title: options.title || base.title,
    provider: options.provider || base.provider,
    submit: options.submit || base.submit,
    storage: options.storage || base.storage,
    rules: options.rules || base.rules,
    sectionName: options.sectionName || base.sectionName,
    sectionLabel: options.sectionLabel || base.sectionLabel,
    successMsg: options.successMsg || base.successMsg,
    errorMsg: options.errorMsg || base.errorMsg,
    fields: [...base.fields, ...(options.fields || [])],
  });
}
