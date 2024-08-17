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
  "id": "ccCvGhe5NssQzwFmA4nCb8",
  "uid": "fAru4JzmgMpMYRiGjZwnqf",
  "type": "multistepform",
  "label": "Foo",
  "name": "foo",
  "timestamp": 1723574473,
  "sections": {
    "main": [
      {
        "type": "section",
        "label": "Heading",
        "adminLabel": "Heading",
        "name": "heading",
        "canDelete": false,
        "isAdminField": true,
        "cElemProps": "{\"border\": \"1px solid'\"}"
      },
      {
        "type": "section",
        "label": "Footer",
        "adminLabel": "Footer",
        "name": "footer",
        "canDelete": false,
        "isAdminField": true,
        "cElemProps": "{\"bgcolor\": \"neutral.800\", \"p\": 5}",
        "cClasses": "fdsdfdf"
      },
      {
        "label": "Inscription",
        "name": "inscription",
        "type": "section"
      },
      {
        "label": "Paiement",
        "name": "paiement",
        "type": "section"
      }
    ],
    "heading": [
      {
        "type": "image",
        "name": "logo",
        "label": "Logo Image",
        "adminLabel": "Logo Image",
        "canDelete": false
      },
      {
        "type": "image",
        "name": "background",
        "label": "Background Image",
        "adminLabel": "Background Image",
        "canDelete": false,
        "mediaId": "https://images.pexels.com/photos/289268/pexels-photo-289268.jpeg?auto=compress&cs=tinysrgb&w=600"
      },
      {
        "type": "image",
        "name": "header",
        "label": "Banner Image",
        "adminLabel": "Banner Image",
        "canDelete": false
      },
      {
        "type": "image",
        "name": "hero",
        "label": "Hero Image",
        "adminLabel": "Hero Image",
        "canDelete": false
      }
    ],
    "footer": [
      {
        "type": "submit",
        "name": "submitBtn",
        "label": "Envoyer",
        "adminLabel": "Submit",
        "desc": "Hello World",
        "cElemProps": "{\"bgcolor\": \"neutral.800\"}",
        "canDelete": false
      },
      {
        "type": "submit",
        "name": "nextBtn",
        "label": "Suivant",
        "adminLabel": "Next",
        "canDelete": false
      },
      {
        "type": "submit",
        "name": "prevBtn",
        "label": "Précédent",
        "adminLabel": "Previous",
        "canDelete": false
      }
    ],
    "inscription": [
      {
        "label": "Prénom",
        "name": "prenom",
        "type": "text"
      },
      {
        "label": "Nom",
        "name": "nom",
        "type": "text"
      },
      {
        "label": "Age",
        "name": "age",
        "type": "number"
      }
    ],
    "paiement": [
      {
        "label": "Titi",
        "name": "titi",
        "type": "text"
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