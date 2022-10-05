import * as React from 'react'; 
import { useState, useMemo, useCallback, useRef } from 'react';
import { Auth } from 'util-commons'
import { QueryParameters } from 'util-commons/QueryParametersEnconding'
import { useEffectToLoadData, LoadState } from "../components/LoadIndicator";
import { Breadcrumbs } from "./App";
import { Grid, Box, Tab, Tabs, Container, Paper } from '@mui/material';
import { makeStyles, createStyles } from '@mui/styles'
import { GenericDataComponent } from '../components/GenericDataComponent'
import { FormControl, InputLabel, MenuItem, OutlinedInput } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { pageStyles, TabPanel, a11yProps } from './Common'
import { round2DecimalPlaces } from 'util-commons/FormatUtils'
import { PlayerShots } from './PlayerShots'
import { PlayerAdvancedStats } from './PlayerStats'
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles//ag-grid.css';
import 'ag-grid-community/styles//ag-theme-alpine.css';
import './Grid.css'

interface IPlayerSummaryProps{
}

export interface IPlayer {
    player_name: string;
    team_title: string;
    position: string;
    games: number;
    time: number;
    goals: number;
    id: number;
    assists: number;
    key_passes: number;
    kP90: number;
    shots: number;
    shots90: number;
    xG: number;
    xGI: number;
    xG90: number;
    xA: number;
    xA90: number;
    npg: number;
    npxG: number;
    xGBuildup: number;
    xGChain: number;
    yellow_cards: number;
    red_cards: number;
}

interface Filter{
    enabled: boolean;
    player_name: string;
    team_title: string;
}

