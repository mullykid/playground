import * as React from 'react'; 
import { useState } from 'react';
import { Auth } from 'util-commons'
import { useEffectToLoadData } from "../components/LoadIndicator";
import { Breadcrumbs } from "./App";
import { Grid } from '@mui/material';

interface IPlayerSummaryProps{

}

export const TeamSummary = (props: IPlayerSummaryProps) => {
    
    const loadData = async() => {
        console.log("here")
        let dataPromise = await Auth.authFetch('/api/players', {              
        });

        console.log(dataPromise.results)
        const data = dataPromise.results.map((v: any, i: any) => {            
            return v
        })
       // LOGGER.debug("Data received {}", dataPromise)
       // setDataGridData(dataPromise)

        return true
    }

    let loadState = useEffectToLoadData(loadData, [])
    return (
        <Grid container item md={12}>
            <Breadcrumbs breadcrumbs={ [ "Team Summary" ] } />
            <div></div>        
        </Grid>
    )
}