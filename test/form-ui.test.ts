import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as publicApi from '../src/index';
import {
  createLocalFormAdmin,
  createFormConfig,
  createSubmitRequestFromProvider,
  attachFormDebugObserver,
  FormEngineRuntime,
  FormDynamicRuntime,
  FormPersistenceRuntime,
  FormRuntime,
  FormUI,
  getProviderDefinition,
  mountFormUI,
  PUBLIC_FORM_SCHEMA_VERSION,
  registerProvider,
  TFormUISubmitDetail,
  validatePublicFormConfig,
} from '../src/index';

function renderFixture(markup: string): FormUI {
  document.body.innerHTML = markup;
  return document.querySelector('form-ui') as FormUI;
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 10));
}

describe('FormUI', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.localStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('keeps the main public runtime exports available from the package entrypoint', () => {
    expect(publicApi.FormUI).toBe(FormUI);
    expect(publicApi.FormRuntime).toBe(FormRuntime);
    expect(publicApi.createFormConfig).toBe(createFormConfig);
    expect(publicApi.mountFormUI).toBe(mountFormUI);
    expect(publicApi.createLocalFormAdmin).toBe(createLocalFormAdmin);
    expect(publicApi.validatePublicFormConfig).toBe(validatePublicFormConfig);
    expect(publicApi.PUBLIC_FORM_SCHEMA_VERSION).toBe(PUBLIC_FORM_SCHEMA_VERSION);
    expect(publicApi.registerProvider).toBe(registerProvider);
    expect(publicApi.getProviderDefinition).toBe(getProviderDefinition);
    expect(publicApi.createSubmitRequestFromProvider).toBe(createSubmitRequestFromProvider);
  });

  it('hydrates a named template into the custom element', () => {
    const element = renderFixture(`
      <template id="contact">
        <form
          id="contact_form"
          data-type="contactform"
          data-name="contact"
          data-label="Contact"
        >
          <div
            data-type="section"
            data-name="main"
            data-label="Main"
          ></div>
          <input
            id="email"
            name="email"
            type="email"
            data-type="email"
            data-name="email"
            data-label="Email"
            data-section-name="main"
          />
          <span id="email_error"></span>
        </form>
      </template>
      <form-ui name="contact"></form-ui>
    `);

    expect(customElements.get('form-ui')).toBe(FormUI);
    expect(element.querySelector('#contact_form')).not.toBeNull();
    expect(element.formConfig?.name).toBe('contact');
    expect(element.validators).toHaveLength(1);
  });

  it('emits a submit success event for a valid form', async () => {
    const element = renderFixture(`
      <template id="contact">
        <form
          id="contact_form"
          data-type="contactform"
          data-name="contact"
          data-label="Contact"
        >
          <div
            data-type="section"
            data-name="main"
            data-label="Main"
          ></div>
          <input
            id="email"
            name="email"
            type="email"
            data-type="email"
            data-name="email"
            data-label="Email"
            data-required="true"
            data-section-name="main"
          />
          <span id="email_error"></span>
        </form>
      </template>
      <form-ui name="contact"></form-ui>
    `);

    const input = element.querySelector('#email') as HTMLInputElement;
    const form = element.querySelector('#contact_form') as HTMLFormElement;
    const onSubmitSuccess = vi.fn();

    element.addEventListener('form-ui:submit-success', (event) => {
      onSubmitSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'alice@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(onSubmitSuccess).toHaveBeenCalledTimes(1);
    expect(onSubmitSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { email: 'alice@example.com' },
      })
    );
  });

  it('can observe form events through the debug observer helper', async () => {
    const element = renderFixture(`
      <template id="debug">
        <form
          id="debug_form"
          data-type="contactform"
          data-name="debug"
          data-label="Debug"
        >
          <div
            data-type="section"
            data-name="main"
            data-label="Main"
          ></div>
          <input
            id="email"
            name="email"
            type="email"
            data-type="email"
            data-name="email"
            data-label="Email"
            data-required="true"
            data-section-name="main"
          />
          <span id="email_error"></span>
        </form>
      </template>
      <form-ui name="debug"></form-ui>
    `);
    const observer = attachFormDebugObserver(element, { maxEvents: 10 });
    const input = element.querySelector('#email') as HTMLInputElement;
    const form = element.querySelector('#debug_form') as HTMLFormElement;

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'debug@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(observer.getEvents().map((event) => event.type)).toEqual([
      'form-ui:submit',
      'form-ui:submit-success',
    ]);

    observer.clear();
    expect(observer.getEvents()).toEqual([]);
    observer.detach();
  });

  it('can observe applied rules through the debug observer helper', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'debug-rule-history-form',
      title: 'Debug Rule History Form',
      rules: [
        {
          id: 'set-currency',
          conditions: [
            { field: 'country', operator: 'equals', value: 'fr' },
          ],
          actions: [
            { type: 'set-value', field: 'currency', value: 'EUR' },
          ],
        },
      ],
      fields: [
        { name: 'country', label: 'Country', type: 'text' },
        { name: 'currency', label: 'Currency', type: 'text' },
      ],
    }) as FormUI;
    const observer = attachFormDebugObserver(element, { maxEvents: 10 });
    const country = element.querySelector('#country') as HTMLInputElement;

    country.value = 'fr';
    country.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(observer.getRuleHistory()).toHaveLength(1);
    expect(observer.getRuleHistory()[0]?.detail?.result?.id).toBe('set-currency');

    observer.clearRuleHistory();
    expect(observer.getRuleHistory()).toEqual([]);
    expect(observer.getEvents().some((event) => event.type === 'form-ui:rule-applied')).toBe(true);

    observer.detach();
  });

  it('can observe template diagnostics through the debug observer helper', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'debug-template-diagnostics-form',
      title: 'Debug Template Diagnostics Form',
      rules: [
        {
          id: 'compose-full-name',
          conditions: [
            { field: 'autoFullName', operator: 'equals', value: true },
          ],
          actions: [
            {
              type: 'set-value',
              field: 'fullName',
              template: '{{firstName}} {{missingName}}',
              transform: 'trim',
            },
          ],
        },
      ],
      fields: [
        { name: 'firstName', label: 'First name', type: 'text' },
        { name: 'fullName', label: 'Full name', type: 'text' },
        { name: 'autoFullName', label: 'Auto full name', type: 'checkbox' },
      ],
    }) as FormUI;
    const observer = attachFormDebugObserver(element, { maxEvents: 10 });
    const firstName = element.querySelector('#firstName') as HTMLInputElement;
    const autoFullName = element.querySelector('#autoFullName') as HTMLInputElement;

    firstName.value = 'Ada';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    autoFullName.checked = true;
    autoFullName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(observer.getTemplateDiagnostics().map((event) => event.type)).toEqual([
      'form-ui:rule-template-missing-field',
    ]);

    observer.clearTemplateDiagnostics();
    expect(observer.getTemplateDiagnostics()).toEqual([]);
    observer.detach();
  });

  it('can read the active template warnings through the debug observer helper', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'debug-active-template-warnings-form',
      title: 'Debug Active Template Warnings Form',
      rules: [
        {
          id: 'compose-full-name',
          conditions: [
            { field: 'autoFullName', operator: 'equals', value: true },
          ],
          actions: [
            {
              type: 'set-value',
              field: 'fullName',
              template: '{{firstName}} {{missingName}}',
              transform: 'trim',
            },
          ],
        },
      ],
      fields: [
        { name: 'firstName', label: 'First name', type: 'text' },
        { name: 'fullName', label: 'Full name', type: 'text' },
        { name: 'autoFullName', label: 'Auto full name', type: 'checkbox' },
      ],
    }) as FormUI;
    const observer = attachFormDebugObserver(element, { maxEvents: 10 });
    const firstName = element.querySelector('#firstName') as HTMLInputElement;
    const autoFullName = element.querySelector('#autoFullName') as HTMLInputElement;

    firstName.value = 'Ada';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    autoFullName.checked = true;
    autoFullName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(observer.getActiveTemplateWarnings()).toEqual([
      {
        ruleId: 'compose-full-name',
        field: 'fullName',
        template: '{{firstName}} {{missingName}}',
        missingField: 'missingName',
      },
    ]);

    observer.clear();
    expect(observer.getActiveTemplateWarnings()).toEqual([]);
    observer.detach();
  });

  it('shows and clears validation errors in the DOM', () => {
    const element = renderFixture(`
      <template id="contact">
        <form
          id="contact_form"
          data-type="contactform"
          data-name="contact"
          data-label="Contact"
        >
          <div
            data-type="section"
            data-name="main"
            data-label="Main"
          ></div>
          <input
            id="email"
            name="email"
            type="email"
            data-type="email"
            data-name="email"
            data-label="Email"
            data-required="true"
            data-section-name="main"
          />
          <span id="email_error"></span>
        </form>
      </template>
      <form-ui name="contact"></form-ui>
    `);

    const input = element.querySelector('#email') as HTMLInputElement;
    const error = element.querySelector('#email_error') as HTMLSpanElement;

    input.dispatchEvent(new FocusEvent('focus'));
    input.dispatchEvent(new FocusEvent('blur'));

    expect(error.textContent).toBe('This field is required.');
    expect(error.style.display).toBe('block');
    expect(input.classList.contains('input-error')).toBe(true);

    input.value = 'alice@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));

    expect(error.textContent).toBe('');
    expect(error.style.display).toBe('none');
    expect(input.classList.contains('input-error')).toBe(false);
  });

  it('can mount a form from a simple config object', () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'booking-form',
      title: 'Booking Form',
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
        },
      ],
    }) as FormUI;

    expect(element).not.toBeNull();
    expect(container.querySelector('template#booking-form')).not.toBeNull();
    expect(element.formConfig?.name).toBe('booking-form');
    expect(element.querySelector('#notes')).not.toBeNull();
  });

  it('emits version 1 configs from the public builder', () => {
    const formConfig = createFormConfig({
      name: 'versioned-form',
      title: 'Versioned Form',
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });

    expect(formConfig.version).toBe(PUBLIC_FORM_SCHEMA_VERSION);
  });

  it('supports standalone normalization and validation without mounting FormUI', () => {
    const formConfig = createFormConfig({
      name: 'engine-form',
      title: 'Engine Form',
      fields: [
        {
          name: 'amount',
          label: 'Amount',
          type: 'price',
          required: true,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
      ],
    });
    const runtime = new FormEngineRuntime();
    const section = formConfig.sections.main || [];

    runtime.setFormConfig(formConfig);
    section.forEach((field) => {
      runtime.setField(field.name, field);
    });

    expect(
      runtime.normalizeValues({
        amount: '42.50',
        email: 'buyer@example.com',
      })
    ).toEqual({
      amount: 42.5,
      email: 'buyer@example.com',
    });

    expect(Object.keys(runtime.validateValues({})).length).toBeGreaterThan(0);
  });

  it('exposes a composed headless runtime API', async () => {
    let values: Record<string, any> = { amount: '12.50', email: 'headless@example.com' };
    const formConfig = createFormConfig({
      name: 'headless-runtime-form',
      title: 'Headless Runtime Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key: 'xpressui:test-headless-runtime',
        autoSaveMs: 0,
      },
      fields: [
        {
          name: 'amount',
          label: 'Amount',
          type: 'price',
          required: true,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
      ],
    });
    const runtime = new FormRuntime(formConfig, {
      getValues: () => values,
    });

    (formConfig.sections.main || []).forEach((field) => {
      runtime.setField(field.name, field);
    });

    expect(runtime.normalizeValues(values)).toEqual({
      amount: 12.5,
      email: 'headless@example.com',
    });

    runtime.saveDraft();
    await flushAsyncWork();

    expect(runtime.loadDraftValues()).toEqual(values);
    expect(runtime.getStorageSnapshot().draft).toEqual(values);

    values = { amount: '', email: '' };
    expect(Object.keys(runtime.validateValues(values)).length).toBeGreaterThan(0);
  });

  it('migrates legacy public configs to version 1', () => {
    const legacyConfig = {
      id: 'legacy-id',
      uid: 'legacy-uid',
      type: 'contactform',
      name: 'legacy-form',
      label: 'Legacy Form',
      sections: {
        custom: [
          {
            type: 'section',
            name: 'main',
            label: 'Main',
          },
        ],
        main: [
          {
            type: 'email',
            name: 'email',
            label: 'Email',
          },
        ],
      },
    };

    const validated = validatePublicFormConfig(legacyConfig);
    expect(validated.version).toBe(1);
    expect(validated.title).toBe('Legacy Form');
  });

  it('rejects invalid public configs', () => {
    expect(() =>
      validatePublicFormConfig({
        version: 1,
        id: 'broken',
        uid: 'broken',
        type: 'contactform',
        name: '',
        title: 'Broken',
        sections: {},
      })
    ).toThrow(/Invalid public form config/);
  });

  it('can submit to a configured API endpoint', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ bookingId: 'bk_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const container = document.createElement('div');
    const element = mountFormUI(
      container,
      createFormConfig({
        name: 'booking-api',
        title: 'Booking API',
        provider: {
          type: 'reservation',
          endpoint: 'https://api.example.test/bookings',
          method: 'POST',
        },
        fields: [
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
          },
        ],
      })
    ) as FormUI;
    const input = element.querySelector('#email') as HTMLInputElement;
    const form = element.querySelector('#booking-api_form') as HTMLFormElement;
    const onSuccess = vi.fn();

    element.addEventListener('form-ui:submit-success', (event) => {
      onSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'alice@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/bookings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'reservation',
          reservation: { email: 'alice@example.com' },
        }),
      })
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { bookingId: 'bk_123' },
      })
    );
  });

  it('supports standalone persistence without mounting FormUI', async () => {
    const formConfig = createFormConfig({
      name: 'runtime-draft-form',
      title: 'Runtime Draft Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key: 'xpressui:test-runtime-draft',
        autoSaveMs: 0,
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });
    const runtime = new FormPersistenceRuntime({
      getFormConfig: () => formConfig,
      getValues: () => ({ email: 'runtime@example.com' }),
      emitEvent: () => true,
      submitValues: async () => ({
        response: new Response(null, { status: 204 }),
        result: null,
      }),
    });

    runtime.setFormConfig(formConfig);
    runtime.saveDraft();
    await flushAsyncWork();

    expect(runtime.loadDraftValues()).toEqual({ email: 'runtime@example.com' });
    expect(runtime.getStorageSnapshot().draft).toEqual({ email: 'runtime@example.com' });

    runtime.clearDraft();

    expect(runtime.loadDraftValues()).toEqual({});
  });

  it('supports conditional visibility and remote select options', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { value: 'morning', label: 'Morning' },
          { value: 'evening', label: 'Evening' },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'dynamic-form',
      title: 'Dynamic Form',
      fields: [
        {
          name: 'service',
          label: 'Service',
          type: 'select-one',
          choices: [
            { value: 'consulting', label: 'Consulting' },
            { value: 'support', label: 'Support' },
          ],
        },
        {
          name: 'slot',
          label: 'Slot',
          type: 'select-one',
          visibleWhenField: 'service',
          visibleWhenEquals: 'consulting',
          optionsEndpoint: 'https://api.example.test/slots',
          optionsDependsOn: 'service',
        },
      ],
    }) as FormUI;
    const service = element.querySelector('#service') as HTMLSelectElement;
    const slot = element.querySelector('#slot') as HTMLSelectElement;
    const slotContainer = slot.closest('label') as HTMLElement;

    expect(slotContainer.style.display).toBe('none');

    service.value = 'consulting';
    service.dispatchEvent(new Event('input', { bubbles: true }));
    service.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsyncWork();

    expect(slotContainer.style.display).toBe('');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/slots?service=consulting'
    );
    expect(slot.options.length).toBe(3);
    expect(slot.options[1].value).toBe('morning');
    expect(slot.options[2].textContent).toBe('Evening');
  });

  it('supports standalone dynamic field logic without mounting FormUI', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { value: 'morning', label: 'Morning' },
          { value: 'evening', label: 'Evening' },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
    document.body.innerHTML = `
      <div id="service-container">
        <select id="service">
          <option value=""></option>
          <option value="consulting">Consulting</option>
        </select>
      </div>
      <label id="slot-container">
        <select id="slot"></select>
      </label>
    `;

    let values: Record<string, any> = { service: '' };
    const runtime = new FormDynamicRuntime({
      getFieldConfigs: () => [
        {
          name: 'slot',
          label: 'Slot',
          type: 'select-one',
          visibleWhenField: 'service',
          visibleWhenEquals: 'consulting',
          optionsEndpoint: 'https://api.example.test/slots',
          optionsDependsOn: 'service',
        },
      ],
      getRules: () => [],
      getFieldContainer: (fieldName) =>
        fieldName === 'slot'
          ? document.querySelector('#slot-container') as HTMLElement
          : null,
      getFieldElement: (fieldName) =>
        document.querySelector(`#${fieldName}`) as HTMLSelectElement | null,
      setFieldDisabled: (fieldName, disabled) => {
        const field = document.querySelector(`#${fieldName}`) as HTMLSelectElement | null;
        if (field) {
          field.disabled = disabled;
        }
      },
      getFieldValue: (fieldName) => values[fieldName],
      clearFieldValue: (fieldName) => {
        values = { ...values, [fieldName]: undefined };
      },
      setFieldValue: (fieldName, value) => {
        values = { ...values, [fieldName]: value };
      },
      getFormValues: () => values,
      emitEvent: () => true,
      getEventContext: () => ({ formConfig: null, submit: undefined }),
    });

    runtime.updateConditionalFields();

    expect((document.querySelector('#slot-container') as HTMLElement).style.display).toBe('none');

    values = { service: 'consulting' };
    runtime.updateConditionalFields();
    await runtime.refreshRemoteOptions('service');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/slots?service=consulting'
    );
    expect((document.querySelector('#slot-container') as HTMLElement).style.display).toBe('');
    expect((document.querySelector('#slot') as HTMLSelectElement).options.length).toBe(3);
  });

  it('exposes active template warnings from the standalone dynamic runtime', () => {
    let values: Record<string, any> = { autoFullName: false, firstName: '' };
    const runtime = new FormDynamicRuntime({
      getFieldConfigs: () => [
        { name: 'firstName', label: 'First name', type: 'text' },
        { name: 'fullName', label: 'Full name', type: 'text' },
        { name: 'autoFullName', label: 'Auto full name', type: 'checkbox' },
      ],
      getRules: () => [
        {
          id: 'compose-full-name',
          conditions: [
            { field: 'autoFullName', operator: 'equals', value: true },
          ],
          actions: [
            {
              type: 'set-value',
              field: 'fullName',
              template: '{{firstName}} {{missingName}}',
              transform: 'trim',
            },
          ],
        },
      ],
      getFieldContainer: () => null,
      getFieldElement: () => null,
      setFieldDisabled: () => {},
      getFieldValue: (fieldName) => values[fieldName],
      clearFieldValue: (fieldName) => {
        values = { ...values, [fieldName]: undefined };
      },
      setFieldValue: (fieldName, value) => {
        values = { ...values, [fieldName]: value };
      },
      getFormValues: () => values,
      emitEvent: () => true,
      getEventContext: () => ({ formConfig: null, submit: undefined }),
    });

    values = { ...values, firstName: 'Ada', autoFullName: true };
    runtime.updateConditionalFields();

    expect(runtime.getActiveTemplateWarnings()).toEqual([
      {
        ruleId: 'compose-full-name',
        field: 'fullName',
        template: '{{firstName}} {{missingName}}',
        missingField: 'missingName',
      },
    ]);
  });

  it('supports basic rules with AND/OR logic and show/hide actions', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'rules-form',
      title: 'Rules Form',
      rules: [
        {
          logic: 'AND',
          conditions: [
            { field: 'service', operator: 'equals', value: 'consulting' },
            { field: 'urgency', operator: 'equals', value: 'high' },
          ],
          actions: [
            { type: 'show', field: 'notes' },
          ],
        },
        {
          logic: 'OR',
          conditions: [
            { field: 'service', operator: 'equals', value: 'support' },
            { field: 'urgency', operator: 'equals', value: 'low' },
          ],
          actions: [
            { type: 'hide', field: 'notes' },
            { type: 'clear-value', field: 'notes' },
          ],
        },
      ],
      fields: [
        {
          name: 'service',
          label: 'Service',
          type: 'text',
        },
        {
          name: 'urgency',
          label: 'Urgency',
          type: 'text',
        },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
        },
      ],
    }) as FormUI;
    const service = element.querySelector('#service') as HTMLInputElement;
    const urgency = element.querySelector('#urgency') as HTMLInputElement;
    const notes = element.querySelector('#notes') as HTMLTextAreaElement;
    const notesContainer = notes.closest('label') as HTMLElement;

    service.value = 'support';
    service.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(notesContainer.style.display).toBe('none');

    service.value = 'consulting';
    service.dispatchEvent(new Event('input', { bubbles: true }));
    urgency.value = 'high';
    urgency.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(notesContainer.style.display).toBe('');

    notes.value = 'Keep me';
    notes.dispatchEvent(new Event('input', { bubbles: true }));
    urgency.value = 'low';
    urgency.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(notesContainer.style.display).toBe('none');
    expect((element.form?.getState().values || {}).notes).toBeUndefined();
  });

  it('emits a debug event when a rule is applied', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'rule-event-form',
      title: 'Rule Event Form',
      rules: [
        {
          id: 'set-currency',
          conditions: [
            { field: 'country', operator: 'equals', value: 'fr' },
          ],
          actions: [
            { type: 'set-value', field: 'currency', value: 'EUR' },
          ],
        },
      ],
      fields: [
        { name: 'country', label: 'Country', type: 'text' },
        { name: 'currency', label: 'Currency', type: 'text' },
      ],
    }) as FormUI;
    const country = element.querySelector('#country') as HTMLInputElement;
    const onRuleApplied = vi.fn();

    element.addEventListener('form-ui:rule-applied', (event) => {
      onRuleApplied((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    country.value = 'fr';
    country.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(onRuleApplied).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          id: 'set-currency',
          actions: [
            { type: 'set-value', field: 'currency', value: 'EUR' },
          ],
        }),
      })
    );
  });

  it('does not emit a rule-applied event when a matching rule does not change state', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'no-op-rule-event-form',
      title: 'No Op Rule Event Form',
      rules: [
        {
          id: 'set-currency',
          conditions: [
            { field: 'country', operator: 'equals', value: 'fr' },
          ],
          actions: [
            { type: 'set-value', field: 'currency', value: 'EUR' },
          ],
        },
      ],
      fields: [
        { name: 'country', label: 'Country', type: 'text' },
        { name: 'currency', label: 'Currency', type: 'text' },
      ],
    }) as FormUI;
    const country = element.querySelector('#country') as HTMLInputElement;
    const currency = element.querySelector('#currency') as HTMLInputElement;
    const onRuleApplied = vi.fn();

    element.addEventListener('form-ui:rule-applied', (event) => {
      onRuleApplied((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    country.value = 'fr';
    country.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(currency.value).toBe('EUR');
    expect(onRuleApplied).toHaveBeenCalledTimes(1);

    country.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(onRuleApplied).toHaveBeenCalledTimes(1);
  });

  it('supports advanced rule operators for string and numeric comparisons', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'advanced-rules-form',
      title: 'Advanced Rules Form',
      rules: [
        {
          conditions: [
            { field: 'email', operator: 'contains', value: '@vip.' },
          ],
          actions: [
            { type: 'show', field: 'vipNotes' },
          ],
        },
        {
          conditions: [
            { field: 'plan', operator: 'in', value: ['pro', 'enterprise'] },
            { field: 'amount', operator: 'gt', value: 100 },
            { field: 'discount', operator: 'lt', value: 50 },
          ],
          actions: [
            { type: 'show', field: 'accountManager' },
          ],
        },
      ],
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'plan', label: 'Plan', type: 'text' },
        { name: 'amount', label: 'Amount', type: 'number' },
        { name: 'discount', label: 'Discount', type: 'number' },
        { name: 'vipNotes', label: 'VIP Notes', type: 'textarea' },
        { name: 'accountManager', label: 'Account Manager', type: 'text' },
      ],
    }) as FormUI;
    const email = element.querySelector('#email') as HTMLInputElement;
    const plan = element.querySelector('#plan') as HTMLInputElement;
    const amount = element.querySelector('#amount') as HTMLInputElement;
    const discount = element.querySelector('#discount') as HTMLInputElement;
    const vipNotesContainer = (element.querySelector('#vipNotes') as HTMLTextAreaElement).closest('label') as HTMLElement;
    const accountManagerContainer = (element.querySelector('#accountManager') as HTMLInputElement).closest('label') as HTMLElement;

    email.value = 'member@vip.example';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    plan.value = 'pro';
    plan.dispatchEvent(new Event('input', { bubbles: true }));
    amount.value = '150';
    amount.dispatchEvent(new Event('input', { bubbles: true }));
    discount.value = '10';
    discount.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(vipNotesContainer.style.display).toBe('');
    expect(accountManagerContainer.style.display).toBe('');
  });

  it('supports the set-value rule action', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'set-value-rules-form',
      title: 'Set Value Rules Form',
      rules: [
        {
          conditions: [
            { field: 'country', operator: 'equals', value: 'fr' },
          ],
          actions: [
            { type: 'set-value', field: 'currency', value: 'EUR' },
          ],
        },
      ],
      fields: [
        { name: 'country', label: 'Country', type: 'text' },
        { name: 'currency', label: 'Currency', type: 'text' },
      ],
    }) as FormUI;
    const country = element.querySelector('#country') as HTMLInputElement;
    const currency = element.querySelector('#currency') as HTMLInputElement;

    country.value = 'fr';
    country.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).currency).toBe('EUR');
    expect(currency.value).toBe('EUR');
  });

  it('supports the set-value rule action from another field', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'set-value-source-field-rules-form',
      title: 'Set Value Source Field Rules Form',
      rules: [
        {
          conditions: [
            { field: 'sameAsBilling', operator: 'equals', value: true },
          ],
          actions: [
            { type: 'set-value', field: 'shippingEmail', sourceField: 'billingEmail' },
          ],
        },
      ],
      fields: [
        { name: 'billingEmail', label: 'Billing Email', type: 'email' },
        { name: 'shippingEmail', label: 'Shipping Email', type: 'email' },
        { name: 'sameAsBilling', label: 'Same as billing', type: 'checkbox' },
      ],
    }) as FormUI;
    const billingEmail = element.querySelector('#billingEmail') as HTMLInputElement;
    const shippingEmail = element.querySelector('#shippingEmail') as HTMLInputElement;
    const sameAsBilling = element.querySelector('#sameAsBilling') as HTMLInputElement;

    billingEmail.value = 'billing@example.com';
    billingEmail.dispatchEvent(new Event('input', { bubbles: true }));
    sameAsBilling.checked = true;
    sameAsBilling.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).shippingEmail).toBe('billing@example.com');
    expect(shippingEmail.value).toBe('billing@example.com');
  });

  it('supports set-value transforms for copied field values', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'set-value-transform-rules-form',
      title: 'Set Value Transform Rules Form',
      rules: [
        {
          conditions: [
            { field: 'copySlug', operator: 'equals', value: true },
          ],
          actions: [
            {
              type: 'set-value',
              field: 'slug',
              sourceField: 'name',
              transform: 'lowercase',
            },
          ],
        },
      ],
      fields: [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'slug', label: 'Slug', type: 'text' },
        { name: 'copySlug', label: 'Copy slug', type: 'checkbox' },
      ],
    }) as FormUI;
    const name = element.querySelector('#name') as HTMLInputElement;
    const slug = element.querySelector('#slug') as HTMLInputElement;
    const copySlug = element.querySelector('#copySlug') as HTMLInputElement;

    name.value = '  Hello World  ';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    copySlug.checked = true;
    copySlug.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).slug).toBe('  hello world  ');
    expect(slug.value).toBe('  hello world  ');
  });

  it('supports the slugify set-value transform', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'set-value-slugify-rules-form',
      title: 'Set Value Slugify Rules Form',
      rules: [
        {
          conditions: [
            { field: 'copySlug', operator: 'equals', value: true },
          ],
          actions: [
            {
              type: 'set-value',
              field: 'slug',
              sourceField: 'name',
              transform: 'slugify',
            },
          ],
        },
      ],
      fields: [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'slug', label: 'Slug', type: 'text' },
        { name: 'copySlug', label: 'Copy slug', type: 'checkbox' },
      ],
    }) as FormUI;
    const name = element.querySelector('#name') as HTMLInputElement;
    const slug = element.querySelector('#slug') as HTMLInputElement;
    const copySlug = element.querySelector('#copySlug') as HTMLInputElement;

    name.value = '  Hello World!  ';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    copySlug.checked = true;
    copySlug.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).slug).toBe('hello-world');
    expect(slug.value).toBe('hello-world');
  });

  it('supports set-value templates built from multiple fields', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'set-value-template-rules-form',
      title: 'Set Value Template Rules Form',
      rules: [
        {
          conditions: [
            { field: 'autoFullName', operator: 'equals', value: true },
          ],
          actions: [
            {
              type: 'set-value',
              field: 'fullName',
              template: '{{firstName}} {{lastName}}',
              transform: 'trim',
            },
          ],
        },
      ],
      fields: [
        { name: 'firstName', label: 'First name', type: 'text' },
        { name: 'lastName', label: 'Last name', type: 'text' },
        { name: 'fullName', label: 'Full name', type: 'text' },
        { name: 'autoFullName', label: 'Auto full name', type: 'checkbox' },
      ],
    }) as FormUI;
    const firstName = element.querySelector('#firstName') as HTMLInputElement;
    const lastName = element.querySelector('#lastName') as HTMLInputElement;
    const fullName = element.querySelector('#fullName') as HTMLInputElement;
    const autoFullName = element.querySelector('#autoFullName') as HTMLInputElement;

    firstName.value = 'Ada';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    lastName.value = 'Lovelace';
    lastName.dispatchEvent(new Event('input', { bubbles: true }));
    autoFullName.checked = true;
    autoFullName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).fullName).toBe('Ada Lovelace');
    expect(fullName.value).toBe('Ada Lovelace');
  });

  it('emits a debug event when a set-value template references a missing field', async () => {
    const container = document.createElement('div');
    const onMissingField = vi.fn();
    const element = mountFormUI(container, {
      name: 'set-value-missing-template-field-rules-form',
      title: 'Set Value Missing Template Field Rules Form',
      rules: [
        {
          id: 'compose-full-name',
          conditions: [
            { field: 'autoFullName', operator: 'equals', value: true },
          ],
          actions: [
            {
              type: 'set-value',
              field: 'fullName',
              template: '{{firstName}} {{missingName}}',
              transform: 'trim',
            },
          ],
        },
      ],
      fields: [
        { name: 'firstName', label: 'First name', type: 'text' },
        { name: 'fullName', label: 'Full name', type: 'text' },
        { name: 'autoFullName', label: 'Auto full name', type: 'checkbox' },
      ],
    }) as FormUI;
    const firstName = element.querySelector('#firstName') as HTMLInputElement;
    const fullName = element.querySelector('#fullName') as HTMLInputElement;
    const autoFullName = element.querySelector('#autoFullName') as HTMLInputElement;

    element.addEventListener('form-ui:rule-template-missing-field', (event) => {
      onMissingField((event as CustomEvent<any>).detail);
    });

    firstName.value = 'Ada';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    autoFullName.checked = true;
    autoFullName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(onMissingField).toHaveBeenCalledTimes(1);
    expect(onMissingField).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          ruleId: 'compose-full-name',
          field: 'fullName',
          template: '{{firstName}} {{missingName}}',
          missingField: 'missingName',
        }),
      })
    );
    expect((element.form?.getState().values || {}).fullName).toBe('Ada');
    expect(fullName.value).toBe('Ada');
  });

  it('does not re-emit the same missing template field warning while it stays unchanged', async () => {
    const container = document.createElement('div');
    const onMissingField = vi.fn();
    const element = mountFormUI(container, {
      name: 'set-value-stable-missing-template-field-rules-form',
      title: 'Set Value Stable Missing Template Field Rules Form',
      rules: [
        {
          id: 'compose-full-name',
          conditions: [
            { field: 'autoFullName', operator: 'equals', value: true },
          ],
          actions: [
            {
              type: 'set-value',
              field: 'fullName',
              template: '{{firstName}} {{missingName}}',
              transform: 'trim',
            },
          ],
        },
      ],
      fields: [
        { name: 'firstName', label: 'First name', type: 'text' },
        { name: 'fullName', label: 'Full name', type: 'text' },
        { name: 'autoFullName', label: 'Auto full name', type: 'checkbox' },
      ],
    }) as FormUI;
    const firstName = element.querySelector('#firstName') as HTMLInputElement;
    const autoFullName = element.querySelector('#autoFullName') as HTMLInputElement;

    element.addEventListener('form-ui:rule-template-missing-field', (event) => {
      onMissingField((event as CustomEvent<any>).detail);
    });

    firstName.value = 'Ada';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    autoFullName.checked = true;
    autoFullName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(onMissingField).toHaveBeenCalledTimes(1);
  });

  it('re-emits a missing template field warning after the template becomes valid and then invalid again', async () => {
    const container = document.createElement('div');
    const onMissingField = vi.fn();
    const element = mountFormUI(container, {
      name: 'set-value-reset-missing-template-field-rules-form',
      title: 'Set Value Reset Missing Template Field Rules Form',
      rules: [
        {
          id: 'compose-full-name',
          conditions: [
            { field: 'autoFullName', operator: 'equals', value: true },
          ],
          actions: [
            {
              type: 'set-value',
              field: 'fullName',
              template: '{{firstName}} {{missingName}}',
              transform: 'trim',
            },
          ],
        },
      ],
      fields: [
        { name: 'firstName', label: 'First name', type: 'text' },
        { name: 'fullName', label: 'Full name', type: 'text' },
        { name: 'autoFullName', label: 'Auto full name', type: 'checkbox' },
      ],
    }) as FormUI;
    const firstName = element.querySelector('#firstName') as HTMLInputElement;
    const autoFullName = element.querySelector('#autoFullName') as HTMLInputElement;

    element.addEventListener('form-ui:rule-template-missing-field', (event) => {
      onMissingField((event as CustomEvent<any>).detail);
    });

    firstName.value = 'Ada';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    autoFullName.checked = true;
    autoFullName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    element.formConfig!.rules = [
      {
        id: 'compose-full-name',
        conditions: [
          { field: 'autoFullName', operator: 'equals', value: true },
        ],
        actions: [
          {
            type: 'set-value',
            field: 'fullName',
            template: '{{firstName}}',
            transform: 'trim',
          },
        ],
      },
    ];
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    element.formConfig!.rules = [
      {
        id: 'compose-full-name',
        conditions: [
          { field: 'autoFullName', operator: 'equals', value: true },
        ],
        actions: [
          {
            type: 'set-value',
            field: 'fullName',
            template: '{{firstName}} {{missingName}}',
            transform: 'trim',
          },
        ],
      },
    ];
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(onMissingField).toHaveBeenCalledTimes(2);
  });

  it('emits a debug event when a template warning is cleared', async () => {
    const container = document.createElement('div');
    const onWarningCleared = vi.fn();
    const element = mountFormUI(container, {
      name: 'set-value-template-warning-cleared-form',
      title: 'Set Value Template Warning Cleared Form',
      rules: [
        {
          id: 'compose-full-name',
          conditions: [
            { field: 'autoFullName', operator: 'equals', value: true },
          ],
          actions: [
            {
              type: 'set-value',
              field: 'fullName',
              template: '{{firstName}} {{missingName}}',
              transform: 'trim',
            },
          ],
        },
      ],
      fields: [
        { name: 'firstName', label: 'First name', type: 'text' },
        { name: 'fullName', label: 'Full name', type: 'text' },
        { name: 'autoFullName', label: 'Auto full name', type: 'checkbox' },
      ],
    }) as FormUI;
    const firstName = element.querySelector('#firstName') as HTMLInputElement;
    const autoFullName = element.querySelector('#autoFullName') as HTMLInputElement;

    element.addEventListener('form-ui:rule-template-warning-cleared', (event) => {
      onWarningCleared((event as CustomEvent<any>).detail);
    });

    firstName.value = 'Ada';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    autoFullName.checked = true;
    autoFullName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    element.formConfig!.rules = [
      {
        id: 'compose-full-name',
        conditions: [
          { field: 'autoFullName', operator: 'equals', value: true },
        ],
        actions: [
          {
            type: 'set-value',
            field: 'fullName',
            template: '{{firstName}}',
            transform: 'trim',
          },
        ],
      },
    ];
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(onWarningCleared).toHaveBeenCalledTimes(1);
    expect(onWarningCleared).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          ruleId: 'compose-full-name',
          field: 'fullName',
          template: '{{firstName}}',
          previousMissingField: 'missingName',
        }),
      })
    );
  });

  it('emits the current template warning state when warnings appear and clear', async () => {
    const container = document.createElement('div');
    const onWarningState = vi.fn();
    const element = mountFormUI(container, {
      name: 'set-value-template-warning-state-form',
      title: 'Set Value Template Warning State Form',
      rules: [
        {
          id: 'compose-full-name',
          conditions: [
            { field: 'autoFullName', operator: 'equals', value: true },
          ],
          actions: [
            {
              type: 'set-value',
              field: 'fullName',
              template: '{{firstName}} {{missingName}}',
              transform: 'trim',
            },
          ],
        },
      ],
      fields: [
        { name: 'firstName', label: 'First name', type: 'text' },
        { name: 'fullName', label: 'Full name', type: 'text' },
        { name: 'autoFullName', label: 'Auto full name', type: 'checkbox' },
      ],
    }) as FormUI;
    const firstName = element.querySelector('#firstName') as HTMLInputElement;
    const autoFullName = element.querySelector('#autoFullName') as HTMLInputElement;

    element.addEventListener('form-ui:rule-template-warning-state', (event) => {
      onWarningState((event as CustomEvent<any>).detail);
    });

    firstName.value = 'Ada';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    autoFullName.checked = true;
    autoFullName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    element.formConfig!.rules = [
      {
        id: 'compose-full-name',
        conditions: [
          { field: 'autoFullName', operator: 'equals', value: true },
        ],
        actions: [
          {
            type: 'set-value',
            field: 'fullName',
            template: '{{firstName}}',
            transform: 'trim',
          },
        ],
      },
    ];
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(onWarningState).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        result: {
          warnings: [
            {
              ruleId: 'compose-full-name',
              field: 'fullName',
              template: '{{firstName}} {{missingName}}',
              missingField: 'missingName',
            },
          ],
        },
      })
    );
    expect(onWarningState).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        result: {
          warnings: [],
        },
      })
    );
  });

  it('supports the fetch-options rule action', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { value: '09:00', label: '09:00' },
          { value: '10:00', label: '10:00' },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'fetch-options-rules-form',
      title: 'Fetch Options Rules Form',
      rules: [
        {
          conditions: [
            { field: 'service', operator: 'equals', value: 'consulting' },
          ],
          actions: [
            { type: 'fetch-options', field: 'slot' },
          ],
        },
      ],
      fields: [
        {
          name: 'service',
          label: 'Service',
          type: 'text',
        },
        {
          name: 'slot',
          label: 'Slot',
          type: 'select-one',
          optionsEndpoint: 'https://api.example.test/slots',
          optionsDependsOn: 'service',
        },
      ],
    }) as FormUI;
    const service = element.querySelector('#service') as HTMLInputElement;
    const slot = element.querySelector('#slot') as HTMLSelectElement;

    service.value = 'consulting';
    service.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/slots?service=consulting'
    );
    expect(slot.options.length).toBe(3);
    expect(slot.options[1].value).toBe('09:00');
  });

  it('supports enable and disable rule actions', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'enable-disable-rules-form',
      title: 'Enable Disable Rules Form',
      rules: [
        {
          conditions: [
            { field: 'mode', operator: 'equals', value: 'readonly' },
          ],
          actions: [
            { type: 'disable', field: 'notes' },
          ],
        },
        {
          conditions: [
            { field: 'mode', operator: 'equals', value: 'edit' },
          ],
          actions: [
            { type: 'enable', field: 'notes' },
          ],
        },
      ],
      fields: [
        { name: 'mode', label: 'Mode', type: 'text' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ],
    }) as FormUI;
    const mode = element.querySelector('#mode') as HTMLInputElement;
    const notes = element.querySelector('#notes') as HTMLTextAreaElement;

    mode.value = 'readonly';
    mode.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(notes.disabled).toBe(true);

    mode.value = 'edit';
    mode.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(notes.disabled).toBe(false);
  });

  it('supports a payment provider with a normalized payload', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ clientSecret: 'pi_secret_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'payment-form',
      title: 'Payment Form',
      provider: {
        type: 'payment',
        endpoint: 'https://api.example.test/payments',
      },
      fields: [
        {
          name: 'amount',
          label: 'Amount',
          type: 'price',
          required: true,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
      ],
    }) as FormUI;
    const amount = element.querySelector('#amount') as HTMLInputElement;
    const email = element.querySelector('#email') as HTMLInputElement;
    const form = element.querySelector('#payment-form_form') as HTMLFormElement;
    const onPaymentSuccess = vi.fn();

    element.addEventListener('form-ui:payment-success', (event) => {
      onPaymentSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    amount.dispatchEvent(new FocusEvent('focus'));
    amount.value = '42.50';
    amount.dispatchEvent(new Event('input', { bubbles: true }));
    amount.dispatchEvent(new FocusEvent('blur'));

    email.dispatchEvent(new FocusEvent('focus'));
    email.value = 'buyer@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    email.dispatchEvent(new FocusEvent('blur'));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/payments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'payment',
          payment: {
            amount: 42.5,
            email: 'buyer@example.com',
          },
        }),
      })
    );
    expect(onPaymentSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { clientSecret: 'pi_secret_123' },
      })
    );
  });

  it('supports a stripe payment provider contract', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          clientSecret: 'pi_stripe_secret_123',
          paymentIntentId: 'pi_123',
          redirectUrl: '/checkout/complete',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'stripe-form',
      title: 'Stripe Form',
      provider: {
        type: 'payment-stripe',
        endpoint: 'https://api.example.test/stripe/create-intent',
      },
      fields: [
        {
          name: 'amount',
          label: 'Amount',
          type: 'price',
          required: true,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
      ],
    }) as FormUI;
    const amount = element.querySelector('#amount') as HTMLInputElement;
    const email = element.querySelector('#email') as HTMLInputElement;
    const form = element.querySelector('#stripe-form_form') as HTMLFormElement;
    const onStripeSuccess = vi.fn();

    element.addEventListener('form-ui:payment-stripe-success', (event) => {
      onStripeSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    amount.dispatchEvent(new FocusEvent('focus'));
    amount.value = '19.99';
    amount.dispatchEvent(new Event('input', { bubbles: true }));
    amount.dispatchEvent(new FocusEvent('blur'));

    email.dispatchEvent(new FocusEvent('focus'));
    email.value = 'stripe@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    email.dispatchEvent(new FocusEvent('blur'));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/stripe/create-intent',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'payment-stripe',
          payment: {
            amount: 19.99,
            email: 'stripe@example.com',
          },
        }),
      })
    );
    expect(onStripeSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          clientSecret: 'pi_stripe_secret_123',
          paymentIntentId: 'pi_123',
          redirectUrl: '/checkout/complete',
        },
      })
    );
  });

  it('supports a webhook provider with a generic normalized payload', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ delivered: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'webhook-form',
      title: 'Webhook Form',
      provider: {
        type: 'webhook',
        endpoint: 'https://api.example.test/hooks/inbound',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
        {
          name: 'topic',
          label: 'Topic',
          type: 'text',
          required: true,
        },
      ],
    }) as FormUI;
    const email = element.querySelector('#email') as HTMLInputElement;
    const topic = element.querySelector('#topic') as HTMLInputElement;
    const form = element.querySelector('#webhook-form_form') as HTMLFormElement;
    const onWebhookSuccess = vi.fn();

    element.addEventListener('form-ui:webhook-success', (event) => {
      onWebhookSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    email.dispatchEvent(new FocusEvent('focus'));
    email.value = 'hook@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    email.dispatchEvent(new FocusEvent('blur'));

    topic.dispatchEvent(new FocusEvent('focus'));
    topic.value = 'lead.created';
    topic.dispatchEvent(new Event('input', { bubbles: true }));
    topic.dispatchEvent(new FocusEvent('blur'));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/hooks/inbound',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'webhook',
          data: {
            email: 'hook@example.com',
            topic: 'lead.created',
          },
        }),
      })
    );
    expect(onWebhookSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { delivered: true },
      })
    );
  });

  it('supports a booking availability provider for scheduling workflows', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          slots: [
            { value: '09:00', label: '09:00' },
            { value: '10:00', label: '10:00' },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'availability-form',
      title: 'Availability Form',
      provider: {
        type: 'booking-availability',
        endpoint: 'https://api.example.test/availability',
      },
      fields: [
        {
          name: 'service',
          label: 'Service',
          type: 'text',
          required: true,
        },
        {
          name: 'date',
          label: 'Date',
          type: 'date',
          required: true,
        },
      ],
    }) as FormUI;
    const service = element.querySelector('#service') as HTMLInputElement;
    const date = element.querySelector('#date') as HTMLInputElement;
    const form = element.querySelector('#availability-form_form') as HTMLFormElement;
    const onAvailabilitySuccess = vi.fn();

    element.addEventListener('form-ui:booking-availability-success', (event) => {
      onAvailabilitySuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    service.dispatchEvent(new FocusEvent('focus'));
    service.value = 'massage';
    service.dispatchEvent(new Event('input', { bubbles: true }));
    service.dispatchEvent(new FocusEvent('blur'));

    date.dispatchEvent(new FocusEvent('focus'));
    date.value = '2026-03-10';
    date.dispatchEvent(new Event('input', { bubbles: true }));
    date.dispatchEvent(new FocusEvent('blur'));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/availability',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'booking-availability',
          availability: {
            service: 'massage',
            date: '2026-03-10',
          },
        }),
      })
    );
    expect(onAvailabilitySuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          slots: [
            { value: '09:00', label: '09:00' },
            { value: '10:00', label: '10:00' },
          ],
        },
      })
    );
  });

  it('supports an email provider for outbound messaging workflows', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ delivered: true, messageId: 'msg_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'email-form',
      title: 'Email Form',
      provider: {
        type: 'email',
        endpoint: 'https://api.example.test/email/send',
      },
      fields: [
        {
          name: 'to',
          label: 'To',
          type: 'email',
          required: true,
        },
        {
          name: 'subject',
          label: 'Subject',
          type: 'text',
          required: true,
        },
      ],
    }) as FormUI;
    const to = element.querySelector('#to') as HTMLInputElement;
    const subject = element.querySelector('#subject') as HTMLInputElement;
    const form = element.querySelector('#email-form_form') as HTMLFormElement;
    const onEmailSuccess = vi.fn();

    element.addEventListener('form-ui:email-success', (event) => {
      onEmailSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    to.dispatchEvent(new FocusEvent('focus'));
    to.value = 'user@example.com';
    to.dispatchEvent(new Event('input', { bubbles: true }));
    to.dispatchEvent(new FocusEvent('blur'));

    subject.dispatchEvent(new FocusEvent('focus'));
    subject.value = 'Welcome';
    subject.dispatchEvent(new Event('input', { bubbles: true }));
    subject.dispatchEvent(new FocusEvent('blur'));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/email/send',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'email',
          email: {
            to: 'user@example.com',
            subject: 'Welcome',
          },
        }),
      })
    );
    expect(onEmailSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { delivered: true, messageId: 'msg_123' },
      })
    );
  });

  it('supports custom providers registered through the provider registry', async () => {
    registerProvider('quote-request', {
      buildPayload(values) {
        return {
          action: 'quote-request',
          quote: values,
        };
      },
      successEventName: 'form-ui:quote-success',
      errorEventName: 'form-ui:quote-error',
    });

    expect(getProviderDefinition('quote-request')).not.toBeNull();

    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ quoteId: 'qt_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'quote-form',
      title: 'Quote Form',
      submit: {
        endpoint: 'https://api.example.test/quotes',
        action: 'quote-request',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#email') as HTMLInputElement;
    const form = element.querySelector('#quote-form_form') as HTMLFormElement;
    const onQuoteSuccess = vi.fn();

    element.addEventListener('form-ui:quote-success', (event) => {
      onQuoteSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'quote@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/quotes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'quote-request',
          quote: { email: 'quote@example.com' },
        }),
      })
    );
    expect(onQuoteSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { quoteId: 'qt_123' },
      })
    );
  });

  it('derives submit config from the provider registry for built-in and custom providers', () => {
    expect(
      createSubmitRequestFromProvider({
        type: 'reservation',
        endpoint: 'https://api.example.test/reservations',
      })
    ).toEqual({
      endpoint: 'https://api.example.test/reservations',
      method: 'POST',
      headers: undefined,
      action: 'reservation',
    });

    expect(
      createSubmitRequestFromProvider({
        type: 'quote-request',
        endpoint: 'https://api.example.test/quotes',
      })
    ).toEqual({
      endpoint: 'https://api.example.test/quotes',
      method: 'POST',
      headers: undefined,
      action: 'quote-request',
    });

    const formConfig = createFormConfig({
      name: 'quote-provider-form',
      title: 'Quote Provider Form',
      provider: {
        type: 'quote-request',
        endpoint: 'https://api.example.test/quotes',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });

    expect(formConfig.submit).toEqual({
      endpoint: 'https://api.example.test/quotes',
      method: 'POST',
      headers: undefined,
      action: 'quote-request',
    });
  });

  it('saves and restores drafts with local storage', async () => {
    const key = 'xpressui:test-draft';
    const firstContainer = document.createElement('div');
    const firstElement = mountFormUI(firstContainer, {
      name: 'draft-form',
      title: 'Draft Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key,
        autoSaveMs: 0,
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;
    const input = firstElement.querySelector('#email') as HTMLInputElement;

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'draft@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    await flushAsyncWork();

    expect(window.localStorage.getItem(key)).toContain('draft@example.com');

    const secondContainer = document.createElement('div');
    const secondElement = mountFormUI(secondContainer, {
      name: 'draft-form',
      title: 'Draft Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key,
        autoSaveMs: 0,
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;
    const restoredInput = secondElement.querySelector('#email') as HTMLInputElement;
    const onDraftRestored = vi.fn();

    secondElement.addEventListener('form-ui:draft-restored', (event) => {
      onDraftRestored((event as CustomEvent<TFormUISubmitDetail>).detail);
    });
    secondElement.initialize();
    await flushAsyncWork();

    expect(restoredInput.value).toBe('draft@example.com');
    expect(onDraftRestored).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { email: 'draft@example.com' },
      })
    );
  });

  it('queues submissions locally when the network fails', async () => {
    const fetchSpy = vi
      .spyOn(window, 'fetch')
      .mockRejectedValue(new TypeError('Failed to fetch'));
    const key = 'xpressui:test-queue';
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'queue-form',
      title: 'Queue Form',
      storage: {
        mode: 'draft-and-queue',
        adapter: 'local-storage',
        key,
        autoSaveMs: 0,
      },
      submit: {
        endpoint: 'https://api.example.test/offline',
        method: 'POST',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#email') as HTMLInputElement;
    const form = element.querySelector('#queue-form_form') as HTMLFormElement;
    const onQueued = vi.fn();

    element.addEventListener('form-ui:queued', (event) => {
      onQueued((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'offline@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalled();
    expect(onQueued).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { email: 'offline@example.com' },
      })
    );
    const queueState = JSON.parse(window.localStorage.getItem(`${key}:queue`) || '{}');
    expect(queueState.version).toBe(1);
    expect(queueState.items).toHaveLength(1);
    expect(queueState.items[0].values).toEqual({ email: 'offline@example.com' });
    expect(window.localStorage.getItem(key)).toBeNull();
  });

  it('flushes queued submissions when sync resumes', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ synced: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const key = 'xpressui:test-sync';
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'sync-form',
      title: 'Sync Form',
      storage: {
        mode: 'draft-and-queue',
        adapter: 'local-storage',
        key,
        autoSaveMs: 0,
      },
      submit: {
        endpoint: 'https://api.example.test/sync',
        method: 'POST',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
      ],
    }) as FormUI;
    const onSyncSuccess = vi.fn();

    window.localStorage.setItem(
      `${key}:queue`,
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'queued_1',
            values: { email: 'queued@example.com' },
            attempts: 0,
            createdAt: 1,
            updatedAt: 1,
            nextAttemptAt: 0,
          },
        ],
      }),
    );

    element.addEventListener('form-ui:sync-success', (event) => {
      onSyncSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    await element.flushSubmissionQueue();
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/sync',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'queued@example.com' }),
      })
    );
    expect(onSyncSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { email: 'queued@example.com' },
        result: { synced: true },
      })
    );
    expect(window.localStorage.getItem(`${key}:queue`)).toBe(
      JSON.stringify({ version: 1, items: [] })
    );
  });

  it('increments retry metadata when queued sync fails', async () => {
    const fetchSpy = vi
      .spyOn(window, 'fetch')
      .mockRejectedValue(new TypeError('Temporary offline'));
    const key = 'xpressui:test-backoff';
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'backoff-form',
      title: 'Backoff Form',
      storage: {
        mode: 'queue',
        adapter: 'local-storage',
        key,
      },
      submit: {
        endpoint: 'https://api.example.test/backoff',
        method: 'POST',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;
    const onSyncError = vi.fn();

    window.localStorage.setItem(
      `${key}:queue`,
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'queued_retry',
            values: { email: 'retry@example.com' },
            attempts: 0,
            createdAt: 1,
            updatedAt: 1,
            nextAttemptAt: 0,
          },
        ],
      }),
    );

    element.addEventListener('form-ui:sync-error', (event) => {
      onSyncError((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    await element.flushSubmissionQueue();
    await flushAsyncWork();

    const queueState = JSON.parse(window.localStorage.getItem(`${key}:queue`) || '{}');
    expect(fetchSpy).toHaveBeenCalled();
    expect(onSyncError).toHaveBeenCalledTimes(1);
    expect(queueState.items).toHaveLength(1);
    expect(queueState.items[0].attempts).toBe(1);
    expect(queueState.items[0].nextAttemptAt).toBeGreaterThan(Date.now() - 100);
  });

  it('moves exhausted queue entries to the dead-letter queue', async () => {
    const fetchSpy = vi
      .spyOn(window, 'fetch')
      .mockRejectedValue(new TypeError('Permanent failure'));
    const key = 'xpressui:test-dead-letter';
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'dead-letter-form',
      title: 'Dead Letter Form',
      storage: {
        mode: 'queue',
        adapter: 'local-storage',
        key,
      },
      submit: {
        endpoint: 'https://api.example.test/dead-letter',
        method: 'POST',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;
    const onDeadLettered = vi.fn();

    window.localStorage.setItem(
      `${key}:queue`,
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'queued_dead',
            values: { email: 'dead@example.com' },
            attempts: 2,
            createdAt: 1,
            updatedAt: 1,
            nextAttemptAt: 0,
          },
        ],
      }),
    );

    element.addEventListener('form-ui:dead-lettered', (event) => {
      onDeadLettered((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    await element.flushSubmissionQueue();
    await flushAsyncWork();

    const queueState = JSON.parse(window.localStorage.getItem(`${key}:queue`) || '{}');
    const deadLetterState = JSON.parse(window.localStorage.getItem(`${key}:dead-letter`) || '{}');
    expect(fetchSpy).toHaveBeenCalled();
    expect(queueState).toEqual({ version: 1, items: [] });
    expect(deadLetterState.version).toBe(1);
    expect(deadLetterState.items).toHaveLength(1);
    expect(deadLetterState.items[0].attempts).toBe(3);
    expect(onDeadLettered).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { email: 'dead@example.com' },
      })
    );
    expect(element.getQueueState()).toEqual(
      expect.objectContaining({
        queueLength: 0,
        deadLetterLength: 1,
      })
    );
  });

  it('can clear the dead-letter queue', () => {
    const key = 'xpressui:test-dead-letter-clear';
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'dead-letter-clear-form',
      title: 'Dead Letter Clear Form',
      storage: {
        mode: 'queue',
        adapter: 'local-storage',
        key,
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;

    window.localStorage.setItem(
      `${key}:dead-letter`,
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'dead_1',
            values: { email: 'dead@example.com' },
            attempts: 3,
            createdAt: 1,
            updatedAt: 1,
            nextAttemptAt: 0,
          },
        ],
      }),
    );

    element.clearDeadLetterQueue();

    expect(window.localStorage.getItem(`${key}:dead-letter`)).toBeNull();
    expect(element.getStorageSnapshot().deadLetter).toEqual([]);
  });

  it('can requeue a dead-letter entry back into the active queue', () => {
    const key = 'xpressui:test-dead-letter-requeue';
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'dead-letter-requeue-form',
      title: 'Dead Letter Requeue Form',
      storage: {
        mode: 'queue',
        adapter: 'local-storage',
        key,
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;
    const onRequeued = vi.fn();

    window.localStorage.setItem(
      `${key}:dead-letter`,
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'dead_requeue',
            values: { email: 'return@example.com' },
            attempts: 3,
            createdAt: 1,
            updatedAt: 1,
            nextAttemptAt: 0,
          },
        ],
      }),
    );

    element.addEventListener('form-ui:dead-letter-requeued', (event) => {
      onRequeued((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    expect(element.requeueDeadLetterEntry('dead_requeue')).toBe(true);

    const queueState = JSON.parse(window.localStorage.getItem(`${key}:queue`) || '{}');
    const deadLetterState = JSON.parse(window.localStorage.getItem(`${key}:dead-letter`) || '{}');
    expect(queueState.version).toBe(1);
    expect(queueState.items).toHaveLength(1);
    expect(queueState.items[0].values).toEqual({ email: 'return@example.com' });
    expect(deadLetterState).toEqual({ version: 1, items: [] });
    expect(onRequeued).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { email: 'return@example.com' },
      })
    );
  });

  it('can replay a dead-letter entry immediately', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ replayed: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const key = 'xpressui:test-dead-letter-replay';
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'dead-letter-replay-form',
      title: 'Dead Letter Replay Form',
      storage: {
        mode: 'queue',
        adapter: 'local-storage',
        key,
      },
      submit: {
        endpoint: 'https://api.example.test/replay',
        method: 'POST',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;
    const onReplaySuccess = vi.fn();

    window.localStorage.setItem(
      `${key}:dead-letter`,
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'dead_replay',
            values: { email: 'replay@example.com' },
            attempts: 3,
            createdAt: 1,
            updatedAt: 1,
            nextAttemptAt: 0,
          },
        ],
      }),
    );

    element.addEventListener('form-ui:dead-letter-replayed-success', (event) => {
      onReplaySuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    await expect(element.replayDeadLetterEntry('dead_replay')).resolves.toBe(true);

    const deadLetterState = JSON.parse(window.localStorage.getItem(`${key}:dead-letter`) || '{}');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/replay',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'replay@example.com' }),
      })
    );
    expect(deadLetterState).toEqual({ version: 1, items: [] });
    expect(onReplaySuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { email: 'replay@example.com' },
        result: { replayed: true },
      })
    );
  });

  it('exposes a local admin API independent of FormUI', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const formConfig = createFormConfig({
      name: 'admin-form',
      title: 'Admin Form',
      storage: {
        mode: 'draft-and-queue',
        adapter: 'local-storage',
        key: 'xpressui:test-admin',
      },
      submit: {
        endpoint: 'https://api.example.test/admin',
        method: 'POST',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });
    const admin = createLocalFormAdmin(formConfig);

    window.localStorage.setItem('xpressui:test-admin', JSON.stringify({ email: 'draft@example.com' }));
    window.localStorage.setItem(
      'xpressui:test-admin:queue',
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'queue_admin_1',
            values: { email: 'queued@example.com' },
            attempts: 0,
            createdAt: 1,
            updatedAt: 1,
            nextAttemptAt: 0,
          },
        ],
      }),
    );
    window.localStorage.setItem(
      'xpressui:test-admin:dead-letter',
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'dead_admin_1',
            values: { email: 'dead@example.com' },
            attempts: 3,
            createdAt: 1,
            updatedAt: 1,
            nextAttemptAt: 0,
          },
        ],
      }),
    );

    expect(admin.getSnapshot()).toEqual(
      expect.objectContaining({
        draft: { email: 'draft@example.com' },
      })
    );

    expect(admin.requeueDeadLetterEntry('dead_admin_1')).toBe(true);
    expect(admin.getSnapshot().queue).toHaveLength(2);
    expect(admin.getSnapshot().deadLetter).toEqual([]);

    await expect(admin.replayDeadLetterEntry('missing')).resolves.toBe(false);

    window.localStorage.setItem(
      'xpressui:test-admin:dead-letter',
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'dead_admin_2',
            values: { email: 'replay@example.com' },
            attempts: 3,
            createdAt: 1,
            updatedAt: 1,
            nextAttemptAt: 0,
          },
        ],
      }),
    );

    await expect(admin.replayDeadLetterEntry('dead_admin_2')).resolves.toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/admin',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'replay@example.com' }),
      })
    );

    admin.clearDraft();
    admin.clearQueue();
    admin.clearDeadLetter();
    expect(admin.getSnapshot()).toEqual({
      draft: null,
      queue: [],
      deadLetter: [],
    });
  });

  it('can export and import local admin snapshots', () => {
    const formConfig = createFormConfig({
      name: 'admin-import-export-form',
      title: 'Admin Import Export Form',
      storage: {
        mode: 'draft-and-queue',
        adapter: 'local-storage',
        key: 'xpressui:test-admin-import-export',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });
    const admin = createLocalFormAdmin(formConfig);

    const replaced = admin.importSnapshot({
      draft: { email: 'draft@example.com' },
      queue: [
        {
          id: 'queue_import_1',
          values: { email: 'queued@example.com' },
          attempts: 1,
          createdAt: 1,
          updatedAt: 1,
          nextAttemptAt: 10,
        },
      ],
      deadLetter: [
        {
          id: 'dead_import_1',
          values: { email: 'dead@example.com' },
          attempts: 3,
          createdAt: 2,
          updatedAt: 2,
          nextAttemptAt: 0,
          lastError: 'timeout',
        },
      ],
    });

    expect(replaced).toEqual({
      draft: { email: 'draft@example.com' },
      queue: [
        expect.objectContaining({ id: 'queue_import_1' }),
      ],
      deadLetter: [
        expect.objectContaining({ id: 'dead_import_1' }),
      ],
    });
    expect(admin.exportSnapshot()).toEqual(replaced);

    const merged = admin.importSnapshot(
      {
        draft: { note: 'merged' },
        queue: [
          {
            id: 'queue_import_2',
            values: { email: 'queued-2@example.com' },
            attempts: 0,
            createdAt: 3,
            updatedAt: 3,
            nextAttemptAt: 20,
          },
        ],
        deadLetter: [
          {
            id: 'dead_import_2',
            values: { email: 'dead-2@example.com' },
            attempts: 4,
            createdAt: 4,
            updatedAt: 4,
            nextAttemptAt: 0,
            lastError: 'network',
          },
        ],
      },
      'merge'
    );

    expect(merged.draft).toEqual({
      email: 'draft@example.com',
      note: 'merged',
    });
    expect(merged.queue.map((entry) => entry.id)).toEqual([
      'queue_import_1',
      'queue_import_2',
    ]);
    expect(merged.deadLetter.map((entry) => entry.id)).toEqual([
      'dead_import_1',
      'dead_import_2',
    ]);
  });

  it('can filter and sort queue entries through the local admin API', () => {
    const formConfig = createFormConfig({
      name: 'admin-query-form',
      title: 'Admin Query Form',
      storage: {
        mode: 'queue',
        adapter: 'local-storage',
        key: 'xpressui:test-admin-query',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });
    const admin = createLocalFormAdmin(formConfig);

    window.localStorage.setItem(
      'xpressui:test-admin-query:queue',
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'queue_1',
            values: { email: 'alpha@example.com' },
            attempts: 0,
            createdAt: 100,
            updatedAt: 100,
            nextAttemptAt: 100,
          },
          {
            id: 'queue_2',
            values: { email: 'beta@example.com' },
            attempts: 2,
            createdAt: 200,
            updatedAt: 300,
            nextAttemptAt: 400,
          },
          {
            id: 'queue_3',
            values: { email: 'gamma@example.com' },
            attempts: 4,
            createdAt: 300,
            updatedAt: 500,
            nextAttemptAt: 600,
          },
        ],
      }),
    );

    expect(
      admin.listQueue({
        minAttempts: 1,
        search: 'example',
        sortBy: 'attempts',
        sortOrder: 'asc',
        limit: 2,
      }).map((entry) => entry.id)
    ).toEqual(['queue_2', 'queue_3']);
  });

  it('can filter queue entries by age and retry window', () => {
    const now = 10_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const formConfig = createFormConfig({
      name: 'admin-age-query-form',
      title: 'Admin Age Query Form',
      storage: {
        mode: 'queue',
        adapter: 'local-storage',
        key: 'xpressui:test-admin-age-query',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });
    const admin = createLocalFormAdmin(formConfig);

    window.localStorage.setItem(
      'xpressui:test-admin-age-query:queue',
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'queue_age_1',
            values: { email: 'fresh@example.com' },
            attempts: 1,
            createdAt: 9_500,
            updatedAt: 9_500,
            nextAttemptAt: 10_500,
            lastError: 'fresh network issue',
          },
          {
            id: 'queue_age_2',
            values: { email: 'stale@example.com' },
            attempts: 2,
            createdAt: 7_000,
            updatedAt: 8_000,
            nextAttemptAt: 9_000,
            lastError: 'stale timeout',
          },
          {
            id: 'queue_age_3',
            values: { email: 'older@example.com' },
            attempts: 3,
            createdAt: 1_000,
            updatedAt: 2_000,
            nextAttemptAt: 15_000,
            lastError: 'older timeout',
          },
        ],
      }),
    );

    expect(
      admin.listQueue({
        minAgeMs: 2_000,
        maxAgeMs: 9_000,
        nextAttemptBefore: 10_000,
      }).map((entry) => entry.id)
    ).toEqual(['queue_age_2']);

    expect(
      admin.listQueue({
        nextAttemptAfter: 10_000,
        sortBy: 'nextAttemptAt',
        sortOrder: 'asc',
      }).map((entry) => entry.id)
    ).toEqual(['queue_age_1', 'queue_age_3']);
  });

  it('can filter dead-letter entries through the local admin API', () => {
    const formConfig = createFormConfig({
      name: 'admin-dead-query-form',
      title: 'Admin Dead Query Form',
      storage: {
        mode: 'queue',
        adapter: 'local-storage',
        key: 'xpressui:test-admin-dead-query',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });
    const admin = createLocalFormAdmin(formConfig);

    window.localStorage.setItem(
      'xpressui:test-admin-dead-query:dead-letter',
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'dead_a',
            values: { email: 'a@example.com' },
            attempts: 3,
            createdAt: 100,
            updatedAt: 200,
            nextAttemptAt: 0,
          },
          {
            id: 'dead_b',
            values: { email: 'b@other.com' },
            attempts: 5,
            createdAt: 300,
            updatedAt: 400,
            nextAttemptAt: 0,
          },
        ],
      }),
    );

    expect(
      admin.listDeadLetter({
        minAttempts: 4,
        search: 'other',
      }).map((entry) => entry.id)
    ).toEqual(['dead_b']);
  });

  it('can filter dead-letter entries by error text', () => {
    const formConfig = createFormConfig({
      name: 'admin-dead-error-form',
      title: 'Admin Dead Error Form',
      storage: {
        mode: 'queue',
        adapter: 'local-storage',
        key: 'xpressui:test-admin-dead-error',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });
    const admin = createLocalFormAdmin(formConfig);

    window.localStorage.setItem(
      'xpressui:test-admin-dead-error:dead-letter',
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'dead_error_a',
            values: { email: 'a@example.com' },
            attempts: 3,
            createdAt: 100,
            updatedAt: 200,
            nextAttemptAt: 0,
            lastError: 'payment timeout',
          },
          {
            id: 'dead_error_b',
            values: { email: 'b@example.com' },
            attempts: 4,
            createdAt: 300,
            updatedAt: 400,
            nextAttemptAt: 0,
            lastError: 'validation rejected',
          },
        ],
      }),
    );

    expect(
      admin.listDeadLetter({
        errorText: 'timeout',
      }).map((entry) => entry.id)
    ).toEqual(['dead_error_a']);
  });

  it('supports batch admin actions for queue and dead-letter entries', async () => {
    const fetchSpy = vi
      .spyOn(window, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const formConfig = createFormConfig({
      name: 'admin-batch-form',
      title: 'Admin Batch Form',
      storage: {
        mode: 'draft-and-queue',
        adapter: 'local-storage',
        key: 'xpressui:test-admin-batch',
      },
      submit: {
        endpoint: 'https://api.example.test/admin-batch',
        method: 'POST',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });
    const admin = createLocalFormAdmin(formConfig);

    window.localStorage.setItem(
      'xpressui:test-admin-batch:queue',
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'queue_batch_1',
            values: { email: 'keep@example.com' },
            attempts: 0,
            createdAt: 1,
            updatedAt: 1,
            nextAttemptAt: 0,
          },
          {
            id: 'queue_batch_2',
            values: { email: 'purge@example.com' },
            attempts: 4,
            createdAt: 2,
            updatedAt: 2,
            nextAttemptAt: 0,
          },
        ],
      }),
    );
    window.localStorage.setItem(
      'xpressui:test-admin-batch:dead-letter',
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'dead_batch_1',
            values: { email: 'requeue@example.com' },
            attempts: 3,
            createdAt: 3,
            updatedAt: 3,
            nextAttemptAt: 0,
          },
          {
            id: 'dead_batch_2',
            values: { email: 'replay-success@example.com' },
            attempts: 4,
            createdAt: 4,
            updatedAt: 4,
            nextAttemptAt: 0,
          },
          {
            id: 'dead_batch_3',
            values: { email: 'replay-fail@example.com' },
            attempts: 5,
            createdAt: 5,
            updatedAt: 5,
            nextAttemptAt: 0,
          },
        ],
      }),
    );

    expect(
      admin.purgeQueue({
        minAttempts: 4,
      })
    ).toBe(1);
    expect(admin.getSnapshot().queue.map((entry) => entry.id)).toEqual(['queue_batch_1']);

    expect(
      admin.requeueDeadLetterEntries({
        search: 'requeue@',
      })
    ).toBe(1);
    expect(admin.getSnapshot().queue.map((entry) => entry.values.email)).toEqual([
      'keep@example.com',
      'requeue@example.com',
    ]);

    await expect(
      admin.replayDeadLetterEntries({
        search: 'replay',
        sortBy: 'attempts',
        sortOrder: 'asc',
      })
    ).resolves.toEqual({
      succeeded: 1,
      failed: 1,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/admin-batch',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'replay-success@example.com' }),
      })
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/admin-batch',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'replay-fail@example.com' }),
      })
    );

    const snapshot = admin.getSnapshot();
    expect(snapshot.deadLetter).toHaveLength(1);
    expect(snapshot.deadLetter[0].id).toBe('dead_batch_3');
    expect(snapshot.deadLetter[0].attempts).toBe(6);

    expect(
      admin.purgeDeadLetter({
        search: 'replay-fail',
      })
    ).toBe(1);
    expect(admin.getSnapshot().deadLetter).toEqual([]);
  });
});
