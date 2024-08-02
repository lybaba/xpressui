import { ThemeProvider } from '@mui/joy/styles';
import { BrowserRouter } from "react-router-dom";
import theme from './styles/default';
import TMediaFile from '../common/TMediaFile';
import PostUIProvider, { usePostUIContext } from '../components/postui/PostUIProvider';
import { useEffect } from 'react';
import { getPostConfigAndAssets } from '../components/postui/post-utils';
import FrontendClient from '../common/frontend';
import { initPostUI } from '../components/postui/Actions';
import PostUIRouter from './PostUIRouter';
type AppProps = {
  rootPostName: string;
}

function MainContent(props: AppProps) {
  const {
    rootPostName,
  } = props;

  const postUIContext = usePostUIContext();

  useEffect(() => {
    const postConfigFileName = `config/${rootPostName}.json`;
    const postAssetsFileName = `config/assets.json`;

    getPostConfigAndAssets(postConfigFileName, postAssetsFileName).then((postConfigParams) => {
      if (postConfigParams) {

        const {
          postConfig,
          baseUrl,
          mediaFiles
        } = postConfigParams;

        const mediaFilesMap: Record<string, TMediaFile> = {};

        mediaFiles.forEach((mediaFile: TMediaFile) => {
          mediaFilesMap[mediaFile.id] = mediaFile;
        });

        if (postConfig) {
          const imagesBaseUrl = `${baseUrl}images`;

          const FrontendClientArgs = {
            baseUrl,
            imagesBaseUrl,
            postConfig,
            mediaFiles,
            mediaFilesMap,
          }

          const frontend = new FrontendClient(FrontendClientArgs);

          initPostUI(postUIContext, { ...FrontendClientArgs, frontend, rootPostConfig: postConfig });
        }
      }
    });

  }, []);



  return (
    <BrowserRouter>
      <PostUIRouter
        rootPostName={rootPostName}
      />
    </BrowserRouter>

  )
}



function App(props: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <PostUIProvider>
        <MainContent
          {...props}
        />
      </PostUIProvider>
    </ThemeProvider>
  )
}

export default App;