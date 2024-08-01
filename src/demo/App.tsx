import { ThemeProvider } from '@mui/joy/styles';
import { BrowserRouter, HashRouter } from "react-router-dom";
import theme from './styles/default';
import TPostConfig from '../common/TPostConfig';
import TMediaFile from '../common/TMediaFile';
import PostUIProvider from '../components/postui/PostUIProvider';
import XPressUI from './XPressUI';

type AppProps = {
  rootPostName: string;
  postConfig: TPostConfig;
  template?: string;
  mediaFiles: TMediaFile[];
  baseUrl: string;
}


function App(props: AppProps) {
  const {
    rootPostName,
    mediaFiles,
    baseUrl,
    postConfig,
  } = props;

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <PostUIProvider>
          <XPressUI
           {...props}
           rootPostName={rootPostName}
           postConfig={postConfig}
           mediaFiles={mediaFiles}
           baseUrl={baseUrl}
          />
        </PostUIProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App;