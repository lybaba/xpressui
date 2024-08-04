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
              "type": "text",
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


function App() {
  return (
    <ThemeProvider theme={theme}>
      <PostUIProvider>
        <PostUI postConfig={MULTI_STEP_FORM_CONFIG} onPostUIEvent={onPostUIEvent}/>
      </PostUIProvider>
    </ThemeProvider>
  )
}

export default App;