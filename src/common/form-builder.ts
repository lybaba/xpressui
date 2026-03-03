import shortUUID from 'short-uuid';
import { CUSTOM_SECTION } from './Constants';
import TFieldConfig from './TFieldConfig';
import TFormConfig, {
  CONTACTFORM_TYPE,
  TFormProviderRequest,
  TFormStorageConfig,
  TFormSubmitRequest,
} from './TFormConfig';
import {
  CHECKBOX_TYPE,
  getHtmlInputType,
  SELECT_ONE_TYPE,
  TEXTAREA_TYPE,
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

  if (field.type === CHECKBOX_TYPE) {
    return `<label class="label cursor-pointer justify-start gap-3">
    <input class="checkbox" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="checkbox" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${conditionalAttrs} />
    <span class="label-text">${escapeHtml(field.label)}</span>
</label>
<span class="label-text-alt" id="${escapeHtml(field.name)}_error"></span>`;
  }

  return `<label class="form-control w-full">
    <div class="label"><span class="label-text">${escapeHtml(field.label)}</span></div>
    <input class="input input-bordered w-full" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="${escapeHtml(getHtmlInputType(field.type))}" data-label="${escapeHtml(field.label)}" data-type="${escapeHtml(field.type)}" data-name="${escapeHtml(field.name)}"${requiredAttr} data-section-name="${escapeHtml(sectionName)}"${placeholderAttr}${conditionalAttrs} />
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
    ? {
        endpoint: provider.endpoint,
        method: provider.method || 'POST',
        headers: provider.headers,
        action: provider.type,
      }
    : undefined);

  return {
    id: shortUUID.generate(),
    uid: shortUUID.generate(),
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
    successMsg: input.successMsg,
    errorMsg: input.errorMsg,
  };
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
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  return `<template id="${escapeHtml(templateName)}">
  <form id="${escapeHtml(templateName)}_form" data-type="${escapeHtml(config.type)}" data-name="${escapeHtml(config.name)}" data-label="${escapeHtml(config.title)}" ${submitAttrs} ${storageAttrs}>
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
  const config = 'fields' in input ? createFormConfig(input) : input;
  container.innerHTML = createTemplateMarkup(config, templateName);
  const element = container.querySelector('form-ui') as HTMLElement | null;

  if (element && 'initialize' in element && typeof (element as any).initialize === 'function') {
    (element as any).initialize();
  }

  return element;
}
