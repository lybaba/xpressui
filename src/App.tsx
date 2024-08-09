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
  "submitBtnLabel": "Submit",
  "prevBtnLabel": "Previous",
  "nextBtnLabel": "Next",
  "backendController": "controller.php",
  "successMsg": "Form successfully submited.",
  "errorMsg": "Submission failed.",
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
  "errorMsg": "",
  "name": "hello-world",
  "prevBtnLabel": "Previous",
  "id": "6uyeZKccSGgnaX2jQFiar7",
  "submitBtnLabel": "Submit",
  "label": "Hello World",
  "backendController": "controller-sample.php",
  "logo": "",
  "timestamp": 1723029213,
  "background": "",
  "sections": {
    "hello_world": [
      {
        "name": "photo",
        "mediaId": "https://media.istockphoto.com/id/869773236/fr/photo/il-est-%C3%A9pris-de-son-nouveau-jouet.jpg?s=2048x2048&w=is&k=20&c=o_I2F0beKYgrnob9cRS16FijA6UOmM8MHieLEy9fUuA=",
        "label": "Photo",
        "type": "image"
      },
      {
        "required": true,
        "name": "sexe",
        "choices": [
          {
            "label": "Tapha Tine",
            "name": "baaba-maal"
          },
          {
            "label": "Youssou Ndour",
            "name": "youssou-ndour"
          },
          {
            "name": "thione-seck",
            "label": "Thione Seck"
          },
          {
            "name": "gdfg",
            "label": "gdfg"
          },
          {
            "name": "gdfgdfgdfgg",
            "label": "gdfgdfgdfgg"
          },
          {
            "name": "kine-lam",
            "label": "Kiné Lam"
          },
          {
            "label": "Ouza",
            "name": "ouza"
          },
          {
            "name": "doudou",
            "label": "Doudou"
          },
          {
            "label": "Mariam",
            "name": "mariam"
          },
          {
            "name": "tidiane",
            "label": "Tidiane"
          },
          {
            "label": "Néné",
            "name": "nene"
          },
          {
            "label": "coucou",
            "name": "coucou"
          },
          {
            "label": "Kiki",
            "name": "kiki"
          },
          {
            "name": "fdfds",
            "label": "fdfds"
          },
          {
            "name": "fsdf",
            "label": "fsdf"
          },
          {
            "label": "uiuiuyi",
            "name": "uiuiuyi"
          },
          {
            "label": "uyiuyi",
            "name": "uyiuyi"
          },
          {
            "label": "iuyi",
            "name": "iuyi"
          },
          {
            "name": "hfdfdhgfhgf",
            "label": "hfdfdhgfhgf"
          }
        ],
        "label": "Sexe",
        "type": "single-select"
      },
      {
        "required": true,
        "label": "Email",
        "name": "email",
        "type": "email",
        "canDelete": false
      },
      {
        "choices": [
          {
            "label": "Tapha Tine",
            "name": "baaba-maal"
          },
          {
            "label": "Youssou Ndour",
            "name": "youssou-ndour"
          },
          {
            "name": "thione-seck",
            "label": "Thione Seck"
          },
          {
            "name": "kine-lam",
            "label": "Kiné Lam"
          },
          {
            "name": "ouza",
            "label": "Ouza"
          },
          {
            "name": "doudou",
            "label": "Doudou"
          },
          {
            "name": "mariam",
            "label": "Mariam"
          },
          {
            "label": "Tidiane",
            "name": "tidiane"
          },
          {
            "name": "nene",
            "label": "Néné"
          },
          {
            "name": "coucou",
            "label": "coucou"
          },
          {
            "label": "Kiki",
            "name": "kiki"
          },
          {
            "label": "fdfds",
            "name": "fdfds"
          },
          {
            "name": "fsdf",
            "label": "fsdf"
          }
        ],
        "name": "choix",
        "label": "Choix",
        "type": "single-select"
      },
      {
        "name": "chanteurs",
        "type": "single-select",
        "choices": [
          {
            "label": "Tapha Tine",
            "name": "baaba-maal"
          },
          {
            "label": "Youssou Ndour",
            "name": "youssou-ndour"
          },
          {
            "name": "thione-seck",
            "label": "Thione Seck"
          },
          {
            "name": "gdfg",
            "label": "gdfg"
          },
          {
            "label": "gdfgdfgdfgg",
            "name": "gdfgdfgdfgg"
          },
          {
            "name": "kine-lam",
            "label": "Kiné Lam"
          },
          {
            "name": "ouza",
            "label": "Ouza"
          },
          {
            "name": "doudou",
            "label": "Doudou"
          },
          {
            "label": "Mariam",
            "name": "mariam"
          },
          {
            "label": "Tidiane",
            "name": "tidiane"
          },
          {
            "name": "nene",
            "label": "Néné"
          },
          {
            "label": "coucou",
            "name": "coucou"
          },
          {
            "name": "kiki",
            "label": "Kiki"
          },
          {
            "label": "fdfds",
            "name": "fdfds"
          },
          {
            "label": "fsdf",
            "name": "fsdf"
          },
          {
            "name": "fsdfsdfsdfsdfsdffsd",
            "label": "fsdfsdfsdfsdfsdffsd"
          },
          {
            "label": "jhgjg",
            "name": "jhgjg"
          },
          {
            "name": "yujytu",
            "label": "yujytu"
          },
          {
            "label": "ytuytutyuytu",
            "name": "ytuytutyuytu"
          },
          {
            "name": "uiuiuyi",
            "label": "uiuiuyi"
          },
          {
            "label": "uyiuyi",
            "name": "uyiuyi"
          },
          {
            "label": "iuyi",
            "name": "iuyi"
          },
          {
            "name": "hfdfdhgfhgf",
            "label": "hfdfdhgfhgf"
          }
        ],
        "label": "Chanteurs"
      }
    ],
    "main": [
      {
        "name": "hello_world",
        "type": "section",
        "canDelete": false,
        "label": "Hello World"
      }
    ]
  },
  "uid": "rSjDHThhZ6dJ7lK3Mr5UCZdLaUv1",
  "nextBtnLabel": "Next",
  "header": "",
  "hero": "",
  "successMsg": "",
  "type": "contactform"
}



// ======================

// callback for sending data to server.  
async function onPostUIEvent(event: TPostUIEvent): Promise<TServerResponse> {

  console.log("PostUIPage____onPostUIEvent : ", event);

  // add logic to post the data (event.data) to the server
  if (event.eventType === TPostUIEventType.SubmitFormEvent) {
    const response = await fetch(event.frontend.formConfig.backendController, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event.data.formData), 
    });

    const {
      errorMsg = 'Submission failed.',
      successMsg = 'Form has been successfully submitted.'
    } = event.frontend.formConfig;

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


function App() {
  return (
    <ThemeProvider theme={theme}>
      <PostUIProvider>
      <Stack
        gap={4}
        spacing={4}
        sx={{
          display: 'flex',
          maxWidth: '800px',
          mx: 'auto',
          px: { xs: 2, md: 6 },
          py: { xs: 2, md: 3 }
        }}
      >
        <PostUI formConfig={CHOICEGROUP_FORM_CONFIG} onPostUIEvent={onPostUIEvent}/>
        </Stack>
      </PostUIProvider>
    </ThemeProvider>
  )
}

export default App;