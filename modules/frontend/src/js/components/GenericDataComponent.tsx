import * as React from 'react'
import { LoadState, LoadIndicator } from './LoadIndicator'
import { Box, Paper } from '@mui/material';

export interface IGenericDataComponent extends React.PropsWithChildren<any>{    
    loadState: LoadState
    title?: string
    height?: number
    className?: string
}

export const GenericDataComponent = (props: IGenericDataComponent) => {
    let OuterComponent = OuterDiv
    return(
        <OuterComponent {...props}>
            <RenderInside loadState={props.loadState}>
                {props.children}
            </RenderInside>
        </OuterComponent>
    )    
}


const RenderInside = (props: { loadState: LoadState, children?: any}) => {
    switch (props.loadState) {
        case LoadState.OK:
            return props.children;
        case LoadState.ERROR:
            return (<Box className="statusContainer"><div className="status well text-danger">Error while loading data</div></Box>)
        case LoadState.LOADING:
            return (<LoadIndicator loadState={props.loadState}/>)
        case LoadState.NO_DATA:
            return (<Box className="statusContainer"><div className="status well text-primary">No data available</div></Box>)
    }
}
const OuterDiv = (props: { children: any, className?: string, title?: string, height?: number | string }) => {

    return (
        <Paper elevation={2} sx={ {height: props.height ? props.height : 300, position: "relative" } } className={props.className}>
            <h3>{props.title}</h3>

            {props.children}
        </Paper>
    )
}