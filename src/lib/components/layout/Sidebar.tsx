import * as React from 'react';
import GlobalStyles from '@mui/joy/GlobalStyles';
import Box from '@mui/joy/Box';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton, { listItemButtonClasses } from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';

import ColorSchemeToggle from './ColorSchemeToggle';
import { closeSidebar } from './utils';
import { PathProps, withRouter } from '../../common/router';

//import logo from './logo.jpg';
import { usePostUIContext } from '../post-ui/PostUIProvider';
import TAppPage from '../../types/TAppPage';

function Toggler({
  defaultExpanded = false,
  renderToggle,
  children,
}: {
  defaultExpanded?: boolean;
  children: React.ReactNode;
  renderToggle: (params: {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultExpanded);
  return (
    <React.Fragment>
      {renderToggle({ open, setOpen })}
      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: '0.2s ease',
          '& > *': {
            overflow: 'hidden',
          },
        }}
      >
        {children}
      </Box>
    </React.Fragment>
  );
}

type Props = PathProps;

function Sidebar(props: Props) {
  const {
    navigate,
    params
  } = props;

  const postUIContext = usePostUIContext();
  const {
    postConfig
  } = postUIContext;

  const {
    appPages = []
  } = postConfig;


  return (
    <Sheet
      className="Sidebar"
      sx={{
        position: { xs: 'fixed', md: 'sticky' },
        transform: {
          xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))',
          md: 'none',
        },
        transition: 'transform 0.4s, width 0.4s',
        zIndex: 10000,
        height: '100dvh',
        width: 'var(--Sidebar-width)',
        top: 0,
        p: 2,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      <GlobalStyles
        styles={(theme) => ({
          ':root': {
            '--Sidebar-width': '220px',
            [theme.breakpoints.up('lg')]: {
              '--Sidebar-width': '240px',
            },
          },
        })}
      />
      <Box
        className="Sidebar-overlay"
        sx={{
          position: 'fixed',
          zIndex: 9998,
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          opacity: 'var(--SideNavigation-slideIn)',
          backgroundColor: 'var(--joy-palette-background-backdrop)',
          transition: 'opacity 0.4s',
          transform: {
            xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--Sidebar-width, 0px)))',
            lg: 'translateX(-100%)',
          },
        }}
        onClick={() => closeSidebar()}
      />
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {/*<IconButton
          color="neutral"
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            textDecoration: 'none'
          }}

          onClick={() => {
            navigate('/')
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
            }}
          >
            <Box
              component="img"
              sx={{
                height: 30,
              }}
              alt={'XPress UI'}
              src={logo}
            />
          </Box>
        </IconButton>
        */}
        <Typography level="title-lg">XPress UI.</Typography>
        <ColorSchemeToggle sx={{ ml: 'auto' }} />
      </Box>
      <Box
        sx={{
          minHeight: 0,
          overflow: 'hidden auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          [`& .${listItemButtonClasses.root}`]: {
            gap: 1.5,
          },
        }}
      >
        <List
          size="sm"
          sx={{
            gap: 1,
            '--List-nestedInsetStart': '30px',
            '--ListItem-radius': (theme) => theme.vars.radius.sm,
          }}
        >

          {
            appPages.map((appPage : TAppPage, index: number) => (
              <ListItem key={index}>
                <ListItemButton
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/${appPage.name}`)
                  }}
                >
                  <ListItemContent>
                    <Typography level="title-sm">{appPage.label}</Typography>
                  </ListItemContent>
                </ListItemButton>
              </ListItem>
            ))
          }
        </List>
      </Box>
    </Sheet>
  );
}

export default withRouter(Sidebar)