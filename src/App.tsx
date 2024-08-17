import { ThemeProvider } from '@mui/joy/styles';
import theme from './styles/default';
import PostUIProvider from './components/ui/PostUIProvider';
import TPostUIEvent, { TPostUIEventType } from './common/TPostUIEvent';
import TServerResponse from './common/TServerResponse';
import PostUI from './components/ui/PostUI';
import TFormConfig, { CHOICE_FORM_TYPE, RenderingMode } from './common/TFormConfig';
import { Stack } from '@mui/joy';
import TFieldConfig from './common/TFieldConfig';
import { CHECKBOX_TYPE, NUMBER_TYPE, SECTION_TYPE, TEXT_TYPE, UPLOAD_IMAGE_TYPE } from './common/field';

const MULTI_STEP_FORM_CONFIG: TFormConfig = {
  "uid": "user123",
  "id": "123",
  "type": "multistepform",
  "name": "multi-step-form",
  "label": "MultiStep Form",
  "sections": {
      "main": [
        {
          "name": "step_0",
          "label": "Step 0",
          "type": "section",
      },
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
      "step_0": [
        {
            "label": "XPressUI",
            "type": "image-url",
            "name": "xpressui",
            mediaInfo: {
              filePath: '/images/new_product.jpg'
            }
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

// ==================



const NAME: TFieldConfig = { type: TEXT_TYPE, name: 'name', label: "Name", required: true, canEdit: false };
const LABEL: TFieldConfig = { type: TEXT_TYPE, name: 'label', label: "Label", required: true };
const PRICE: TFieldConfig = { type: NUMBER_TYPE, name: 'price', label: "Price" };
const IMG: TFieldConfig = { type: UPLOAD_IMAGE_TYPE, name: 'img', label: "Image" };
const DISABLED: TFieldConfig = { type: CHECKBOX_TYPE, name: 'disabled', label: "Disabled" };

const CHOICE_GROUP_FORM_NAME = 'choicegroup';
const CHOICE_GROUP_FORM_LABEL = 'Choice Group';

const CHOICEGROUP_FORM_CONFIG: TFormConfig = {
  "label": "Hello",
  "uid": "rSjDHThhZ6dJ7lK3Mr5UCZdLaUv1",
  "sections": {
    "hello": [
      {
        "required": true,
        "name": "email",
        "type": "email",
        "label": "Email",
        "canDelete": false
      }
    ],
    "main": [
      {
        "adminLabel": "Form Styling",
        "isAdminField": true,
        "name": "body",
        "type": "section",
        "subType": "body",
        "canDelete": false,
        "label": "Form Styling"
      },
      {
        "type": "section",
        "adminLabel": "Form Submit",
        "subType": "formsubmit",
        "label": "Form Submit",
        "name": "formsubmit",
        "canDelete": false,
        "isAdminField": true
      },
      {
        "label": "Hello",
        "canDelete": false,
        "type": "section",
        "name": "hello"
      }
    ],
    "formsubmit": [
      {
        "label": "Button Group",
        "canDelete": false,
        "type": "btn-group",
        "name": "btnGroup",
        "adminLabel": "Button Group"
      },
      {
        "adminLabel": "Submit",
        "label": "Commander",
        "canDelete": false,
        "type": "submit",
        "name": "submitBtn"
      }
    ]
  },
  "type": "contactform",
  "name": "hello",
  "timestamp": 1723891379,
  "id": "1MoaPuxHL4LToMPWc6u5Ke"
}
// ======================

// callback for sending data to server.  
async function onPostUIEvent(event: TPostUIEvent): Promise<TServerResponse> {

  console.log("PostUIPage____onPostUIEvent : ", event);

  // add logic to post the data (event.data) to the server
  if (event.eventType === TPostUIEventType.SubmitFormEvent) {

  }

  const serverRes: TServerResponse = {
    success: true,
    message: 'success',
  };

  return serverRes;
}


function App() {
  return (
    <ThemeProvider theme={theme}>
      <PostUIProvider>
        <PostUI formConfig={CHOICEGROUP_FORM_CONFIG} onPostUIEvent={onPostUIEvent}/>
      </PostUIProvider>
    </ThemeProvider>
  )
}

export default App;