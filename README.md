# xpress-ui

`@lybaba/xpressui` is a lightweight form engine built around a custom element:
`<form-ui>`.

It helps you:
- define forms from simple JavaScript objects
- validate input with AJV + `final-form`
- submit data to your backend with normalized payloads
- plug in common workflows such as reservation and payment
- build dynamic forms with conditional fields and API-driven select options

This repository currently ships a browser-focused Web Component library. It is
not the old React `PostUI` API shown in earlier versions of the README.

## Current Scope

The public API is centered on:
- `FormUI` (the custom element class)
- `mountFormUI(...)`
- `createFormConfig(...)`
- `createTemplateMarkup(...)`

The recommended path is `mountFormUI(...)`, which lets you mount a form from a
plain object without hand-writing a full HTML template.

## Requirements

- Node.js `20.19.0` or newer

```bash
nvm install 20.19.0
nvm use 20.19.0
```

## Installation

The package is configured for GitHub Packages:

```bash
npm install @lybaba/xpressui
```

If you publish privately through GitHub Packages, make sure your npm registry
and auth are configured for the `@lybaba` scope.

## Quick Start

```ts
import { mountFormUI } from '@lybaba/xpressui';

const container = document.getElementById('app');

if (container) {
  const form = mountFormUI(container, {
    name: 'contact-form',
    title: 'Contact Us',
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  });

  form?.addEventListener('form-ui:submit-success', (event) => {
    console.log('Submitted', (event as CustomEvent).detail.values);
  });
}
```

## Submission Modes

### 1. Manual handling through events

If you do not provide a submit endpoint, the component validates the form and
emits events. Your app decides what to do next.

Events:
- `form-ui:submit`
- `form-ui:submit-success`
- `form-ui:submit-error`

### 2. Direct API submission

Provide a `submit` block and the component will call your backend with `fetch`.

```ts
mountFormUI(container, {
  name: 'booking-form',
  title: 'Book a Table',
  submit: {
    endpoint: '/api/bookings',
    method: 'POST',
  },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'date', label: 'Date', type: 'datetime', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
});
```

Supported submit options:
- `endpoint`
- `method`
- `headers`
- `mode` (`json` or `form-data`)
- `action`

## Built-in Providers

Providers are thin presets on top of `submit`. They normalize payloads so your
backend receives stable request shapes.

### Reservation

```ts
mountFormUI(container, {
  name: 'reservation-form',
  title: 'Reserve',
  provider: {
    type: 'reservation',
    endpoint: '/api/reservations',
  },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'date', label: 'Date', type: 'datetime', required: true },
  ],
});
```

Request body:

```json
{
  "action": "reservation",
  "reservation": {
    "email": "user@example.com",
    "date": "2026-03-03 20:00"
  }
}
```

Extra event:
- `form-ui:reservation-success`

### Payment

```ts
mountFormUI(container, {
  name: 'payment-form',
  title: 'Pay Now',
  provider: {
    type: 'payment',
    endpoint: '/api/payments',
  },
  fields: [
    { name: 'amount', label: 'Amount', type: 'price', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
});
```

Request body:

```json
{
  "action": "payment",
  "payment": {
    "amount": 42.5,
    "email": "buyer@example.com"
  }
}
```

Extra events:
- `form-ui:payment-success`
- `form-ui:payment-error`

### Stripe Payment

Use `payment-stripe` when your backend creates a Stripe PaymentIntent and
returns checkout metadata to the frontend.

```ts
mountFormUI(container, {
  name: 'stripe-payment-form',
  title: 'Pay with Stripe',
  provider: {
    type: 'payment-stripe',
    endpoint: '/api/stripe/create-intent',
  },
  fields: [
    { name: 'amount', label: 'Amount', type: 'price', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
});
```

Request body:

```json
{
  "action": "payment-stripe",
  "payment": {
    "amount": 19.99,
    "email": "stripe@example.com"
  }
}
```

Expected backend response:

```json
{
  "clientSecret": "pi_secret_123",
  "paymentIntentId": "pi_123",
  "redirectUrl": "/checkout/complete"
}
```

Extra events:
- `form-ui:payment-stripe-success`
- `form-ui:payment-stripe-error`

## Dynamic Forms

