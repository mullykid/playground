import * as React from 'react'; 
import { useState } from 'react';
import { useEffectToLoadData } from '../components/LoadIndicator'
import { round2DecimalPlaces } from 'util-commons/FormatUtils'
import Chart from "react-apexcharts";
import { IPlayer } from './PlayerSummary'
import { GenericDataComponent } from '../components/GenericDataComponent'


export interface IPlayerStatsProps {
    height: number,
    player: IPlayer
}

interface IRadar{
    name: string,
    data: number[]
}


export const PlayerAdvancedStats = (props: IPlayerStatsProps) => {    
    const [chartData, setChartData] = useState<IRadar[]>([])
    //const classes = pageStyles();

    const formatData = async() => {
        if (props.player){
            let d: IRadar[] = [{name: 'stats', data: []}]
            d[0].data.push(props.player.xG)
            d[0].data.push(props.player.xGI)
            d[0].data.push(props.player.xG90)
            d[0].data.push(props.player.xA)
            d[0].data.push(props.player.xA90)
            d[0].data.push(props.player.npg)
            d[0].data.push(props.player.npxG)
            d[0].data.push(props.player.xGBuildup)
            d[0].data.push(props.player.xGChain)                  

            setChartData(d)
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

    const radarOptions = {
        chart: {
          height: props.height,
          type: 'radar'
        },
        xaxis: {
            categories: ['xG', 'xGI', 'xG90', 'xA', 'xA90', 'npg', 'npxG', 'xGBuildup', 'xGChain']
        }       
    }
    const loadState = useEffectToLoadData(formatData, [props.player])
    /*
   chart: {
  background: 'url(/assets/img/some.svg)'
},
        */

    return(
        <GenericDataComponent height={props.height} loadState={loadState}>
            <Chart 
                options={radarOptions} 
                series={chartData} 
                type="radar" 
                height={props.height} 
            />
        </GenericDataComponent>
    )
}    