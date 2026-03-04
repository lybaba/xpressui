import { CUSTOM_SECTION } from './Constants';
import TFieldConfig from './TFieldConfig';
import TFormConfig, {
  CONTACTFORM_TYPE,
  TFormProviderRequest,
  TFormRule,
  TFormStorageConfig,
  TFormSubmitRequest,
} from './TFormConfig';
import { generateRuntimeId } from './id';
import { createSubmitRequestFromProvider } from './provider-registry';
import { PUBLIC_FORM_SCHEMA_VERSION, validatePublicFormConfig } from './public-schema';
import {
  APPROVAL_STATE_TYPE,
  CAMERA_PHOTO_TYPE,
  CHECKBOX_TYPE,
  DOCUMENT_SCAN_TYPE,
  getHtmlInputType,
  isFileFieldType,
  QR_SCAN_TYPE,
  SELECT_MULTIPLE_TYPE,
  SELECT_ONE_TYPE,
  TEXTAREA_TYPE,
  UPLOAD_IMAGE_TYPE,
} from './field';

export type TSimpleFieldInput = Partial<TFieldConfig> & {
  type: string;
  name: string;
  label: string;
};

export type TSimpleFormInput = {
  name: string;
  title?: string;
  type?: string;
  fields: TSimpleFieldInput[];
  submit?: TFormSubmitRequest;
  provider?: TFormProviderRequest;
  storage?: TFormStorageConfig;
  rules?: TFormRule[];
  sectionName?: string;
  sectionLabel?: string;
  successMsg?: string;
  errorMsg?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderField(field: TFieldConfig, sectionName: string): string {
  const requiredAttr = field.required ? ' data-required="true"' : '';
  const placeholderAttr = field.placeholder
    ? ` placeholder="${escapeHtml(String(field.placeholder))}"`
    : '';
  const acceptAttr = field.accept
    ? ` accept="${escapeHtml(String(field.accept))}"`
    : field.type === UPLOAD_IMAGE_TYPE
      ? ' accept="image/*"'
      : field.type === CAMERA_PHOTO_TYPE ||
          field.type === QR_SCAN_TYPE ||
          field.type === DOCUMENT_SCAN_TYPE
        ? ' accept="image/*"'
      : '';
  const captureAttr = field.capture
    ? ` capture="${escapeHtml(String(field.capture))}"`
    : field.type === CAMERA_PHOTO_TYPE ||
        field.type === QR_SCAN_TYPE ||
        field.type === DOCUMENT_SCAN_TYPE
      ? ' capture="environment"'
      : '';
  const multipleAttr = field.multiple ? ' multiple' : '';
  const documentScanModeAttr = field.documentScanMode
    ? ` data-document-scan-mode="${escapeHtml(String(field.documentScanMode))}"`
    : '';
  const documentOcrAttr = field.enableDocumentOcr ? ' data-enable-document-ocr="true"' : '';
  const requireValidDocumentMrzAttr = field.requireValidDocumentMrz
    ? ' data-require-valid-document-mrz="true"'
    : '';
  const documentTextTargetFieldAttr = field.documentTextTargetField
    ? ` data-document-text-target-field="${escapeHtml(String(field.documentTextTargetField))}"`
    : '';
  const documentMrzTargetFieldAttr = field.documentMrzTargetField
    ? ` data-document-mrz-target-field="${escapeHtml(String(field.documentMrzTargetField))}"`
    : '';
  const documentFirstNameTargetFieldAttr = field.documentFirstNameTargetField
    ? ` data-document-first-name-target-field="${escapeHtml(String(field.documentFirstNameTargetField))}"`
    : '';
  const documentLastNameTargetFieldAttr = field.documentLastNameTargetField
    ? ` data-document-last-name-target-field="${escapeHtml(String(field.documentLastNameTargetField))}"`
    : '';
  const documentNumberTargetFieldAttr = field.documentNumberTargetField
    ? ` data-document-number-target-field="${escapeHtml(String(field.documentNumberTargetField))}"`
    : '';
  const documentNationalityTargetFieldAttr = field.documentNationalityTargetField
    ? ` data-document-nationality-target-field="${escapeHtml(String(field.documentNationalityTargetField))}"`
    : '';
  const documentBirthDateTargetFieldAttr = field.documentBirthDateTargetField
    ? ` data-document-birth-date-target-field="${escapeHtml(String(field.documentBirthDateTargetField))}"`
    : '';
  const documentExpiryDateTargetFieldAttr = field.documentExpiryDateTargetField
    ? ` data-document-expiry-date-target-field="${escapeHtml(String(field.documentExpiryDateTargetField))}"`
    : '';
  const documentSexTargetFieldAttr = field.documentSexTargetField
    ? ` data-document-sex-target-field="${escapeHtml(String(field.documentSexTargetField))}"`
    : '';
  const fileDropModeAttr = field.fileDropMode
    ? ` data-file-drop-mode="${escapeHtml(String(field.fileDropMode))}"`
    : '';
  const minFilesAttr = field.minFiles !== undefined
    ? ` data-min-files="${escapeHtml(String(field.minFiles))}"`
    : '';
  const maxFilesAttr = field.maxFiles !== undefined
    ? ` data-max-files="${escapeHtml(String(field.maxFiles))}"`
    : '';
  const maxFileSizeAttr = field.maxFileSizeMb !== undefined
    ? ` data-max-file-size-mb="${escapeHtml(String(field.maxFileSizeMb))}"`
    : '';
  const maxTotalFileSizeAttr = field.maxTotalFileSizeMb !== undefined
    ? ` data-max-total-file-size-mb="${escapeHtml(String(field.maxTotalFileSizeMb))}"`
    : '';
  const formDataFieldNameAttr = field.formDataFieldName
    ? ` data-form-data-field-name="${escapeHtml(String(field.formDataFieldName))}"`
    : '';
  const fileTypeErrorAttr = field.fileTypeErrorMsg
    ? ` data-file-type-error-msg="${escapeHtml(String(field.fileTypeErrorMsg))}"`
    : '';
  const fileSizeErrorAttr = field.fileSizeErrorMsg
    ? ` data-file-size-error-msg="${escapeHtml(String(field.fileSizeErrorMsg))}"`
    : '';
  const fileSelectionMarkup = isFileFieldType(field.type)
    ? `<div class="mt-2 rounded border border-dashed border-base-300 p-3 transition-colors" id="${escapeHtml(field.name)}_selection" data-file-drop-zone="${escapeHtml(field.name)}"></div>`
    : '';
  const helpText = field.helpText
    ? `<div class="label"><span class="label-text-alt">${escapeHtml(field.helpText)}</span></div>`
    : '';
  const conditionalAttrs = [
    field.visibleWhenField
      ? ` data-visible-when-field="${escapeHtml(String(field.visibleWhenField))}"`
      : '',
    field.visibleWhenEquals
      ? ` data-visible-when-equals="${escapeHtml(String(field.visibleWhenEquals))}"`
      : '',
    field.optionsEndpoint
      ? ` data-options-endpoint="${escapeHtml(String(field.optionsEndpoint))}"`
      : '',
    field.optionsDependsOn
      ? ` data-options-depends-on="${escapeHtml(String(field.optionsDependsOn))}"`
      : '',
    field.optionsLabelKey
      ? ` data-options-label-key="${escapeHtml(String(field.optionsLabelKey))}"`
      : '',
    field.optionsValueKey
      ? ` data-options-value-key="${escapeHtml(String(field.optionsValueKey))}"`
      : '',
  ].join('');

  if (field.type === TEXTAREA_TYPE) {
    return `<label class="form-control w-full">
    <div class="label"><span class="label-text">${escapeHtml(field.label)}</span></div>
    <textarea class="textarea textarea-bordered w-full" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${placeholderAttr}${conditionalAttrs}></textarea>
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</label>`;
  }

  if (field.type === SELECT_ONE_TYPE) {
    const options = (field.choices || [])
      .map(
        (choice) =>
          `<option value="${escapeHtml(String(choice.value))}">${escapeHtml(choice.label)}</option>`
      )
      .join('');

    return `<label class="form-control w-full">
    <div class="label"><span class="label-text">${escapeHtml(field.label)}</span></div>
    <select class="select select-bordered w-full" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="select-one" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${conditionalAttrs}>
      <option value=""></option>
      ${options}
    </select>
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</label>`;
  }

  if (field.type === SELECT_MULTIPLE_TYPE) {
    const options = (field.choices || [])
      .map(
        (choice) =>
          `<option value="${escapeHtml(String(choice.value))}">${escapeHtml(choice.label)}</option>`
      )
      .join('');

    return `<label class="form-control w-full">
    <div class="label"><span class="label-text">${escapeHtml(field.label)}</span></div>
    <select class="select select-bordered w-full" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" multiple type="select-multiple" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${conditionalAttrs}>
      ${options}
    </select>
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</label>`;
  }

  if (field.type === CHECKBOX_TYPE) {
    return `<label class="label cursor-pointer justify-start gap-3">
    <input class="checkbox" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="checkbox" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${conditionalAttrs} />
    <span class="label-text">${escapeHtml(field.label)}</span>
</label>
<span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span>`;
  }

  if (field.type === APPROVAL_STATE_TYPE) {
    return `<label class="form-control w-full">
    <div class="label"><span class="label-text">${escapeHtml(field.label)}</span></div>
    <input class="input input-bordered w-full opacity-80" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="text" readonly data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}" data-section-name="${escapeHtml(sectionName)}"${conditionalAttrs} />
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</label>`;
  }

  return `<label class="form-control w-full">
    <div class="label"><span class="label-text">${escapeHtml(field.label)}</span></div>
    <input class="input input-bordered w-full" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="${escapeHtml(getHtmlInputType(field.type))}" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${isFileFieldType(field.type) ? `${acceptAttr}${captureAttr}${multipleAttr}${documentScanModeAttr}${documentOcrAttr}${requireValidDocumentMrzAttr}${documentTextTargetFieldAttr}${documentMrzTargetFieldAttr}${documentFirstNameTargetFieldAttr}${documentLastNameTargetFieldAttr}${documentNumberTargetFieldAttr}${documentNationalityTargetFieldAttr}${documentBirthDateTargetFieldAttr}${documentExpiryDateTargetFieldAttr}${documentSexTargetFieldAttr}${fileDropModeAttr}${minFilesAttr}${maxFilesAttr}${maxFileSizeAttr}${maxTotalFileSizeAttr}${formDataFieldNameAttr}${fileTypeErrorAttr}${fileSizeErrorAttr}` : placeholderAttr}${conditionalAttrs} />
    ${fileSelectionMarkup}
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</label>`;
}

export function createFormConfig(input: TSimpleFormInput): TFormConfig {
  const sectionName = input.sectionName || 'main';
  const sectionLabel = input.sectionLabel || 'Main';
  const fields = input.fields.map((field) => ({ ...field }));
  const provider = input.provider;
  const submit = input.submit || (provider
    ? createSubmitRequestFromProvider(provider)
    : undefined);

  return validatePublicFormConfig({
    version: PUBLIC_FORM_SCHEMA_VERSION,
    id: generateRuntimeId(),
    uid: generateRuntimeId(),
    timestamp: Math.floor(Date.now() / 1000),
    type: input.type || CONTACTFORM_TYPE,
    name: input.name,
    title: input.title || input.name,
    sections: {
      [CUSTOM_SECTION]: [
        {
          type: 'section',
          name: sectionName,
          label: sectionLabel,
        },
      ],
      [sectionName]: fields,
    },
    submit,
    provider,
    storage: input.storage,
    rules: input.rules,
    successMsg: input.successMsg,
    errorMsg: input.errorMsg,
  });
}

export function createTemplateMarkup(
  config: TFormConfig,
  templateName: string = config.name
): string {
  const section = config.sections[CUSTOM_SECTION]?.[0];
  const sectionName = section?.name || 'main';
  const sectionLabel = section?.label || 'Main';
  const fields = config.sections[sectionName] || [];
  const fieldMarkup = fields.map((field) => renderField(field, sectionName)).join('\n');

  const submitAttrs = config.submit
    ? [
        `data-submit-endpoint="${escapeHtml(config.submit.endpoint)}"`,
        config.submit.method
          ? `data-submit-method="${escapeHtml(config.submit.method)}"`
          : '',
        config.submit.mode
          ? `data-submit-mode="${escapeHtml(config.submit.mode)}"`
          : '',
        config.submit.includeDocumentData
          ? `data-submit-include-document-data="true"`
          : '',
        config.submit.documentDataMode
          ? `data-submit-document-data-mode="${escapeHtml(config.submit.documentDataMode)}"`
          : '',
        config.submit.documentFieldPaths?.length
          ? `data-submit-document-field-paths="${escapeHtml(JSON.stringify(config.submit.documentFieldPaths))}"`
          : '',
        config.submit.formDataArrayMode
          ? `data-submit-form-data-array-mode="${escapeHtml(config.submit.formDataArrayMode)}"`
          : '',
        config.submit.uploadStrategy
          ? `data-submit-upload-strategy="${escapeHtml(config.submit.uploadStrategy)}"`
          : '',
        config.submit.presignEndpoint
          ? `data-submit-presign-endpoint="${escapeHtml(config.submit.presignEndpoint)}"`
          : '',
        config.submit.presignMethod
          ? `data-submit-presign-method="${escapeHtml(config.submit.presignMethod)}"`
          : '',
        config.submit.presignUploadUrlKey
          ? `data-submit-presign-upload-url-key="${escapeHtml(config.submit.presignUploadUrlKey)}"`
          : '',
        config.submit.presignFileUrlKey
          ? `data-submit-presign-file-url-key="${escapeHtml(config.submit.presignFileUrlKey)}"`
          : '',
        config.submit.uploadMethod
          ? `data-submit-upload-method="${escapeHtml(config.submit.uploadMethod)}"`
          : '',
        config.submit.action
          ? `data-submit-action="${escapeHtml(config.submit.action)}"`
          : '',
      ]
        .filter(Boolean)
        .join(' ')
    : '';
  const storageAttrs = config.storage
    ? [
        `data-storage-mode="${escapeHtml(config.storage.mode)}"`,
        config.storage.adapter
          ? `data-storage-adapter="${escapeHtml(config.storage.adapter)}"`
          : '',
        config.storage.key
          ? `data-storage-key="${escapeHtml(config.storage.key)}"`
          : '',
        config.storage.autoSaveMs !== undefined
          ? `data-storage-autosave-ms="${escapeHtml(String(config.storage.autoSaveMs))}"`
          : '',
        config.storage.encryptionKey
          ? `data-storage-encryption-key="${escapeHtml(config.storage.encryptionKey)}"`
          : '',
        config.storage.retentionDays !== undefined
          ? `data-storage-retention-days="${escapeHtml(String(config.storage.retentionDays))}"`
          : '',
        config.storage.retentionDraftDays !== undefined
          ? `data-storage-retention-draft-days="${escapeHtml(String(config.storage.retentionDraftDays))}"`
          : '',
        config.storage.retentionQueueDays !== undefined
          ? `data-storage-retention-queue-days="${escapeHtml(String(config.storage.retentionQueueDays))}"`
          : '',
        config.storage.retentionDeadLetterDays !== undefined
          ? `data-storage-retention-dead-letter-days="${escapeHtml(String(config.storage.retentionDeadLetterDays))}"`
          : '',
      ]
        .filter(Boolean)
        .join(' ')
    : '';
  const rulesAttr = config.rules?.length
    ? `data-rules="${escapeHtml(JSON.stringify(config.rules))}"`
    : '';

  return `<template id="${escapeHtml(templateName)}">
  <form id="${escapeHtml(templateName)}_form" data-version="${escapeHtml(String(config.version || PUBLIC_FORM_SCHEMA_VERSION))}" data-type="${escapeHtml(config.type)}" data-name="${escapeHtml(config.name)}" data-label="${escapeHtml(config.title)}" ${submitAttrs} ${storageAttrs} ${rulesAttr}>
    <div data-name="${escapeHtml(sectionName)}" data-type="section" data-label="${escapeHtml(sectionLabel)}" class="flex flex-col gap-4">
      ${fieldMarkup}
      <button type="submit" class="btn btn-primary">Submit</button>
    </div>
  </form>
</template>
<form-ui name="${escapeHtml(templateName)}"></form-ui>`;
}

export function mountFormUI(
  container: Element,
  input: TSimpleFormInput | TFormConfig,
  templateName?: string
): HTMLElement | null {
  const config = 'fields' in input ? createFormConfig(input) : validatePublicFormConfig(input);
  container.innerHTML = createTemplateMarkup(config, templateName);
  const element = container.querySelector('form-ui') as HTMLElement | null;

  if (element && 'initialize' in element && typeof (element as any).initialize === 'function') {
    (element as any).initialize();
  }

  return element;
}
