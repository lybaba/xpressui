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
- `FormRuntime` (the composed headless runtime)
- `mountFormUI(...)`
- `createFormConfig(...)`
- `createTemplateMarkup(...)`

The recommended path is `mountFormUI(...)`, which lets you mount a form from a
plain object without hand-writing a full HTML template.

`FormUI` also exposes `getActiveTemplateWarnings()` for direct inspection of
active template issues on the mounted component.

For storage/debug tooling outside the component instance, use
`createLocalFormAdmin(formConfig)`.

Public API you should treat as stable:
- `mountFormUI(...)`
- `createFormConfig(...)`
- `createTemplateMarkup(...)`
- `FormUI`
- `FormRuntime`
- `createLocalFormAdmin(...)`
- public schema helpers (`validatePublicFormConfig`, `migratePublicFormConfig`)

Advanced building blocks available but better treated as lower-level/internal:
- `FormEngineRuntime`
- `FormDynamicRuntime`
- `FormPersistenceRuntime`
- `provider-registry` helpers
- `form-submit` internals

If you work directly with `FormDynamicRuntime`, you can also inspect current
template issues through `getActiveTemplateWarnings()`.

For lightweight event inspection in the browser, you can also use
`attachFormDebugObserver(...)`.

The public form contract is now versioned.
Current public schema version:
- `1`

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

## Headless Runtime

If you do not want to mount `<form-ui>`, use `FormRuntime` directly. It
combines validation, normalization, local persistence, and optional dynamic
field behavior behind a single headless API.

```ts
import { createFormConfig, FormRuntime } from '@lybaba/xpressui';

const values = {
  amount: '42.50',
  email: 'buyer@example.com',
};

const formConfig = createFormConfig({
  name: 'headless-payment',
  title: 'Headless Payment',
  storage: {
    mode: 'draft',
    adapter: 'local-storage',
    key: 'xpressui:headless-payment',
    autoSaveMs: 0,
  },
  fields: [
    { name: 'amount', label: 'Amount', type: 'price', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
});

const runtime = new FormRuntime(formConfig, {
  getValues: () => values,
});

for (const field of formConfig.sections.main || []) {
  runtime.setField(field.name, field);
}

const normalized = runtime.normalizeValues(values);
const errors = runtime.validateValues(values);

runtime.saveDraft();
const draft = runtime.loadDraftValues();
```

Main `FormRuntime` methods:
- `setFormConfig(...)`
- `setField(...)`
- `normalizeValues(...)`
- `validateValues(...)`
- `saveDraft()`
- `loadDraftValues()`
- `clearDraft()`
- `getQueueState()`
- `getStorageSnapshot()`
- `flushSubmissionQueue()`
- `getActiveTemplateWarnings()`

If you pass DOM adapters through `dynamic`, the same runtime can also handle:
- `updateConditionalFields()`
- `refreshRemoteOptions()`
- `getActiveTemplateWarnings()`

Public types exported for headless integrations:
- `TFormRuntimeOptions`
- `TFormRuntimePublicApi`
- `TFormRuntimeDynamicAdapters`
- `TFormRuntimeSubmitValues`
- `TFormRuntimeSubmitResult`

## Debug Observer

Use `attachFormDebugObserver(...)` to record `form-ui:*` runtime events without
instrumenting each event manually.

```ts
import { attachFormDebugObserver, mountFormUI } from '@lybaba/xpressui';

const form = mountFormUI(container, {
  name: 'debug-form',
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
});

const observer = form
  ? attachFormDebugObserver(form, { maxEvents: 50 })
  : null;

console.log(observer?.getEvents());
console.log(observer?.getRuleHistory());
console.log(observer?.getTemplateDiagnostics());
console.log(observer?.getActiveTemplateWarnings());
```

The observer API:
- `getEvents()`
- `getRuleHistory()`
- `getTemplateDiagnostics()`
- `getActiveTemplateWarnings()`
- `clear()`
- `clearRuleHistory()`
- `clearTemplateDiagnostics()`
- `detach()`

`getRuleHistory()` returns only `form-ui:rule-applied` events. Use
`clearRuleHistory()` to reset that rule-specific buffer without clearing the
full event log.

`getTemplateDiagnostics()` returns only `form-ui:rule-template-missing-field`
and `form-ui:rule-template-warning-cleared` events.

`getActiveTemplateWarnings()` returns the current active template warning state
without requiring you to keep the latest `form-ui:rule-template-warning-state`
event yourself.

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

### Webhook

Use `webhook` for a generic outbound integration when you want to forward a
normalized payload to another backend endpoint without creating a custom
provider first.

```ts
mountFormUI(container, {
  name: 'webhook-form',
  title: 'Webhook Form',
  provider: {
    type: 'webhook',
    endpoint: '/api/hooks/inbound',
  },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'topic', label: 'Topic', type: 'text', required: true },
  ],
});
```

Request body:

```json
{
  "action": "webhook",
  "data": {
    "email": "hook@example.com",
    "topic": "lead.created"
  }
}
```

Extra events:
- `form-ui:webhook-success`
- `form-ui:webhook-error`

### Booking Availability

Use `booking-availability` when your backend returns available slots, pricing,
or scheduling metadata for a selected service/date combination.

```ts
mountFormUI(container, {
  name: 'availability-form',
  title: 'Availability',
  provider: {
    type: 'booking-availability',
    endpoint: '/api/availability',
  },
  fields: [
    { name: 'service', label: 'Service', type: 'text', required: true },
    { name: 'date', label: 'Date', type: 'date', required: true },
  ],
});
```

