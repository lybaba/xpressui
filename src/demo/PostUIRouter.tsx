import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Outlet, Route, Routes } from 'react-router-dom';


import { PathProps, withRouter } from '../components/router';
import PostUIPage from './PostUIPage';
import HomePage from './HomePage';

type PostUIRouterProps = {
  rootPostName: string;
}

type PostUIRouterBodyProps = PathProps & PostUIRouterProps;

function PostUIRouterBody_(props: PostUIRouterBodyProps) {



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

const PostUIRouterBody = withRouter(PostUIRouterBody_);



function PostUIRouter(props: PostUIRouterProps) {
  return (
    <Routes>
      <Route element={<PostUIRouterBody {...props} />}>
        <Route path="/" element={<HomePage />} />
        <Route path={`/:postName`} element={<PostUIPage />} />
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


export default PostUIRouter;