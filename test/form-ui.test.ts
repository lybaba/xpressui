import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createFormConfig,
  FormUI,
  mountFormUI,
  TFormUISubmitDetail,
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
});
