import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as publicApi from '../src/index';
import { createStorageAdapter } from '../src/common/form-storage';
import {
  createLocalFormAdmin,
  createFormConfig,
  createFormPreset,
  createTemplateMarkup,
  createSubmitRequestFromProvider,
  attachFormDebugObserver,
  createFormDebugPanel,
  fieldFactory,
  stepFactory,
  FormEngineRuntime,
  FormDynamicRuntime,
  FormPersistenceRuntime,
  FormStepRuntime,
  FormRuntime,
  FormUploadRuntime,
  FormUI,
  getProviderDefinition,
  normalizeProviderResult,
  resolveProviderTransition,
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

function normalizeLocalStorageApi() {
  const existing = (() => {
    try {
      return window.localStorage as Storage | null;
    } catch {
      return null;
    }
  })();
  if (
    existing &&
    typeof existing.getItem === 'function' &&
    typeof existing.setItem === 'function' &&
    typeof existing.removeItem === 'function' &&
    typeof existing.clear === 'function'
  ) {
    return;
  }

  const values: Record<string, string> = {};
  const memoryStorage: Storage = {
    get length() {
      return Object.keys(values).length;
    },
    clear: () => {
      Object.keys(values).forEach((key) => delete values[key]);
    },
    getItem: (key: string) => (Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null),
    key: (index: number) => Object.keys(values)[index] || null,
    removeItem: (key: string) => {
      delete values[key];
    },
    setItem: (key: string, value: string) => {
      values[key] = String(value);
    },
  };

  try {
    Object.defineProperty(window, 'localStorage', {
      value: memoryStorage,
      configurable: true,
    });
  } catch {
    (window as any).localStorage = memoryStorage;
  }
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 10));
}

