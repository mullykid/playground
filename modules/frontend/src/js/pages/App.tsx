
import * as React from 'react';
import { useState, useContext, useEffect, createContext } from 'react'
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { ReactElem } from "util-commons/ReactCommons";
import MailIcon from '@mui/icons-material/Mail';
import { TextField, Grid, Button } from '@mui/material';
//import AccountCircle from '@mui/material';
import Header from '../components/Header'
import { createTheme, ThemeProvider } from '@mui/material'; 
import { SubscribeDialog } from '../components/SubcribeModal'
import { red, yellow } from "@mui/material/colors";
import { BrowserRouter, Routes, NavLink, Route } from "react-router-dom";
import { PlayerSummary } from './PlayerSummary';
import { TeamSummary } from './TeamSummary'

const appTheme = createTheme({
    palette:{
        primary:{
            main:"#38003c"
        },
        secondary:{
            main: "#00ff85"
        }
    }
})

const drawerWidth = 240;

interface IRouterLinkProps{
  icon: any
  text: string
  to: string
}

export const BreadcrumbsContext = createContext({
  onNavigation: (navBreadcrumbs: string[], navSubtitle: string | undefined) => { },
  navBreadcrumbs: ['Home'] as ReactElem[]
})

export const App = () => {
    const [subscribeOpen, setSubcribeOpen] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const [navBreadcrumbs, setNavBreadcrumbs] = useState<string[]>([])
    //const [dateRange, setDateRange] = useState<IDateRange>(createDayRange(new Date()))
    const [navSubtitle, setNavSubtitle] = useState<string>("")

    const onSubscribeClick = () => {
        setSubcribeOpen(!subscribeOpen)
    }   
   
    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    const AllRoutes = () => (
      <Routes>                  
          <Route path='/playerSummary' element={<PlayerSummary/>} />
          <Route path='/teamSummary' element={<TeamSummary/>} />
          <Route path='/' element={<PlayerSummary/>} />
      </Routes>
    )

    const RouterLink = (props: IRouterLinkProps) => {   
      return (
        <ListItem key={props.text} to={props.to} component={NavLink} disablePadding sx={{ display: 'block' }}>
          <ListItemButton
              sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              }}                                           
          >
              <ListItemIcon
              sx={{
                  minWidth: 0,
                  color: 'primary.main',
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
              }}
              >
              {props.icon}
              </ListItemIcon>
              <ListItemText 
                primaryTypographyProps={{
                  fontSize: 16,
                  color: 'primary.main',
                }}
                primary={props.text} sx={{ opacity: open ? 1 : 0 }}  />                                  
          </ListItemButton>
        </ListItem>
      )
    }

    const navigationContext = {
      navBreadcrumbs,
      onNavigation: (elems: string[], navSubtitle?: string) => {       
          setNavBreadcrumbs(elems);
          setNavSubtitle(navSubtitle || "");
      }
    }

    const getPageTitle = () => {
      return navBreadcrumbs[navBreadcrumbs.length - 1] || ""
    }
    
    return (
        <div className="App">
            <BreadcrumbsContext.Provider value={navigationContext}>
              <BrowserRouter>
                <ThemeProvider theme={appTheme} >
                    <Box sx={{ display: 'flex' }}>
                        <CssBaseline />                        
                        <AppBar position="fixed" open={open}>
                            <Toolbar>
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                onClick={handleDrawerOpen}
                                edge="start"
                                sx={{
                                marginRight: 5,
                                ...(open && { display: 'none' }),
                                }}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" noWrap component="div">
                                {getPageTitle()}
                            </Typography>
                            </Toolbar>
                        </AppBar>
                        <Drawer variant="permanent" open={open}>
                            <DrawerHeader>
                            <IconButton onClick={handleDrawerClose}>
                                {appTheme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                            </IconButton>
                            </DrawerHeader>
                            <Divider />
                            <List>
                                <RouterLink text='Player Summary' icon={<PersonIcon/>} to='/playerSummary' />
                                <Divider />
                                <RouterLink text='Team Summary' icon={<GroupsIcon/>} to='/teamSummary' />
                            </List>
                            <Divider />                          
                        </Drawer>
                        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                            <DrawerHeader />
                            {AllRoutes()}
                            {/*<Grid container>      
                                <SubscribeDialog open={subscribeOpen} onClose={onSubscribeClick} />
                                <Grid item md={2}>                  
                                    <Button color="primary" variant="contained" onClick={onSubscribeClick}> Subscribe </Button> 
                                </Grid>
                                <Grid item md={2}>
                                    <TextField id="standard-basic" label="Name" variant="standard" />
                                </Grid>                      
                            </Grid>    
                            <Typography paragraph>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                            tempor incididunt ut labore et dolore magna aliqua. Rhoncus dolor purus non
                            enim praesent elementum facilisis leo vel. Risus at ultrices mi tempus
                            imperdiet. Semper risus in hendrerit gravida rutrum quisque non tellus.
                            Convallis convallis tellus id interdum velit laoreet id donec ultrices.
                            Odio morbi quis commodo odio aenean sed adipiscing. Amet nisl suscipit
                            adipiscing bibendum est ultricies integer quis. Cursus euismod quis viverra
                            nibh cras. Metus vulputate eu scelerisque felis imperdiet proin fermentum
                            leo. Mauris commodo quis imperdiet massa tincidunt. Cras tincidunt lobortis
                            feugiat vivamus at augue. At augue eget arcu dictum varius duis at
                            consectetur lorem. Velit sed ullamcorper morbi tincidunt. Lorem donec massa
                            sapien faucibus et molestie ac.
                            </Typography>
                            <Typography paragraph>
                            Consequat mauris nunc congue nisi vitae suscipit. Fringilla est ullamcorper
                            eget nulla facilisi etiam dignissim diam. Pulvinar elementum integer enim
                            neque volutpat ac tincidunt. Ornare suspendisse sed nisi lacus sed viverra
                            tellus. Purus sit amet volutpat consequat mauris. Elementum eu facilisis
                            sed odio morbi. Euismod lacinia at quis risus sed vulputate odio. Morbi
                            tincidunt ornare massa eget egestas purus viverra accumsan in. In hendrerit
                            gravida rutrum quisque non tellus orci ac. Pellentesque nec nam aliquam sem
                            et tortor. Habitant morbi tristique senectus et. Adipiscing elit duis
                            tristique sollicitudin nibh sit. Ornare aenean euismod elementum nisi quis
                            eleifend. Commodo viverra maecenas accumsan lacus vel facilisis. Nulla
                            posuere sollicitudin aliquam ultrices sagittis orci a.
                            </Typography>
                              */}
                        </Box>
                    </Box>           
                </ThemeProvider>
              </BrowserRouter>
            </BreadcrumbsContext.Provider>
        </div>
    );
}

export default App;

export const Breadcrumbs = (props: { breadcrumbs: string[], subtitle?: string }): React.ReactElement | null => {
    let context = useContext(BreadcrumbsContext);

    useEffect(() => context.onNavigation(props.breadcrumbs, props.subtitle), [props.breadcrumbs.join("_"), props.subtitle]);

    return null;
}


const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({  
  display: 'flex',
  alignItems: 'center',  
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);