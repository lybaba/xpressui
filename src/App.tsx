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
              publicUrl: '/images/new_product.jpg'
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
  "id": "5J3KZP9EnsV3S25jHETDNg",
  "label": "My APP",
  "sections": {
    "section1": [
      {
        "name": "content_1",
        "type": "html",
        "label": "content1sdsd"
      },
      {
        "name": "un_autre_boutton",
        "type": "btn",
        "label": "Un autre bouttonfdfds"
      },
      {
        "name": "i_want_it",
        "label": "I want Itttttttt",
        "type": "btn"
      }
    ],
    "nav": [
      {
        "name": "navMenu",
        "label": "Navigation Menu",
        "type": "navigation-menu",
        "adminLabel": "Navigation Menu",
        "canDelete": false,
        "choices": [
          {
            "id": "5qzjT5Dhq6AXxsdQirEYZN",
            "name": "SuperForm"
          },
          {
            "id": "4kauuE6198mDtSzwSecc4S",
            "name": "FooBar"
          },
          {
            "name": "Produits",
            "id": "bswHHfSrPL5nHmHqZeMwb4"
          },
          {
            "id": "sNx9CSrahaTrDoeagujVRY",
            "name": "Hello"
          }
        ]
      }
    ],
    "global": [
      {
        "isAdminField": true,
        "type": "section",
        "label": "Styles",
        "canDelete": false,
        "adminLabel": "Styles",
        "subType": "body",
        "name": "body"
      },
      {
        "canDelete": false,
        "isAdminField": true,
        "adminLabel": "Navigation Menu",
        "name": "nav",
        "subType": "nav",
        "label": "Navigation Menu",
        "type": "section"
      },
      {
        "type": "section",
        "label": "Buttons",
        "canDelete": false,
        "subType": "formsubmit",
        "adminLabel": "Buttons",
        "name": "formsubmit",
        "isAdminField": true
      }
    ],
    "custom": [
      {
        "canDelete": false,
        "name": "section1",
        "label": "Section 0000",
        "type": "section",
        "hero": "https://storage.googleapis.com/joosorolstore.appspot.com/static/rSjDHThhZ6dJ7lK3Mr5UCZdLaUv1/pqWvNheiqZDRZsUBvA1Xy3-large.jpeg"
      },
      {
        "subType": "section",
        "type": "section",
        "label": "ytry",
        "name": "ytry"
      }
    ],
    "formsubmit": [
      {
        "canDelete": false,
        "label": "Buttons",
        "name": "btnGroup",
        "adminLabel": "Buttons",
        "type": "btn-group"
      },
      {
        "type": "submit",
        "adminLabel": "Submit button",
        "name": "submitBtn",
        "label": "Submit",
        "canDelete": false
      }
    ]
  },
  "name": "my-app",
  "timestamp": 1724093752,
  "type": "webapp",
  "uid": "rSjDHThhZ6dJ7lK3Mr5UCZdLaUv1"
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