describe('FormUI', () => {
  beforeEach(() => {
    normalizeLocalStorageApi();
    document.body.innerHTML = '';
    const storage = window.localStorage as Storage | Record<string, any> | null;
    if (storage && typeof (storage as Storage).clear === 'function') {
      (storage as Storage).clear();
    } else if (storage) {
      Object.keys(storage).forEach((key) => {
        delete (storage as Record<string, any>)[key];
      });
    }
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('keeps the main public runtime exports available from the package entrypoint', () => {
    expect(publicApi.FormUI).toBe(FormUI);
    expect(publicApi.FormRuntime).toBe(FormRuntime);
    expect(publicApi.FormStepRuntime).toBe(FormStepRuntime);
    expect(publicApi.FormUploadRuntime).toBe(FormUploadRuntime);
    expect(publicApi.createFormConfig).toBe(createFormConfig);
    expect(publicApi.createFormPreset).toBe(createFormPreset);
    expect(publicApi.fieldFactory).toBe(fieldFactory);
    expect(publicApi.stepFactory).toBe(stepFactory);
    expect(publicApi.mountFormUI).toBe(mountFormUI);
    expect(publicApi.createLocalFormAdmin).toBe(createLocalFormAdmin);
    expect(publicApi.validatePublicFormConfig).toBe(validatePublicFormConfig);
    expect(publicApi.PUBLIC_FORM_SCHEMA_VERSION).toBe(PUBLIC_FORM_SCHEMA_VERSION);
    expect(publicApi.registerProvider).toBe(registerProvider);
    expect(publicApi.getProviderDefinition).toBe(getProviderDefinition);
    expect(publicApi.createSubmitRequestFromProvider).toBe(createSubmitRequestFromProvider);
    expect(publicApi.resolveProviderTransition).toBe(resolveProviderTransition);
  });

  it('provides field factory helpers for common field types', () => {
    expect(
      fieldFactory.selectMultiple(
        'Preferred Topics',
        'Preferred Topics',
        [
          { value: 'sales', label: 'Sales' },
          { value: 'support', label: 'Support' },
        ],
        { required: true },
      ),
    ).toEqual({
      type: 'select-multiple',
      name: 'preferred_topics',
      label: 'Preferred Topics',
      choices: [
        { value: 'sales', label: 'Sales' },
        { value: 'support', label: 'Support' },
      ],
      required: true,
    });

    expect(
      fieldFactory.documentScan('Passport Scan', 'Passport Scan', {
        enableDocumentOcr: true,
        requireValidDocumentMrz: true,
      }),
    ).toEqual({
      type: 'document-scan',
      name: 'passport_scan',
      label: 'Passport Scan',
      enableDocumentOcr: true,
      requireValidDocumentMrz: true,
    });

    expect(
      fieldFactory.productList(
        'products',
        'Products',
        [
          {
            value: 'sku_camera',
            label: 'Nomad Camera Bag',
            sale_price: 129,
            discount_price: 99,
          } as any,
        ],
        { required: true },
      ),
    ).toEqual({
      type: 'product-list',
      name: 'products',
      label: 'Products',
      choices: [
        {
          value: 'sku_camera',
          label: 'Nomad Camera Bag',
          sale_price: 129,
          discount_price: 99,
        },
      ],
      required: true,
    });

    expect(
      fieldFactory.imageGallery(
        'lookbook',
        'Lookbook',
        [
          {
            value: 'img_1',
            label: 'Image 1',
            image_thumbnail: 'https://cdn.example.test/thumb_1.jpg',
            image_medium: 'https://cdn.example.test/medium_1.jpg',
          } as any,
        ],
        { required: true },
      ),
    ).toEqual({
      type: 'image-gallery',
      name: 'lookbook',
      label: 'Lookbook',
      choices: [
        {
          value: 'img_1',
          label: 'Image 1',
          image_thumbnail: 'https://cdn.example.test/thumb_1.jpg',
          image_medium: 'https://cdn.example.test/medium_1.jpg',
        },
      ],
      required: true,
    });

    expect(
      fieldFactory.setting('tax_rate', 'Tax Rate', 0.2),
    ).toEqual({
      type: 'setting',
      name: 'tax_rate',
      label: 'Tax Rate',
      value: 0.2,
    });
  });

  it('provides business form presets that can be converted to mountable markup', () => {
    const formConfig = createFormPreset('identity-check', {
      name: 'kyc-form',
      fields: [
        fieldFactory.cameraPhoto('selfie_capture', 'Selfie Capture'),
      ],
    });
    const markup = createTemplateMarkup(formConfig);

    expect(formConfig.name).toBe('kyc-form');
    expect(formConfig.submit?.includeDocumentData).toBe(true);
    expect(formConfig.submit?.documentFieldPaths).toContain('mrz.valid');
    expect(formConfig.provider?.type).toBe('identity-verification');
    expect(formConfig.sections.main?.some((field) => field.name === 'passport')).toBe(true);
    expect(formConfig.sections.main?.some((field) => field.name === 'selfie_capture')).toBe(true);
    expect(markup).toContain('<form-ui name="kyc-form"></form-ui>');
    expect(markup).toContain('data-submit-endpoint="/api/identity/verify"');
  });

  it('provides wizard presets for booking and identity onboarding flows', () => {
    const bookingWizard = createFormPreset('booking-wizard');
    const identityWizard = createFormPreset('identity-onboarding');
    const ecommercePreset = createFormPreset('ecommerce-checkout');

    expect(bookingWizard.stepSections?.map((section) => section.name)).toEqual([
      'details_step',
      'review_step',
      'scheduling_step',
      'confirmation_step',
    ]);
    expect(bookingWizard.workflowStepTargets).toEqual({
      pending_approval: 'confirmation_step',
      approved: 'confirmation_step',
    });
    expect(bookingWizard.stepSections?.[1]?.stepTransitions).toEqual([
      {
        whenField: 'service',
        operator: 'in',
        value: ['follow_up'],
        target: 'confirmation_step',
      },
    ]);
    expect(identityWizard.stepSections?.map((section) => section.name)).toEqual([
      'identity_step',
      'document_step',
      'review_step',
    ]);
    expect(ecommercePreset.sections.main?.some((field) => field.type === 'product-list')).toBe(true);
    expect(ecommercePreset.sections.main?.some((field) => field.name === 'products')).toBe(true);
  });

  it('renders all step sections in template markup for multi-step forms', () => {
    const markup = createTemplateMarkup({
      version: 1,
      id: 'multi_step_markup',
      uid: 'multi_step_markup_uid',
      type: 'multistepform',
      name: 'multi-step-markup',
      title: 'Multi Step Markup',
      stepSections: [
        { type: 'section', name: 'first_step', label: 'First Step' },
        { type: 'section', name: 'second_step', label: 'Second Step', stepSummary: true },
      ],
      sections: {
        custom: [
          { type: 'section', name: 'first_step', label: 'First Step' },
          { type: 'section', name: 'second_step', label: 'Second Step', stepSummary: true },
        ],
        first_step: [
          { type: 'text', name: 'first_name', label: 'First Name', required: true },
        ],
        second_step: [
          { type: 'output', name: 'review', label: 'Review' },
        ],
      },
    } as any);

    expect(markup).toContain('data-name="first_step"');
    expect(markup).toContain('data-name="second_step"');
    expect(markup).toContain('data-step-summary="true"');
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

  it('renders base output renderer types when mode is set to view', () => {
    const element = renderFixture(`
      <template id="view_mvp">
        <form
          id="view_mvp_form"
          data-type="contactform"
          data-name="view_mvp"
          data-label="View MVP"
        >
          <input
            id="text_value"
            name="text_value"
            type="text"
            value="Hello MVP"
            data-type="text"
            data-name="text_value"
            data-label="Text"
            data-section-name="main"
          />
          <textarea
            id="html_value"
            name="html_value"
            data-type="html"
            data-name="html_value"
            data-label="Html"
            data-section-name="main"
          ><strong>Bold</strong> content</textarea>
          <input
            id="image_value"
            name="image_value"
            type="text"
            value="https://cdn.example.test/picture.png"
            data-type="image"
            data-name="image_value"
            data-label="Image"
            data-section-name="main"
          />
          <input
            id="file_value"
            name="file_value"
            type="text"
            value="https://cdn.example.test/docs/spec.pdf"
            data-type="file"
            data-name="file_value"
            data-label="File"
            data-section-name="main"
          />
          <input
            id="video_value"
            name="video_value"
            type="text"
            value="https://cdn.example.test/media/demo.mp4"
            data-type="file"
            data-accept="video/*"
            data-name="video_value"
            data-label="Video"
            data-section-name="main"
          />
          <input
            id="link_value"
            name="link_value"
            type="text"
            value="https://example.test/resource"
            data-type="link"
            data-name="link_value"
            data-label="Link"
            data-section-name="main"
          />
          <button id="submit_button" type="submit">Submit</button>
        </form>
      </template>
      <form-ui name="view_mvp" mode="view"></form-ui>
    `);

    const textInput = element.querySelector('#text_value') as HTMLInputElement;
    const htmlInput = element.querySelector('#html_value') as HTMLTextAreaElement;
    const submitButton = element.querySelector('#submit_button') as HTMLButtonElement;

    expect(textInput.style.display).toBe('none');
    expect(textInput.disabled).toBe(true);
    expect(htmlInput.style.display).toBe('none');
    expect(htmlInput.disabled).toBe(true);
    expect(submitButton.style.display).toBe('none');

    const textOutput = element.querySelector('#text_value_view span') as HTMLSpanElement;
    expect(textOutput.textContent).toBe('Hello MVP');

    const htmlOutput = element.querySelector('#html_value_view div') as HTMLDivElement;
    expect(htmlOutput.innerHTML).toContain('<strong>Bold</strong> content');

    const imageOutput = element.querySelector('#image_value_view img') as HTMLImageElement;
    expect(imageOutput.getAttribute('src')).toBe('https://cdn.example.test/picture.png');

    const fileOutput = element.querySelector('#file_value_view a') as HTMLAnchorElement;
    expect(fileOutput.getAttribute('href')).toBe('https://cdn.example.test/docs/spec.pdf');
    expect(fileOutput.getAttribute('download')).not.toBeNull();
    expect(fileOutput.textContent).toBe('spec.pdf');

    const videoOutput = element.querySelector('#video_value_view video') as HTMLVideoElement;
    expect(videoOutput.getAttribute('src')).toBe('https://cdn.example.test/media/demo.mp4');

    const linkOutput = element.querySelector('#link_value_view a') as HTMLAnchorElement;
    expect(linkOutput.getAttribute('href')).toBe('https://example.test/resource');
    expect(linkOutput.textContent).toBe('https://example.test/resource');
  });

  it('uses view-values attribute in view mode to override DOM field values', () => {
    const element = renderFixture(`
      <template id="view_override">
        <form
          id="view_override_form"
          data-type="contactform"
          data-name="view_override"
          data-label="View Override"
        >
          <input
            id="headline"
            name="headline"
            type="text"
            value="Old value"
            data-type="text"
            data-name="headline"
            data-label="Headline"
            data-section-name="main"
          />
        </form>
      </template>
      <form-ui
        name="view_override"
        mode="view"
        view-values='{"headline":"New value"}'
      ></form-ui>
    `);

    const output = element.querySelector('#headline_view span') as HTMLSpanElement;
    expect(output.textContent).toBe('New value');
  });

  it('sanitizes html output by default in view mode', () => {
    const element = renderFixture(`
      <template id="view_html_sanitize">
        <form
          id="view_html_sanitize_form"
          data-type="contactform"
          data-name="view_html_sanitize"
          data-label="View Html Sanitize"
        >
          <textarea
            id="html_block"
            name="html_block"
            data-type="html"
            data-name="html_block"
            data-label="Html Block"
            data-section-name="main"
          ><img src="x" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(2)">Click</a><p>Safe</p></textarea>
        </form>
      </template>
      <form-ui name="view_html_sanitize" mode="view"></form-ui>
    `);

    const output = element.querySelector('#html_block_view div') as HTMLDivElement;
    expect(output.innerHTML).not.toContain('<script');
    expect(output.innerHTML).not.toContain('onerror=');
    expect(output.innerHTML).not.toContain('javascript:');
    expect(output.innerHTML).toContain('<p>Safe</p>');
  });

  it('allows unsafe html rendering when allow-unsafe-html is enabled', () => {
    const element = renderFixture(`
      <template id="view_html_unsafe">
        <form
          id="view_html_unsafe_form"
          data-type="contactform"
          data-name="view_html_unsafe"
          data-label="View Html Unsafe"
        >
          <textarea
            id="html_block"
            name="html_block"
            data-type="html"
            data-name="html_block"
            data-label="Html Block"
            data-section-name="main"
          ><script>window.__unsafe_test=true</script><p>Unsafe allowed</p></textarea>
        </form>
      </template>
      <form-ui name="view_html_unsafe" mode="view" allow-unsafe-html="true"></form-ui>
    `);

    const output = element.querySelector('#html_block_view div') as HTMLDivElement;
    expect(output.innerHTML).toContain('<script>window.__unsafe_test=true</script>');
    expect(output.innerHTML).toContain('<p>Unsafe allowed</p>');
  });

  it('renders image values as a gallery when media display policy is gallery', () => {
    const element = renderFixture(`
      <template id="view_media_gallery">
        <form
          id="view_media_gallery_form"
          data-type="contactform"
          data-name="view_media_gallery"
          data-label="View Media Gallery"
        >
          <input
            id="photos"
            name="photos"
            type="text"
            data-type="image"
            data-name="photos"
            data-label="Photos"
            data-view-media-display="gallery"
            data-section-name="main"
          />
        </form>
      </template>
      <form-ui
        name="view_media_gallery"
        mode="view"
        view-values='{"photos":["https://cdn.example.test/a.png","https://cdn.example.test/b.png"]}'
      ></form-ui>
    `);

    const output = element.querySelector('#photos_view') as HTMLElement;
    const images = output.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(output.getAttribute('data-media-display-policy')).toBe('gallery');
  });

  it('renders video values as links when media display policy is link', () => {
    const element = renderFixture(`
      <template id="view_video_link">
        <form
          id="view_video_link_form"
          data-type="contactform"
          data-name="view_video_link"
          data-label="View Video Link"
        >
          <input
            id="demo_video"
            name="demo_video"
            type="text"
            data-type="file"
            data-accept="video/*"
            data-name="demo_video"
            data-label="Demo Video"
            data-view-media-display="link"
            data-section-name="main"
          />
        </form>
      </template>
      <form-ui
        name="view_video_link"
        mode="view"
        view-values='{"demo_video":"https://cdn.example.test/demo.mp4"}'
      ></form-ui>
    `);

    const output = element.querySelector('#demo_video_view') as HTMLElement;
    expect(output.querySelector('video')).toBeNull();
    const anchor = output.querySelector('a') as HTMLAnchorElement;
    expect(anchor.getAttribute('href')).toBe('https://cdn.example.test/demo.mp4');
    expect(output.getAttribute('data-media-display-policy')).toBe('link');
  });

  it('renders outputs while keeping inputs interactive in hybrid mode', () => {
    const element = renderFixture(`
      <template id="hybrid_mvp">
        <form
          id="hybrid_mvp_form"
          data-type="contactform"
          data-name="hybrid_mvp"
          data-label="Hybrid MVP"
        >
          <input
            id="full_name"
            name="full_name"
            type="text"
            value="Alice"
            data-type="text"
            data-name="full_name"
            data-label="Full Name"
            data-section-name="main"
          />
          <input
            id="website"
            name="website"
            type="text"
            value="https://example.test/profile"
            data-type="link"
            data-name="website"
            data-label="Website"
            data-section-name="main"
          />
          <button id="submit_button" type="submit">Submit</button>
        </form>
      </template>
      <form-ui name="hybrid_mvp" mode="hybrid"></form-ui>
    `);

    const textInput = element.querySelector('#full_name') as HTMLInputElement;
    const submitButton = element.querySelector('#submit_button') as HTMLButtonElement;
    const textOutput = element.querySelector('#full_name_view span') as HTMLSpanElement;
    const linkOutput = element.querySelector('#website_view a') as HTMLAnchorElement;

    expect(textInput.style.display).toBe('');
    expect(textInput.disabled).toBe(false);
    expect(submitButton.style.display).toBe('');
    expect(textOutput.textContent).toBe('Alice');
    expect(linkOutput.getAttribute('href')).toBe('https://example.test/profile');
  });

  it('updates rendered output when input value changes in hybrid mode', () => {
    const element = renderFixture(`
      <template id="hybrid_sync">
        <form
          id="hybrid_sync_form"
          data-type="contactform"
          data-name="hybrid_sync"
          data-label="Hybrid Sync"
        >
          <input
            id="title"
            name="title"
            type="text"
            value=""
            data-type="text"
            data-name="title"
            data-label="Title"
            data-section-name="main"
          />
        </form>
      </template>
      <form-ui name="hybrid_sync" mode="hybrid"></form-ui>
    `);

    const input = element.querySelector('#title') as HTMLInputElement;
    expect((element.querySelector('#title_view span') as HTMLSpanElement).textContent).toBe('');

    input.value = 'New title';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect((element.querySelector('#title_view span') as HTMLSpanElement).textContent).toBe('New title');
  });

  it('supports field-level view mode in a normal form while keeping other fields editable', async () => {
    const element = renderFixture(`
      <template id="mixed_field_view_mode">
        <form
          id="mixed_field_view_mode_form"
          data-type="contactform"
          data-name="mixed_field_view_mode"
          data-label="Mixed Field View Mode"
        >
          <input
            id="first_name"
            name="first_name"
            type="text"
            value=""
            data-type="text"
            data-name="first_name"
            data-label="First Name"
            data-section-name="main"
          />
          <input
            id="hero_image"
            name="hero_image"
            type="text"
            value="https://cdn.example.test/hero.png"
            data-type="image"
            data-name="hero_image"
            data-label="Hero Image"
            data-field-render-mode="view"
            data-section-name="main"
          />
        </form>
      </template>
      <form-ui name="mixed_field_view_mode"></form-ui>
    `);

    const editableInput = element.querySelector('#first_name') as HTMLInputElement;
    const viewOnlyInput = element.querySelector('#hero_image') as HTMLInputElement;
    expect(editableInput.style.display).not.toBe('none');
    expect(viewOnlyInput.style.display).toBe('none');
    const renderedImage = element.querySelector('#hero_image_view img') as HTMLImageElement;
    expect(renderedImage).not.toBeNull();
    expect(renderedImage.getAttribute('src')).toBe('https://cdn.example.test/hero.png');

    editableInput.value = 'Alice';
    editableInput.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();
    expect((element.getFieldValue('first_name') as string)).toBe('Alice');
  });

  it('supports custom output renderer registration in view mode', () => {
    const element = renderFixture(`
      <template id="view_custom_renderer">
        <form
          id="view_custom_renderer_form"
          data-type="contactform"
          data-name="view_custom_renderer"
          data-label="View Custom Renderer"
        >
          <input
            id="status"
            name="status"
            type="text"
            value="approved"
            data-type="text"
            data-name="status"
            data-label="Status"
            data-view-renderer="badge"
            data-section-name="main"
          />
        </form>
      </template>
      <form-ui name="view_custom_renderer" mode="view"></form-ui>
    `);

    element.setOutputRenderer('badge', ({ value }) => {
      const badge = document.createElement('span');
      badge.className = 'status-badge';
      badge.textContent = String(value || '').toUpperCase();
      return badge;
    });

    const output = element.querySelector('#status_view .status-badge') as HTMLSpanElement;
    expect(output).not.toBeNull();
    expect(output.textContent).toBe('APPROVED');
    expect((element.querySelector('#status_view') as HTMLElement).getAttribute('data-renderer-type')).toBe('badge');
  });

  it('supports a custom html sanitizer override through runtime API', () => {
    const element = renderFixture(`
      <template id="view_html_custom_sanitizer">
        <form
          id="view_html_custom_sanitizer_form"
          data-type="contactform"
          data-name="view_html_custom_sanitizer"
          data-label="View Html Custom Sanitizer"
        >
          <textarea
            id="html_block"
            name="html_block"
            data-type="html"
            data-name="html_block"
            data-label="Html Block"
            data-section-name="main"
          ><p>hello world</p></textarea>
        </form>
      </template>
      <form-ui name="view_html_custom_sanitizer" mode="view"></form-ui>
    `);

    element.setHtmlSanitizer((html) => html.replace('hello', 'safe'));
    const output = element.querySelector('#html_block_view div') as HTMLDivElement;
    expect(output.innerHTML).toContain('<p>safe world</p>');
  });

  it('supports field-level output renderer override through runtime API in hybrid mode', () => {
    const element = renderFixture(`
      <template id="hybrid_field_override">
        <form
          id="hybrid_field_override_form"
          data-type="contactform"
          data-name="hybrid_field_override"
          data-label="Hybrid Field Override"
        >
          <input
            id="score"
            name="score"
            type="text"
            value="42"
            data-type="text"
            data-name="score"
            data-label="Score"
            data-section-name="main"
          />
        </form>
      </template>
      <form-ui name="hybrid_field_override" mode="hybrid"></form-ui>
    `);

    element.setFieldOutputRenderer('score', ({ value }) => {
      const strong = document.createElement('strong');
      strong.className = 'score-custom';
      strong.textContent = `Score=${value}`;
      return strong;
    });

    const output = element.querySelector('#score_view .score-custom') as HTMLElement;
    expect(output.textContent).toBe('Score=42');
    expect((element.querySelector('#score_view') as HTMLElement).getAttribute('data-renderer-type')).toBe('custom');
  });

  it('supports field-level media policy override through runtime API in hybrid mode', () => {
    const element = renderFixture(`
      <template id="hybrid_media_policy">
        <form
          id="hybrid_media_policy_form"
          data-type="contactform"
          data-name="hybrid_media_policy"
          data-label="Hybrid Media Policy"
        >
          <input
            id="photo"
            name="photo"
            type="text"
            value="https://cdn.example.test/picture.png"
            data-type="image"
            data-name="photo"
            data-label="Photo"
            data-section-name="main"
          />
        </form>
      </template>
      <form-ui name="hybrid_media_policy" mode="hybrid"></form-ui>
    `);

    element.setFieldMediaPolicy('photo', 'thumbnail');

    const output = element.querySelector('#photo_view') as HTMLElement;
    const image = output.querySelector('img') as HTMLImageElement;
    expect(image.style.maxWidth).toBe('160px');
    expect(output.getAttribute('data-media-display-policy')).toBe('thumbnail');
  });

  it('supports product-list fields with a 20-product max catalog, global sticky cart and gallery modal', async () => {
    const products = Array.from({ length: 25 }, (_, index) => ({
      value: `sku_${index + 1}`,
      name: `Product ${index + 1}`,
      label: `Product ${index + 1}`,
      sale_price: 100 + index,
      discount_price: 90 + index,
      image_thumbnail: `https://cdn.example.test/thumb_${index + 1}.jpg`,
      image_medium: `https://cdn.example.test/medium_${index + 1}.jpg`,
      photos_full: [`https://cdn.example.test/full_${index + 1}.jpg`],
    }));

    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'product-list-demo',
      title: 'Product List Demo',
      fields: [
        {
          type: 'product-list',
          name: 'products',
          label: 'Products',
          required: true,
          choices: products as any,
        },
      ],
    }) as FormUI;

    expect(element.querySelectorAll('[data-product-card]').length).toBe(20);
    expect(element.querySelectorAll('[data-product-list-global-cart]').length).toBe(1);

    const addFirst = element.querySelector('[data-product-action="add"][data-product-id="sku_1"]') as HTMLButtonElement;
    addFirst.click();
    await flushAsyncWork();

    const cartItems = element.getFieldValue('products') as Array<Record<string, any>>;
    expect(Array.isArray(cartItems)).toBe(true);
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0]).toEqual(
      expect.objectContaining({
        id: 'sku_1',
        name: 'Product 1',
        quantity: 1,
        sale_price: 100,
        discount_price: 90,
      }),
    );

    const addAgain = element.querySelector('[data-product-action="add"][data-product-id="sku_1"]') as HTMLButtonElement;
    addAgain.click();
    await flushAsyncWork();
    expect((element.getFieldValue('products') as Array<Record<string, any>>)[0].quantity).toBe(2);
    expect(element.querySelectorAll('[data-product-cart-item]').length).toBe(1);
    expect((element.querySelector('[data-product-cart-summary="true"]') as HTMLElement).textContent).toBe('2');
    expect((element.querySelector('[data-product-cart-total-badge="true"]') as HTMLElement).textContent).toContain('180.00€');

    const cartTrigger = element.querySelector('[data-product-cart-trigger="true"]') as HTMLButtonElement;
    cartTrigger.click();
    await flushAsyncWork();
    const cartOverlay = element.querySelector('[data-product-cart-overlay="true"]') as HTMLElement;
    expect(cartOverlay.getAttribute('data-state')).toBe('open');
    expect(document.body.style.overflow).toBe('hidden');

    const cartClose = element.querySelector('[data-product-cart-close="true"]') as HTMLButtonElement;
    cartClose.click();
    await flushAsyncWork();
    expect(cartOverlay.getAttribute('data-state')).toBe('closing');
    await new Promise((resolve) => setTimeout(resolve, 220));
    expect(cartOverlay.getAttribute('data-state')).toBe('closed');
    expect(document.body.style.overflow).toBe('');

    const card = element.querySelector('[data-product-open-gallery="sku_1"]') as HTMLElement;
    card.click();
    await flushAsyncWork();
    expect(document.body.querySelector('[data-product-gallery-overlay="true"]')).not.toBeNull();
    expect(document.body.querySelector('[data-product-gallery-main="true"]')).not.toBeNull();
  });

  it('renders a single global cart even with multiple product-list fields in the same form', async () => {
    const products = [
      {
        value: 'sku_1',
        name: 'Product 1',
        label: 'Product 1',
        sale_price: 100,
        discount_price: 90,
        image_thumbnail: 'https://cdn.example.test/thumb_1.jpg',
        image_medium: 'https://cdn.example.test/medium_1.jpg',
        photos_full: ['https://cdn.example.test/full_1.jpg'],
      },
    ];

    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'product-list-multi-demo',
      title: 'Product List Multi Demo',
      fields: [
        {
          type: 'product-list',
          name: 'products_a',
          label: 'Products A',
          choices: products as any,
        },
        {
          type: 'product-list',
          name: 'products_b',
          label: 'Products B',
          choices: products as any,
        },
      ],
    }) as FormUI;

    const addA = element.querySelector('#products_a_selection [data-product-action="add"][data-product-id="sku_1"]') as HTMLButtonElement;
    addA.click();
    await flushAsyncWork();

    const addB = element.querySelector('#products_b_selection [data-product-action="add"][data-product-id="sku_1"]') as HTMLButtonElement;
    addB.click();
    await flushAsyncWork();

    expect(element.querySelectorAll('[data-product-list-global-cart]').length).toBe(1);
    expect(element.querySelectorAll('[data-product-cart-item]').length).toBe(2);
  });

  it('supports image-gallery fields with a 20-image max catalog and selection modal interactions', async () => {
    const images = Array.from({ length: 24 }, (_, index) => ({
      value: `img_${index + 1}`,
      name: `Image ${index + 1}`,
      label: `Image ${index + 1}`,
      image_thumbnail: `https://cdn.example.test/thumb_${index + 1}.jpg`,
      image_medium: `https://cdn.example.test/medium_${index + 1}.jpg`,
      photos_full: [`https://cdn.example.test/full_${index + 1}.jpg`],
    }));

    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'image-gallery-demo',
      title: 'Image Gallery Demo',
      fields: [
        {
          type: 'image-gallery',
          name: 'lookbook',
          label: 'Lookbook',
          required: true,
          choices: images as any,
        },
      ],
    }) as FormUI;

    expect(element.querySelectorAll('[data-image-card]').length).toBe(20);

    const selectFirst = element.querySelector('[data-image-gallery-action="toggle"][data-image-id="img_1"]') as HTMLButtonElement;
    selectFirst.click();
    await flushAsyncWork();

    const selected = element.getFieldValue('lookbook') as Array<Record<string, any>>;
    expect(Array.isArray(selected)).toBe(true);
    expect(selected).toHaveLength(1);
    expect(selected[0]).toEqual(
      expect.objectContaining({
        id: 'img_1',
        name: 'Image 1',
      }),
    );

    const imageCard = element.querySelector('[data-image-open-gallery="img_1"]') as HTMLElement;
    imageCard.click();
    await flushAsyncWork();
    expect(document.body.querySelector('[data-product-gallery-overlay="true"]')).not.toBeNull();

    const remove = element.querySelector('[data-image-gallery-action="remove"][data-image-id="img_1"]') as HTMLButtonElement;
    remove.click();
    await flushAsyncWork();
    expect((element.getFieldValue('lookbook') as Array<Record<string, any>>).length).toBe(0);
  });

  it('validates product-list and image-gallery as array selections instead of text fields', () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'ecommerce-array-validation-demo',
      title: 'Ecommerce Array Validation Demo',
      fields: [
        {
          type: 'product-list',
          name: 'products',
          label: 'Products',
          required: true,
          choices: [
            {
              value: 'sku_1',
              label: 'Product 1',
            } as any,
          ],
        },
        {
          type: 'image-gallery',
          name: 'lookbook',
          label: 'Lookbook',
          required: true,
          choices: [
            {
              value: 'img_1',
              label: 'Image 1',
            } as any,
          ],
        },
      ],
    }) as FormUI;

    expect(element.validateForm({})).toEqual({
      products: expect.objectContaining({ errorMessage: 'This field is required.' }),
      lookbook: expect.objectContaining({ errorMessage: 'This field is required.' }),
    });

    expect(
      element.validateForm({
        products: [{ id: 'sku_1', name: 'Product 1', quantity: 1 }],
        lookbook: [{ id: 'img_1', name: 'Image 1' }],
      }),
    ).toEqual({});
  });

  it('exposes an output snapshot API with renderer metadata', () => {
    const element = renderFixture(`
      <template id="view_snapshot">
        <form
          id="view_snapshot_form"
          data-type="contactform"
          data-name="view_snapshot"
          data-label="View Snapshot"
        >
          <input
            id="url"
            name="url"
            type="text"
            value="https://example.test"
            data-type="link"
            data-name="url"
            data-label="Url"
            data-section-name="main"
          />
        </form>
      </template>
      <form-ui name="view_snapshot" mode="view"></form-ui>
    `);

    const snapshot = element.getOutputSnapshot();
    expect(snapshot.url).toEqual({
      rendererType: 'link',
      mediaDisplayPolicy: 'link',
      value: 'https://example.test',
    });
  });

  it('emits output snapshot events in hybrid mode when values change', () => {
    const element = renderFixture(`
      <template id="hybrid_output_event">
        <form
          id="hybrid_output_event_form"
          data-type="contactform"
          data-name="hybrid_output_event"
          data-label="Hybrid Output Event"
        >
          <input
            id="title"
            name="title"
            type="text"
            value=""
            data-type="text"
            data-name="title"
            data-label="Title"
            data-section-name="main"
          />
        </form>
      </template>
      <form-ui name="hybrid_output_event" mode="hybrid"></form-ui>
    `);

    const snapshots: Array<Record<string, any>> = [];
    element.addEventListener('form-ui:output-snapshot', (event) => {
      snapshots.push((event as CustomEvent<TFormUISubmitDetail>).detail.result);
    });

    const input = element.querySelector('#title') as HTMLInputElement;
    input.value = 'Snapshot ready';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots[snapshots.length - 1]?.title).toEqual({
      rendererType: 'text',
      mediaDisplayPolicy: 'large',
      value: 'Snapshot ready',
    });
  });

  it('supports basic multi-step navigation across existing sections', () => {
    const element = renderFixture(`
      <template id="wizard">
        <form
          id="wizard_form"
          data-type="contactform"
          data-name="wizard"
          data-label="Wizard"
        >
          <div data-type="section" data-name="step_one" data-label="Step One"></div>
          <div data-type="section" data-name="step_two" data-label="Step Two"></div>
          <input
            id="first_name"
            name="first_name"
            type="text"
            data-type="text"
            data-name="first_name"
            data-label="First Name"
            data-section-name="step_one"
          />
          <span id="first_name_error"></span>
          <input
            id="last_name"
            name="last_name"
            type="text"
            data-type="text"
            data-name="last_name"
            data-label="Last Name"
            data-section-name="step_two"
          />
          <span id="last_name_error"></span>
        </form>
      </template>
      <form-ui name="wizard"></form-ui>
    `);
    const onStepChange = vi.fn();

    element.addEventListener('form-ui:step-change', (event) => {
      onStepChange((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    const firstName = element.querySelector('#first_name') as HTMLInputElement;
    const lastName = element.querySelector('#last_name') as HTMLInputElement;

    expect(element.getStepNames()).toEqual(['step_one', 'step_two']);
    expect(element.getCurrentStepIndex()).toBe(0);
    expect((firstName.closest('label') || firstName).getAttribute('data-step-hidden') || undefined).toBeUndefined();
    expect((lastName.closest('label') || lastName).getAttribute('data-step-hidden')).toBe('true');

    expect(element.nextStep()).toBe(true);
    expect(element.getCurrentStepIndex()).toBe(1);
    expect((firstName.closest('label') || firstName).getAttribute('data-step-hidden')).toBe('true');
    expect((lastName.closest('label') || lastName).getAttribute('data-step-hidden') || undefined).toBeUndefined();
    expect(onStepChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          stepIndex: 1,
          stepName: 'step_two',
          stepCount: 2,
        }),
      }),
    );
  });

  it('validates the current step before allowing navigation', () => {
    const element = renderFixture(`
      <template id="wizard">
        <form
          id="wizard_form"
          data-type="contactform"
          data-name="wizard"
          data-label="Wizard"
        >
          <div data-type="section" data-name="step_one" data-label="Step One"></div>
          <div data-type="section" data-name="step_two" data-label="Step Two"></div>
          <input
            id="first_name"
            name="first_name"
            type="text"
            data-type="text"
            data-name="first_name"
            data-label="First Name"
            data-required="true"
            data-section-name="step_one"
          />
          <span id="first_name_error"></span>
          <input
            id="last_name"
            name="last_name"
            type="text"
            data-type="text"
            data-name="last_name"
            data-label="Last Name"
            data-section-name="step_two"
          />
          <span id="last_name_error"></span>
        </form>
      </template>
      <form-ui name="wizard"></form-ui>
    `);

    const firstName = element.querySelector('#first_name') as HTMLInputElement;
    const error = element.querySelector('#first_name_error') as HTMLSpanElement;

    expect(element.nextStep()).toBe(false);
    expect(element.getCurrentStepIndex()).toBe(0);
    expect(error.textContent).toBe('This field is required.');

    firstName.value = 'Alice';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    firstName.dispatchEvent(new FocusEvent('blur'));

    expect(element.nextStep()).toBe(true);
    expect(element.getCurrentStepIndex()).toBe(1);
  });

  it('adds native step controls and blocks submit before the last step', async () => {
    const element = renderFixture(`
      <template id="wizard">
        <form
          id="wizard_form"
          data-type="contactform"
          data-name="wizard"
          data-label="Wizard"
        >
          <div data-type="section" data-name="step_one" data-label="Step One"></div>
          <div data-type="section" data-name="step_two" data-label="Step Two"></div>
          <input
            id="first_name"
            name="first_name"
            type="text"
            data-type="text"
            data-name="first_name"
            data-label="First Name"
            data-required="true"
            data-section-name="step_one"
          />
          <span id="first_name_error"></span>
          <input
            id="last_name"
            name="last_name"
            type="text"
            data-type="text"
            data-name="last_name"
            data-label="Last Name"
            data-section-name="step_two"
          />
          <span id="last_name_error"></span>
          <button id="submit_button" type="submit">Submit</button>
        </form>
      </template>
      <form-ui name="wizard"></form-ui>
    `);
    const submitSuccess = vi.fn();

    element.addEventListener('form-ui:submit-success', submitSuccess);

    const form = element.querySelector('#wizard_form') as HTMLFormElement;
    const firstName = element.querySelector('#first_name') as HTMLInputElement;
    const submitButton = element.querySelector('#submit_button') as HTMLButtonElement;
    const backButton = element.querySelector('[data-step-action="back"]') as HTMLButtonElement;
    const nextButton = element.querySelector('[data-step-action="next"]') as HTMLButtonElement;

    expect(backButton).not.toBeNull();
    expect(nextButton).not.toBeNull();
    expect(backButton.style.display).toBe('none');
    expect(nextButton.style.display).toBe('');
    expect(submitButton.disabled).toBe(true);
    expect(submitButton.style.display).toBe('none');

    nextButton.click();
    expect(element.getCurrentStepIndex()).toBe(0);

    firstName.value = 'Alice';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    nextButton.click();

    expect(element.getCurrentStepIndex()).toBe(1);
    expect(backButton.style.display).toBe('');
    expect(nextButton.style.display).toBe('none');
    expect(submitButton.disabled).toBe(false);
    expect(submitButton.style.display).toBe('');

    backButton.click();
    expect(element.getCurrentStepIndex()).toBe(0);

    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(element.getCurrentStepIndex()).toBe(1);
    expect(submitSuccess).not.toHaveBeenCalled();

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    expect(submitSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows step progress and allows optional steps to be skipped', () => {
    const element = renderFixture(`
      <template id="wizard">
        <form
          id="wizard_form"
          data-type="contactform"
          data-name="wizard"
          data-label="Wizard"
        >
          <div data-type="section" data-name="step_one" data-label="Step One"></div>
          <div data-type="section" data-name="step_two" data-label="Step Two" data-step-skippable="true"></div>
          <input
            id="first_name"
            name="first_name"
            type="text"
            data-type="text"
            data-name="first_name"
            data-label="First Name"
            data-section-name="step_one"
          />
          <span id="first_name_error"></span>
          <input
            id="notes"
            name="notes"
            type="text"
            data-type="text"
            data-name="notes"
            data-label="Notes"
            data-required="true"
            data-section-name="step_two"
          />
          <span id="notes_error"></span>
        </form>
      </template>
      <form-ui name="wizard"></form-ui>
    `);

    const progress = element.querySelector('[data-form-step-progress]') as HTMLElement;

    expect(element.getStepProgress()).toEqual({
      stepIndex: 0,
      stepNumber: 1,
      stepCount: 2,
      percent: 50,
    });
    expect(progress.textContent).toBe('Step 1 of 2 (50%)');

    expect(element.nextStep()).toBe(true);
    expect(element.getStepProgress()).toEqual({
      stepIndex: 1,
      stepNumber: 2,
      stepCount: 2,
      percent: 100,
    });
    expect(progress.textContent).toBe('Step 2 of 2 (100%) (Optional)');
    expect(element.nextStep()).toBe(false);
  });

  it('restores the saved current step from draft storage and supports custom step labels', () => {
    const markup = `
      <template id="wizard">
        <form
          id="wizard_form"
          data-type="contactform"
          data-name="wizard"
          data-label="Wizard"
          data-storage-mode="draft"
          data-step-previous-label="Previous"
          data-step-next-label="Continue"
        >
          <div data-type="section" data-name="step_one" data-label="Step One"></div>
          <div data-type="section" data-name="step_two" data-label="Step Two"></div>
          <input
            id="first_name"
            name="first_name"
            type="text"
            data-type="text"
            data-name="first_name"
            data-label="First Name"
            data-required="true"
            data-section-name="step_one"
          />
          <span id="first_name_error"></span>
          <input
            id="last_name"
            name="last_name"
            type="text"
            data-type="text"
            data-name="last_name"
            data-label="Last Name"
            data-section-name="step_two"
          />
          <span id="last_name_error"></span>
          <button id="submit_button" type="submit">Submit</button>
        </form>
      </template>
      <form-ui name="wizard"></form-ui>
    `;

    const element = renderFixture(markup);
    const firstName = element.querySelector('#first_name') as HTMLInputElement;
    const backButton = element.querySelector('[data-step-action="back"]') as HTMLButtonElement;
    const nextButton = element.querySelector('[data-step-action="next"]') as HTMLButtonElement;

    expect(backButton.textContent).toBe('Previous');
    expect(nextButton.textContent).toBe('Continue');

    firstName.value = 'Alice';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    expect(element.nextStep()).toBe(true);
    element.saveDraft();

    const restoredElement = renderFixture(markup);
    expect(restoredElement.getCurrentStepIndex()).toBe(1);
    expect(restoredElement.getCurrentStepName()).toBe('step_two');
  });

  it('supports step validation and step persistence in FormRuntime resume flows', () => {
    const values = { first_name: '', last_name: '' };
    const runtime = new FormRuntime(
      validatePublicFormConfig({
        version: 1,
        id: 'runtime_wizard',
        uid: 'runtime_wizard_uid',
        type: 'multistepform',
        name: 'runtime_wizard',
        title: 'Runtime Wizard',
        storage: {
          mode: 'draft',
        },
        sections: {
          custom: [
            { type: 'section', name: 'step_one', label: 'Step One' },
            { type: 'section', name: 'step_two', label: 'Step Two' },
          ],
          step_one: [
            { type: 'text', name: 'first_name', label: 'First Name', required: true },
          ],
          step_two: [
            { type: 'text', name: 'last_name', label: 'Last Name', required: true },
          ],
        },
      }),
      {
        getValues: () => values,
      },
    );

    expect(runtime.validateCurrentStep()).toBe(false);
    values.first_name = 'Alice';
    expect(runtime.validateCurrentStep()).toBe(true);
    expect(runtime.nextStep()).toBe(true);
    expect(runtime.getCurrentStepIndex()).toBe(1);

    runtime.saveDraft(values);

    const restoredRuntime = new FormRuntime(
      validatePublicFormConfig({
        version: 1,
        id: 'runtime_wizard',
        uid: 'runtime_wizard_uid',
        type: 'multistepform',
        name: 'runtime_wizard',
        title: 'Runtime Wizard',
        storage: {
          mode: 'draft',
        },
        sections: {
          custom: [
            { type: 'section', name: 'step_one', label: 'Step One' },
            { type: 'section', name: 'step_two', label: 'Step Two' },
          ],
          step_one: [
            { type: 'text', name: 'first_name', label: 'First Name', required: true },
          ],
          step_two: [
            { type: 'text', name: 'last_name', label: 'Last Name', required: true },
          ],
        },
      }),
      {
        getValues: () => values,
      },
    );

    expect(restoredRuntime.getCurrentStepIndex()).toBe(1);

    const token = runtime.createResumeToken();
    expect(token).toBeTruthy();
    expect(runtime.goToStep(0)).toBe(true);
    expect(runtime.restoreFromResumeToken(token as string)).toEqual({ first_name: 'Alice', last_name: '' });
    expect(runtime.getCurrentStepIndex()).toBe(1);
  });

  it('supports workflow-aware step validation in FormRuntime', () => {
    const values = { review_notes: '' };
    const runtime = new FormRuntime(
      validatePublicFormConfig({
        version: 1,
        id: 'runtime_review',
        uid: 'runtime_review_uid',
        type: 'multistepform',
        name: 'runtime_review',
        title: 'Runtime Review',
        sections: {
          custom: [
            {
              type: 'section',
              name: 'intro_step',
              label: 'Intro Step',
            },
            {
              type: 'section',
              name: 'review_step',
              label: 'Review Step',
              stepValidateWhenWorkflowStates: ['pending_approval'],
            },
          ],
          intro_step: [
            { type: 'text', name: 'intro_notes', label: 'Intro Notes' },
          ],
          review_step: [
            { type: 'text', name: 'review_notes', label: 'Review Notes', required: true },
          ],
        },
      }),
      {
        getValues: () => values,
      },
    );

    expect(runtime.getWorkflowState()).toBe('draft');
    expect(runtime.goToStep(1)).toBe(true);
    expect(runtime.validateCurrentStep()).toBe(true);

    runtime.setWorkflowState('pending_approval');
    expect(runtime.validateCurrentStep()).toBe(false);

    values.review_notes = 'Checked';
    expect(runtime.validateCurrentStep()).toBe(true);
  });

  it('renders a review summary on summary steps and can jump conditionally to another step', () => {
    const element = renderFixture(`
      <template id="wizard">
        <form
          id="wizard_form"
          data-type="contactform"
          data-name="wizard"
          data-label="Wizard"
        >
          <div data-type="section" data-name="details_step" data-label="Details"></div>
          <div
            data-type="section"
            data-name="review_step"
            data-label="Review"
            data-step-summary="true"
            data-next-step-when-field="fast_track"
            data-next-step-when-equals="true"
            data-next-step-target="final_step"
          ></div>
          <div data-type="section" data-name="confirm_step" data-label="Confirm"></div>
          <div data-type="section" data-name="final_step" data-label="Final"></div>
          <input
            id="first_name"
            name="first_name"
            type="text"
            data-type="text"
            data-name="first_name"
            data-label="First Name"
            data-section-name="details_step"
          />
          <span id="first_name_error"></span>
          <input
            id="fast_track"
            name="fast_track"
            type="checkbox"
            data-type="checkbox"
            data-name="fast_track"
            data-label="Fast Track"
            data-section-name="review_step"
          />
          <span id="fast_track_error"></span>
          <input
            id="confirmation_notes"
            name="confirmation_notes"
            type="text"
            data-type="text"
            data-name="confirmation_notes"
            data-label="Confirmation Notes"
            data-section-name="confirm_step"
          />
          <span id="confirmation_notes_error"></span>
          <input
            id="final_notes"
            name="final_notes"
            type="text"
            data-type="text"
            data-name="final_notes"
            data-label="Final Notes"
            data-section-name="final_step"
          />
          <span id="final_notes_error"></span>
        </form>
      </template>
      <form-ui name="wizard"></form-ui>
    `);

    const firstName = element.querySelector('#first_name') as HTMLInputElement;
    firstName.value = 'Alice';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));

    expect(element.nextStep()).toBe(true);
    expect(element.getCurrentStepName()).toBe('review_step');

    const summary = element.querySelector('[data-form-step-summary]') as HTMLElement;
    expect(summary.textContent).toContain('First Name: Alice');

    const fastTrack = element.querySelector('#fast_track') as HTMLInputElement;
    fastTrack.checked = true;
    fastTrack.dispatchEvent(new Event('input', { bubbles: true }));

    expect(element.nextStep()).toBe(true);
    expect(element.getCurrentStepName()).toBe('final_step');
  });

  it('uses explicit stepSections in the public config and runtime navigation', () => {
    const runtime = new FormRuntime(
      validatePublicFormConfig({
        version: 1,
        id: 'runtime_explicit_steps',
        uid: 'runtime_explicit_steps_uid',
        type: 'multistepform',
        name: 'runtime_explicit_steps',
        title: 'Runtime Explicit Steps',
        stepSections: [
          { type: 'section', name: 'step_one', label: 'Step One' },
          { type: 'section', name: 'step_two', label: 'Step Two', stepSkippable: true },
        ],
        sections: {
          custom: [
            { type: 'section', name: 'step_one', label: 'Step One' },
            { type: 'section', name: 'step_two', label: 'Step Two' },
          ],
          step_one: [
            { type: 'text', name: 'first_name', label: 'First Name' },
          ],
          step_two: [
            { type: 'text', name: 'last_name', label: 'Last Name', required: true },
          ],
        },
      }),
      {
        getValues: () => ({ first_name: 'Alice', last_name: '' }),
      },
    );

    expect(runtime.getStepNames()).toEqual(['step_one', 'step_two']);
    expect(runtime.nextStep()).toBe(true);
    expect(runtime.getCurrentStepName()).toBe('step_two');
    expect(runtime.validateCurrentStep()).toBe(false);
  });

  it('supports richer conditional step transitions in the extracted step runtime', () => {
    const steps = new FormStepRuntime({
      version: 1,
      id: 'step_runtime',
      uid: 'step_runtime_uid',
      type: 'multistepform',
      name: 'step_runtime',
      title: 'Step Runtime',
      stepSections: [
        {
          type: 'section',
          name: 'review',
          label: 'Review',
          nextStepWhenField: 'tier',
          nextStepWhenEquals: ['vip', 'priority'],
          nextStepTarget: 'fast_lane',
        },
        {
          type: 'section',
          name: 'fast_lane',
          label: 'Fast Lane',
        },
        {
          type: 'section',
          name: 'standard',
          label: 'Standard',
        },
        {
          type: 'section',
          name: 'decision',
          label: 'Decision',
          nextStepWhenField: 'status',
          nextStepWhenNotEquals: 'approved',
          nextStepTarget: 'fallback',
        },
        {
          type: 'section',
          name: 'fallback',
          label: 'Fallback',
        },
      ],
      sections: {
        custom: [],
      },
    } as any);

    expect(steps.nextStep({ tier: 'vip' }, true)).toBe(true);
    expect(steps.getCurrentStepName()).toBe('fast_lane');

    expect(steps.goToStep(3)).toBe(true);
    expect(steps.nextStep({ status: 'rejected' }, true)).toBe(true);
    expect(steps.getCurrentStepName()).toBe('fallback');
    expect(steps.goToWorkflowStep('missing')).toBe(false);
  });

  it('supports transition DSL operators and workflow snapshots in the extracted step runtime', () => {
    const steps = new FormStepRuntime({
      version: 1,
      id: 'dsl_runtime',
      uid: 'dsl_runtime_uid',
      type: 'multistepform',
      name: 'dsl_runtime',
      title: 'DSL Runtime',
      stepSections: [
        {
          type: 'section',
          name: 'entry',
          label: 'Entry',
          stepTransitions: [
            {
              whenField: 'tier',
              operator: 'in',
              value: ['vip', 'priority'],
              target: 'priority_step',
            },
          ],
        },
        {
          type: 'section',
          name: 'priority_step',
          label: 'Priority',
        },
      ],
      sections: {
        custom: [],
      },
      workflowStepTargets: {
        completed: 'priority_step',
      },
    } as any);

    expect(steps.getConditionalNextStepName({ tier: 'vip' })).toBe('priority_step');
    expect(steps.nextStep({ tier: 'vip' }, true)).toBe(true);
    expect(steps.getWorkflowSnapshot({ tier: 'vip' })).toEqual({
      workflowState: 'draft',
      currentStepName: 'priority_step',
      currentStepIndex: 1,
      progress: {
        stepIndex: 1,
        stepNumber: 2,
        stepCount: 2,
        percent: 100,
      },
      nextStepTarget: null,
    });

    steps.setWorkflowState('completed');
    expect(steps.goToWorkflowStep()).toBe(false);
  });

  it('supports compound transition groups in the extracted step runtime', () => {
    const steps = new FormStepRuntime({
      version: 1,
      id: 'dsl_runtime_grouped',
      uid: 'dsl_runtime_grouped_uid',
      type: 'multistepform',
      name: 'dsl_runtime_grouped',
      title: 'DSL Runtime Grouped',
      stepSections: [
        {
          type: 'section',
          name: 'entry',
          label: 'Entry',
          stepTransitions: [
            {
              logic: 'AND',
              conditions: [
                { whenField: 'tier', operator: 'in', value: ['vip', 'priority'] },
                { whenField: 'region', operator: 'equals', value: 'eu' },
              ],
              target: 'priority_step',
            },
            {
              logic: 'OR',
              conditions: [
                { whenField: 'manual', operator: 'truthy' },
                { whenField: 'forceFast', operator: 'equals', value: 'yes' },
              ],
              target: 'priority_step',
            },
          ],
        },
        {
          type: 'section',
          name: 'priority_step',
          label: 'Priority',
        },
      ],
      sections: {
        custom: [],
      },
    } as any);

    expect(
      steps.getConditionalNextStepName({
        tier: 'vip',
        region: 'eu',
      }),
    ).toBe('priority_step');
    expect(
      steps.getConditionalNextStepName({
        tier: 'vip',
        region: 'us',
      }),
    ).toBe(null);
    expect(
      steps.getConditionalNextStepName({
        manual: true,
      }),
    ).toBe('priority_step');
  });

  it('supports time and date transition operators in the extracted step runtime', () => {
    const steps = new FormStepRuntime({
      version: 1,
      id: 'dsl_runtime_date_ops',
      uid: 'dsl_runtime_date_ops_uid',
      type: 'multistepform',
      name: 'dsl_runtime_date_ops',
      title: 'DSL Runtime Date Operators',
      stepSections: [
        {
          type: 'section',
          name: 'entry',
          label: 'Entry',
          stepTransitions: [
            {
              whenField: 'appointment',
              operator: 'date_before',
              value: '2026-01-01T00:00:00Z',
              target: 'before_cutoff',
            },
            {
              whenField: 'appointment',
              operator: 'date_between',
              value: ['2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z'],
              target: 'inside_window',
            },
            {
              whenField: 'appointment',
              operator: 'date_after',
              value: '2026-12-31T23:59:59Z',
              target: 'after_cutoff',
            },
          ],
        },
        { type: 'section', name: 'before_cutoff', label: 'Before Cutoff' },
        { type: 'section', name: 'inside_window', label: 'Inside Window' },
        { type: 'section', name: 'after_cutoff', label: 'After Cutoff' },
      ],
      sections: {
        custom: [],
      },
    } as any);

    expect(steps.getConditionalNextStepName({ appointment: '2025-12-31T10:00:00Z' })).toBe('before_cutoff');
    expect(steps.getConditionalNextStepName({ appointment: '2026-06-15T10:00:00Z' })).toBe('inside_window');
    expect(steps.getConditionalNextStepName({ appointment: '2027-01-01T10:00:00Z' })).toBe('after_cutoff');
    expect(steps.getConditionalNextStepName({ appointment: 'invalid-date' })).toBe(null);
  });

  it('emits dedicated step transition events and supports workflow step targets', () => {
    const element = renderFixture(`
      <template id="wizard">
        <form
          id="wizard_form"
          data-type="contactform"
          data-name="wizard"
          data-label="Wizard"
          data-workflow-step-targets='{"approved":"decision_step"}'
        >
          <div data-type="section" data-name="first_step" data-label="First"></div>
          <div
            data-type="section"
            data-name="optional_step"
            data-label="Optional"
            data-step-skippable="true"
          ></div>
          <div
            data-type="section"
            data-name="decision_step"
            data-label="Decision"
            data-next-step-when-field="path"
            data-next-step-when-not-equals='["standard","slow"]'
            data-next-step-target="final_step"
          ></div>
          <div data-type="section" data-name="final_step" data-label="Final"></div>
          <input
            id="required_name"
            name="required_name"
            type="text"
            data-type="text"
            data-name="required_name"
            data-label="Required Name"
            data-required="true"
            data-section-name="first_step"
          />
          <span id="required_name_error"></span>
          <input
            id="path"
            name="path"
            type="text"
            data-type="text"
            data-name="path"
            data-label="Path"
            data-section-name="decision_step"
          />
          <span id="path_error"></span>
        </form>
      </template>
      <form-ui name="wizard"></form-ui>
    `);

    const blocked = vi.fn();
    const skipped = vi.fn();
    const jumped = vi.fn();

    element.addEventListener('form-ui:step-blocked', blocked);
    element.addEventListener('form-ui:step-skipped', skipped);
    element.addEventListener('form-ui:step-jumped', jumped);

    expect(element.nextStep()).toBe(false);
    expect(blocked).toHaveBeenCalledTimes(1);

    const requiredName = element.querySelector('#required_name') as HTMLInputElement;
    requiredName.value = 'Alice';
    requiredName.dispatchEvent(new Event('input', { bubbles: true }));
    expect(element.nextStep()).toBe(true);
    expect(skipped).not.toHaveBeenCalled();

    expect(element.nextStep()).toBe(true);
    expect(skipped).toHaveBeenCalledTimes(1);
    expect(element.getCurrentStepName()).toBe('decision_step');

    const path = element.querySelector('#path') as HTMLInputElement;
    path.value = 'vip';
    path.dispatchEvent(new Event('input', { bubbles: true }));
    expect(element.nextStep()).toBe(true);
    expect(jumped).toHaveBeenCalledTimes(1);
    expect(element.getCurrentStepName()).toBe('final_step');

    expect(element.goToWorkflowStep('approved')).toBe(true);
    expect(element.getCurrentStepName()).toBe('decision_step');
  });

  it('shows workflow state in the debug panel', async () => {
    const element = renderFixture(`
      <template id="workflow_debug">
        <form
          id="workflow_debug_form"
          data-type="contactform"
          data-name="workflow_debug"
          data-label="Workflow Debug"
          data-workflow-step-targets='{"approved":"final_step"}'
        >
          <div data-type="section" data-name="first_step" data-label="First"></div>
          <div data-type="section" data-name="final_step" data-label="Final"></div>
          <input
            id="required_name"
            name="required_name"
            type="text"
            data-type="text"
            data-name="required_name"
            data-label="Required Name"
            data-required="true"
            data-section-name="first_step"
          />
          <span id="required_name_error"></span>
        </form>
      </template>
      <form-ui name="workflow_debug"></form-ui>
    `);

    const panel = createFormDebugPanel(element);
    const input = element.querySelector('#required_name') as HTMLInputElement;
    input.value = 'Alice';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(element.nextStep()).toBe(true);
    await flushAsyncWork();

    const workflow = panel.element.querySelector('.xpressui-debug-panel__workflow') as HTMLElement;
    expect(workflow.textContent).toContain('"currentStepName": "final_step"');
    panel.detach();
  });

  it('can create an indexeddb storage adapter with local cache fallback', () => {
    const records = new Map<string, any>();
    const open = vi.fn(() => {
      const request: any = {
        result: {
          objectStoreNames: {
            contains: () => false,
          },
          createObjectStore: vi.fn(),
          transaction: vi.fn(() => ({
            objectStore: vi.fn(() => ({
              get: vi.fn((key: string) => {
                const inner: any = { onsuccess: null, onerror: null, result: null };
                queueMicrotask(() => {
                  inner.result = records.has(key) ? records.get(key) : null;
                  if (typeof inner.onsuccess === 'function') {
                    inner.onsuccess(new Event('success'));
                  }
                });
                return inner;
              }),
              put: vi.fn((value: any, key: string) => {
                const inner: any = { onsuccess: null, onerror: null };
                queueMicrotask(() => {
                  records.set(key, value);
                  if (typeof inner.onsuccess === 'function') {
                    inner.onsuccess(new Event('success'));
                  }
                });
                return inner;
              }),
              delete: vi.fn((key: string) => {
                const inner: any = { onsuccess: null, onerror: null };
                queueMicrotask(() => {
                  records.delete(key);
                  if (typeof inner.onsuccess === 'function') {
                    inner.onsuccess(new Event('success'));
                  }
                });
                return inner;
              }),
            })),
          })),
        },
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      queueMicrotask(() => {
        if (typeof request.onupgradeneeded === 'function') {
          request.onupgradeneeded(new Event('upgradeneeded'));
        }
        if (typeof request.onsuccess === 'function') {
          request.onsuccess(new Event('success'));
        }
      });

      return request;
    });

    Object.defineProperty(window, 'indexedDB', {
      value: { open },
      configurable: true,
    });

    const adapter = createStorageAdapter(createFormConfig({
      name: 'idb-storage-form',
      title: 'IndexedDB Storage Form',
      storage: {
        mode: 'draft',
        adapter: 'indexeddb',
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    }));

    adapter?.saveDraft({ email: 'idb@example.com' });

    expect(open).toHaveBeenCalled();
    expect(adapter?.loadDraft()).toEqual({ email: 'idb@example.com' });
  });

  it('can migrate local storage state into indexeddb during hydration', async () => {
    const records = new Map<string, any>();
    const open = vi.fn(() => {
      const request: any = {
        result: {
          objectStoreNames: {
            contains: () => true,
          },
          createObjectStore: vi.fn(),
          transaction: vi.fn(() => ({
            objectStore: vi.fn(() => ({
              get: vi.fn((key: string) => {
                const inner: any = { onsuccess: null, onerror: null, result: null };
                queueMicrotask(() => {
                  inner.result = records.has(key) ? records.get(key) : null;
                  if (typeof inner.onsuccess === 'function') {
                    inner.onsuccess(new Event('success'));
                  }
                });
                return inner;
              }),
              put: vi.fn((value: any, key: string) => {
                const inner: any = { onsuccess: null, onerror: null };
                queueMicrotask(() => {
                  records.set(key, value);
                  if (typeof inner.onsuccess === 'function') {
                    inner.onsuccess(new Event('success'));
                  }
                });
                return inner;
              }),
              delete: vi.fn((key: string) => {
                const inner: any = { onsuccess: null, onerror: null };
                queueMicrotask(() => {
                  records.delete(key);
                  if (typeof inner.onsuccess === 'function') {
                    inner.onsuccess(new Event('success'));
                  }
                });
                return inner;
              }),
            })),
          })),
        },
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      queueMicrotask(() => {
        if (typeof request.onsuccess === 'function') {
          request.onsuccess(new Event('success'));
        }
      });

      return request;
    });

    Object.defineProperty(window, 'indexedDB', {
      value: { open },
      configurable: true,
    });

    const formConfig = createFormConfig({
      name: 'idb-migration-form',
      title: 'IndexedDB Migration Form',
      storage: {
        mode: 'draft',
        adapter: 'indexeddb',
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    });
    window.localStorage.setItem('xpressui:draft:idb-migration-form', JSON.stringify({ email: 'migrate@example.com' }));

    const adapter = createStorageAdapter(formConfig);
    const hydration = await adapter?.hydrate?.();

    expect(hydration?.migratedFromLocalStorage).toBe(true);
    expect(hydration?.snapshot.draft).toEqual({ email: 'migrate@example.com' });
  });

  it('purges expired drafts when storage retention is configured', () => {
    const formConfig = createFormConfig({
      name: 'retention-draft-form',
      title: 'Retention Draft Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key: 'xpressui:test-retention-draft',
        retentionDays: 1,
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    });

    window.localStorage.setItem(
      'xpressui:test-retention-draft',
      JSON.stringify({
        version: 1,
        savedAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
        values: { email: 'expired@example.com' },
      }),
    );

    const adapter = createStorageAdapter(formConfig);

    expect(adapter?.loadDraft()).toBeNull();
    expect(window.localStorage.getItem('xpressui:test-retention-draft')).toBeNull();
  });

  it('purges expired queue entries when storage retention is configured', () => {
    const formConfig = createFormConfig({
      name: 'retention-queue-form',
      title: 'Retention Queue Form',
      storage: {
        mode: 'queue',
        adapter: 'local-storage',
        key: 'xpressui:test-retention-queue',
        retentionDays: 1,
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    });

    window.localStorage.setItem(
      'xpressui:test-retention-queue:queue',
      JSON.stringify({
        version: 1,
        items: [
          {
            id: 'expired_queue',
            values: { email: 'expired@example.com' },
            attempts: 1,
            createdAt: Date.now() - (3 * 24 * 60 * 60 * 1000),
            updatedAt: Date.now() - (3 * 24 * 60 * 60 * 1000),
            nextAttemptAt: 0,
          },
          {
            id: 'fresh_queue',
            values: { email: 'fresh@example.com' },
            attempts: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            nextAttemptAt: 0,
          },
        ],
      }),
    );

    const adapter = createStorageAdapter(formConfig);
    const queue = adapter?.loadQueue() || [];

    expect(queue).toHaveLength(1);
    expect(queue[0]?.id).toBe('fresh_queue');
  });

  it('supports per-kind retention and encrypted local draft storage', () => {
    const formConfig = createFormConfig({
      name: 'secure-storage-form',
      title: 'Secure Storage Form',
      storage: {
        mode: 'draft-and-queue',
        adapter: 'local-storage',
        key: 'xpressui:test-secure-storage',
        encryptionKey: 'secret-key',
        retentionDraftDays: 1,
        retentionQueueDays: 7,
        retentionDeadLetterDays: 30,
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    });

    const draftKey = 'xpressui:test-secure-storage';
    const queueKey = 'xpressui:test-secure-storage:queue';
    const deadLetterKey = 'xpressui:test-secure-storage:dead-letter';

    const adapter = createStorageAdapter(formConfig);
    adapter?.saveDraft({ email: 'encrypted@example.com' });
    adapter?.saveQueue([
      {
        id: 'fresh_queue',
        values: { email: 'queue@example.com' },
        attempts: 0,
        createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
        updatedAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
        nextAttemptAt: 0,
      },
    ]);
    adapter?.saveDeadLetterQueue([
      {
        id: 'fresh_dead_letter',
        values: { email: 'dead@example.com' },
        attempts: 3,
        createdAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
        updatedAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
        nextAttemptAt: 0,
      },
    ]);

    const draftRaw = window.localStorage.getItem(draftKey) || '';
    expect(draftRaw).toContain('enc:v1:');
    expect(draftRaw).not.toContain('encrypted@example.com');

    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        version: 1,
        savedAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
        values: { email: 'expired@example.com' },
      }),
    );

    expect(adapter?.loadDraft()).toBeNull();
    expect(adapter?.loadQueue()).toEqual([
      expect.objectContaining({
        id: 'fresh_queue',
      }),
    ]);
    expect(adapter?.loadDeadLetterQueue()).toEqual([
      expect.objectContaining({
        id: 'fresh_dead_letter',
      }),
    ]);
    expect(window.localStorage.getItem(queueKey)).toContain('enc:v1:');
    expect(window.localStorage.getItem(deadLetterKey)).toContain('enc:v1:');
  });

  it('reports storage health through the adapter and admin helpers', () => {
    const formConfig = createFormConfig({
      name: 'storage-health-form',
      title: 'Storage Health Form',
      storage: {
        mode: 'draft-and-queue',
        adapter: 'local-storage',
        key: 'xpressui:test-storage-health',
        encryptionKey: 'health-key',
        retentionDraftDays: 1,
        retentionQueueDays: 2,
        retentionDeadLetterDays: 3,
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    });

    const adapter = createStorageAdapter(formConfig);
    adapter?.saveDraft({ email: 'health@example.com' });
    adapter?.saveQueue([
      {
        id: 'queue_health',
        values: { email: 'queue@example.com' },
        attempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nextAttemptAt: 0,
      },
    ]);
    adapter?.saveDeadLetterQueue([
      {
        id: 'dead_health',
        values: { email: 'dead@example.com' },
        attempts: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nextAttemptAt: 0,
      },
    ]);

    const admin = createLocalFormAdmin(formConfig);

    expect(adapter?.getHealth()).toEqual({
      adapter: 'local-storage',
      encryptionEnabled: true,
      hasDraft: true,
      queueLength: 1,
      deadLetterLength: 1,
      totalEntries: 2,
      retentionMs: {
        draft: 1 * 24 * 60 * 60 * 1000,
        queue: 2 * 24 * 60 * 60 * 1000,
        deadLetter: 3 * 24 * 60 * 60 * 1000,
      },
    });
    expect(admin.getStorageHealth()).toEqual(adapter?.getHealth());
  });

  it('reports storage health through the headless runtime', () => {
    const runtime = new FormRuntime(createFormConfig({
      name: 'runtime-storage-health-form',
      title: 'Runtime Storage Health Form',
      storage: {
        mode: 'queue',
        adapter: 'local-storage',
        key: 'xpressui:test-runtime-storage-health',
      },
      fields: [
        { name: 'attachment', label: 'Attachment', type: 'file' },
      ],
    }));

    expect(runtime.getStorageHealth()).toEqual(
      expect.objectContaining({
        queueEnabled: false,
        queueDisabledReason: 'file-uploads-are-not-queued',
      }),
    );
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

  it('resolves relative submit endpoints against submit.baseUrl', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'submit-base-url-form',
      title: 'Submit Base URL Form',
      submit: {
        baseUrl: 'https://api.example.test/v1',
        endpoint: 'payments',
        method: 'POST',
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    }) as FormUI;

    await element.onSubmit({ email: 'base-url@example.com' });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/v1/payments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'base-url@example.com' }),
      }),
    );
  });

  it('runs submit lifecycle hooks for preSubmit and postSuccess', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'confirmed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const preSubmit = vi.fn().mockReturnValue({ email: 'normalized@example.com' });
    const postSuccess = vi.fn();
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'submit-lifecycle-success-form',
      title: 'Submit Lifecycle Success Form',
      submit: {
        endpoint: '/api/submit-lifecycle-success',
        method: 'POST',
        lifecycle: {
          preSubmit,
          postSuccess,
        },
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    }) as FormUI;

    await element.onSubmit({ email: 'INITIAL@example.com' });

    expect(preSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'preSubmit',
        values: { email: 'INITIAL@example.com' },
      }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/submit-lifecycle-success',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'normalized@example.com' }),
      }),
    );
    expect(postSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'postSuccess',
        values: { email: 'normalized@example.com' },
      }),
    );
  });

  it('cancels submission when a preSubmit lifecycle hook returns false', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const onSubmitCanceled = vi.fn();
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'submit-lifecycle-cancel-form',
      title: 'Submit Lifecycle Cancel Form',
      submit: {
        endpoint: '/api/submit-lifecycle-cancel',
        method: 'POST',
        lifecycle: {
          preSubmit: () => false,
        },
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    }) as FormUI;

    element.addEventListener('form-ui:submit-canceled', (event) => {
      onSubmitCanceled((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    await element.onSubmit({ email: 'cancel@example.com' });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(onSubmitCanceled).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { email: 'cancel@example.com' },
        result: { reason: 'pre-submit-canceled' },
      }),
    );
  });

  it('runs postFailure lifecycle hooks when submit fails', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'validation_error' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const postFailure = vi.fn();
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'submit-lifecycle-failure-form',
      title: 'Submit Lifecycle Failure Form',
      submit: {
        endpoint: '/api/submit-lifecycle-failure',
        method: 'POST',
        lifecycle: {
          postFailure,
        },
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    }) as FormUI;

    await expect(
      element.onSubmit({ email: 'failure@example.com' }),
    ).rejects.toBeTruthy();

    expect(postFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'postFailure',
        values: { email: 'failure@example.com' },
        result: { code: 'validation_error' },
      }),
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
      'form-ui:workflow-state',
      'form-ui:workflow-step',
      'form-ui:workflow-state',
      'form-ui:workflow-step',
      'form-ui:submit-success',
    ]);

    observer.clear();
    expect(observer.getEvents()).toEqual([]);
    observer.detach();
  });

  it('can render a live debug panel from form events', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'debug-panel-form',
      title: 'Debug Panel Form',
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
    const panel = createFormDebugPanel(element, { title: 'Runtime Debug' });
    const country = element.querySelector('#country') as HTMLInputElement;

    document.body.appendChild(panel.element);

    country.value = 'fr';
    country.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(panel.element.textContent).toContain('Runtime Debug');
    expect(panel.element.textContent).toContain('Recent Rules');
    expect(panel.element.textContent).toContain('Active Template Warnings');
    expect(panel.element.textContent).toContain('Output Snapshot');
    expect(panel.element.textContent).toContain('Clear Snapshot');
    expect(panel.element.textContent).toContain('Clear Events');
    expect(panel.element.textContent).toContain('Status: listening');
    expect(panel.element.textContent).toContain('Last Updated:');
    expect(panel.element.textContent).toContain('set-currency');

    const buttons = Array.from(panel.element.querySelectorAll('button')) as HTMLButtonElement[];
    const clearSnapshotButton = buttons.find((button) => button.textContent === 'Clear Snapshot')!;
    const clearEventsButton = buttons.find((button) => button.textContent === 'Clear Events')!;

    clearSnapshotButton.click();
    expect(panel.element.textContent).toContain('[]');
    expect(panel.element.textContent).toContain('events: 2');

    clearEventsButton.click();
    expect(panel.element.textContent).toContain('events: 0');
    expect(panel.element.textContent).toContain('Last Updated: never');

    panel.detach();
    expect(panel.element.textContent).toContain('Status: detached');
    expect(document.body.contains(panel.element)).toBe(false);
  });

  it('renders output snapshot details in the debug panel for hybrid mode', async () => {
    const element = renderFixture(`
      <template id="debug_output_snapshot">
        <form
          id="debug_output_snapshot_form"
          data-type="contactform"
          data-name="debug_output_snapshot"
          data-label="Debug Output Snapshot"
        >
          <input
            id="title"
            name="title"
            type="text"
            data-type="text"
            data-name="title"
            data-label="Title"
            data-section-name="main"
          />
        </form>
      </template>
      <form-ui name="debug_output_snapshot" mode="hybrid"></form-ui>
    `);

    const panel = createFormDebugPanel(element, { title: 'Output Debug' });
    const input = element.querySelector('#title') as HTMLInputElement;
    input.value = 'Debug value';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    const outputSnapshot = panel.element.querySelector('.xpressui-debug-panel__output-snapshot') as HTMLElement;
    expect(outputSnapshot.textContent).toContain('"title"');
    expect(outputSnapshot.textContent).toContain('"rendererType": "text"');
    expect(outputSnapshot.textContent).toContain('"value": "Debug value"');

    panel.detach();
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
    expect(observer.getRecentAppliedRules()).toEqual([
      {
        id: 'set-currency',
        logic: undefined,
        conditions: [
          { field: 'country', operator: 'equals', value: 'fr' },
        ],
        actions: [
          { type: 'set-value', field: 'currency', value: 'EUR' },
        ],
      },
    ]);
    expect(observer.getLastRuleState()).toEqual(
      expect.objectContaining({
        type: 'form-ui:rule-state',
        timestamp: expect.any(Number),
        detail: expect.objectContaining({
          result: {
            rules: [
              {
                id: 'set-currency',
                logic: undefined,
                conditions: [
                  { field: 'country', operator: 'equals', value: 'fr' },
                ],
                actions: [
                  { type: 'set-value', field: 'currency', value: 'EUR' },
                ],
              },
            ],
          },
        }),
      })
    );
    expect(observer.getSnapshot()).toEqual(
      expect.objectContaining({
        recentAppliedRules: [
          {
            id: 'set-currency',
            logic: undefined,
            conditions: [
              { field: 'country', operator: 'equals', value: 'fr' },
            ],
            actions: [
              { type: 'set-value', field: 'currency', value: 'EUR' },
            ],
          },
        ],
        lastRuleState: expect.objectContaining({
          type: 'form-ui:rule-state',
          timestamp: expect.any(Number),
        }),
        activeTemplateWarnings: [],
        lastTemplateWarningState: null,
      })
    );

    observer.clearRuleHistory();
    expect(observer.getRuleHistory()).toEqual([]);
    observer.clearSnapshot();
    expect(observer.getRecentAppliedRules()).toEqual([]);
    expect(observer.getLastRuleState()).toBeNull();
    expect(observer.getActiveTemplateWarnings()).toEqual([]);
    expect(observer.getLastTemplateWarningState()).toBeNull();
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
    expect(observer.getLastTemplateWarningState()).toEqual(
      expect.objectContaining({
        type: 'form-ui:rule-template-warning-state',
        timestamp: expect.any(Number),
        detail: expect.objectContaining({
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
        }),
      })
    );
    expect(observer.getSnapshot()).toEqual(
      expect.objectContaining({
        recentAppliedRules: [
          {
            id: 'compose-full-name',
            logic: undefined,
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
        lastRuleState: expect.objectContaining({
          type: 'form-ui:rule-state',
          timestamp: expect.any(Number),
        }),
        activeTemplateWarnings: [
          {
            ruleId: 'compose-full-name',
            field: 'fullName',
            template: '{{firstName}} {{missingName}}',
            missingField: 'missingName',
          },
        ],
        lastTemplateWarningState: expect.objectContaining({
          type: 'form-ui:rule-template-warning-state',
          timestamp: expect.any(Number),
        }),
      })
    );

    observer.clearActiveTemplateWarnings();
    expect(observer.getActiveTemplateWarnings()).toEqual([]);
    observer.clearLastTemplateWarningState();
    expect(observer.getLastTemplateWarningState()).toBeNull();
    expect(observer.getSnapshot()).toEqual(
      expect.objectContaining({
        activeTemplateWarnings: [],
        lastTemplateWarningState: null,
      })
    );
    observer.detach();
  });

  it('exposes active template warnings directly on FormUI', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'form-ui-active-template-warnings-form',
      title: 'Form UI Active Template Warnings Form',
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

    firstName.value = 'Ada';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    autoFullName.checked = true;
    autoFullName.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(element.getActiveTemplateWarnings()).toEqual([
      {
        ruleId: 'compose-full-name',
        field: 'fullName',
        template: '{{firstName}} {{missingName}}',
        missingField: 'missingName',
      },
    ]);

    element.clearActiveTemplateWarnings();
    expect(element.getActiveTemplateWarnings()).toEqual([]);
  });

  it('exposes recently applied rules directly on FormUI', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'form-ui-recent-rules-form',
      title: 'Form UI Recent Rules Form',
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

    country.value = 'fr';
    country.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(element.getRecentAppliedRules()).toEqual([
      {
        id: 'set-currency',
        logic: undefined,
        conditions: [
          { field: 'country', operator: 'equals', value: 'fr' },
        ],
        actions: [
          { type: 'set-value', field: 'currency', value: 'EUR' },
        ],
      },
    ]);

    element.clearRecentAppliedRules();
    expect(element.getRecentAppliedRules()).toEqual([]);
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

  it('does not double-initialize mounted forms when the container is already attached', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const element = mountFormUI(container, {
      name: 'attached-mount-form',
      title: 'Attached Mount Form',
      fields: [
        {
          name: 'full_name',
          label: 'Full Name',
          type: 'text',
          required: true,
        },
      ],
    }) as FormUI;

    const forms = element.querySelectorAll('form');
    const inputs = element.querySelectorAll('#full_name');
    const input = element.querySelector('#full_name') as HTMLInputElement;

    expect(forms).toHaveLength(1);
    expect(inputs).toHaveLength(1);

    input.value = 'Alice';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(element.form?.getState().values.full_name).toBe('Alice');
  });

  it('supports select-multiple fields in mounted forms', async () => {
    const container = document.createElement('div');
    const onSubmitSuccess = vi.fn();
    const element = mountFormUI(container, {
      name: 'multi-select-form',
      title: 'Multi Select Form',
      fields: [
        {
          name: 'services',
          label: 'Services',
          type: 'select-multiple',
          choices: [
            { value: 'consulting', label: 'Consulting' },
            { value: 'support', label: 'Support' },
            { value: 'training', label: 'Training' },
          ],
        },
      ],
    }) as FormUI;
    const services = element.querySelector('#services') as HTMLSelectElement;

    element.addEventListener('form-ui:submit-success', (event) => {
      onSubmitSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    Array.from(services.options).forEach((option) => {
      option.selected = option.value === 'consulting' || option.value === 'training';
    });
    services.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).services).toEqual(['consulting', 'training']);

    const form = element.querySelector('#multi-select-form_form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(onSubmitSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        values: {
          services: ['consulting', 'training'],
        },
      })
    );
  });

  it('stores file metadata locally and submits file blobs with form-data', async () => {
    const originalXhr = window.XMLHttpRequest;

    class MockXhr {
      static sentBodies: Array<FormData | File> = [];
      upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 200;
      responseText = JSON.stringify({ uploaded: true });

      open() {}
      setRequestHeader() {}
      getResponseHeader(name: string) {
        return name.toLowerCase() === 'content-type' ? 'application/json' : null;
      }
      send(body: FormData | File) {
        MockXhr.sentBodies.push(body);
        this.onload?.();
      }
    }

    (window as any).XMLHttpRequest = MockXhr;
    (globalThis as any).XMLHttpRequest = MockXhr;
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'upload-form',
      title: 'Upload Form',
      submit: {
        endpoint: '/api/uploads',
        method: 'POST',
        mode: 'form-data',
        formDataArrayMode: 'brackets',
      },
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key: 'xpressui:upload-form',
        autoSaveMs: 0,
      },
      fields: [
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          accept: '.pdf,image/*',
          multiple: true,
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#attachments') as HTMLInputElement;
    const fileOne = new File(['report'], 'report.pdf', { type: 'application/pdf' });
    const fileTwo = new File(['photo'], 'photo.png', { type: 'image/png' });

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [fileOne, fileTwo],
    });

    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).attachments).toEqual([fileOne, fileTwo]);
    expect((element.querySelector('#attachments_selection') as HTMLElement).textContent).toContain(
      'report.pdf',
    );
    expect((element.querySelector('#attachments_selection') as HTMLElement).textContent).toContain(
      'photo.png',
    );
    expect(JSON.parse(window.localStorage.getItem('xpressui:upload-form') || '{}')).toEqual({
      version: 1,
      savedAt: expect.any(Number),
      values: {
        attachments: [
          expect.objectContaining({
            __type: 'file-metadata',
            name: 'report.pdf',
            mimeType: 'application/pdf',
          }),
          expect.objectContaining({
            __type: 'file-metadata',
            name: 'photo.png',
            mimeType: 'image/png',
          }),
        ],
      },
    });

    await element.onSubmit((element.form?.getState().values || {}) as Record<string, any>);

    const body = MockXhr.sentBodies[0] as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.getAll('attachments[]')).toEqual([fileOne, fileTwo]);

    (window as any).XMLHttpRequest = originalXhr;
    (globalThis as any).XMLHttpRequest = originalXhr;
  });

  it('emits upload progress events and shows upload state in the default UI', async () => {
    const originalXhr = window.XMLHttpRequest;
    const eventTypes: string[] = [];

    class MockXhr {
      static sentBodies: Array<FormData | File> = [];
      upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 200;
      responseText = JSON.stringify({ uploaded: true });

      open() {}
      setRequestHeader() {}
      getResponseHeader(name: string) {
        return name.toLowerCase() === 'content-type' ? 'application/json' : null;
      }
      send(body: FormData | File) {
        MockXhr.sentBodies.push(body);
        this.upload.onprogress?.({
          lengthComputable: true,
          loaded: 50,
          total: 100,
        } as ProgressEvent);
        this.upload.onprogress?.({
          lengthComputable: true,
          loaded: 100,
          total: 100,
        } as ProgressEvent);
        this.onload?.();
      }
    }

    (window as any).XMLHttpRequest = MockXhr;
    (globalThis as any).XMLHttpRequest = MockXhr;

    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'upload-progress-form',
      title: 'Upload Progress Form',
      submit: {
        endpoint: '/api/uploads',
        method: 'POST',
        mode: 'form-data',
      },
      fields: [
        {
          name: 'attachment',
          label: 'Attachment',
          type: 'file',
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#attachment') as HTMLInputElement;
    const file = new File(['upload'], 'upload.pdf', { type: 'application/pdf' });

    ['form-ui:upload-start', 'form-ui:upload-progress', 'form-ui:upload-complete'].forEach((type) => {
      element.addEventListener(type, () => {
        eventTypes.push(type);
      });
    });

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [file],
    });

    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsyncWork();
    await element.onSubmit((element.form?.getState().values || {}) as Record<string, any>);

    expect(eventTypes).toContain('form-ui:upload-start');
    expect(eventTypes).toContain('form-ui:upload-progress');
    expect(eventTypes).toContain('form-ui:upload-complete');
    expect((element.querySelector('#attachment_selection') as HTMLElement).textContent).toContain(
      'Uploaded',
    );

    (window as any).XMLHttpRequest = originalXhr;
    (globalThis as any).XMLHttpRequest = originalXhr;
  });

  it('supports drag and drop for file fields in the default UI', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'file-drop-form',
      title: 'File Drop Form',
      fields: [
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          multiple: true,
        },
      ],
    }) as FormUI;
    const selection = element.querySelector('#attachments_selection') as HTMLElement;
    const droppedFile = new File(['drop'], 'drop.pdf', { type: 'application/pdf' });
    const dropEvent = new Event('drop', { bubbles: true }) as DragEvent;

    Object.defineProperty(dropEvent, 'dataTransfer', {
      configurable: true,
      value: {
        files: [droppedFile],
      },
    });

    selection.dispatchEvent(dropEvent);
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).attachments).toEqual([droppedFile]);
    expect(selection.textContent).toContain('drop.pdf');
  });

  it('rejects invalid dropped files before updating the field value', async () => {
    const container = document.createElement('div');
    const onFileValidationError = vi.fn();
    const element = mountFormUI(container, {
      name: 'file-drop-validated-form',
      title: 'File Drop Validated Form',
      fields: [
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          multiple: true,
          fileDropMode: 'append',
          maxFiles: 1,
        },
      ],
    }) as FormUI;
    const selection = element.querySelector('#attachments_selection') as HTMLElement;
    const initialFile = new File(['one'], 'one.pdf', { type: 'application/pdf' });
    const rejectedFile = new File(['two'], 'two.pdf', { type: 'application/pdf' });

    element.addEventListener('form-ui:file-validation-error', (event) => {
      onFileValidationError((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    element.form?.change('attachments', [initialFile]);

    const dropEvent = new Event('drop', { bubbles: true }) as DragEvent;
    Object.defineProperty(dropEvent, 'dataTransfer', {
      configurable: true,
      value: {
        files: [rejectedFile],
      },
    });

    selection.dispatchEvent(dropEvent);
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).attachments).toEqual([initialFile]);
    expect(onFileValidationError).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          field: 'attachments',
          code: 'file-count',
        },
      }),
    );
  });

  it('can append dropped files when fileDropMode is append', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'file-drop-append-form',
      title: 'File Drop Append Form',
      fields: [
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          multiple: true,
          fileDropMode: 'append',
          maxFiles: 3,
        },
      ],
    }) as FormUI;
    const selection = element.querySelector('#attachments_selection') as HTMLElement;
    const firstFile = new File(['one'], 'one.pdf', { type: 'application/pdf' });
    const secondFile = new File(['two'], 'two.pdf', { type: 'application/pdf' });

    element.form?.change('attachments', [firstFile]);

    const dropEvent = new Event('drop', { bubbles: true }) as DragEvent;
    Object.defineProperty(dropEvent, 'dataTransfer', {
      configurable: true,
      value: {
        files: [secondFile],
      },
    });

    selection.dispatchEvent(dropEvent);
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).attachments).toEqual([firstFile, secondFile]);
  });

  it('can remove a selected file from the default upload UI', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'file-remove-form',
      title: 'File Remove Form',
      fields: [
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          multiple: true,
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#attachments') as HTMLInputElement;
    const fileOne = new File(['one'], 'one.pdf', { type: 'application/pdf' });
    const fileTwo = new File(['two'], 'two.pdf', { type: 'application/pdf' });

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [fileOne, fileTwo],
    });

    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsyncWork();

    const removeButtons = Array.from(
      element.querySelectorAll('#attachments_selection [data-remove-file-index]'),
    ) as HTMLButtonElement[];
    expect(removeButtons).toHaveLength(2);
    expect(removeButtons[0].closest('label')).toBeNull();
    const inputClickSpy = vi.spyOn(input, 'click');

    removeButtons[0].click();
    await flushAsyncWork();

    expect(inputClickSpy).not.toHaveBeenCalled();
    expect((element.form?.getState().values || {}).attachments).toEqual([fileTwo]);
    expect((element.querySelector('#attachments_selection') as HTMLElement).textContent).toContain(
      'two.pdf',
    );
    expect((element.querySelector('#attachments_selection') as HTMLElement).textContent).not.toContain(
      'one.pdf',
    );
    inputClickSpy.mockRestore();
  });

  it('renders a simple image preview when image uploads are allowed', async () => {
    const createObjectUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:test-preview');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'image-preview-form',
      title: 'Image Preview Form',
      fields: [
        {
          name: 'image',
          label: 'Image',
          type: 'file',
          accept: 'image/*',
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#image') as HTMLInputElement;
    const imageFile = new File(['image'], 'photo.png', { type: 'image/png' });

    document.body.appendChild(container);

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [imageFile],
    });

    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsyncWork();

    const preview = element.querySelector('#image_selection img') as HTMLImageElement;
    expect(preview).not.toBeNull();
    expect(preview.src).toContain('blob:test-preview');
    expect(preview.style.width).toBe('72px');
    expect(preview.style.height).toBe('72px');
    expect(preview.style.objectFit).toBe('cover');

    element.remove();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:test-preview');
    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
  });

  it('does not apply string-only AJV validation to file fields', () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'file-validation-form',
      title: 'File Validation Form',
      fields: [
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          multiple: true,
          required: true,
        },
      ],
    }) as FormUI;
    const file = new File(['file'], 'doc.pdf', { type: 'application/pdf' });

    const errors = element.engine.validateValues({
      attachments: [file],
    });

    expect(errors.attachments).toBeUndefined();
  });

  it('renders native capture attributes for file and camera-photo fields', () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'camera-fields-form',
      title: 'Camera Fields Form',
      fields: [
        {
          name: 'identity_photo',
          label: 'Identity Photo',
          type: 'file',
          accept: 'image/*',
          capture: 'user',
        },
        {
          name: 'document_scan',
          label: 'Document Scan',
          type: 'camera-photo',
        },
      ],
    }) as FormUI;
    const fileField = element.querySelector('#identity_photo') as HTMLInputElement;
    const cameraField = element.querySelector('#document_scan') as HTMLInputElement;

    expect(fileField.getAttribute('capture')).toBe('user');
    expect(fileField.getAttribute('accept')).toBe('image/*');
    expect(cameraField.type).toBe('file');
    expect(cameraField.getAttribute('accept')).toBe('image/*');
    expect(cameraField.getAttribute('capture')).toBe('environment');
  });

  it('can decode a qr-scan field into a string value', async () => {
    const originalBarcodeDetector = (globalThis as any).BarcodeDetector;
    const onQrScanSuccess = vi.fn();

    class MockBarcodeDetector {
      detect = vi.fn().mockResolvedValue([{ rawValue: 'ID-QR-123' }]);
    }

    (globalThis as any).BarcodeDetector = MockBarcodeDetector;

    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'qr-scan-form',
      title: 'QR Scan Form',
      fields: [
        {
          name: 'scan_code',
          label: 'Scan Code',
          type: 'qr-scan',
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#scan_code') as HTMLInputElement;
    const imageFile = new File(['image'], 'qr.png', { type: 'image/png' });

    element.addEventListener('form-ui:qr-scan-success', (event) => {
      onQrScanSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [imageFile],
    });

    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).scan_code).toBe('ID-QR-123');
    expect(onQrScanSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          field: 'scan_code',
          code: 'ID-QR-123',
        },
      }),
    );
    expect((element.querySelector('#scan_code_selection') as HTMLElement).textContent).toContain(
      'Scanned code: ID-QR-123',
    );

    (globalThis as any).BarcodeDetector = originalBarcodeDetector;
  });

  it('emits a qr-scan error when barcode detection is unavailable', async () => {
    const originalBarcodeDetector = (globalThis as any).BarcodeDetector;
    const onQrScanError = vi.fn();

    (globalThis as any).BarcodeDetector = undefined;

    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'qr-scan-error-form',
      title: 'QR Scan Error Form',
      fields: [
        {
          name: 'scan_code',
          label: 'Scan Code',
          type: 'qr-scan',
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#scan_code') as HTMLInputElement;
    const imageFile = new File(['image'], 'qr.png', { type: 'image/png' });

    element.addEventListener('form-ui:qr-scan-error', (event) => {
      onQrScanError((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [imageFile],
    });

    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).scan_code).toBeUndefined();
    expect(onQrScanError).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          field: 'scan_code',
          reason: 'barcode-detector-unavailable',
        },
      }),
    );

    (globalThis as any).BarcodeDetector = originalBarcodeDetector;
  });

  it('supports live camera scanning for qr-scan fields', async () => {
    const originalBarcodeDetector = (globalThis as any).BarcodeDetector;
    const originalMediaDevices = navigator.mediaDevices;
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined as unknown as void);
    const onQrScanSuccess = vi.fn();
    const stopTrack = vi.fn();

    class MockBarcodeDetector {
      detect = vi.fn().mockResolvedValue([{ rawValue: 'LIVE-QR-789' }]);
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: stopTrack }],
        }),
      },
    });
    (globalThis as any).BarcodeDetector = MockBarcodeDetector;

    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'qr-live-form',
      title: 'QR Live Form',
      fields: [
        {
          name: 'scan_code',
          label: 'Scan Code',
          type: 'qr-scan',
        },
      ],
    }) as FormUI;

    element.addEventListener('form-ui:qr-scan-success', (event) => {
      onQrScanSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    const startButton = element.querySelector('[data-qr-action="start"]') as HTMLButtonElement;
    startButton.click();
    await flushAsyncWork();

    const scanButton = element.querySelector('[data-qr-action="scan"]') as HTMLButtonElement;
    expect(scanButton).not.toBeNull();

    scanButton.click();
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).scan_code).toBe('LIVE-QR-789');
    expect(onQrScanSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          field: 'scan_code',
          code: 'LIVE-QR-789',
          source: 'camera',
        },
      }),
    );
    expect(stopTrack).toHaveBeenCalled();

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    (globalThis as any).BarcodeDetector = originalBarcodeDetector;
    playSpy.mockRestore();
  });

  it('can auto-scan qr codes continuously once the live camera starts', async () => {
    const originalBarcodeDetector = (globalThis as any).BarcodeDetector;
    const originalMediaDevices = navigator.mediaDevices;
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined as unknown as void);

    class MockBarcodeDetector {
      detect = vi.fn().mockResolvedValue([{ rawValue: 'AUTO-QR-456' }]);
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
    (globalThis as any).BarcodeDetector = MockBarcodeDetector;

    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'qr-auto-form',
      title: 'QR Auto Form',
      fields: [
        {
          name: 'scan_code',
          label: 'Scan Code',
          type: 'qr-scan',
        },
      ],
    }) as FormUI;

    const startButton = element.querySelector('[data-qr-action="start"]') as HTMLButtonElement;
    startButton.click();
    await new Promise((resolve) => setTimeout(resolve, 320));
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).scan_code).toBe('AUTO-QR-456');

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    (globalThis as any).BarcodeDetector = originalBarcodeDetector;
    playSpy.mockRestore();
  });

  it('supports document-scan front and back slots with framed previews', async () => {
    const createObjectUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation((file: Blob) => `blob:${(file as File).name}`);
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'document-scan-form',
      title: 'Document Scan Form',
      fields: [
        {
          name: 'identity_card',
          label: 'Identity Card',
          type: 'document-scan',
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#identity_card') as HTMLInputElement;
    const frontFile = new File(['front'], 'front.png', { type: 'image/png' });
    const backFile = new File(['back'], 'back.png', { type: 'image/png' });

    const buttons = Array.from(
      element.querySelectorAll('#identity_card_selection [data-document-scan-slot]'),
    ) as HTMLButtonElement[];
    expect(buttons).toHaveLength(2);

    buttons[1].click();
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [backFile],
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsyncWork();

    const rerenderedButtons = Array.from(
      element.querySelectorAll('#identity_card_selection [data-document-scan-slot]'),
    ) as HTMLButtonElement[];
    rerenderedButtons[0].click();
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [frontFile],
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsyncWork();

    expect((element.form?.getState().values || {}).identity_card).toEqual([frontFile, backFile]);
    expect((element.querySelector('#identity_card_selection') as HTMLElement).textContent).toContain(
      'Front',
    );
    expect((element.querySelector('#identity_card_selection') as HTMLElement).textContent).toContain(
      'Back',
    );
    expect(
      (element.querySelectorAll('#identity_card_selection img') as NodeListOf<HTMLImageElement>).length,
    ).toBe(2);

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
  });

  it('crops document scans and emits OCR and MRZ events when native text detection is available', async () => {
    const originalCreateImageBitmap = (globalThis as any).createImageBitmap;
    const originalTextDetector = (globalThis as any).TextDetector;
    const drawImageSpy = vi.fn();
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const onCrop = vi.fn();
    const onBounds = vi.fn();
    const onText = vi.fn();
    const onMrz = vi.fn();
    const onData = vi.fn();
    const onFieldsPopulated = vi.fn();

    (globalThis as any).createImageBitmap = vi.fn().mockResolvedValue({
      width: 1600,
      height: 1200,
      close: vi.fn(),
    });

    class MockTextDetector {
      detect = vi.fn().mockResolvedValue([
        {
          rawValue: 'P<UTOERIKSSON<<ANNA<MARIA\nL898902C36UTO7408122F1204159ZE184226B<<<<<10',
        },
      ]);
    }

    (globalThis as any).TextDetector = MockTextDetector;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: drawImageSpy,
    }) as any;
    HTMLCanvasElement.prototype.toBlob = function toBlob(callback: BlobCallback) {
      callback(new Blob(['cropped'], { type: 'image/png' }));
    };

    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'document-ocr-form',
      title: 'Document OCR Form',
      fields: [
        {
          name: 'passport',
          label: 'Passport',
          type: 'document-scan',
          documentScanMode: 'single',
          enableDocumentOcr: true,
          documentTextTargetField: 'passport_text',
          documentMrzTargetField: 'passport_mrz',
          documentFirstNameTargetField: 'first_name',
          documentLastNameTargetField: 'last_name',
          documentNumberTargetField: 'document_number',
          documentNationalityTargetField: 'nationality',
          documentBirthDateTargetField: 'birth_date',
          documentExpiryDateTargetField: 'expiry_date',
          documentSexTargetField: 'sex',
        },
        {
          name: 'passport_text',
          label: 'Passport Text',
          type: 'textarea',
        },
        {
          name: 'passport_mrz',
          label: 'Passport MRZ',
          type: 'text',
        },
        { name: 'first_name', label: 'First Name', type: 'text' },
        { name: 'last_name', label: 'Last Name', type: 'text' },
        { name: 'document_number', label: 'Document Number', type: 'text' },
        { name: 'nationality', label: 'Nationality', type: 'text' },
        { name: 'birth_date', label: 'Birth Date', type: 'text' },
        { name: 'expiry_date', label: 'Expiry Date', type: 'text' },
        { name: 'sex', label: 'Sex', type: 'text' },
      ],
    }) as FormUI;
    const input = element.querySelector('#passport') as HTMLInputElement;
    const sourceFile = new File(['passport'], 'passport.png', { type: 'image/png' });

    element.addEventListener('form-ui:document-scan-cropped', (event) => {
      onCrop((event as CustomEvent<TFormUISubmitDetail>).detail);
    });
    element.addEventListener('form-ui:document-scan-bounds-detected', (event) => {
      onBounds((event as CustomEvent<TFormUISubmitDetail>).detail);
    });
    element.addEventListener('form-ui:document-text-detected', (event) => {
      onText((event as CustomEvent<TFormUISubmitDetail>).detail);
    });
    element.addEventListener('form-ui:document-mrz-detected', (event) => {
      onMrz((event as CustomEvent<TFormUISubmitDetail>).detail);
    });
    element.addEventListener('form-ui:document-data', (event) => {
      onData((event as CustomEvent<TFormUISubmitDetail>).detail);
    });
    element.addEventListener('form-ui:document-fields-populated', (event) => {
      onFieldsPopulated((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [sourceFile],
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsyncWork();

    const savedFile = (element.form?.getState().values || {}).passport as File;
    expect(savedFile).toBeInstanceOf(File);
    expect(savedFile).not.toBe(sourceFile);
    expect(drawImageSpy).toHaveBeenCalled();
    expect(onCrop).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          field: 'passport',
          slot: 0,
          fileName: 'passport.png',
        }),
      }),
    );
    expect(onBounds).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          field: 'passport',
          slot: 0,
          bounds: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
            width: expect.any(Number),
            height: expect.any(Number),
          }),
          corners: expect.objectContaining({
            topLeft: expect.objectContaining({
              x: expect.any(Number),
              y: expect.any(Number),
            }),
            topRight: expect.objectContaining({
              x: expect.any(Number),
              y: expect.any(Number),
            }),
            bottomRight: expect.objectContaining({
              x: expect.any(Number),
              y: expect.any(Number),
            }),
            bottomLeft: expect.objectContaining({
              x: expect.any(Number),
              y: expect.any(Number),
            }),
          }),
        }),
      }),
    );
    expect(onText).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          field: 'passport',
          slot: 0,
          text: expect.stringContaining('P<UTOERIKSSON'),
        }),
      }),
    );
    expect(onMrz).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          field: 'passport',
          slot: 0,
          mrz: expect.objectContaining({
            format: 'TD3',
            documentCode: 'P',
            issuingCountry: 'UTO',
            documentNumber: 'L898902C3',
            nationality: 'UTO',
            birthDate: '740812',
            expiryDate: '120415',
            sex: 'F',
            surnames: ['ERIKSSON'],
            givenNames: ['ANNA', 'MARIA'],
            valid: true,
            checksums: expect.objectContaining({
              composite: true,
              documentNumber: true,
              birthDate: true,
              expiryDate: true,
            }),
          }),
        }),
      }),
    );
    expect(onData).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          field: 'passport',
          slot: 0,
          text: expect.stringContaining('P<UTOERIKSSON'),
          mrz: expect.objectContaining({
            format: 'TD3',
            documentNumber: 'L898902C3',
            valid: true,
          }),
        }),
      }),
    );
    expect(onFieldsPopulated).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          field: 'passport',
          slot: 0,
          fields: {
            firstName: 'ANNA MARIA',
            lastName: 'ERIKSSON',
            documentNumber: 'L898902C3',
            nationality: 'UTO',
            birthDate: '740812',
            expiryDate: '120415',
            sex: 'F',
          },
        },
      }),
    );
    expect((element.form?.getState().values || {}).passport_text).toContain('P<UTOERIKSSON');
    expect((element.form?.getState().values || {}).passport_mrz).toEqual(
      expect.objectContaining({
        format: 'TD3',
        documentNumber: 'L898902C3',
        issuingCountry: 'UTO',
        valid: true,
      }),
    );
    expect((element.form?.getState().values || {}).first_name).toBe('ANNA MARIA');
    expect((element.form?.getState().values || {}).last_name).toBe('ERIKSSON');
    expect((element.form?.getState().values || {}).document_number).toBe('L898902C3');
    expect((element.form?.getState().values || {}).nationality).toBe('UTO');
    expect((element.form?.getState().values || {}).birth_date).toBe('740812');
    expect((element.form?.getState().values || {}).expiry_date).toBe('120415');
    expect((element.form?.getState().values || {}).sex).toBe('F');
    expect(element.getDocumentData('passport')).toEqual(
      expect.objectContaining({
        text: expect.stringContaining('P<UTOERIKSSON'),
        mrz: expect.objectContaining({
          format: 'TD3',
          documentNumber: 'L898902C3',
          valid: true,
          checksums: expect.objectContaining({
            composite: true,
            documentNumber: true,
            birthDate: true,
            expiryDate: true,
          }),
        }),
        fields: expect.objectContaining({
          firstName: 'ANNA MARIA',
          lastName: 'ERIKSSON',
        }),
      }),
    );
    expect((element.querySelector('#passport_selection') as HTMLElement).textContent).toContain('OCR:');
    expect((element.querySelector('#passport_selection') as HTMLElement).textContent).toContain('MRZ:');

    (globalThis as any).createImageBitmap = originalCreateImageBitmap;
    (globalThis as any).TextDetector = originalTextDetector;
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
  });

  it('emits a dedicated event for file validation errors', () => {
    const container = document.createElement('div');
    const onFileValidationError = vi.fn();
    const element = mountFormUI(container, {
      name: 'file-validation-event-form',
      title: 'File Validation Event Form',
      fields: [
        {
          name: 'attachment',
          label: 'Attachment',
          type: 'file',
          accept: '.pdf',
        },
      ],
    }) as FormUI;
    const wrongType = new File(['image'], 'image.png', { type: 'image/png' });

    element.addEventListener('form-ui:file-validation-error', (event) => {
      onFileValidationError((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    const errors = element.validateForm({ attachment: wrongType });

    expect(errors).toEqual({
      attachment: expect.objectContaining({
        errorMessage: 'File type not allowed: image.png',
      }),
    });
    expect(onFileValidationError).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          field: 'attachment',
          code: 'file-accept',
        },
      }),
    );
  });

  it('validates file type and size before submit', () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'validated-upload-form',
      title: 'Validated Upload Form',
      fields: [
        {
          name: 'attachment',
          label: 'Attachment',
          type: 'file',
          accept: '.pdf',
          maxFileSizeMb: 0.000001,
        },
      ],
    }) as FormUI;
    const wrongType = new File(['image'], 'image.png', { type: 'image/png' });
    const tooLarge = new File(['123456789'], 'report.pdf', { type: 'application/pdf' });

    expect(element.validateForm({ attachment: wrongType })).toEqual({
      attachment: expect.objectContaining({
        errorMessage: 'File type not allowed: image.png',
      }),
    });

    expect(element.validateForm({ attachment: tooLarge })).toEqual({
      attachment: expect.objectContaining({
        errorMessage: 'File too large: report.pdf exceeds 0.000001 MB',
      }),
    });
  });

  it('supports maxFiles and custom file validation messages', () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'custom-upload-errors-form',
      title: 'Custom Upload Errors Form',
      fields: [
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          accept: '.pdf',
          multiple: true,
          maxFiles: 1,
          maxFileSizeMb: 0.000001,
          fileTypeErrorMsg: 'Custom type error',
          fileSizeErrorMsg: 'Custom size error',
        },
      ],
    }) as FormUI;
    const pdfA = new File(['a'], 'a.pdf', { type: 'application/pdf' });
    const pdfB = new File(['b'], 'b.pdf', { type: 'application/pdf' });
    const png = new File(['image'], 'bad.png', { type: 'image/png' });
    const largePdf = new File(['123456789'], 'large.pdf', { type: 'application/pdf' });

    expect(element.validateForm({ attachments: [pdfA, pdfB] })).toEqual({
      attachments: expect.objectContaining({
        errorMessage: 'Too many files: maximum 1 allowed',
      }),
    });

    expect(element.validateForm({ attachments: [png] })).toEqual({
      attachments: expect.objectContaining({
        errorMessage: 'Custom type error',
      }),
    });

    expect(element.validateForm({ attachments: [largePdf] })).toEqual({
      attachments: expect.objectContaining({
        errorMessage: 'Custom size error',
      }),
    });
  });

  it('supports minFiles validation for multiple uploads', () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'min-files-form',
      title: 'Min Files Form',
      fields: [
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          multiple: true,
          minFiles: 2,
        },
      ],
    }) as FormUI;
    const fileOne = new File(['one'], 'one.pdf', { type: 'application/pdf' });

    expect(element.validateForm({ attachments: [fileOne] })).toEqual({
      attachments: expect.objectContaining({
        errorMessage: 'Not enough files: minimum 2 required',
      }),
    });
  });

  it('supports total file size validation for multiple uploads', () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'total-size-form',
      title: 'Total Size Form',
      fields: [
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          multiple: true,
          maxTotalFileSizeMb: 0.000001,
        },
      ],
    }) as FormUI;
    const fileOne = new File(['12345'], 'one.pdf', { type: 'application/pdf' });
    const fileTwo = new File(['67890'], 'two.pdf', { type: 'application/pdf' });

    expect(element.validateForm({ attachments: [fileOne, fileTwo] })).toEqual({
      attachments: expect.objectContaining({
        errorMessage: 'Files too large together: total exceeds 0.000001 MB',
      }),
    });
  });

  it('supports repeat form-data array keys for file uploads', async () => {
    const originalXhr = window.XMLHttpRequest;

    class MockXhr {
      static sentBodies: Array<FormData | File> = [];
      upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 200;
      responseText = JSON.stringify({ uploaded: true });

      open() {}
      setRequestHeader() {}
      getResponseHeader(name: string) {
        return name.toLowerCase() === 'content-type' ? 'application/json' : null;
      }
      send(body: FormData | File) {
        MockXhr.sentBodies.push(body);
        this.onload?.();
      }
    }

    (window as any).XMLHttpRequest = MockXhr;
    (globalThis as any).XMLHttpRequest = MockXhr;
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'upload-repeat-form',
      title: 'Upload Repeat Form',
      submit: {
        endpoint: '/api/uploads',
        method: 'POST',
        mode: 'form-data',
        formDataArrayMode: 'repeat',
      },
      fields: [
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          multiple: true,
        },
      ],
    }) as FormUI;
    const fileOne = new File(['one'], 'one.pdf', { type: 'application/pdf' });
    const fileTwo = new File(['two'], 'two.pdf', { type: 'application/pdf' });

    await element.onSubmit({ attachments: [fileOne, fileTwo] });
    const body = MockXhr.sentBodies[0] as FormData;
    expect(body.getAll('attachments')).toEqual([fileOne, fileTwo]);
    expect(body.getAll('attachments[]')).toEqual([]);

    (window as any).XMLHttpRequest = originalXhr;
    (globalThis as any).XMLHttpRequest = originalXhr;
  });

  it('supports custom form-data field names for file uploads', async () => {
    const originalXhr = window.XMLHttpRequest;

    class MockXhr {
      static sentBodies: Array<FormData | File> = [];
      upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 200;
      responseText = JSON.stringify({ uploaded: true });

      open() {}
      setRequestHeader() {}
      getResponseHeader(name: string) {
        return name.toLowerCase() === 'content-type' ? 'application/json' : null;
      }
      send(body: FormData | File) {
        MockXhr.sentBodies.push(body);
        this.onload?.();
      }
    }

    (window as any).XMLHttpRequest = MockXhr;
    (globalThis as any).XMLHttpRequest = MockXhr;
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'upload-custom-field-form',
      title: 'Upload Custom Field Form',
      submit: {
        endpoint: '/api/uploads',
        method: 'POST',
        mode: 'form-data',
        formDataArrayMode: 'repeat',
      },
      fields: [
        {
          name: 'attachments',
          label: 'Attachments',
          type: 'file',
          multiple: true,
          formDataFieldName: 'documents',
        },
      ],
    }) as FormUI;
    const fileOne = new File(['one'], 'one.pdf', { type: 'application/pdf' });
    const fileTwo = new File(['two'], 'two.pdf', { type: 'application/pdf' });

    await element.onSubmit({ attachments: [fileOne, fileTwo] });
    const body = MockXhr.sentBodies[0] as FormData;
    expect(body.getAll('documents')).toEqual([fileOne, fileTwo]);
    expect(body.getAll('attachments')).toEqual([]);

    (window as any).XMLHttpRequest = originalXhr;
    (globalThis as any).XMLHttpRequest = originalXhr;
  });

  it('supports presigned upload flows through the upload runtime', async () => {
    const originalXhr = window.XMLHttpRequest;
    const emittedEvents: string[] = [];

    class MockXhr {
      upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 200;
      responseText = '';

      open() {}
      setRequestHeader() {}
      getResponseHeader() {
        return 'text/plain';
      }
      send() {
        this.upload.onprogress?.({
          lengthComputable: true,
          loaded: 100,
          total: 100,
        } as ProgressEvent);
        this.onload?.();
      }
    }

    (window as any).XMLHttpRequest = MockXhr;
    (globalThis as any).XMLHttpRequest = MockXhr;

    const fetchMock = vi.spyOn(window, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          uploadUrl: 'https://upload.example.test/file',
          fileUrl: 'https://cdn.example.test/file.pdf',
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ saved: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const runtime = new FormUploadRuntime({
      emitEvent: (eventName) => {
        emittedEvents.push(eventName);
        return true;
      },
    });
    const file = new File(['content'], 'file.pdf', { type: 'application/pdf' });

    await runtime.submit(
      { attachment: file },
      {
        endpoint: 'https://api.example.test/finalize',
        method: 'POST',
        mode: 'form-data',
        uploadStrategy: 'presigned',
        presignEndpoint: 'https://api.example.test/presign',
      },
      {
        attachment: {
          name: 'attachment',
          label: 'Attachment',
          type: 'file',
        },
      },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(emittedEvents).toContain('form-ui:upload-start');
    expect(emittedEvents).toContain('form-ui:upload-progress');
    expect(emittedEvents).toContain('form-ui:upload-complete');

    const presignRequest = fetchMock.mock.calls[0][1] as RequestInit;
    expect(presignRequest.body).toBe(JSON.stringify({
      fieldName: 'attachment',
      fileName: 'file.pdf',
      contentType: 'application/pdf',
      size: file.size,
    }));

    const finalizeRequest = fetchMock.mock.calls[1][1] as RequestInit;
    const finalizeBody = finalizeRequest.body as FormData;
    expect(finalizeBody.get('attachment')).toBe('https://cdn.example.test/file.pdf');

    (window as any).XMLHttpRequest = originalXhr;
    (globalThis as any).XMLHttpRequest = originalXhr;
  });

  it('disables offline queue for forms that include file fields', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'queued-upload-form',
      title: 'Queued Upload Form',
      submit: {
        endpoint: '/api/uploads',
        method: 'POST',
        mode: 'form-data',
      },
      storage: {
        mode: 'draft-and-queue',
        adapter: 'local-storage',
        key: 'xpressui:queued-upload-form',
        autoSaveMs: 0,
      },
      fields: [
        {
          name: 'attachment',
          label: 'Attachment',
          type: 'file',
        },
      ],
    }) as FormUI;
    const onQueueDisabled = vi.fn();
    const upload = new File(['content'], 'proof.pdf', { type: 'application/pdf' });

    element.addEventListener('form-ui:queue-disabled-for-files', (event) => {
      onQueueDisabled((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    vi.spyOn(element, 'submitToApi').mockRejectedValue(new Error('offline'));

    await element.onSubmit({ attachment: upload });
    expect(onQueueDisabled).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
      }),
    );
    expect(element.getQueueState()).toEqual(
      expect.objectContaining({
        queueLength: 0,
        disabledReason: 'file-uploads-are-not-queued',
      }),
    );
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

  it('preserves submit lifecycle functions in validated form config', () => {
    const preSubmit = vi.fn();
    const postSuccess = vi.fn();

    const formConfig = createFormConfig({
      name: 'lifecycle-config-form',
      title: 'Lifecycle Config Form',
      submit: {
        endpoint: '/api/lifecycle-config',
        lifecycle: {
          preSubmit,
          postSuccess,
        },
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });

    expect(formConfig.submit?.lifecycle?.preSubmit).toBe(preSubmit);
    expect(formConfig.submit?.lifecycle?.postSuccess).toBe(postSuccess);
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
    expect(runtime.getOutputSnapshot()).toEqual({
      amount: {
        rendererType: 'text',
        mediaDisplayPolicy: 'large',
        value: '12.50',
      },
      email: {
        rendererType: 'text',
        mediaDisplayPolicy: 'large',
        value: 'headless@example.com',
      },
    });

    runtime.saveDraft();
    await flushAsyncWork();

    expect(runtime.loadDraftValues()).toEqual(values);
    expect(runtime.getStorageSnapshot().draft).toEqual(values);
    runtime.engine.setDocumentData('passport', {
      text: 'P<UTOERIKSSON',
      mrz: { documentNumber: 'L898902C3' },
      fields: { firstName: 'ANNA MARIA' },
    });
    expect(runtime.buildSubmissionValues(values)).toEqual({
      amount: 12.5,
      email: 'headless@example.com',
    });
    expect(runtime.getDocumentData('passport')).toEqual({
      text: 'P<UTOERIKSSON',
      mrz: { documentNumber: 'L898902C3' },
      fields: { firstName: 'ANNA MARIA' },
    });
    expect(runtime.getAllDocumentData()).toEqual({
      passport: {
        text: 'P<UTOERIKSSON',
        mrz: { documentNumber: 'L898902C3' },
        fields: { firstName: 'ANNA MARIA' },
      },
    });

    values = { amount: '', email: '' };
    expect(Object.keys(runtime.validateValues(values)).length).toBeGreaterThan(0);
  });

  it('can include normalized document data in headless submission values', () => {
    const formConfig = createFormConfig({
      name: 'headless-document-submit-form',
      title: 'Headless Document Submit Form',
      submit: {
        endpoint: '/api/submit',
        includeDocumentData: true,
        documentDataMode: 'summary',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });
    const runtime = new FormRuntime(formConfig);

    (formConfig.sections.main || []).forEach((field) => {
      runtime.setField(field.name, field);
    });
    runtime.engine.setDocumentData('passport', {
      text: 'P<UTOERIKSSON',
      mrz: { documentNumber: 'L898902C3', valid: true },
      fields: { firstName: 'ANNA MARIA' },
    });

    expect(runtime.buildSubmissionValues({ email: 'doc@example.com' })).toEqual({
      email: 'doc@example.com',
      document: {
        field: 'passport',
        mrz: {
          format: undefined,
          documentCode: undefined,
          issuingCountry: undefined,
          documentNumber: 'L898902C3',
          nationality: undefined,
          birthDate: undefined,
          expiryDate: undefined,
          sex: undefined,
          valid: true,
        },
        fields: { firstName: 'ANNA MARIA' },
      },
    });
  });

  it('can whitelist document submission fields in headless submission values', () => {
    const formConfig = createFormConfig({
      name: 'headless-document-submit-filter-form',
      title: 'Headless Document Submit Filter Form',
      submit: {
        endpoint: '/api/submit',
        includeDocumentData: true,
        documentDataMode: 'summary',
        documentFieldPaths: ['mrz.documentNumber', 'mrz.valid', 'fields.firstName'],
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    });
    const runtime = new FormRuntime(formConfig);

    (formConfig.sections.main || []).forEach((field) => {
      runtime.setField(field.name, field);
    });
    runtime.engine.setDocumentData('passport', {
      text: 'P<UTOERIKSSON',
      mrz: { documentNumber: 'L898902C3', valid: true, nationality: 'UTO' },
      fields: { firstName: 'ANNA MARIA', lastName: 'ERIKSSON' },
    });

    expect(runtime.buildSubmissionValues({ email: 'doc@example.com' })).toEqual({
      email: 'doc@example.com',
      document: {
        field: 'passport',
        mrz: {
          documentNumber: 'L898902C3',
          valid: true,
        },
        fields: { firstName: 'ANNA MARIA' },
      },
    });
  });

  it('exposes active template warnings through the composed headless runtime', () => {
    let values: Record<string, any> = {
      firstName: '',
      autoFullName: false,
    };
    const formConfig = createFormConfig({
      name: 'headless-template-warning-form',
      title: 'Headless Template Warning Form',
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
    });
    const runtime = new FormRuntime(formConfig, {
      getValues: () => values,
      dynamic: {
        getFieldContainer: () => null,
        getFieldElement: () => null,
        getFieldValue: (fieldName) => values[fieldName],
        clearFieldValue: (fieldName) => {
          values = { ...values, [fieldName]: undefined };
        },
      },
    });

    (formConfig.sections.main || []).forEach((field) => {
      runtime.setField(field.name, field);
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

    runtime.clearActiveTemplateWarnings();
    expect(runtime.getActiveTemplateWarnings()).toEqual([]);
  });

  it('exposes recently applied rules through the composed headless runtime', () => {
    let values: Record<string, any> = {
      country: '',
    };
    const formConfig = createFormConfig({
      name: 'headless-recent-rules-form',
      title: 'Headless Recent Rules Form',
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
    });
    const runtime = new FormRuntime(formConfig, {
      getValues: () => values,
      dynamic: {
        getFieldContainer: () => null,
        getFieldElement: () => null,
        getFieldValue: (fieldName) => values[fieldName],
        clearFieldValue: (fieldName) => {
          values = { ...values, [fieldName]: undefined };
        },
      },
    });

    (formConfig.sections.main || []).forEach((field) => {
      runtime.setField(field.name, field);
    });

    values = { ...values, country: 'fr' };
    runtime.updateConditionalFields();

    expect(runtime.getRecentAppliedRules()).toEqual([
      {
        id: 'set-currency',
        logic: undefined,
        conditions: [
          { field: 'country', operator: 'equals', value: 'fr' },
        ],
        actions: [
          { type: 'set-value', field: 'currency', value: 'EUR' },
        ],
      },
    ]);

    runtime.clearRecentAppliedRules();
    expect(runtime.getRecentAppliedRules()).toEqual([]);
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
    document.body.appendChild(container);
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
    element.form?.change('service', 'consulting');
    element.updateConditionalFields();
    await element.refreshRemoteOptions('service');
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

    runtime.clearActiveTemplateWarnings();
    expect(runtime.getActiveTemplateWarnings()).toEqual([]);
  });

  it('exposes recently applied rules from the standalone dynamic runtime', () => {
    let values: Record<string, any> = { country: '' };
    const runtime = new FormDynamicRuntime({
      getFieldConfigs: () => [
        { name: 'country', label: 'Country', type: 'text' },
        { name: 'currency', label: 'Currency', type: 'text' },
      ],
      getRules: () => [
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

    values = { ...values, country: 'fr' };
    runtime.updateConditionalFields();

    expect(runtime.getRecentAppliedRules()).toEqual([
      {
        id: 'set-currency',
        logic: undefined,
        conditions: [
          { field: 'country', operator: 'equals', value: 'fr' },
        ],
        actions: [
          { type: 'set-value', field: 'currency', value: 'EUR' },
        ],
      },
    ]);

    runtime.clearRecentAppliedRules();
    expect(runtime.getRecentAppliedRules()).toEqual([]);
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

  it('supports exists and empty rule operators', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'presence-rules-form',
      title: 'Presence Rules Form',
      rules: [
        {
          conditions: [
            { field: 'document_number', operator: 'exists' },
          ],
          actions: [
            { type: 'disable', field: 'review_state' },
          ],
        },
        {
          conditions: [
            { field: 'notes', operator: 'empty' },
          ],
          actions: [
            { type: 'disable', field: 'submit_ready' },
          ],
        },
        {
          conditions: [
            { field: 'notes', operator: 'exists' },
          ],
          actions: [
            { type: 'enable', field: 'submit_ready' },
          ],
        },
      ],
      fields: [
        { name: 'document_number', label: 'Document Number', type: 'text' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
        { name: 'review_state', label: 'Review State', type: 'text' },
        { name: 'submit_ready', label: 'Submit Ready', type: 'text' },
      ],
    }) as FormUI;
    const documentNumber = element.querySelector('#document_number') as HTMLInputElement;
    const notes = element.querySelector('#notes') as HTMLTextAreaElement;
    const reviewState = element.querySelector('#review_state') as HTMLInputElement;
    const submitReady = element.querySelector('#submit_ready') as HTMLInputElement;

    await flushAsyncWork();
    expect(reviewState.disabled).toBe(false);
    expect(submitReady.disabled).toBe(true);

    documentNumber.value = 'L898902C3';
    documentNumber.dispatchEvent(new Event('input', { bubbles: true }));
    notes.value = 'Reviewed';
    notes.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(reviewState.disabled).toBe(true);
    expect(submitReady.disabled).toBe(false);
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

  it('supports hidden setting fields as rule inputs without rendering them in the UI', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'setting-rule-form',
      title: 'Setting Rule Form',
      rules: [
        {
          id: 'apply-default-currency',
          conditions: [
            { field: 'default_currency', operator: 'equals', value: 'EUR' },
          ],
          actions: [
            { type: 'set-value', field: 'currency', value: 'EUR' },
          ],
        },
      ],
      fields: [
        { name: 'default_currency', label: 'Default Currency', type: 'setting', value: 'EUR' } as any,
        { name: 'currency', label: 'Currency', type: 'text' },
      ],
    }) as FormUI;

    await flushAsyncWork();

    const settingField = element.querySelector('#default_currency') as HTMLInputElement;
    expect(settingField).not.toBeNull();
    expect(settingField.style.display).toBe('none');
    expect(element.getFieldValue('default_currency')).toBe('EUR');
    expect((element.querySelector('#currency') as HTMLInputElement).value).toBe('EUR');
  });

  it('supports numeric setting values in rule conditions', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'setting-numeric-rule-form',
      title: 'Setting Numeric Rule Form',
      rules: [
        {
          id: 'apply-fast-shipping',
          conditions: [
            { field: 'free_shipping_threshold', operator: 'gt', value: 100 },
          ],
          actions: [
            { type: 'set-value', field: 'shipping_mode', value: 'express' },
          ],
        },
      ],
      fields: [
        { name: 'free_shipping_threshold', label: 'Free Shipping Threshold', type: 'setting', value: 120 } as any,
        { name: 'shipping_mode', label: 'Shipping Mode', type: 'text' },
      ],
    }) as FormUI;

    await flushAsyncWork();
    expect(element.getFieldValue('free_shipping_threshold')).toBe(120);
    expect((element.querySelector('#shipping_mode') as HTMLInputElement).value).toBe('express');
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

  it('supports set-error and lock-submit rule actions', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'set-error-lock-submit-rules-form',
      title: 'Set Error And Lock Submit Rules Form',
      rules: [
        {
          conditions: [
            { field: 'email', operator: 'contains', value: 'blocked' },
          ],
          actions: [
            { type: 'set-error', field: 'email', message: 'This email is not allowed.' },
            { type: 'lock-submit', field: 'submit', message: 'Resolve the blocked email first.' },
          ],
        },
      ],
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    }) as FormUI;
    const email = element.querySelector('#email') as HTMLInputElement;
    const error = element.querySelector('#email_error') as HTMLSpanElement;
    const submitButton = element.querySelector('button[type="submit"]') as HTMLButtonElement;
    const form = element.querySelector('#set-error-lock-submit-rules-form_form') as HTMLFormElement;
    const onSubmitLocked = vi.fn();
    const onSubmitSuccess = vi.fn();

    element.addEventListener('form-ui:submit-locked', (event) => {
      onSubmitLocked((event as CustomEvent<TFormUISubmitDetail>).detail);
    });
    element.addEventListener('form-ui:submit-success', (event) => {
      onSubmitSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    email.value = 'blocked@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(error.textContent).toBe('This email is not allowed.');
    expect(error.style.display).toBe('block');
    expect(submitButton.disabled).toBe(true);
    expect(submitButton.title).toBe('Resolve the blocked email first.');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(onSubmitLocked).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          message: 'Resolve the blocked email first.',
        },
      })
    );
    expect(onSubmitSuccess).not.toHaveBeenCalled();

    email.value = 'ok@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(error.textContent).toBe('');
    expect(error.style.display).toBe('none');
    expect(submitButton.disabled).toBe(false);
    expect(submitButton.title).toBe('');
  });

  it('supports emit-event rule actions', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'emit-event-rules-form',
      title: 'Emit Event Rules Form',
      rules: [
        {
          id: 'emit-review-event',
          conditions: [
            { field: 'status', operator: 'equals', value: 'review' },
          ],
          actions: [
            {
              type: 'emit-event',
              field: 'form-ui:custom-review',
              template: 'Review requested for {{email}}',
            },
          ],
        },
      ],
      fields: [
        { name: 'status', label: 'Status', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
      ],
    }) as FormUI;
    const status = element.querySelector('#status') as HTMLInputElement;
    const email = element.querySelector('#email') as HTMLInputElement;
    const onCustomReview = vi.fn();

    element.addEventListener('form-ui:custom-review', (event) => {
      onCustomReview((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    email.value = 'review@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    status.value = 'review';
    status.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    expect(onCustomReview).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          ruleId: 'emit-review-event',
          action: 'emit-event',
          eventName: 'form-ui:custom-review',
          payload: 'Review requested for review@example.com',
        }),
      }),
    );
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

  it('emits standardized provider messages when a provider returns messages', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        status: 'accepted',
        messages: ['Webhook accepted', 'Processing asynchronously'],
        nextActions: ['refresh-status', { type: 'poll', delayMs: 2000 }],
        data: {
          webhookId: 'wh_123',
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'webhook-messages-form',
      title: 'Webhook Messages Form',
      provider: {
        type: 'webhook',
        endpoint: 'https://api.example.test/webhooks/messages',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;
    const email = element.querySelector('#email') as HTMLInputElement;
    const form = element.querySelector('#webhook-messages-form_form') as HTMLFormElement;
    const onProviderMessages = vi.fn();

    element.addEventListener('form-ui:provider-messages', (event) => {
      onProviderMessages((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    email.value = 'user@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(onProviderMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        providerResult: {
          status: 'accepted',
          transition: null,
          messages: ['Webhook accepted', 'Processing asynchronously'],
          errors: [],
          nextActions: ['refresh-status', { type: 'poll', delayMs: 2000 }],
          data: {
            webhookId: 'wh_123',
          },
        },
        result: {
          status: 'accepted',
          source: 'success',
          messages: ['Webhook accepted', 'Processing asynchronously'],
          nextActions: ['refresh-status', { type: 'poll', delayMs: 2000 }],
        },
      }),
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

  it('supports a calendar booking provider for confirmed slot workflows', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ confirmed: true, bookingId: 'bk_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'calendar-booking-form',
      title: 'Calendar Booking Form',
      provider: {
        type: 'calendar-booking',
        endpoint: 'https://api.example.test/bookings',
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
        {
          name: 'slot',
          label: 'Slot',
          type: 'text',
          required: true,
        },
      ],
    }) as FormUI;
    const service = element.querySelector('#service') as HTMLInputElement;
    const date = element.querySelector('#date') as HTMLInputElement;
    const slot = element.querySelector('#slot') as HTMLInputElement;
    const form = element.querySelector('#calendar-booking-form_form') as HTMLFormElement;
    const onBookingSuccess = vi.fn();

    element.addEventListener('form-ui:calendar-booking-success', (event) => {
      onBookingSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    service.value = 'massage';
    service.dispatchEvent(new Event('input', { bubbles: true }));
    date.value = '2026-03-12';
    date.dispatchEvent(new Event('input', { bubbles: true }));
    slot.value = '10:00';
    slot.dispatchEvent(new Event('input', { bubbles: true }));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/bookings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'calendar-booking',
          booking: {
            service: 'massage',
            date: '2026-03-12',
            slot: '10:00',
          },
        }),
      })
    );
    expect(onBookingSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { confirmed: true, bookingId: 'bk_123' },
      })
    );
  });

  it('applies explicit standardized provider transitions returned by the backend', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          confirmed: true,
          transition: {
            type: 'step',
            target: 'details_step',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    const element = renderFixture(`
      <template id="calendar-transition-form">
        <form
          id="calendar-transition-form_form"
          data-type="multistepform"
          data-name="calendar-transition-form"
          data-label="Calendar Transition Form"
          data-submit-endpoint="https://api.example.test/bookings"
          data-submit-action="calendar-booking"
        >
          <div data-type="section" data-name="details_step" data-label="Details"></div>
          <div
            data-type="section"
            data-name="confirmation_step"
            data-label="Confirmation"
            data-step-summary="true"
          ></div>
          <input
            id="booking_id"
            name="booking_id"
            type="text"
            data-type="text"
            data-name="booking_id"
            data-label="Booking ID"
            data-required="true"
            data-section-name="details_step"
          />
          <span id="booking_id_error"></span>
          <button id="submit_button" type="submit">Submit</button>
        </form>
      </template>
      <form-ui name="calendar-transition-form"></form-ui>
    `);
    const bookingId = element.querySelector('#booking_id') as HTMLInputElement;
    const form = element.querySelector('#calendar-transition-form_form') as HTMLFormElement;
    const onProviderTransition = vi.fn();

    element.addEventListener('form-ui:provider-transition', (event) => {
      onProviderTransition((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    bookingId.value = 'bk_123';
    bookingId.dispatchEvent(new Event('input', { bubbles: true }));
    expect(element.nextStep()).toBe(true);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(element.getCurrentStepName()).toBe('details_step');
    expect(onProviderTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          transition: {
            type: 'step',
            target: 'details_step',
          },
        }),
      }),
    );
  });

  it('routes to a mapped workflow step when a provider returns a workflow transition', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        status: 'pending_approval',
        transition: {
          type: 'workflow',
          state: 'pending_approval',
        },
        data: {
          approvalId: 'apr_123',
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const element = renderFixture(`
      <template id="approval-routing-form">
        <form
          id="approval-routing-form_form"
          data-name="approval-routing-form"
          data-label="Approval Routing Form"
          data-type="multistepform"
          data-version="1"
          data-submit-endpoint="https://api.example.test/approvals"
          data-submit-action="approval-request"
          data-workflow-step-targets='{"pending_approval":"review_step"}'
        >
          <div data-type="section" data-name="request_step" data-label="Request"></div>
          <div data-type="section" data-name="review_step" data-label="Review" data-step-summary="true"></div>
          <input
            id="requester_email"
            name="requester_email"
            type="email"
            data-type="email"
            data-name="requester_email"
            data-label="Requester Email"
            data-required="true"
            data-section-name="request_step"
          />
          <span id="requester_email_error"></span>
          <div
            data-type="output"
            data-name="review_output"
            data-label="Review"
            data-section-name="review_step"
          ></div>
          <button id="submit_button" type="submit">Submit</button>
        </form>
      </template>
      <form-ui name="approval-routing-form"></form-ui>
    `);
    const requesterEmail = element.querySelector('#requester_email') as HTMLInputElement;
    const form = element.querySelector('#approval-routing-form_form') as HTMLFormElement;
    const onProviderTransition = vi.fn();
    const onProviderStepRouted = vi.fn();

    element.addEventListener('form-ui:provider-transition', (event) => {
      onProviderTransition((event as CustomEvent<TFormUISubmitDetail>).detail);
    });
    element.addEventListener('form-ui:provider-step-routed', (event) => {
      onProviderStepRouted((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    requesterEmail.value = 'approver@example.com';
    requesterEmail.dispatchEvent(new Event('input', { bubbles: true }));
    expect(element.nextStep()).toBe(true);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(element.getWorkflowState()).toBe('pending_approval');
    expect(element.getCurrentStepName()).toBe('review_step');
    expect(onProviderStepRouted).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          transition: {
            type: 'workflow',
            state: 'pending_approval',
          },
          stepName: 'review_step',
        }),
      }),
    );
    expect(onProviderTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          transition: {
            type: 'workflow',
            state: 'pending_approval',
          },
          routed: true,
          stepName: 'review_step',
        }),
      }),
    );
  });

  it('applies workflow-only provider routing policy when step and workflow transitions conflict', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        status: 'pending_approval',
        transition: {
          type: 'step',
          target: 'request_step',
        },
        data: {
          approvalId: 'apr_policy_1',
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const element = renderFixture(`
      <template id="approval-routing-policy-form">
        <form
          id="approval-routing-policy-form_form"
          data-name="approval-routing-policy-form"
          data-label="Approval Routing Policy Form"
          data-type="multistepform"
          data-version="1"
          data-submit-endpoint="https://api.example.test/approvals/policy"
          data-submit-action="approval-request"
          data-submit-provider-routing-policy="workflow-only"
          data-workflow-step-targets='{"pending_approval":"review_step"}'
        >
          <div data-type="section" data-name="request_step" data-label="Request"></div>
          <div data-type="section" data-name="review_step" data-label="Review" data-step-summary="true"></div>
          <input
            id="request_email_policy"
            name="request_email_policy"
            type="email"
            data-type="email"
            data-name="request_email_policy"
            data-label="Requester Email"
            data-required="true"
            data-section-name="request_step"
          />
          <span id="request_email_policy_error"></span>
          <button id="submit_button" type="submit">Submit</button>
        </form>
      </template>
      <form-ui name="approval-routing-policy-form"></form-ui>
    `);
    const input = element.querySelector('#request_email_policy') as HTMLInputElement;
    const form = element.querySelector('#approval-routing-policy-form_form') as HTMLFormElement;
    const onProviderTransition = vi.fn();

    element.addEventListener('form-ui:provider-transition', (event) => {
      onProviderTransition((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    input.value = 'policy@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(element.nextStep()).toBe(true);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(element.getWorkflowState()).toBe('pending_approval');
    expect(element.getCurrentStepName()).toBe('review_step');
    expect(onProviderTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          transition: {
            type: 'workflow',
            state: 'pending_approval',
          },
          policy: 'workflow-only',
          stepName: 'review_step',
        }),
      }),
    );
  });

  it('derives workflow routing from provider status when transition is omitted', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        status: 'pending_approval',
        data: {
          approvalId: 'apr_status_only',
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const element = renderFixture(`
      <template id="approval-status-derived-form">
        <form
          id="approval-status-derived-form_form"
          data-name="approval-status-derived-form"
          data-label="Approval Status Derived Form"
          data-type="multistepform"
          data-version="1"
          data-submit-endpoint="https://api.example.test/approvals/status-only"
          data-submit-action="approval-request"
          data-workflow-step-targets='{"pending_approval":"review_step"}'
        >
          <div data-type="section" data-name="request_step" data-label="Request"></div>
          <div data-type="section" data-name="review_step" data-label="Review" data-step-summary="true"></div>
          <input
            id="request_email_derived"
            name="request_email_derived"
            type="email"
            data-type="email"
            data-name="request_email_derived"
            data-label="Requester Email"
            data-required="true"
            data-section-name="request_step"
          />
          <span id="request_email_derived_error"></span>
          <button id="submit_button" type="submit">Submit</button>
        </form>
      </template>
      <form-ui name="approval-status-derived-form"></form-ui>
    `);
    const input = element.querySelector('#request_email_derived') as HTMLInputElement;
    const form = element.querySelector('#approval-status-derived-form_form') as HTMLFormElement;
    const onProviderTransition = vi.fn();

    element.addEventListener('form-ui:provider-transition', (event) => {
      onProviderTransition((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    input.value = 'derived@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(element.nextStep()).toBe(true);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(element.getWorkflowState()).toBe('pending_approval');
    expect(element.getCurrentStepName()).toBe('review_step');
    expect(onProviderTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        providerResult: expect.objectContaining({
          status: 'pending_approval',
          transition: {
            type: 'workflow',
            state: 'pending_approval',
          },
        }),
      }),
    );
  });

  it('supports a calendar cancel provider for cancellation workflows', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ cancelled: true, bookingId: 'bk_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'calendar-cancel-form',
      title: 'Calendar Cancel Form',
      provider: {
        type: 'calendar-cancel',
        endpoint: 'https://api.example.test/bookings/cancel',
      },
      fields: [
        {
          name: 'booking_id',
          label: 'Booking ID',
          type: 'text',
          required: true,
        },
        {
          name: 'reason',
          label: 'Reason',
          type: 'text',
        },
      ],
    }) as FormUI;
    const bookingId = element.querySelector('#booking_id') as HTMLInputElement;
    const reason = element.querySelector('#reason') as HTMLInputElement;
    const form = element.querySelector('#calendar-cancel-form_form') as HTMLFormElement;
    const onCancelSuccess = vi.fn();

    element.addEventListener('form-ui:calendar-cancel-success', (event) => {
      onCancelSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    bookingId.value = 'bk_123';
    bookingId.dispatchEvent(new Event('input', { bubbles: true }));
    reason.value = 'User requested change';
    reason.dispatchEvent(new Event('input', { bubbles: true }));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/bookings/cancel',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'calendar-cancel',
          cancellation: {
            booking_id: 'bk_123',
            reason: 'User requested change',
          },
        }),
      })
    );
    expect(onCancelSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { cancelled: true, bookingId: 'bk_123' },
      })
    );
  });

  it('supports a calendar reschedule provider for slot changes', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ rescheduled: true, bookingId: 'bk_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'calendar-reschedule-form',
      title: 'Calendar Reschedule Form',
      provider: {
        type: 'calendar-reschedule',
        endpoint: 'https://api.example.test/bookings/reschedule',
      },
      fields: [
        {
          name: 'booking_id',
          label: 'Booking ID',
          type: 'text',
          required: true,
        },
        {
          name: 'new_date',
          label: 'New Date',
          type: 'date',
          required: true,
        },
        {
          name: 'new_slot',
          label: 'New Slot',
          type: 'text',
          required: true,
        },
      ],
    }) as FormUI;
    const bookingId = element.querySelector('#booking_id') as HTMLInputElement;
    const newDate = element.querySelector('#new_date') as HTMLInputElement;
    const newSlot = element.querySelector('#new_slot') as HTMLInputElement;
    const form = element.querySelector('#calendar-reschedule-form_form') as HTMLFormElement;
    const onRescheduleSuccess = vi.fn();

    element.addEventListener('form-ui:calendar-reschedule-success', (event) => {
      onRescheduleSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    bookingId.value = 'bk_123';
    bookingId.dispatchEvent(new Event('input', { bubbles: true }));
    newDate.value = '2026-03-18';
    newDate.dispatchEvent(new Event('input', { bubbles: true }));
    newSlot.value = '14:00';
    newSlot.dispatchEvent(new Event('input', { bubbles: true }));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/bookings/reschedule',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'calendar-reschedule',
          reschedule: {
            booking_id: 'bk_123',
            new_date: '2026-03-18',
            new_slot: '14:00',
          },
        }),
      })
    );
    expect(onRescheduleSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { rescheduled: true, bookingId: 'bk_123' },
      })
    );
  });

  it('supports an approval-request provider and emits pending approval events', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        status: 'pending_approval',
        transition: {
          type: 'workflow',
          state: 'pending_approval',
        },
        messages: ['Waiting for manager approval'],
        errors: [],
        data: {
          approvalId: 'apr_123',
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'approval-request-form',
      title: 'Approval Request Form',
      provider: {
        type: 'approval-request',
        endpoint: 'https://api.example.test/approvals',
      },
      fields: [
        {
          name: 'requester_email',
          label: 'Requester Email',
          type: 'email',
          required: true,
        },
        {
          name: 'amount',
          label: 'Amount',
          type: 'number',
          required: true,
        },
      ],
    }) as FormUI;
    const requesterEmail = element.querySelector('#requester_email') as HTMLInputElement;
    const amount = element.querySelector('#amount') as HTMLInputElement;
    const form = element.querySelector('#approval-request-form_form') as HTMLFormElement;
    const onApprovalRequested = vi.fn();

    element.addEventListener('form-ui:approval-requested', (event) => {
      onApprovalRequested((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    requesterEmail.value = 'approver@example.com';
    requesterEmail.dispatchEvent(new Event('input', { bubbles: true }));
    amount.value = '250';
    amount.dispatchEvent(new Event('input', { bubbles: true }));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/approvals',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'approval-request',
          approval: {
            requester_email: 'approver@example.com',
            amount: 250,
          },
        }),
      })
    );
    expect(onApprovalRequested).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          status: 'pending_approval',
          transition: {
            type: 'workflow',
            state: 'pending_approval',
          },
          messages: ['Waiting for manager approval'],
          errors: [],
          data: {
            approvalId: 'apr_123',
          },
        },
        providerResult: {
          status: 'pending_approval',
          transition: {
            type: 'workflow',
            state: 'pending_approval',
          },
          messages: ['Waiting for manager approval'],
          errors: [],
          data: {
            approvalId: 'apr_123',
          },
        },
      })
    );
  });

  it('emits approval-complete when an approval-request response is approved', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'approved', approvalId: 'apr_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'approval-complete-form',
      title: 'Approval Complete Form',
      provider: {
        type: 'approval-request',
        endpoint: 'https://api.example.test/approvals',
      },
      fields: [
        {
          name: 'request_id',
          label: 'Request ID',
          type: 'text',
          required: true,
        },
      ],
    }) as FormUI;
    const requestId = element.querySelector('#request_id') as HTMLInputElement;
    const form = element.querySelector('#approval-complete-form_form') as HTMLFormElement;
    const onApprovalComplete = vi.fn();

    element.addEventListener('form-ui:approval-complete', (event) => {
      onApprovalComplete((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    requestId.value = 'req_123';
    requestId.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(onApprovalComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { status: 'approved', approvalId: 'apr_123' },
      })
    );
    expect(element.getApprovalState()).toEqual(
      expect.objectContaining({
        status: 'approved',
        approvalId: 'apr_123',
        result: { status: 'approved', approvalId: 'apr_123' },
        providerResult: {
          status: 'approved',
          transition: {
            type: 'workflow',
            state: 'approved',
          },
          messages: [],
          errors: [],
          data: {
            approvalId: 'apr_123',
          },
        },
      })
    );
  });

  it('supports an approval-decision provider and emits approval state updates', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'completed', approvalId: 'apr_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'approval-decision-form',
      title: 'Approval Decision Form',
      provider: {
        type: 'approval-decision',
        endpoint: 'https://api.example.test/approvals/decision',
      },
      fields: [
        {
          name: 'approval_id',
          label: 'Approval ID',
          type: 'text',
          required: true,
        },
        {
          name: 'decision',
          label: 'Decision',
          type: 'text',
          required: true,
        },
      ],
    }) as FormUI;
    const approvalId = element.querySelector('#approval_id') as HTMLInputElement;
    const decision = element.querySelector('#decision') as HTMLInputElement;
    const form = element.querySelector('#approval-decision-form_form') as HTMLFormElement;
    const onApprovalState = vi.fn();

    element.addEventListener('form-ui:approval-state', (event) => {
      onApprovalState((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    approvalId.value = 'apr_123';
    approvalId.dispatchEvent(new Event('input', { bubbles: true }));
    decision.value = 'approved';
    decision.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/approvals/decision',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'approval-decision',
          decision: {
            approval_id: 'apr_123',
            decision: 'approved',
          },
        }),
      })
    );
    expect(onApprovalState).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          status: 'completed',
          approvalId: 'apr_123',
          result: { status: 'completed', approvalId: 'apr_123' },
          providerResult: {
            status: 'completed',
            transition: {
              type: 'workflow',
              state: 'completed',
            },
            messages: [],
            errors: [],
            data: {
              approvalId: 'apr_123',
            },
          },
        }),
      })
    );
    expect(element.getApprovalState()).toEqual(
      expect.objectContaining({
        status: 'completed',
        approvalId: 'apr_123',
        result: { status: 'completed', approvalId: 'apr_123' },
        providerResult: {
          status: 'completed',
          transition: {
            type: 'workflow',
            state: 'completed',
          },
          messages: [],
          errors: [],
          data: {
            approvalId: 'apr_123',
          },
        },
      })
    );
  });

  it('supports an approval-comment provider for audit trail messages', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ saved: true, commentId: 'cmt_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'approval-comment-form',
      title: 'Approval Comment Form',
      provider: {
        type: 'approval-comment',
        endpoint: 'https://api.example.test/approvals/comment',
      },
      fields: [
        {
          name: 'approval_id',
          label: 'Approval ID',
          type: 'text',
          required: true,
        },
        {
          name: 'comment',
          label: 'Comment',
          type: 'textarea',
          required: true,
        },
      ],
    }) as FormUI;
    const approvalId = element.querySelector('#approval_id') as HTMLInputElement;
    const comment = element.querySelector('#comment') as HTMLTextAreaElement;
    const form = element.querySelector('#approval-comment-form_form') as HTMLFormElement;
    const onCommentSuccess = vi.fn();

    element.addEventListener('form-ui:approval-comment-success', (event) => {
      onCommentSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    approvalId.value = 'apr_123';
    approvalId.dispatchEvent(new Event('input', { bubbles: true }));
    comment.value = 'Approved with note';
    comment.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/approvals/comment',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'approval-comment',
          comment: {
            approval_id: 'apr_123',
            comment: 'Approved with note',
          },
        }),
      })
    );
    expect(onCommentSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { saved: true, commentId: 'cmt_123' },
      })
    );
  });

  it('keeps approval-state fields in sync with the current approval status', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'pending_approval', approvalId: 'apr_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'approval-state-field-form',
      title: 'Approval State Field Form',
      provider: {
        type: 'approval-request',
        endpoint: 'https://api.example.test/approvals',
      },
      fields: [
        {
          name: 'requester_email',
          label: 'Requester Email',
          type: 'email',
          required: true,
        },
        {
          name: 'approval_status',
          label: 'Approval Status',
          type: 'approval-state',
        },
      ],
    }) as FormUI;
    const requesterEmail = element.querySelector('#requester_email') as HTMLInputElement;
    const approvalStatus = element.querySelector('#approval_status') as HTMLInputElement;
    const form = element.querySelector('#approval-state-field-form_form') as HTMLFormElement;

    requesterEmail.value = 'approver@example.com';
    requesterEmail.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(approvalStatus.readOnly).toBe(true);
    expect(approvalStatus.value).toBe('pending_approval');
    expect((element.form?.getState().values || {}).approval_status).toBe('pending_approval');
  });

  it('emits workflow-state updates across a simple approval lifecycle', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'pending_approval', approvalId: 'apr_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'approval-workflow-form',
      title: 'Approval Workflow Form',
      provider: {
        type: 'approval-request',
        endpoint: 'https://api.example.test/approvals',
      },
      fields: [
        {
          name: 'requester_email',
          label: 'Requester Email',
          type: 'email',
          required: true,
        },
      ],
    }) as FormUI;
    const requesterEmail = element.querySelector('#requester_email') as HTMLInputElement;
    const form = element.querySelector('#approval-workflow-form_form') as HTMLFormElement;
    const onWorkflowState = vi.fn();

    element.addEventListener('form-ui:workflow-state', (event) => {
      onWorkflowState((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    requesterEmail.value = 'approver@example.com';
    requesterEmail.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(element.getWorkflowState()).toBe('pending_approval');
    expect(onWorkflowState).toHaveBeenCalledWith(
      expect.objectContaining({
        result: {
          state: 'submitting',
          approvalState: null,
        },
      })
    );
    expect(onWorkflowState).toHaveBeenLastCalledWith(
      expect.objectContaining({
        result: {
          state: 'pending_approval',
          approvalState: expect.objectContaining({
            status: 'pending_approval',
            approvalId: 'apr_123',
            result: { status: 'pending_approval', approvalId: 'apr_123' },
            providerResult: {
              status: 'pending_approval',
              transition: {
                type: 'workflow',
                state: 'pending_approval',
              },
              messages: [],
              errors: [],
              data: {
                approvalId: 'apr_123',
              },
            },
          }),
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

  it('supports a crm provider for lead capture workflows', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ accepted: true, leadId: 'lead_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'crm-form',
      title: 'CRM Form',
      provider: {
        type: 'crm',
        endpoint: 'https://api.example.test/crm/leads',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
        },
        {
          name: 'full_name',
          label: 'Full Name',
          type: 'text',
          required: true,
        },
      ],
    }) as FormUI;
    const email = element.querySelector('#email') as HTMLInputElement;
    const name = element.querySelector('#full_name') as HTMLInputElement;
    const form = element.querySelector('#crm-form_form') as HTMLFormElement;
    const onCrmSuccess = vi.fn();

    element.addEventListener('form-ui:crm-success', (event) => {
      onCrmSuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    email.value = 'lead@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    name.value = 'Alice Prospect';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/crm/leads',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'crm',
          contact: {
            email: 'lead@example.com',
            full_name: 'Alice Prospect',
          },
        }),
      })
    );
    expect(onCrmSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { accepted: true, leadId: 'lead_123' },
      })
    );
  });

  it('supports an identity-verification provider for document workflows', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ verified: true, verificationId: 'idv_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'identity-form',
      title: 'Identity Form',
      provider: {
        type: 'identity-verification',
        endpoint: 'https://api.example.test/identity/verify',
      },
      fields: [
        {
          name: 'document_number',
          label: 'Document Number',
          type: 'text',
          required: true,
        },
        {
          name: 'last_name',
          label: 'Last Name',
          type: 'text',
          required: true,
        },
      ],
    }) as FormUI;
    const documentNumber = element.querySelector('#document_number') as HTMLInputElement;
    const lastName = element.querySelector('#last_name') as HTMLInputElement;
    const form = element.querySelector('#identity-form_form') as HTMLFormElement;
    const onIdentitySuccess = vi.fn();

    element.addEventListener('form-ui:identity-verification-success', (event) => {
      onIdentitySuccess((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    documentNumber.value = 'L898902C3';
    documentNumber.dispatchEvent(new Event('input', { bubbles: true }));
    lastName.value = 'ERIKSSON';
    lastName.dispatchEvent(new Event('input', { bubbles: true }));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/identity/verify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'identity-verification',
          identity: {
            document_number: 'L898902C3',
            last_name: 'ERIKSSON',
          },
        }),
      }),
    );
    expect(onIdentitySuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { verified: true, verificationId: 'idv_123' },
      }),
    );
  });

  it('supports an identity-verification-stripe provider contract', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ verified: true, sessionId: 'vs_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'identity-stripe-form',
      title: 'Identity Stripe Form',
      provider: {
        type: 'identity-verification-stripe',
        endpoint: 'https://api.example.test/identity/stripe',
      },
      fields: [
        {
          name: 'document_number',
          label: 'Document Number',
          type: 'text',
          required: true,
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#document_number') as HTMLInputElement;
    const form = element.querySelector('#identity-stripe-form_form') as HTMLFormElement;

    input.value = 'L898902C3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/identity/stripe',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'identity-verification-stripe',
          identity: {
            document_number: 'L898902C3',
          },
        }),
      }),
    );
  });

  it('can include normalized document data in submitted FormUI payloads', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ saved: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'document-submit-form',
      title: 'Document Submit Form',
      submit: {
        endpoint: 'https://api.example.test/document-submit',
        method: 'POST',
        includeDocumentData: true,
        documentDataMode: 'summary',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;

    element.engine.setDocumentData('passport', {
      text: 'P<UTOERIKSSON',
      mrz: { documentNumber: 'L898902C3', valid: true, nationality: 'UTO' },
      fields: { firstName: 'ANNA MARIA' },
    });

    await element.onSubmit({ email: 'doc@example.com' });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/document-submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'doc@example.com',
          document: {
            field: 'passport',
            mrz: {
              format: undefined,
              documentCode: undefined,
              issuingCountry: undefined,
              documentNumber: 'L898902C3',
              nationality: 'UTO',
              birthDate: undefined,
              expiryDate: undefined,
              sex: undefined,
              valid: true,
            },
            fields: { firstName: 'ANNA MARIA' },
          },
        }),
      }),
    );
  });

  it('can whitelist document submission fields in submitted FormUI payloads', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ saved: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'document-submit-filter-form',
      title: 'Document Submit Filter Form',
      submit: {
        endpoint: 'https://api.example.test/document-submit',
        method: 'POST',
        includeDocumentData: true,
        documentDataMode: 'summary',
        documentFieldPaths: ['mrz.documentNumber', 'mrz.valid', 'fields.firstName'],
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;

    element.engine.setDocumentData('passport', {
      text: 'P<UTOERIKSSON',
      mrz: { documentNumber: 'L898902C3', valid: true, nationality: 'UTO' },
      fields: { firstName: 'ANNA MARIA', lastName: 'ERIKSSON' },
    });

    await element.onSubmit({ email: 'doc@example.com' });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/document-submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'doc@example.com',
          document: {
            field: 'passport',
            mrz: {
              documentNumber: 'L898902C3',
              valid: true,
            },
            fields: { firstName: 'ANNA MARIA' },
          },
        }),
      }),
    );
  });

  it('blocks validation when a document-scan field requires a valid MRZ and the checksum fails', () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'document-validation-form',
      title: 'Document Validation Form',
      fields: [
        {
          name: 'passport',
          label: 'Passport',
          type: 'document-scan',
          requireValidDocumentMrz: true,
        },
      ],
    }) as FormUI;

    element.engine.setDocumentData('passport', {
      mrz: { valid: false },
    });

    expect(element.validateForm({ passport: new File(['x'], 'passport.png', { type: 'image/png' }) })).toEqual({
      passport: expect.objectContaining({
        errorMessage: 'Document scan failed MRZ validation.',
      }),
    });
  });

  it('supports an identity-verification-webhook provider contract', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'identity-webhook-form',
      title: 'Identity Webhook Form',
      provider: {
        type: 'identity-verification-webhook',
        endpoint: 'https://api.example.test/identity/webhook',
      },
      fields: [
        {
          name: 'document_number',
          label: 'Document Number',
          type: 'text',
          required: true,
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#document_number') as HTMLInputElement;
    const form = element.querySelector('#identity-webhook-form_form') as HTMLFormElement;

    input.value = 'L898902C3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushAsyncWork();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/identity/webhook',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'identity-verification-webhook',
          identity: {
            document_number: 'L898902C3',
          },
        }),
      }),
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

  it('normalizes provider-specific error payloads into consistent errors and messages', () => {
    const paymentErrorResult = normalizeProviderResult(
      'payment',
      {
        code: 'payment_failed',
        message: 'Card authorization failed',
        errors: {
          amount: 'Amount is below minimum charge',
        },
      },
      {
        endpoint: 'https://api.example.test/payments',
        action: 'payment',
      },
    );
    expect(paymentErrorResult.messages).toEqual([
      'Card authorization failed',
      'Amount is below minimum charge',
    ]);
    expect(paymentErrorResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'payment',
          code: 'field_error',
          field: 'amount',
          message: 'Amount is below minimum charge',
        }),
        expect.objectContaining({
          source: 'payment',
          code: 'payment_failed',
          message: 'Card authorization failed',
        }),
      ]),
    );

    const approvalErrorResult = normalizeProviderResult(
      'approval-request',
      {
        reason: 'Approver is unavailable',
      },
      {
        endpoint: 'https://api.example.test/approvals',
        action: 'approval-request',
      },
    );
    expect(approvalErrorResult.messages).toEqual(['Approver is unavailable']);
    expect(approvalErrorResult.errors).toEqual([
      expect.objectContaining({
        source: 'approval-request',
        code: 'approval_error',
        message: 'Approver is unavailable',
      }),
    ]);

    const identityErrorResult = normalizeProviderResult(
      'identity-verification',
      {
        verificationErrors: [
          { code: 'mrz_invalid', message: 'MRZ checksum failed', field: 'document_number' },
          'Image quality is too low',
        ],
      },
      {
        endpoint: 'https://api.example.test/identity/verify',
        action: 'identity-verification',
      },
    );
    expect(identityErrorResult.messages).toEqual([
      'MRZ checksum failed',
      'Image quality is too low',
    ]);
    expect(identityErrorResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'identity-verification',
          code: 'mrz_invalid',
          field: 'document_number',
          message: 'MRZ checksum failed',
        }),
        expect.objectContaining({
          source: 'identity-verification',
          code: 'verification_error',
          message: 'Image quality is too low',
        }),
      ]),
    );
  });

  it('validates provider config schemas when provider.config is provided', () => {
    expect(() =>
      createSubmitRequestFromProvider({
        type: 'booking-availability',
        endpoint: 'https://api.example.test/availability',
        config: {
          slotDurationMinutes: 0,
        },
      }),
    ).toThrow('config.slotDurationMinutes must be >= 1');

    expect(
      createSubmitRequestFromProvider({
        type: 'booking-availability',
        endpoint: 'https://api.example.test/availability',
        config: {
          slotDurationMinutes: 15,
          timezone: 'Europe/Paris',
        },
      }),
    ).toEqual({
      endpoint: 'https://api.example.test/availability',
      method: 'POST',
      headers: undefined,
      action: 'booking-availability',
    });

    registerProvider('quote-configured', {
      providerConfigSchema: {
        required: ['channel'],
        properties: {
          channel: { type: 'string', minLength: 1 },
          priority: { type: 'number', minimum: 1 },
        },
        additionalProperties: false,
      },
      buildPayload(values) {
        return {
          action: 'quote-configured',
          quote: values,
        };
      },
    });

    expect(() =>
      createSubmitRequestFromProvider({
        type: 'quote-configured',
        endpoint: 'https://api.example.test/quotes/configured',
      }),
    ).toThrow('provider.config is required');

    expect(() =>
      createSubmitRequestFromProvider({
        type: 'quote-configured',
        endpoint: 'https://api.example.test/quotes/configured',
        config: {
          channel: 'email',
          unsupported: true,
        },
      }),
    ).toThrow('unsupported config.unsupported');

    expect(
      createSubmitRequestFromProvider({
        type: 'quote-configured',
        endpoint: 'https://api.example.test/quotes/configured',
        config: {
          channel: 'email',
          priority: 2,
        },
      }),
    ).toEqual({
      endpoint: 'https://api.example.test/quotes/configured',
      method: 'POST',
      headers: undefined,
      action: 'quote-configured',
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

  it('creates and restores local resume tokens through FormUI', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'resume-form',
      title: 'Resume Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key: 'xpressui:test-resume-form',
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
    const input = element.querySelector('#email') as HTMLInputElement;
    const onResumeRestored = vi.fn();

    element.addEventListener('form-ui:resume-token-restored', (event) => {
      onResumeRestored((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    input.value = 'resume@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    const token = element.createResumeToken();
    expect(typeof token).toBe('string');

    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    const restored = element.restoreFromResumeToken(token as string);

    expect(restored).toEqual({ email: 'resume@example.com' });
    expect((element.querySelector('#email') as HTMLInputElement).value).toBe('resume@example.com');
    expect(onResumeRestored).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { email: 'resume@example.com' },
        result: expect.objectContaining({
          token,
        }),
      }),
    );
  });

  it('creates and restores local resume tokens through the headless runtime', () => {
    let values: Record<string, any> = { email: 'runtime-resume@example.com' };
    const runtime = new FormRuntime(createFormConfig({
      name: 'runtime-resume-form',
      title: 'Runtime Resume Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key: 'xpressui:test-runtime-resume',
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    }), {
      getValues: () => values,
    });

    const token = runtime.createResumeToken();
    expect(typeof token).toBe('string');

    values = {};
    const restored = runtime.restoreFromResumeToken(token as string);

    expect(restored).toEqual({ email: 'runtime-resume@example.com' });
  });

  it('can list and delete local resume tokens, including through the admin helper', async () => {
    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'resume-admin-form',
      title: 'Resume Admin Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key: 'xpressui:test-resume-admin',
        resumeEndpoint: '/api/resume',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#email') as HTMLInputElement;

    input.value = 'admin-resume@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    const token = element.createResumeToken() as string;
    expect(element.listResumeTokens()).toEqual([
      expect.objectContaining({
        token,
        resumeEndpoint: '/api/resume',
      }),
    ]);

    const admin = createLocalFormAdmin(element.formConfig!);
    expect(admin.listResumeTokens()).toEqual([
      expect.objectContaining({
        token,
        resumeEndpoint: '/api/resume',
      }),
    ]);
    expect(admin.deleteResumeToken(token)).toBe(true);
    expect(element.listResumeTokens()).toEqual([]);
  });

  it('expires resume tokens when resumeTokenTtlDays is configured', () => {
    const runtime = new FormRuntime(createFormConfig({
      name: 'resume-ttl-form',
      title: 'Resume TTL Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key: 'xpressui:test-resume-ttl',
        resumeTokenTtlDays: 1,
      },
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
      ],
    }), {
      getValues: () => ({ email: 'ttl@example.com' }),
    });

    const token = runtime.createResumeToken() as string;
    const storageKey = `xpressui:resume:resume-ttl-form:${token}`;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        savedAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
        snapshot: {
          draft: { email: 'expired@example.com' },
          queue: [],
          deadLetter: [],
        },
      }),
    );

    expect(runtime.listResumeTokens()).toEqual([]);
    expect(runtime.restoreFromResumeToken(token)).toBeNull();
    expect(window.localStorage.getItem(storageKey)).toBeNull();
  });

  it('supports remote save and resume flows through resumeEndpoint', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === 'https://api.example.test/resume' && init?.method === 'POST') {
        return new Response(JSON.stringify({ token: 'remote_token_123', savedAt: 123456 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url === 'https://api.example.test/resume?token=remote_token_123' && init?.method === 'GET') {
        return new Response(JSON.stringify({
          token: 'remote_token_123',
          savedAt: 123456,
          snapshot: {
            draft: { email: 'remote-resume@example.com' },
            queue: [],
            deadLetter: [],
          },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url === 'https://api.example.test/resume?token=remote_token_123' && init?.method === 'DELETE') {
        return new Response(null, {
          status: 204,
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'remote-resume-form',
      title: 'Remote Resume Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key: 'xpressui:test-remote-resume',
        resumeEndpoint: 'https://api.example.test/resume',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;
    const input = element.querySelector('#email') as HTMLInputElement;

    input.value = 'remote-resume@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    const token = await element.createResumeTokenAsync();
    expect(token).toBe('remote_token_123');
    expect(element.listResumeTokens()).toEqual([
      {
        token: 'remote_token_123',
        savedAt: 123456,
        expired: false,
        resumeEndpoint: 'https://api.example.test/resume',
        remote: true,
      },
    ]);

    const lookup = await element.lookupResumeToken('remote_token_123');
    expect(lookup).toEqual({
      token: 'remote_token_123',
      savedAt: 123456,
      expired: false,
      resumeEndpoint: 'https://api.example.test/resume',
      remote: true,
      snapshot: {
        draft: { email: 'remote-resume@example.com' },
        queue: [],
        deadLetter: [],
      },
    });

    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    const restored = await element.restoreFromResumeTokenAsync('remote_token_123');
    expect(restored).toEqual({ email: 'remote-resume@example.com' });
    expect((element.querySelector('#email') as HTMLInputElement).value).toBe('remote-resume@example.com');
    await expect(element.invalidateResumeToken('remote_token_123')).resolves.toBe(true);
    expect(element.listResumeTokens()).toEqual([]);

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/resume',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    const createCall = fetchSpy.mock.calls.find(
      ([url, init]) => String(url) === 'https://api.example.test/resume' && init?.method === 'POST',
    );
    expect(createCall).toBeDefined();
    const createBody = JSON.parse(String(createCall?.[1]?.body || '{}'));
    expect(createBody).toEqual(
      expect.objectContaining({
        operation: 'create',
        formName: 'remote-resume-form',
      }),
    );
    expect(createBody.snapshot).toEqual(
      expect.objectContaining({
        draft: { email: 'remote-resume@example.com' },
      }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/resume?token=remote_token_123',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/resume?token=remote_token_123',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });

  it('supports the formal remote resume contract for lookup and invalidate responses', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === 'https://api.example.test/resume' && init?.method === 'POST') {
        return new Response(JSON.stringify({
          operation: 'create',
          token: 'remote_token_contract',
          savedAt: 7890,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url === 'https://api.example.test/resume?token=missing_token' && init?.method === 'GET') {
        return new Response(JSON.stringify({
          operation: 'lookup',
          token: 'missing_token',
          found: false,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url === 'https://api.example.test/resume?token=remote_token_contract' && init?.method === 'DELETE') {
        return new Response(JSON.stringify({
          operation: 'invalidate',
          token: 'remote_token_contract',
          invalidated: false,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const container = document.createElement('div');
    const element = mountFormUI(container, {
      name: 'remote-resume-contract-form',
      title: 'Remote Resume Contract Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key: 'xpressui:test-remote-resume-contract',
        resumeEndpoint: 'https://api.example.test/resume',
      },
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
        },
      ],
    }) as FormUI;

    const input = element.querySelector('#email') as HTMLInputElement;
    input.value = 'contract@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flushAsyncWork();

    await expect(element.createResumeTokenAsync()).resolves.toBe('remote_token_contract');
    await expect(element.lookupResumeToken('missing_token')).resolves.toBeNull();
    await expect(element.invalidateResumeToken('remote_token_contract')).resolves.toBe(false);
    expect(element.listResumeTokens()).toEqual([
      expect.objectContaining({
        token: 'remote_token_contract',
        remote: true,
      }),
    ]);

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/resume?token=missing_token',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.test/resume?token=remote_token_contract',
      expect.objectContaining({
        method: 'DELETE',
      }),
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

  it('exposes async snapshot hydration on the local admin API', async () => {
    const formConfig = createFormConfig({
      name: 'admin-async-form',
      title: 'Admin Async Form',
      storage: {
        mode: 'draft',
        adapter: 'local-storage',
        key: 'xpressui:test-admin-async',
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

    window.localStorage.setItem('xpressui:test-admin-async', JSON.stringify({ email: 'async@example.com' }));

    await expect(admin.getSnapshotAsync()).resolves.toEqual(
      expect.objectContaining({
        draft: { email: 'async@example.com' },
      }),
    );
    await expect(admin.exportSnapshotAsync()).resolves.toEqual(
      expect.objectContaining({
        draft: { email: 'async@example.com' },
      }),
    );
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