The component supports two dynamic patterns out of the box:
- conditional visibility
- remote options for select fields

```ts
mountFormUI(container, {
  name: 'dynamic-booking',
  title: 'Dynamic Booking',
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
      optionsEndpoint: '/api/slots',
      optionsDependsOn: 'service',
    },
  ],
});
```

Extra event:
- `form-ui:options-loaded`

## Local Draft Storage

The runtime can persist draft values in the browser with `localStorage`.

```ts
mountFormUI(container, {
  name: 'inspection-form',
  title: 'Inspection',
  storage: {
    mode: 'draft',
    adapter: 'local-storage',
    key: 'xpressui:inspection-draft',
    autoSaveMs: 300,
  },
  fields: [
    { name: 'site', label: 'Site', type: 'text', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
});
```

Current storage support:
- `mode: 'draft'`
- `mode: 'queue'`
- `mode: 'draft-and-queue'`
- `adapter: 'local-storage'`

Draft events:
- `form-ui:draft-saved`
- `form-ui:draft-restored`
- `form-ui:draft-cleared`

Queue events:
- `form-ui:queued`
- `form-ui:queue-state`
- `form-ui:sync-success`
- `form-ui:sync-error`
- `form-ui:dead-lettered`
- `form-ui:dead-letter-cleared`

Runtime inspection helpers:
- `form.getQueueState()`
- `form.getStorageSnapshot()`
- `form.clearDeadLetterQueue()`

The local queue is now stored as a versioned object so it can evolve without
breaking existing drafts:

```json
{
  "version": 1,
  "items": []
}
```

If the same queued submission keeps failing, it is moved to a local
dead-letter queue after 3 failed sync attempts.

## Field Features

Useful field capabilities supported by the current builder:
- `required`
- `placeholder`
- `helpText`
- `choices` for select fields
- `visibleWhenField`
- `visibleWhenEquals`
- `optionsEndpoint`
- `optionsDependsOn`
- `optionsLabelKey`
- `optionsValueKey`

Common field types used today:
- `text`
- `textarea`
- `email`
- `tel`
- `number`
- `price`
- `datetime`
- `select-one`
- `checkbox`

## Events

Core events emitted by `<form-ui>`:
- `form-ui:submit`
- `form-ui:submit-success`
- `form-ui:submit-error`
- `form-ui:options-loaded`
- `form-ui:draft-saved`
- `form-ui:draft-restored`
- `form-ui:draft-cleared`
- `form-ui:queued`
- `form-ui:queue-state`
- `form-ui:sync-success`
- `form-ui:sync-error`
- `form-ui:dead-lettered`
- `form-ui:dead-letter-cleared`

Provider-specific events:
- `form-ui:reservation-success`
- `form-ui:payment-success`
- `form-ui:payment-error`
- `form-ui:payment-stripe-success`
- `form-ui:payment-stripe-error`

Event detail includes:
- `values`
- `formConfig`
- `submit`
- `response` when an API call happened
- `result` when the backend returned data
- `error` on failures

## Advanced Usage

If you need more control, you can generate the HTML template yourself:

```ts
import { createFormConfig, createTemplateMarkup } from '@lybaba/xpressui';

const formConfig = createFormConfig({
  name: 'custom-form',
  title: 'Custom Form',
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
});

const markup = createTemplateMarkup(formConfig);
document.getElementById('app')!.innerHTML = markup;
```

## Development

```bash
npm install
npm run test
npm run check
npm run build
npm run start
```

Project tooling:
- Vite 7
- TypeScript 5
- Tailwind CSS 4
- daisyUI 5
- Vitest

## Backend Contracts

For concrete request and response examples, see:

- [docs/backend-integration.md](/home/lyb/projects/xpressui/docs/backend-integration.md)

## Status

What is stable in the current codebase:
- Web Component rendering
- schema-based validation
- API submission hooks
- reservation, payment, and Stripe-oriented provider flows
- conditional fields and remote select loading
- local draft persistence in the browser
- local offline submission queue

What is not implemented as a full product yet:
- visual form builder UI
- persistent hosted backend
- prebuilt Stripe Elements integration
- auth/session management
- production-ready analytics, audit trail, and admin workflows

## License

MIT © [lybaba](https://github.com/lybaba)
