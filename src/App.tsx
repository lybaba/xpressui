import { ThemeProvider } from '@mui/joy/styles';
import theme from './styles/default';
import PostUIProvider from './components/ui/PostUIProvider';
import TPostUIEvent, { TPostUIEventType } from './common/TPostUIEvent';
import TServerResponse from './common/TServerResponse';
import PostUI from './components/ui/PostUI';
import TFormConfig from './common/TFormConfig';
import { Stack } from '@mui/joy';

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
        <PostUI formConfig={MULTI_STEP_FORM_CONFIG} onPostUIEvent={onPostUIEvent}/>
        </Stack>
      </PostUIProvider>
    </ThemeProvider>
  )
}

export default App;