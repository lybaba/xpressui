import { CUSTOM_SECTION } from './Constants';
import TFieldConfig from './TFieldConfig';
import TFormConfig, {
  CONTACTFORM_TYPE,
  TFormProviderRequest,
  TFormRule,
  TFormValidationConfig,
  TFormStepLabels,
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
  PRODUCT_LIST_TYPE,
  IMAGE_GALLERY_TYPE,
  SETTING_TYPE,
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
  workflowStepTargets?: Record<string, string>;
  stepLabels?: TFormStepLabels;
  rules?: TFormRule[];
  validation?: TFormValidationConfig;
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
  const viewModeAttr = field.viewMode === 'view' ? ' data-field-render-mode="view"' : '';
  const rawFieldValue = (field as any).value ?? field.defaultValue;
  const checkboxChecked = rawFieldValue === true || rawFieldValue === 'true' || rawFieldValue === 1 || rawFieldValue === '1';
  const serializedFieldValue = rawFieldValue === undefined || rawFieldValue === null
    ? ''
    : typeof rawFieldValue === 'string'
      ? rawFieldValue
      : JSON.stringify(rawFieldValue);
  const valueAttr = serializedFieldValue !== ''
    ? ` value="${escapeHtml(String(serializedFieldValue))}"`
    : '';
  const placeholderAttr = field.placeholder
    ? ` placeholder="${escapeHtml(String(field.placeholder))}"`
    : '';
  const includeInSubmitAttr = field.includeInSubmit ? ' data-include-in-submit="true"' : '';
  const viewTemplateAttr = field.viewTemplate
    ? ` data-view-template="${escapeHtml(String(field.viewTemplate))}"`
    : '';
  const viewTemplateUnsafeAttr = field.viewTemplateUnsafe ? ' data-view-template-unsafe="true"' : '';
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
    const textareaValue = rawFieldValue === undefined || rawFieldValue === null
      ? ''
      : String(rawFieldValue);
    return `<label class="form-control w-full">
    <div class="label"><span class="label-text">${escapeHtml(field.label)}</span></div>
    <textarea class="textarea textarea-bordered w-full" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${placeholderAttr}${includeInSubmitAttr}${viewTemplateAttr}${viewTemplateUnsafeAttr}${viewModeAttr}${conditionalAttrs}>${escapeHtml(textareaValue)}</textarea>
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</label>`;
  }

  if (field.type === SELECT_ONE_TYPE) {
    const selectedValue = rawFieldValue === undefined || rawFieldValue === null ? '' : String(rawFieldValue);
    const options = (field.choices || [])
      .map(
        (choice) => {
          const optionValue = String(choice.value);
          const selectedAttr = selectedValue === optionValue ? ' selected' : '';
          return `<option value="${escapeHtml(optionValue)}"${selectedAttr}>${escapeHtml(choice.label)}</option>`;
        }
      )
      .join('');

    return `<label class="form-control w-full">
    <div class="label"><span class="label-text">${escapeHtml(field.label)}</span></div>
    <select class="select select-bordered w-full" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="select-one" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${includeInSubmitAttr}${viewTemplateAttr}${viewTemplateUnsafeAttr}${viewModeAttr}${conditionalAttrs}>
      <option value=""${selectedValue === '' ? ' selected' : ''}></option>
      ${options}
    </select>
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</label>`;
  }

  if (field.type === SELECT_MULTIPLE_TYPE) {
    const selectedValues = Array.isArray(rawFieldValue)
      ? rawFieldValue.map((entry) => String(entry))
      : [];
    const options = (field.choices || [])
      .map(
        (choice) => {
          const optionValue = String(choice.value);
          const selectedAttr = selectedValues.includes(optionValue) ? ' selected' : '';
          return `<option value="${escapeHtml(optionValue)}"${selectedAttr}>${escapeHtml(choice.label)}</option>`;
        },
      )
      .join('');

    return `<label class="form-control w-full">
    <div class="label"><span class="label-text">${escapeHtml(field.label)}</span></div>
    <select class="select select-bordered w-full" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" multiple type="select-multiple" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${includeInSubmitAttr}${viewTemplateAttr}${viewTemplateUnsafeAttr}${viewModeAttr}${conditionalAttrs}>
      ${options}
    </select>
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</label>`;
  }

  if (field.type === PRODUCT_LIST_TYPE) {
    const choicesAttr = field.choices?.length
      ? ` data-choices="${escapeHtml(JSON.stringify(field.choices))}"`
      : '';
    return `<div class="form-control w-full">
    <div class="label"><label class="label-text" for="${escapeHtml(field.name)}">${escapeHtml(field.label)}</label></div>
    <input class="input input-bordered w-full hidden" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="hidden" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${valueAttr}${includeInSubmitAttr}${viewTemplateAttr}${viewTemplateUnsafeAttr}${viewModeAttr}${choicesAttr}${conditionalAttrs} />
    <div class="mt-2 rounded border border-base-300 p-3" id="${escapeHtml(field.name)}_selection" data-product-list-zone="${escapeHtml(field.name)}"></div>
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</div>`;
  }

  if (field.type === IMAGE_GALLERY_TYPE) {
    const choicesAttr = field.choices?.length
      ? ` data-choices="${escapeHtml(JSON.stringify(field.choices))}"`
      : '';
    return `<div class="form-control w-full">
    <div class="label"><label class="label-text" for="${escapeHtml(field.name)}">${escapeHtml(field.label)}</label></div>
    <input class="input input-bordered w-full hidden" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="hidden" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${valueAttr}${includeInSubmitAttr}${viewTemplateAttr}${viewTemplateUnsafeAttr}${viewModeAttr}${choicesAttr}${conditionalAttrs} />
    <div class="mt-2 rounded border border-base-300 p-3" id="${escapeHtml(field.name)}_selection" data-image-gallery-zone="${escapeHtml(field.name)}"></div>
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</div>`;
  }

  if (field.type === SETTING_TYPE) {
    const settingValueAttr = serializedFieldValue !== ''
      ? ` data-setting-value="${escapeHtml(String(serializedFieldValue))}"`
      : '';
    return `<input class="hidden" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="hidden" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}" data-section-name="${escapeHtml(sectionName)}"${valueAttr}${settingValueAttr}${includeInSubmitAttr}${viewTemplateAttr}${viewTemplateUnsafeAttr}${viewModeAttr}${conditionalAttrs} />`;
  }

  if (field.type === CHECKBOX_TYPE) {
    return `<label class="label cursor-pointer justify-start gap-3">
    <input class="checkbox" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="checkbox" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${checkboxChecked ? ' checked' : ''}${includeInSubmitAttr}${viewTemplateAttr}${viewTemplateUnsafeAttr}${viewModeAttr}${conditionalAttrs} />
    <span class="label-text">${escapeHtml(field.label)}</span>
</label>
<span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span>`;
  }

  if (field.type === APPROVAL_STATE_TYPE) {
    return `<label class="form-control w-full">
    <div class="label"><span class="label-text">${escapeHtml(field.label)}</span></div>
    <input class="input input-bordered w-full opacity-80" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="text" readonly data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}" data-section-name="${escapeHtml(sectionName)}"${valueAttr}${includeInSubmitAttr}${viewTemplateAttr}${viewTemplateUnsafeAttr}${viewModeAttr}${conditionalAttrs} />
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</label>`;
  }

  if (isFileFieldType(field.type)) {
    return `<div class="form-control w-full">
    <div class="label"><label class="label-text" for="${escapeHtml(field.name)}">${escapeHtml(field.label)}</label></div>
    <input class="input input-bordered w-full" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="${escapeHtml(getHtmlInputType(field.type))}" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${valueAttr}${acceptAttr}${captureAttr}${multipleAttr}${documentScanModeAttr}${documentOcrAttr}${requireValidDocumentMrzAttr}${documentTextTargetFieldAttr}${documentMrzTargetFieldAttr}${documentFirstNameTargetFieldAttr}${documentLastNameTargetFieldAttr}${documentNumberTargetFieldAttr}${documentNationalityTargetFieldAttr}${documentBirthDateTargetFieldAttr}${documentExpiryDateTargetFieldAttr}${documentSexTargetFieldAttr}${fileDropModeAttr}${minFilesAttr}${maxFilesAttr}${maxFileSizeAttr}${maxTotalFileSizeAttr}${formDataFieldNameAttr}${fileTypeErrorAttr}${fileSizeErrorAttr}${includeInSubmitAttr}${viewTemplateAttr}${viewTemplateUnsafeAttr}${viewModeAttr}${conditionalAttrs} />
    ${fileSelectionMarkup}
    ${helpText}
    <div class="label"><span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span></div>
</div>`;
  }

  return `<label class="form-control w-full">
    <div class="label"><span class="label-text">${escapeHtml(field.label)}</span></div>
    <input class="input input-bordered w-full" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="${escapeHtml(getHtmlInputType(field.type))}" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${valueAttr}${isFileFieldType(field.type) ? `${acceptAttr}${captureAttr}${multipleAttr}${documentScanModeAttr}${documentOcrAttr}${requireValidDocumentMrzAttr}${documentTextTargetFieldAttr}${documentMrzTargetFieldAttr}${documentFirstNameTargetFieldAttr}${documentLastNameTargetFieldAttr}${documentNumberTargetFieldAttr}${documentNationalityTargetFieldAttr}${documentBirthDateTargetFieldAttr}${documentExpiryDateTargetFieldAttr}${documentSexTargetFieldAttr}${fileDropModeAttr}${minFilesAttr}${maxFilesAttr}${maxFileSizeAttr}${maxTotalFileSizeAttr}${formDataFieldNameAttr}${fileTypeErrorAttr}${fileSizeErrorAttr}` : placeholderAttr}${includeInSubmitAttr}${viewTemplateAttr}${viewTemplateUnsafeAttr}${viewModeAttr}${conditionalAttrs} />
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
    stepSections: [
      {
        type: 'section',
        name: sectionName,
        label: sectionLabel,
      },
    ],
    workflowStepTargets: 'workflowStepTargets' in input ? (input as any).workflowStepTargets : undefined,
    submit,
    provider,
    storage: input.storage,
    validation: input.validation,
    stepLabels: input.stepLabels,
    rules: input.rules,
    successMsg: input.successMsg,
    errorMsg: input.errorMsg,
  });
}

export function createTemplateMarkup(
  config: TFormConfig,
  templateName: string = config.name
): string {
  const stepSections = config.stepSections?.length ? config.stepSections : config.sections[CUSTOM_SECTION];
  const templateSections: any[] = stepSections?.length
    ? stepSections
    : [{ name: 'main', label: 'Main' }];
  const sectionsMarkup = templateSections
    .map((section) => {
      const sectionName = section?.name || 'main';
      const sectionLabel = section?.label || 'Main';
      const fields = config.sections[sectionName] || [];
      const fieldMarkup = fields.map((field) => renderField(field, sectionName)).join('\n');
      const sectionStepAttrs = [
        section?.stepSkippable ? ' data-step-skippable="true"' : '',
        section?.stepSummary ? ' data-step-summary="true"' : '',
        section?.stepValidateWhenWorkflowStates?.length
          ? ` data-step-validate-when-workflow-states="${escapeHtml(JSON.stringify(section.stepValidateWhenWorkflowStates))}"`
          : '',
        section?.nextStepWhenField
          ? ` data-next-step-when-field="${escapeHtml(section.nextStepWhenField)}"`
          : '',
        section?.nextStepWhenEquals
          ? ` data-next-step-when-equals="${escapeHtml(
              Array.isArray(section.nextStepWhenEquals)
                ? JSON.stringify(section.nextStepWhenEquals)
                : String(section.nextStepWhenEquals),
            )}"`
          : '',
        section?.nextStepWhenNotEquals
          ? ` data-next-step-when-not-equals="${escapeHtml(
              Array.isArray(section.nextStepWhenNotEquals)
                ? JSON.stringify(section.nextStepWhenNotEquals)
                : String(section.nextStepWhenNotEquals),
            )}"`
          : '',
        section?.nextStepTarget
          ? ` data-next-step-target="${escapeHtml(section.nextStepTarget)}"`
          : '',
        section?.stepTransitions?.length
          ? ` data-step-transitions="${escapeHtml(JSON.stringify(section.stepTransitions))}"`
          : '',
      ].join('');

      return `    <div data-name="${escapeHtml(sectionName)}" data-type="section" data-label="${escapeHtml(sectionLabel)}"${sectionStepAttrs} class="flex flex-col gap-4">
      ${fieldMarkup}
      <button type="submit" class="btn btn-primary">Submit</button>
    </div>`;
    })
    .join('\n');

  const submitAttrs = config.submit
    ? [
        `data-submit-endpoint="${escapeHtml(config.submit.endpoint)}"`,
        config.submit.baseUrl
          ? `data-submit-base-url="${escapeHtml(config.submit.baseUrl)}"`
          : '',
        config.submit.includeSettingFields
          ? `data-submit-include-setting-fields="true"`
          : '',
        config.submit.settingFieldAllowlist?.length
          ? `data-submit-setting-field-allowlist="${escapeHtml(JSON.stringify(config.submit.settingFieldAllowlist))}"`
          : '',
        config.submit.providerRoutingPolicy
          ? `data-submit-provider-routing-policy="${escapeHtml(config.submit.providerRoutingPolicy)}"`
          : '',
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
        config.storage.resumeEndpoint
          ? `data-storage-resume-endpoint="${escapeHtml(config.storage.resumeEndpoint)}"`
          : '',
        config.storage.resumeTokenTtlDays !== undefined
          ? `data-storage-resume-token-ttl-days="${escapeHtml(String(config.storage.resumeTokenTtlDays))}"`
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
  const workflowStepTargetsAttr = config.workflowStepTargets
    ? `data-workflow-step-targets="${escapeHtml(JSON.stringify(config.workflowStepTargets))}"`
    : '';
  const stepLabelAttrs = config.stepLabels
    ? [
        config.stepLabels.previous
          ? `data-step-previous-label="${escapeHtml(config.stepLabels.previous)}"`
          : '',
        config.stepLabels.next
          ? `data-step-next-label="${escapeHtml(config.stepLabels.next)}"`
          : '',
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  return `<template id="${escapeHtml(templateName)}">
  <form id="${escapeHtml(templateName)}_form" data-version="${escapeHtml(String(config.version || PUBLIC_FORM_SCHEMA_VERSION))}" data-type="${escapeHtml(config.type)}" data-name="${escapeHtml(config.name)}" data-label="${escapeHtml(config.title)}" ${submitAttrs} ${storageAttrs} ${rulesAttr} ${stepLabelAttrs} ${workflowStepTargetsAttr}>
${sectionsMarkup}
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

  if (
    element &&
    'initialize' in element &&
    typeof (element as any).initialize === 'function' &&
    !(element as any).initialized
  ) {
    (element as any).initialize();
  }

  const lifecycle = config.submit?.lifecycle;
  const submitTransport = config.submit?.transport;
  const validationConfig = (config as any).validation;
  const storageConfig = (config as any).storage;
  const signedResumeSettings =
    storageConfig && (
      storageConfig.signResumeToken
      || storageConfig.verifyResumeToken
      || storageConfig.resumeTokenSignatureVersion
    )
      ? {
          ...(storageConfig.signResumeToken ? { signResumeToken: storageConfig.signResumeToken } : {}),
          ...(storageConfig.verifyResumeToken ? { verifyResumeToken: storageConfig.verifyResumeToken } : {}),
          ...(storageConfig.resumeTokenSignatureVersion
            ? { resumeTokenSignatureVersion: storageConfig.resumeTokenSignatureVersion }
            : {}),
        }
      : null;
  if (
    (lifecycle || submitTransport || validationConfig || signedResumeSettings) &&
    element &&
    'formConfig' in element &&
    (element as any).formConfig &&
    (element as any).formConfig
  ) {
    if ((element as any).formConfig.submit) {
      (element as any).formConfig.submit = {
        ...(element as any).formConfig.submit,
        ...(lifecycle ? { lifecycle } : {}),
        ...(submitTransport ? { transport: submitTransport } : {}),
      };
    }
    if (validationConfig) {
      (element as any).formConfig.validation = validationConfig;
    }
    if (signedResumeSettings && (element as any).formConfig.storage) {
      (element as any).formConfig.storage = {
        ...(element as any).formConfig.storage,
        ...signedResumeSettings,
      };
    }
  }

  return element;
}
