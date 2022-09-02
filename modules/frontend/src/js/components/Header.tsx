import * as React from "react";
import {AppBar, Toolbar, Typography, styled, AppBarProps} from '@mui/material';

function Header(){
    return (
      
      <AppBar position='static' style={{ zIndex: 1 }}>
         <Toolbar>
             <Typography>React Navbar Example</Typography>
         </Toolbar>         
      </AppBar>

    );
}
export default Header;