import { ThemeProvider } from '@mui/joy/styles';
import { BrowserRouter } from "react-router-dom";
import theme from './styles/default';
import TPostConfig from './lib/types/TPostConfig';
import TMediaFile from './lib/types/TMediaFile';
import PostUIProvider from './lib/components/post-ui/PostUIProvider';
import XPressUI from './XPressUI';


type XPressUIAppProps = {
  rootPostName: string;
  postConfig: TPostConfig;
  template?: string;
  mediaFiles: TMediaFile[];
  baseUrl: string;
}


export default function XPressUIApp(props: XPressUIAppProps) {
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
