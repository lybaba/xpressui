# xpress-ui

> XPressUI Frontend Post UI Components

Build Form UI and Online-Store UI (aka PostUI)  from a Json Configuration File.
Just declare your Post UI as a Json Object and XPressUI will take the rest.
- Generate the Post UI
- Handle the Post UI internals ( form validation, navigation, and post data to your backend server)

[![NPM](https://img.shields.io/npm/v/postui.svg)](https://www.npmjs.com/package/postui) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Node version used
nvm install 20.19.0
nvm use 20.19.0

## Install

```bash
npm install --save @lybaba/xpressui
```

## Usage

```tsx
import { ThemeProvider } from '@mui/joy/styles';
import theme from './styles/default';
import PostUIProvider from './components/postui/PostUIProvider';
import TPostUIEvent, { TPostUIEventType } from 'src/common/TPostUIEvent';
import TServerResponse from 'src/common/TServerResponse';
import PostUI from './components/postui/PostUI';
import TPostConfig from './common/TPostConfig';

const MULTI_STEP_FORM_CONFIG: TPostConfig = {
  "uid": "user123",
  "id": "123",
  "type": "multistepform",
  "name": "multi-step-form",
  "label": "MultiStep Form",
  "submitBtnLabel": "Submit",
  "prevBtnLabel": "Previous",
  "nextBtnLabel": "Next",
  "backendController": "controller.php",
  "successMsg": "Form successfully submited.",
  "errorMsg": "Submission failed.",
  "sections": {
      "main": [
          {
              "name": "step_1",
              "label": "Step 1",
              "type": "section",
          },
          {
              "name": "step_2",
              "label": "Step 2",
              "type": "section",
          },
          {
              "name": "step_3",
              "label": "Step 3",
              "type": "section",
          }
      ],
      "step_1": [
          {
              "label": "Email",
              "type": "email",
              "required": true,
              "name": "email"
          }
      ],
      "step_2": [
          {
              "label": "Nom",
              "type": "text",
              "required": true,
              "name": "nom"
          }
      ],
      "step_3": [
          {
              "label": "Message",
              "type": "textarea",
              "required": true,
              "name": "message"
          }
      ],
  }
}


// callback for sending data to server.  
async function onPostUIEvent(event: TPostUIEvent): Promise<TServerResponse> {

  console.log("PostUIPage____onPostUIEvent : ", event);

  // add logic to post the data (event.data) to the server
  if (event.eventType === TPostUIEventType.SubmitFormEvent) {
    const response = await fetch(event.frontend.postConfig.backendController, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event.data), 
    });

    const {
      errorMsg = 'Submission failed.',
      successMsg = 'Form has been successfully submitted.'
    } = event.frontend.postConfig;

    if (!response.ok) {
      const serverRes: TServerResponse = {
        success: false,
        message: errorMsg,
        statusCode: response.status
      };

      return serverRes;
    }
    const data = response.json();
    const serverRes: TServerResponse = {
      success: true,
      message: successMsg,
      data
    };

    return serverRes;
  }

  const serverRes: TServerResponse = {
    success: true,
    message: 'success',
  };

  return serverRes;
}

class Example extends Component {
  render() {
    return(
      <PostUIProvider>
        <PostUI postConfig={MULTI_STEP_FORM_CONFIG} onPostUIEvent={onPostUIEvent}/>
      </PostUIProvider>
    )
  }
}
```

## Simpler Form Setup

You can also mount a form from a plain object and either listen to events or
let the component call your API directly.

```ts
import { mountFormUI } from '@lybaba/xpressui';

const container = document.getElementById('app');

if (container) {
  const form = mountFormUI(container, {
    name: 'booking-form',
    title: 'Book a Table',
    submit: {
      endpoint: '/api/bookings',
      method: 'POST',
      action: 'reservation',
    },
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'date', label: 'Date', type: 'datetime', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  });

  form?.addEventListener('form-ui:submit-success', (event) => {
    console.log('Booking created', (event as CustomEvent).detail.result);
  });
}
```

Events emitted by the component:
- `form-ui:submit`
- `form-ui:submit-success`
- `form-ui:submit-error`

## Reservation Provider

If you want a reservation workflow without hand-writing the submit action, use a
provider:

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

This emits:
- `form-ui:reservation-success`

## Dynamic Fields

You can show fields conditionally and load select options from an API:

```ts
mountFormUI(container, {
  name: 'dynamic-booking',
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

This also emits:
- `form-ui:options-loaded`

## License

MIT © [lybaba](https://github.com/lybaba)
