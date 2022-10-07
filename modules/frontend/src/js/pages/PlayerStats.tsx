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
            d[0].data.push(props.player.goals)
            d[0].data.push(props.player.assists)
            d[0].data.push(props.player.kP90)
            d[0].data.push(props.player.shots90)
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
        //  height: props.height - 50,
          type: 'radar'
        },
        title: {
            text: props.player ? props.player.player_name + ' Stats' : undefined,
            align: 'center',
            offsetX: 0,
            style: {
                fontSize: '18px', 
                //color: color:black
            }
        },
        xaxis: {
            categories: ['goals', 'xG', 'xG90', 'npg', 'npxG', 'assists', 'xA', 'xA90', 'xGI', 'kP90', 'shots90', 'xGBuildup', 'xGChain']
        } ,
        fill: {
            opacity: 0.5,
            colors: ['#00ff85']
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['#00ff85'],
            dashArray: 0
        },
        markers: {
            colors: "#38003c"
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
                height={props.height-20} 
            />
        </GenericDataComponent>
    )
}    