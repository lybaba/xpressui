import { ThemeProvider } from '@mui/joy/styles';
import TPostConfig from './common/TPostConfig';
import TMediaFile from './common/TMediaFile';
import PostUIProvider from './components/postui/PostUIProvider';
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
    <ThemeProvider>
        <PostUIProvider>
          <XPressUI
           {...props}
           rootPostName={rootPostName}
           postConfig={postConfig}
           mediaFiles={mediaFiles}
           baseUrl={baseUrl}
          />
        </PostUIProvider>
    </ThemeProvider>
  )
}
