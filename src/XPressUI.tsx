import { CssVarsProvider, ThemeProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { Outlet, Route, Routes } from 'react-router-dom';


import { useEffect } from 'react';
import TPostConfig from './common/TPostConfig';
import TMediaFile from './common/TMediaFile';
import FrontendClient from './common/frontend';
import { setPostUIConfig, setPostUIConfigAndTemplate } from './components/post-ui/Actions';
import { usePostUIContext } from './components/post-ui/PostUIProvider';
import PostUI from './components/post-ui/PostUI';
import { PathProps, withRouter } from './components/router';
import { TPostConfigWitBaseUrl, getPostConfigAndTemplate } from './components/post-ui/post-utils';
import { isEmpty } from 'lodash';

type XPressUIProps = {
  rootPostName: string;
  postConfig: TPostConfig;
  template?: string;
  mediaFiles: TMediaFile[];
  baseUrl: string;
}

type XPressUIBodyProps = PathProps & XPressUIProps;

function XPressUIBody_(props: XPressUIBodyProps) {
  const {
    rootPostName,
    mediaFiles,
    baseUrl,
    postConfig,
    template = '',
    params: {
      postName
    }
  } = props;

  const postUIContext = usePostUIContext();

  useEffect(() => {
    const mediaFilesMap: Record<string, TMediaFile> = {};

    mediaFiles.forEach((mediaFile: TMediaFile) => {
      mediaFilesMap[mediaFile.id] = mediaFile;
    });

    if (postConfig) {
      const imagesBaseUrl = `${baseUrl}images`;

      const postName = postConfig.name;

      const FrontendClientArgs = {
        template,
        postName,
        baseUrl,
        imagesBaseUrl,
        postConfig,
        mediaFiles,
        mediaFilesMap,
      }

      const frontend = new FrontendClient(FrontendClientArgs);

      setPostUIConfig(postUIContext, { ...FrontendClientArgs, frontend });
    }

  }, [rootPostName]);

  useEffect(() => {
    if (!isEmpty(postName)) {
      const postConfigFileName = `config/${postName}.json`;
      const postTemplateFileName = `templates/${postName}.html`;

      getPostConfigAndTemplate(postConfigFileName, postTemplateFileName).then((data) => {
        if (data.length && !isEmpty(data[0])) {
          const postConfigWithBaseUrl = data[0] as TPostConfigWitBaseUrl;

          const {
            postConfig,
          } = postConfigWithBaseUrl;

          const template = data.length > 1 ? data[1] as string : '';

          setPostUIConfigAndTemplate(postUIContext, postConfig, template);
        }
      });
    }

  }, [postName]);


  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
        <Header />
        <Sidebar {...props} />
        <Box
          component="main"
          className="MainContent"
          sx={{
            px: { xs: 2, md: 6 },
            pt: {
              xs: 'calc(12px + var(--Header-height))',
              sm: 'calc(12px + var(--Header-height))',
              md: 3,
            },
            pb: { xs: 2, sm: 2, md: 3 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            height: '100dvh',
            gap: 1,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </CssVarsProvider>
  );
}

const XPressUIBody = withRouter(XPressUIBody_);


function Home() {
  return (
    <Box>
      XPress UI Demo.
    </Box>
  )
}



function XPressUI(props: XPressUIProps) {
  return (
    <Routes>
      <Route element={<XPressUIBody {...props} />}>
        <Route path="/" element={<Home />} />
        <Route path={`/:postName`} element={<PostUI />} />
      </Route>
      <Route path="*" element={<NoMatch />} />
    </Routes>
  )
}

function NoMatchBody(props: PathProps) {
  console.log("No_MATCH____props : ", props)
  return (
    <Box>
      Not Found
    </Box>
  )
}

const NoMatch = withRouter(NoMatchBody);


export default XPressUI;