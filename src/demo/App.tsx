import { CssVarsProvider, ThemeProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Outlet, Route, Routes } from 'react-router-dom';

import { HashRouter } from "react-router-dom";
import theme from '../styles/default';
import PostSingle from './PostSingle';

function AppBody() {
  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
        <Header />
        <Sidebar />
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

function Home() {
  return (
    <Box>
      Hello World....
    </Box>
  )
}


function App() {
  return (
    <ThemeProvider theme={theme}>
      <HashRouter>
        <Routes>
          <Route element={<AppBody />}>
            <Route path="/" element={<Home />} />
            <Route path="/:postName" element={<PostSingle />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App;