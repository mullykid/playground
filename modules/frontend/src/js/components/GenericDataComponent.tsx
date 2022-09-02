import * as React from 'react'
import { LoadState, LoadIndicator } from './LoadIndicator'

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
            return (<div className="statusContainer"><div className="status well text-danger">Error while loading data</div></div>)
        case LoadState.LOADING:
            return (<LoadIndicator loadState={props.loadState}/>)
        case LoadState.NO_DATA:
            return (<div className="statusContainer"><div className="status well text-primary">No data available</div></div>)
    }
}

const OuterDiv = (props: { children: any, className?: string, title?: string, height?: number | string }) => {

    return (
        <div style={ {height: props.height ? props.height : 300, position: "relative" } } className={props.className}>
            <h3>{props.title}</h3>

            {props.children}
        </div>
    )
}