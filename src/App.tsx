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
  "uid": "rSjDHThhZ6dJ7lK3Mr5UCZdLaUv1",
  "label": "HelloWorld",
  "timestamp": 1724371019,
  "name": "hello-world",
  "type": "webapp",
  "id": "snwkd619yXH5FX7ReqZL9X",
  "sections": {
    "hero": [
      {
        "type": "html",
        "label": "a666",
        "name": "a_666"
      },
      {
        "type": "link",
        "linkPath": "bswHHfSrPL5nHmHqZeMwb4",
        "name": "acheter",
        "linkType": "view-page",
        "label": "Acheter"
      }
    ],
    "call2action-group": [
      {
        "type": "call2action",
        "label": "Acheter",
        "name": "acheter",
        "linkPath": "bswHHfSrPL5nHmHqZeMwb4",
        "linkType": "view-page"
      }
    ],
    "custom": [
      {
        "type": "section",
        "subType": "header-title",
        "name": "header-title",
        "adminLabel": "Header Title",
        "label": "Header Title",
        "isAdminField": true,
        "logo": "https://storage.googleapis.com/joosorolstore.appspot.com/static/rSjDHThhZ6dJ7lK3Mr5UCZdLaUv1/p2yjnGwb1mR9zXHB8jm7WG-large.jpeg"
      },
      {
        "type": "section",
        "subType": "header-nav",
        "name": "header-nav",
        "adminLabel": "Header Menu",
        "label": "Header Menu",
        "isAdminField": true
      }
    ],
    "global": [
      {
        "isAdminField": true,
        "adminLabel": "Actions",
        "label": "Actions",
        "name": "formsubmit",
        "subType": "formsubmit",
        "type": "section",
        "canDelete": false
      }
    ],
    "formsubmit": [
      {
        "label": "Button Group",
        "name": "btnGroup",
        "canDelete": false,
        "type": "btn-group",
        "adminLabel": "Button Group"
      },
      {
        "canDelete": false,
        "adminLabel": "Submit button",
        "name": "submitBtn",
        "label": "Submit",
        "type": "submit"
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