Request body:

```json
{
  "action": "booking-availability",
  "availability": {
    "service": "massage",
    "date": "2026-03-10"
  }
}
```

Typical backend response:

```json
{
  "slots": [
    { "value": "09:00", "label": "09:00" },
    { "value": "10:00", "label": "10:00" }
  ]
}
```

Extra events:
- `form-ui:booking-availability-success`
- `form-ui:booking-availability-error`

### Email

Use `email` when your backend exposes a messaging endpoint and you want a
normalized request contract for outbound email workflows.

```ts
mountFormUI(container, {
  name: 'email-form',
  title: 'Email Form',
  provider: {
    type: 'email',
    endpoint: '/api/email/send',
  },
  fields: [
    { name: 'to', label: 'To', type: 'email', required: true },
    { name: 'subject', label: 'Subject', type: 'text', required: true },
  ],
});
```

Request body:

```json
{
  "action": "email",
  "email": {
    "to": "user@example.com",
    "subject": "Welcome"
  }
}
```

Typical backend response:

```json
{
  "delivered": true,
  "messageId": "msg_123"
}
```

Extra events:
- `form-ui:email-success`
- `form-ui:email-error`

## Dynamic Forms

The component supports two dynamic patterns out of the box:
- conditional visibility
- remote options for select fields
- basic rules (`AND` / `OR`, `show`, `hide`, `clear-value`)

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
- `form-ui:rule-applied`
- `form-ui:rule-template-missing-field`
- `form-ui:rule-template-warning-cleared`
- `form-ui:rule-template-warning-state`

You can also define basic rules at the form level:

```ts
mountFormUI(container, {
  name: 'rules-form',
  title: 'Rules',
  rules: [
    {
      id: 'show-notes-for-priority-consulting',
      logic: 'AND',
      conditions: [
        { field: 'service', operator: 'equals', value: 'consulting' },
        { field: 'urgency', operator: 'equals', value: 'high' },
      ],
      actions: [
        { type: 'show', field: 'notes' },
      ],
    },
  ],
  fields: [
    { name: 'service', label: 'Service', type: 'text' },
    { name: 'urgency', label: 'Urgency', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
});
```

Current rule scope:
- optional rule id: `id`
- condition logic: `AND`, `OR`
- condition operators: `equals`, `not_equals`, `contains`, `in`, `gt`, `lt`
- actions: `show`, `hide`, `enable`, `disable`, `clear-value`, `set-value`, `fetch-options`
- `set-value` can use a constant via `value`, copy another field via `sourceField`, or compose multiple fields via `template` (`{{firstName}} {{lastName}}`)
- `set-value` can also transform the written value with `transform`: `copy`, `trim`, `lowercase`, `uppercase`, `slugify`

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
- `form-ui:dead-letter-requeued`
- `form-ui:dead-letter-replayed-success`
- `form-ui:dead-letter-replayed-error`

Runtime inspection helpers:
- `form.getQueueState()`
- `form.getStorageSnapshot()`
- `form.clearDeadLetterQueue()`
- `form.requeueDeadLetterEntry(entryId)`
- `form.replayDeadLetterEntry(entryId)`

Standalone local admin helper:
- `createLocalFormAdmin(formConfig)`

It can inspect and manage local state without a mounted `FormUI` instance:
- `getSnapshot()`
- `exportSnapshot()`
- `importSnapshot(snapshot, mode?)`
- `listQueue(query?)`
- `listDeadLetter(query?)`
- `clearDraft()`
- `clearQueue()`
- `clearDeadLetter()`
- `purgeQueue(query?)`
- `purgeDeadLetter(query?)`
- `requeueDeadLetterEntry(entryId)`
- `requeueDeadLetterEntries(query?)`
- `replayDeadLetterEntry(entryId)`
- `replayDeadLetterEntries(query?)`

Import modes:
- `replace`
- `merge`

Query options:
- `minAttempts`
- `maxAttempts`
- `search`
- `minAgeMs`
- `maxAgeMs`
- `nextAttemptBefore`
- `nextAttemptAfter`
- `errorText`
- `sortBy` (`createdAt`, `updatedAt`, `attempts`, `nextAttemptAt`)
- `sortOrder` (`asc`, `desc`)
- `limit`

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
- `form-ui:rule-applied`
- `form-ui:rule-template-missing-field`
- `form-ui:rule-template-warning-cleared`
- `form-ui:rule-template-warning-state`
- `form-ui:draft-saved`
- `form-ui:draft-restored`
- `form-ui:draft-cleared`
- `form-ui:queued`
- `form-ui:queue-state`
- `form-ui:sync-success`
- `form-ui:sync-error`
- `form-ui:dead-lettered`
- `form-ui:dead-letter-cleared`
- `form-ui:dead-letter-requeued`
- `form-ui:dead-letter-replayed-success`
- `form-ui:dead-letter-replayed-error`

Provider-specific events:
- `form-ui:reservation-success`
- `form-ui:payment-success`
- `form-ui:payment-error`
- `form-ui:payment-stripe-success`
- `form-ui:payment-stripe-error`
- `form-ui:webhook-success`
- `form-ui:webhook-error`
- `form-ui:booking-availability-success`
- `form-ui:booking-availability-error`
- `form-ui:email-success`
- `form-ui:email-error`

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

- [`docs/backend-integration.md`](./docs/backend-integration.md)

## Status

What is stable in the current codebase:
- Web Component rendering
- schema-based validation
- API submission hooks
- reservation, payment, Stripe, webhook, booking-availability, and email provider flows
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
