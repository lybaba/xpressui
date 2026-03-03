# Backend Integration Guide

This guide defines practical request and response contracts for the built-in
providers shipped by `@lybaba/xpressui`.

The frontend component can submit directly to your backend and emit events based
on the response. These examples show the payloads your API should accept and the
responses your frontend can rely on.

## General Notes

- Default method is `POST`
- Default payload mode is JSON
- The component emits `form-ui:submit-success` on successful HTTP responses
- The component emits `form-ui:submit-error` on non-2xx responses
- Provider-specific events are emitted in addition to the generic events

## Reservation Provider

Frontend config:

```ts
mountFormUI(container, {
  name: 'reservation-form',
  provider: {
    type: 'reservation',
    endpoint: '/api/reservations',
  },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'date', label: 'Date', type: 'datetime', required: true },
    { name: 'partySize', label: 'Party Size', type: 'number', required: true },
  ],
});
```

Request body:

```json
{
  "action": "reservation",
  "reservation": {
    "email": "user@example.com",
    "date": "2026-03-03 20:00",
    "partySize": 4
  }
}
```

Suggested success response:

```json
{
  "reservationId": "res_123",
  "status": "confirmed",
  "message": "Reservation created"
}
```

Suggested validation failure response:

HTTP status: `422`

```json
{
  "code": "validation_error",
  "message": "Invalid reservation data",
  "errors": {
    "date": "slot_unavailable"
  }
}
```

Frontend events:
- `form-ui:submit-success`
- `form-ui:reservation-success`

## Payment Provider

Frontend config:

```ts
mountFormUI(container, {
  name: 'payment-form',
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

Suggested success response:

```json
{
  "paymentId": "pay_123",
  "status": "authorized",
  "message": "Payment initialized"
}
```

Suggested failure response:

HTTP status: `402`

```json
{
  "code": "payment_failed",
  "message": "Card authorization failed"
}
```

Frontend events:
- `form-ui:submit-success`
- `form-ui:payment-success`
- `form-ui:payment-error`

## Stripe Payment Provider

Use this provider when your backend creates a Stripe PaymentIntent.

Frontend config:

```ts
mountFormUI(container, {
  name: 'stripe-payment-form',
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

Recommended success response:

```json
{
  "clientSecret": "pi_secret_123",
  "paymentIntentId": "pi_123",
  "redirectUrl": "/checkout/complete"
}
```

Recommended failure response:

HTTP status: `400`

```json
{
  "code": "stripe_intent_error",
  "message": "Unable to create payment intent"
}
```

Frontend events:
- `form-ui:submit-success`
- `form-ui:payment-stripe-success`
- `form-ui:payment-stripe-error`

## Dynamic Options Endpoint

For select fields using `optionsEndpoint`, the component performs a `GET` and
expects either:
- a top-level array
- an object with `items`
- an object with `options`

Example frontend config:

```ts
mountFormUI(container, {
  name: 'booking-form',
  fields: [
    {
      name: 'service',
      label: 'Service',
      type: 'select-one',
      choices: [
        { value: 'consulting', label: 'Consulting' },
        { value: 'support', label: 'Support' }
      ]
    },
    {
      name: 'slot',
      label: 'Slot',
      type: 'select-one',
      optionsEndpoint: '/api/slots',
      optionsDependsOn: 'service'
    }
  ]
});
```

Generated request:

```http
GET /api/slots?service=consulting
```

Accepted response shapes:

```json
[
  { "value": "morning", "label": "Morning" },
  { "value": "evening", "label": "Evening" }
]
```

```json
{
  "items": [
    { "value": "morning", "label": "Morning" },
    { "value": "evening", "label": "Evening" }
  ]
}
```

```json
{
  "options": [
    { "id": "morning", "name": "Morning" },
    { "id": "evening", "name": "Evening" }
  ]
}
```

If you use custom keys, set:
- `optionsValueKey`
- `optionsLabelKey`

Frontend event:
- `form-ui:options-loaded`

## Express Example

Minimal Node/Express example:

```ts
import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/reservations', (req, res) => {
  const { reservation } = req.body;
  return res.json({
    reservationId: 'res_123',
    status: 'confirmed',
    reservation,
  });
});

app.post('/api/payments', (req, res) => {
  const { payment } = req.body;
  return res.json({
    paymentId: 'pay_123',
    status: 'authorized',
    payment,
  });
});

app.post('/api/stripe/create-intent', (req, res) => {
  return res.json({
    clientSecret: 'pi_secret_123',
    paymentIntentId: 'pi_123',
    redirectUrl: '/checkout/complete',
  });
});

app.get('/api/slots', (req, res) => {
  const { service } = req.query;
  if (service === 'consulting') {
    return res.json([
      { value: 'morning', label: 'Morning' },
      { value: 'evening', label: 'Evening' },
    ]);
  }

  return res.json([]);
});
```
