import * as React from 'react'; 
import { useState } from 'react';
import { Auth } from 'util-commons'
import { useEffectToLoadData } from '../components/LoadIndicator'
import { round2DecimalPlaces } from 'util-commons/FormatUtils'
import Chart from "react-apexcharts";
import "./PlayerShots.css"
import { GenericDataComponent } from '../components/GenericDataComponent'
import { IPlayer } from './PlayerSummary'

interface IShotRec {
    id: number;
    minute: number;
    X: number,
    Y: number,
    x: number,
    y: number,
    z: number,
    xG: number,
    result: string;
    player: string;
    h_a: string,
    situation: string,
    player_id: number;
    season: string,
    shotType: string,
    match_id: number,
    h_team: string;
    a_team: string;
    h_goals: number;
    a_goals: number;
    date: Date;
    player_assisted: string;
    lastAction: string;   
}

export interface IPlayerShotProps{
    player: IPlayer,
    games: number,
    season: number,
    height: number
}

interface IShotPlot{
    name: string,
    data: IShotRec[]
}

export interface ITooltip {ctx: any, series: any, seriesIndex: any, dataPointIndex: any, w: any}

const PLOT_SERIES = ['SavedShot','MissedShots','Goal','BlockedShot','ShotOnPost']

export const PlayerShots = (props: IPlayerShotProps) => {    
    const [shotPlot, setShotPlot] = useState<IShotPlot[]>([])
    //const classes = pageStyles();

    const loadData = async() => {
        if (props.player){
            let id = props.player.id * 1
            let playerShots = await Auth.authFetch('/api/player_shots', {playerid: id, season: props.season})

            let shots:IShotRec[]  = playerShots.results.map((v: IShotRec, i: number) => {  
                v.xG = round2DecimalPlaces(v.xG)
                let temp = v.X
                v.x = round2DecimalPlaces(v.Y)
                v.y = round2DecimalPlaces(temp)
                v.z = round2DecimalPlaces(v.xG)
                return v
            })

            if (props.games > 0){   //filter by last X games.
                shots.sort((a:IShotRec, b:IShotRec) => b.id - a.id); 
                let id = 0
                let gameCount = 0
                shots = shots.filter((s: IShotRec, i: number) => {  
                    if (id != s.match_id && gameCount <= props.games){
                        id = s.match_id
                        gameCount += 1                        
                    }
                    if (id === s.match_id){
                        return s
                    }
                })    
            }

            let shotPlotData: IShotPlot[] = []
           
            PLOT_SERIES.forEach(v => {
                let series: IShotPlot = {name: v, data: []}            
                let filteredShots = shots.filter(s => s.result === v).forEach(f => {                   
                    series.data.push(f)
                })   
                shotPlotData.push(series)
            })

            setShotPlot(shotPlotData)
        }
        
        return true
    }

    /*const scattertoolTip = (prop: ITooltip) => {
        var data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        console.log(data)
        return '<div class="arrow_box" style="width: 250px; height:50px;">' +
                    '<div style="background-color:#ECEFF1">'+prop.ctx.opts.xaxis.categories[prop.dataPointIndex].replace("T", " ")+'</div>' +
                    '<div style="padding-left: 10px; padding-top: 5px;  display: flex;">' +
                        '<div style=" width: 10px; margin-top: 5px; height:10px;background-color:' + prop.ctx.opts.colors[prop.seriesIndex] + '"></div>' +
                        '<span  style="padding-left: 20px ">' + prop.ctx.opts.series[prop.seriesIndex].name + '</span>' +                     
                    '</div'+
                '</div>'
    }*/

    const plotOptions = {
        chart: {
            type: 'scatter',
            zoom: {
                enabled: false,
                type: 'xy'
            },
            id: "bubble",
            offsetY: 20       
        },
        /*noData: {
            text: "No data available",
            align: 'center',
            verticalAlign: 'middle',
            offsetX: 0,
            offsetY: 0,
            style: {
              color: undefined,
              fontSize: '14px',
              fontFamily: undefined
            }
        },*/
        /*title: {
            text: 'Shot Map',
            align: 'center',
            offsetX: 0,
            style: {
                fontSize: '18px', 
                //color: color:black
            }
        },*/
        grid: {
            show: false
        },
        xaxis: {
            show: false,
            tickAmount: 10,
            labels: {
                show: false,
                formatter: function(val:any) {
                    return parseFloat(val).toFixed(1)
                }
            },
            min: 0,
            max: 1,
            axisBorder: { 
                show: false  //or just here to disable only y axis
            },
            axisTicks: { 
                show: false  //or just here to disable only y axis
            }
        },        
        yaxis: {
            show: false,
            tickAmount: 10,
            min: 0,
            max: 1,
            axisBorder: { 
                show: false  //or just here to disable only y axis
            },
            axisTicks: { 
                show: false  //or just here to disable only y axis
            }
        },
        dataLabels: {
            enabled: false
        },
        fill: {
            opacity: 0.8
        },
        tooltip: {
            custom: (props: ITooltip) => {
                //var data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                let rec: IShotRec = props.ctx.opts.series[props.seriesIndex].data[props.dataPointIndex]
                return '<ul>' +
                '<li><b>Game</b>: ' + `${rec.h_team} ${rec.h_goals} v ${rec.a_team} ${rec.a_goals}` + '</li>' +
                '<li><b>Date</b>: ' + rec.date + '</li>' +
                '<li><b>Minute</b>: \'' + rec.minute + '\'</li>' +
                '<li><b>Shot Type</b>: \'' + rec.shotType + '\'</li>' +
                '<li><b>Situation</b>: \'' + rec.situation + '\'</li>' +
                '<li><b>Result</b>: \'' + rec.result + '\'</li>' +
                '</ul>';
              }
        },
        legend:{
            offsetY: 0
        },
        noData: {
            text: "No player selected",
            align: 'center',
            verticalAlign: 'middle',
            offsetX: 0,
            offsetY: 0,
            style: {              
              fontSize: '16px'
            }
        }
    }

    const loadState = useEffectToLoadData(loadData, [props.player, props.games, props.season])
    /*
   chart: {
  background: 'url(/assets/img/some.svg)'
},
        */

    return(
        <GenericDataComponent className='shotPlot' height={props.height} loadState={loadState}>
            <Chart 
                options={plotOptions} 
                series={shotPlot} 
                
                type="bubble" 
                height={props.height - 20}                
            />
        </GenericDataComponent>
    )
}    