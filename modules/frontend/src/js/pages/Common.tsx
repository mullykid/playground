import * as React from 'react'; 
import { makeStyles, createStyles } from '@mui/styles'
import { Grid, Box, Tab, Tabs, Typography } from '@mui/material';

interface ITabPanelProps extends React.PropsWithChildren<any>{
    index: number
    value: number
};

export const pageStyles = makeStyles(theme => ({
    tab: { 
        '& .MuiBox-root': {
          paddingLeft: '0px',
          paddingRight: '0px'
          },
        },
    })
);

export function TabPanel(props:ITabPanelProps) {
    const { children, value, index, ...other } = props;
  
    return (
      <Typography
        component="div"
        role="tabpanel"
        hidden={value !== index}
        id={`scrollable-auto-tabpanel-${index}`}
        aria-labelledby={`scrollable-auto-tab-${index}`}
        {...other}
      >
        <Box p={3}>{props.children}</Box>
      </Typography>
    );
}
  
export function a11yProps(index: number) {
    return {
        id: `scrollable-auto-tab-${index}`,
        "aria-controls": `scrollable-auto-tabpanel-${index}`
    };
}