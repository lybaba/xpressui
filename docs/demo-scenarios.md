# Demo Scenario Matrix

This page maps each browser demo to the runtime capabilities and integration
contracts it demonstrates.

## Core Demos

| Demo | Primary Goal | Key Runtime APIs | Key Events |
|---|---|---|---|
| `demos/booking-wizard.html` | Multi-step booking flow | `nextStep`, `previousStep`, `getStepProgress` | `xpressui:step-change`, `xpressui:step-blocked` |
| `demos/multi-step-review.html` | Step summary/review patterns | `getWorkflowSnapshot`, step summary sections | `xpressui:step-change` |
| `demos/approval-workflow.html` | Provider-driven workflow transitions + combined ops panel | provider routing, `setWorkflowState`, `createFormOpsPanel` | `xpressui:workflow-state`, `xpressui:approval-state` |
| `demos/approval-one-page.html` | One-page approval lifecycle | submit lifecycle + provider normalization | `xpressui:approval-complete` |

## Upload, Identity, And Resume

| Demo | Primary Goal | Key Runtime APIs | Key Events |
|---|---|---|---|
| `demos/file-uploads.html` | Multipart upload + validation UX | `submit.mode: form-data`, `uploadStrategy` | `xpressui:upload-start`, `xpressui:upload-progress`, `xpressui:upload-error` |
| `demos/identity-check.html` | Document scan + OCR/MRZ mapping | `document*TargetField`, `includeDocumentData` | `xpressui:document-mrz-detected`, `xpressui:document-fields-populated` |
| `demos/remote-resume-flow.html` | Remote save/resume, share code, combined ops inspection | `createResumeTokenAsync`, `restoreFromResumeTokenAsync`, `claimResumeShareCodeDetail`, `restoreFromShareCodeDetailAsync`, `createResumeStatusPanel`, `createFormOpsPanel`, `createLocalFormAdmin` | `xpressui:resume-token-created`, `xpressui:resume-share-code-claim-state`, `xpressui:resume-share-code-restore-state`, `xpressui:provider-contract-warning` |
Scenario focus:
- switch between `success`, `expired`, `blocked`, `throttled`, `invalid_signature`, and `not_found` directly in the demo UI

## View / Hybrid / Headless

| Demo | Primary Goal | Key Runtime APIs | Key Events |
|---|---|---|---|
| `demos/view-photo-gallery.html` | Read-only output rendering | `mode="view"`, output renderer registry | `xpressui:output-snapshot` |
| `demos/hybrid-ecommerce.html` | Product list + image gallery + checkout | `mode="hybrid"`, `product-list`, `image-gallery` | cart/gallery modal interactions, `xpressui:submit-success` |
| `demos/quiz-showcase.html` | Quiz field with single/multi/open answers | `quiz`, `minNumOfChoices`, `maxNumOfChoices` | live value updates from quiz card selection |
| `demos/hybrid-output-snapshot.html` | Inspect output snapshot in hybrid mode with ops panel | `getOutputSnapshot`, `createFormOpsPanel` | `xpressui:output-snapshot` |
| `demos/headless-runtime.html` | Runtime without hydration layer | `FormRuntime` APIs only | Host-defined event bridge |

## Provider Transition Sandbox

| Demo | Primary Goal | Key Runtime APIs | Key Events |
|---|---|---|---|
| `demos/provider-transition-flow.html` | Compare workflow/step routing policies | `submit.providerRoutingPolicy`, `resolveProviderTransition` | `xpressui:provider-transition`, `xpressui:workflow-step` |

## Recommended Backend Pairing

- Use [`docs/backend-integration.md`](/home/lyb/projects/xpressui/docs/backend-integration.md) with:
  - `booking-wizard` for reservation contracts
  - `identity-check` for identity/verification contracts
  - `remote-resume-flow` for resume/share-code contracts and local admin/debug inspection
  - `provider-transition-flow` for normalized provider transition payloads
