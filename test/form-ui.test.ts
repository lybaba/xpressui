import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createLocalFormAdmin,
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
});