export const PlayerSummary = (props: IPlayerSummaryProps) => {
    const [dataGridData, setDataGridData] = useState<any>([])
    const [tabValue, setTabValue] = useState<number>(0)
    const [position, setPosition] = useState<string[]>([])
    const [games, setGames] = useState<number>(0)
    const [league, setLeague] = useState<string>("EPL")
    const [season, setSeason] = useState<number>(2022)
    const [player, setPlayer]  = useState<IPlayer>(undefined)
    const gridRef = useRef();

    const [columnDefs] = useState(
        [
            { field: 'player_name', headerName: 'Player', pinned: true, width: 170, type:'textColumn', filter: 'agTextColumnFilter', suppressSizeToFit: true},
            { field: 'team_title', headerName: 'Team', pinned: true, width: 170, type:'textColumn', filter: 'agTextColumnFilter', suppressSizeToFit: true},
            { field: 'position', headerName: 'Position', width: 80, type:'textColumn', filter: 'agTextColumnFilter'},
            { field: 'games', headerName: 'Games'},
            { field: 'time', headerName: 'Mins'},
            { field: 'goals', headerName: 'Goals'},
            { field: 'assists', headerName: 'Assists'},
            { field: 'key_passes', headerName: 'KP'},
            { field: 'kP90', headerName: 'KP90'},    
            { field: 'shots', headerName: 'Shots'},
            { field: 'shots90', headerName: 'Sh90'},
            { field: 'xG', headerName: 'xG'},
            { field: 'xG90', headerName: 'xG90'},
            { field: 'xA', headerName: 'xA'},
            { field: 'xA90', headerName: 'xA90'},
            { field: 'xGI', headerName: 'xGI'},
            { field: 'npg', headerName: 'npg'},
            { field: 'npxG', headerName: 'npxG'},
            { field: 'xGBuildup', headerName: 'xGBuildup'},
            { field: 'xGChain', headerName: 'xGChain'},
            { field: 'yellow_cards', headerName: 'Yellow'},
            { field: 'red_cards', headerName: 'Red'} 
        ]
    )
    const classes = pageStyles();

    const loadData = async() => {
        let dataPromise = await Auth.authFetch('/api/players', {
            league: league,                        
            season: season,
            games: games,
            position: QueryParameters.encodeQueryParameterToSingleString(position)
        });
      //  console.log(dataPromise.results)
        const data = dataPromise.results.map((v: IPlayer, i: number) => {  
            v.xG = round2DecimalPlaces(v.xG)
            v.xA = round2DecimalPlaces(v.xA)
            v.xGI = round2DecimalPlaces(v.xG + v.xA)
            v.npg = round2DecimalPlaces(v.npg) 
            v.npxG = round2DecimalPlaces(v.npxG) 
            v.xGBuildup = round2DecimalPlaces(v.xGBuildup)
            v.xGChain = round2DecimalPlaces(v.xGChain)
            v.xG90 = round2DecimalPlaces((v.xG / v.time) * 90)            
            v.xA90 = round2DecimalPlaces((v.xA / v.time) * 90)
            v.shots90 = round2DecimalPlaces((v.shots / v.time) * 90)
            v.kP90 = round2DecimalPlaces((v.key_passes / v.time) * 90)
            return v
        })
       // LOGGER.debug("Data received {}", dataPromise)
        setDataGridData(data)
        
        return true
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handlePositionFilterChange = (event: SelectChangeEvent<typeof position>) => {
        const {
          target: { value },
        } = event;
        setPosition(
          // On autofill we get a stringified value.
          typeof value === 'string' ? value.split(',') : value,
        );
    };

    const handleGamesFilterChange = (event: SelectChangeEvent) => {
        setGames(parseInt(event.target.value));
    };

    const handleLeagueFilterChange = (event: SelectChangeEvent) => {
        setLeague(event.target.value);
    };

    const handleSeasonFilterChange = (event: SelectChangeEvent) => {
        setSeason(parseInt(event.target.value));
    };

    const onRowClick = (row: any) => {
        setPlayer(row.data)
    };

    type Comparator = (a: IPlayer, b: IPlayer) => number;
    const getComparator = (sortColumn: string): Comparator => {
        switch (sortColumn) {
            case 'player_name':
            case 'team_title':
            case 'position':
            return (a, b) => {
                return a[sortColumn].localeCompare(b[sortColumn]);
            };           
            default:
                return (a:any, b:any) => {
                    return a[sortColumn] - b[sortColumn];
                };
        }
    }
      
    const defaultColDef = useMemo(() => {
        return {
          resizable: true,
          sortable: true,
          width: 90,
          type: 'numericColumn', 
          filter: 'agNumberColumnFilter'
        };
    }, []);
    
    let loadState = useEffectToLoadData(loadData, [league, games, position])

    return (                   
        <Box sx={{ width: '100%', height: '100%'}}>
            <Breadcrumbs breadcrumbs={ [ "Player Summary" ] } />
            <FormControl sx={{ m: 1, minWidth: 200 }} size="small">
                <InputLabel id="season">Season</InputLabel>
                <Select
                    labelId="season"
                    id="season"
                    value={season.toString()}
                    label="Season"
                    style={{ height: 37 }}
                    onChange={handleSeasonFilterChange}
                >
                    <MenuItem value={2022}><em>2022/23</em></MenuItem>
                    <MenuItem value={2021}>2021/22</MenuItem>
                    <MenuItem value={2020}>2020/21</MenuItem>                      

                </Select>
            </FormControl> 
            <FormControl sx={{ m: 1, minWidth: 200 }} size="small">
                <InputLabel id="league">League</InputLabel>
                <Select
                    labelId="league"
                    id="league"
                    value={league}
                    label="League"
                    style={{ height: 37 }}
                    onChange={handleLeagueFilterChange}
                >
                    <MenuItem value={'EPL'}><em>EPL</em></MenuItem>
                    <MenuItem value={'Bundesliga'}>Bundesliga</MenuItem>
                    <MenuItem value={'La liga'}>La Liga</MenuItem>                      
                    <MenuItem value={'Ligue 1'}>Ligue 1</MenuItem>
                    <MenuItem value={'Serie A'}>Serie A</MenuItem>
                </Select>
            </FormControl>                  
            <FormControl sx={{ m: 1, minWidth: 200, marginLeft: 0 }} size="small">
                <InputLabel id="position">Position</InputLabel>
                <Select
                    labelId="position"
                    id="position"
                    style={{ height: 37 }}
                    multiple
                    value={position}
                    label="Position"
                    input={<OutlinedInput label="Position" />}
                    onChange={handlePositionFilterChange}
                >
                    <MenuItem value="">
                    <em>None</em>
                    </MenuItem>
                    <MenuItem value={'GK'}>GK</MenuItem>
                    <MenuItem value={'D'}>D</MenuItem>
                    <MenuItem value={'M'}>M</MenuItem>
                    <MenuItem value={'F'}>F</MenuItem>
                    <MenuItem value={'S'}>S</MenuItem>
                </Select>
            </FormControl>
            <FormControl sx={{ m: 1, minWidth: 200 }} size="small">
                <InputLabel id="games">Games</InputLabel>
                <Select
                    labelId="games"
                    id="games"
                    value={games.toString()}
                    label="Games"
                    style={{ height: 37 }}
                    onChange={handleGamesFilterChange}
                >
                    <MenuItem value={0}><em>All</em></MenuItem>
                    <MenuItem value={3}>Last 3</MenuItem>
                    <MenuItem value={6}>Last 6</MenuItem>
                    <MenuItem value={10}>Last 10</MenuItem>                            
                </Select>
            </FormControl>           
            <Grid container spacing={2}>                                              
                <Grid item md={12}  >       
                    <GenericDataComponent loadState={loadState} height={400}>                        
                        <AgGridReact                                    
                            className="ag-theme-alpine"
                            ref={gridRef}
                            defaultColDef={defaultColDef}
                            rowData={dataGridData}
                            columnDefs={columnDefs}
                            rowHeight={28}
                        //  height={400}
                            //style={{ height: 400, width: 600 }}
                            rowSelection={'single'}
                            onRowClicked={onRowClick}
                        >
                        </AgGridReact>                    
                    </GenericDataComponent>   
                </Grid> 
                <Grid item md={6}>
                    <PlayerShots player={player} season={season} games={games}/>                                 
                </Grid>   
                <Grid item md={6}>
                    <PlayerAdvancedStats height={500} player={player}/>  
                </Grid>                                             
            </Grid>                        
        </Box>
    )
}

const filterColumnClassName = 'filter-cell';
const filterStyle = {
  inlineSize: '100%',
  padding: '4px',
  fontSize: '14px'
}



