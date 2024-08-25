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

const CHOICEGROUP_FORM_CONFIG: TFormConfig ={
  "label": "HelloWorld",
  "uid": "rSjDHThhZ6dJ7lK3Mr5UCZdLaUv1",
  "type": "webapp",
  "name": "hello-world",
  "id": "snwkd619yXH5FX7ReqZL9X",
  "timestamp": 1724371019,
  "sections": {
    "call2action-group": [
      {
        "label": "Acheter",
        "type": "call2action",
        "linkPath": "bswHHfSrPL5nHmHqZeMwb4",
        "name": "acheter",
        "linkType": "view-page"
      }
    ],
    "hero": [
      {
        "label": "a666",
        "type": "html",
        "name": "a_666"
      },
      {
        "type": "link",
        "label": "Acheter",
        "name": "acheter",
        "linkType": "view-page",
        "linkPath": "bswHHfSrPL5nHmHqZeMwb4"
      }
    ],
    "custom": [
      {
        "subType": "header-title",
        "label": "Header Title",
        "logo": "https://storage.googleapis.com/joosorolstore.appspot.com/static/rSjDHThhZ6dJ7lK3Mr5UCZdLaUv1/p2yjnGwb1mR9zXHB8jm7WG-large.jpeg",
        "type": "section",
        "isAdminField": true,
        "name": "header-title",
        "adminLabel": "Header Title"
      },
      {
        "name": "header-nav",
        "label": "Header Menu",
        "adminLabel": "Header Menu",
        "isAdminField": true,
        "type": "section",
        "subType": "header-nav"
      },
      {
        "type": "section",
        "subType": "hero",
        "name": "hero",
        "adminLabel": "Hero Section",
        "label": "Hero Section",
        "isAdminField": true,
        "hero": "https://storage.googleapis.com/joosorolstore.appspot.com/static/rSjDHThhZ6dJ7lK3Mr5UCZdLaUv1/kZTAgAVHamwQiH2qzaxuQV-large.jpeg"
      }
    ],
    "global": [
      {
        "name": "formsubmit",
        "canDelete": false,
        "label": "Actions",
        "isAdminField": true,
        "type": "section",
        "subType": "formsubmit",
        "adminLabel": "Actions"
      }
    ],
    "header-nav": [
      {
        "label": "Home",
        "name": "acheter",
        "type": "link",
        "linkType": "view-page",
        "linkPath": "5qzjT5Dhq6AXxsdQirEYZN"
      },
      {
        "type": "link",
        "name": "nav_1",
        "label": "Nav1"
      },
      {
        "type": "link",
        "name": "nav_2",
        "label": "Nav 2"
      },
      {
        "type": "link",
        "name": "nav_3",
        "label": "Nav 3"
      }
    ],
    "formsubmit": [
      {
        "adminLabel": "Button Group",
        "label": "Button Group",
        "type": "btn-group",
        "name": "btnGroup",
        "canDelete": false
      },
      {
        "adminLabel": "Submit button",
        "canDelete": false,
        "type": "submit",
        "name": "submitBtn",
        "label": "Submit"
      }
    ],
    "nav": [
      {
        "name": "visiter",
        "linkType": "view-page",
        "type": "link",
        "linkPath": "bswHHfSrPL5nHmHqZeMwb4",
        "label": "Visiter"
      }
    ]
  }
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