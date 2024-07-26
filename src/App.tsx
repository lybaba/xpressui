
import './reset.scss';

import {
  ThemeProvider,
} from '@mui/joy';

import { HashRouter } from "react-router-dom";
import PostUIProvider from './components/post-ui/PostUIProvider';
import theme from './styles/default';


function App() {
  return (
    <ThemeProvider theme={theme}>
      <HashRouter>
        <PostUIProvider>
            Hello World
        </PostUIProvider>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App;