import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormUI } from '../src/index';

function renderFixture(markup: string): FormUI {
  document.body.innerHTML = markup;
  return document.querySelector('form-ui') as FormUI;
}

describe('FormUI', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
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

  it('submits normalized values for a valid form', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

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

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'alice@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      JSON.stringify({ email: 'alice@example.com' }, undefined, 2)
    );
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
});
