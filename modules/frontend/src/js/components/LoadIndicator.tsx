import * as React from 'react';
import { useEffect, useState } from 'react';
import "./LoadIndicator.css"
import { Box, CircularProgress }  from '@mui/material';
import Loggers, { LogLevel } from 'util-commons/logger';
import { hash } from 'util-commons/ObjectUtils';

const LOGGER = Loggers.getLogger("commons.LoadIndicator")

export enum LoadState {
    ERROR,
    LOADING,
    NO_DATA,
    OK
}

export const LoadIndicator = (props: ILoadIndicatorProps) => {
    switch (props.loadState) {
        case LoadState.ERROR:
            return (<div className="statusContainer"><div className="status well text-danger">Error while loading data</div></div>)
        case LoadState.LOADING:
            return (<Box sx={{ display: 'inline-block', position: 'absolute', width: '100%' }}><CircularProgress /></Box>)
        case LoadState.NO_DATA:
            return (<div className="statusContainer"><div className="status well text-primary">No data available</div></div>)
    }
}

export interface ILoadIndicatorProps {
    loadState: LoadState,
}

export const useEffectToLoadData = (loadDataCallback: () => (Promise<boolean> | boolean), triggerPoint?: any[]) => {
    const [ loadState, setLoadState ] = useState<LoadState>(LoadState.LOADING)

    const triggerPointHashed = triggerPoint?.map(v => hash(v));

    useEffect( () => {
        (async () => {
            try {
                setLoadState(LoadState.LOADING);
                setLoadState(await loadDataCallback() ? LoadState.OK : LoadState.NO_DATA)
            }
            catch (error) {
                LOGGER.error("Error while loading the data.", error);
        
                setLoadState(LoadState.ERROR);
            }
        })();
    }, triggerPointHashed)    

    return loadState;
}
