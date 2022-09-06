import * as React from 'react'; 
import { useState, useMemo } from 'react';
import { Auth } from 'util-commons'
import { QueryParameters } from 'util-commons/QueryParametersEnconding'
import { useEffectToLoadData, LoadState } from "../components/LoadIndicator";
import { Breadcrumbs } from "./App";
import { Grid, Box, Tab, Tabs, Typography } from '@mui/material';
import { makeStyles, createStyles } from '@mui/styles'
import DataGrid, {Column, SortColumn} from 'react-data-grid';
import { GenericDataComponent } from '../components/GenericDataComponent'
import { FormControl, InputLabel, MenuItem, OutlinedInput } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { pageStyles, TabPanel, a11yProps } from './Common'
import { round2DecimalPlaces } from 'util-commons/FormatUtils'

interface IPlayerSummaryProps{
}

interface IRow {
    player_name: string;
    team_title: string;
    position: string;
    games: number;
    time: number;
    goals: number;
    assists: number;
    key_passes: number;
    shots: number;
    xG: number;
    xA: number;
    npg: number;
    npxG: number;
    xGBuildup: number;
    xGChain: number;
    yellow_cards: number;
    red_cards: number;
}

export const PlayerSummary = (props: IPlayerSummaryProps) => {
    const [dataGridData, setDataGridData] = useState<any>([])
    const [tabValue, setTabValue] = useState<number>(0)
    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
    const [position, setPosition] = useState<string[]>([])
    const [games, setGames] = useState<number>(0)
    const [league, setLeague] = useState<string>("EPL")
    const [season, setSeason] = useState<number>(2022)

    const classes = pageStyles();

    const loadData = async() => {
        let dataPromise = await Auth.authFetch('/api/players', {
            league: league,                        
            season: season,
            games: games,
            position: QueryParameters.encodeQueryParameterToSingleString(position)
        });
        const data = dataPromise.results.map((v: IRow, i: number) => {  
            v.xG = round2DecimalPlaces(v.xG)
            v.xA = round2DecimalPlaces(v.xA)
            v.npg = round2DecimalPlaces(v.npg) 
            v.npxG = round2DecimalPlaces(v.npxG) 
            v.xGBuildup = round2DecimalPlaces(v.xGBuildup)
            v.xGChain = round2DecimalPlaces(v.xGChain)
       
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

    type Comparator = (a: IRow, b: IRow) => number;
    const getComparator = (sortColumn: string): Comparator => {
        switch (sortColumn) {
            case 'player_name':
            case 'team_title':
            case 'position':
            return (a, b) => {
                return a[sortColumn].localeCompare(b[sortColumn]);
            };           
            case 'games':
            case 'time':
            case 'goals':
            case 'assists':
            case 'key_passes':
            case 'shots':
            case 'xG':
            case 'xA':
            case 'npg':
            case 'npxG':
            case 'xGBuildup':
            case 'xGChain':
            case 'yellow_cards':
            case 'red_cards':
            return (a, b) => {
                return a[sortColumn] - b[sortColumn];
            };
            default:
            throw new Error(`unsupported sortColumn: "${sortColumn}"`);
        }
    }

    const sortedRows = useMemo((): readonly IRow[] => {
        if (sortColumns.length === 0) return dataGridData;
    
        return [...dataGridData].sort((a, b) => {
          for (const sort of sortColumns) {
            const comparator = getComparator(sort.columnKey);
            const compResult = comparator(a, b);
            if (compResult !== 0) {
              return sort.direction === 'ASC' ? compResult : -compResult;
            }
          }
          return 0;
        });
    }, [dataGridData, sortColumns]);

    let loadState = useEffectToLoadData(loadData, [league, games, position])

    return (
        <div >
            <Breadcrumbs breadcrumbs={ [ "Player Summary" ] } />
            <Box sx={{ width: '100%', height: '100%'}}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="scrollable auto tabs example"
                    >
                    <Tab label="Summary" {...a11yProps(0)} />                 
                </Tabs>                        
                
                <TabPanel classes={{ root: classes.tab }} value={tabValue} index={0}>
                    <Grid container >      
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
                        <Grid item md={12} >
                            <GenericDataComponent loadState={loadState}>
                                <DataGrid 
                                    className="fill-grid" 
                                    columns={columns} 
                                    rows={sortedRows} 
                                    style={{height: 600}}
                                    rowHeight={25}
                                    sortColumns={sortColumns}
                                    onSortColumnsChange={setSortColumns}
                                    defaultColumnOptions={{
                                        sortable: true,
                                        resizable: true
                                    }}
                                />
                            </GenericDataComponent>
                        </Grid>
                    </Grid>
                </TabPanel>              
            </Box>
        </div>
    )
}

const columns = [
    { key: 'player_name', name: 'Name', frozen: true },
    { key: 'team_title', name: 'Team', frozen: true },
    { key: 'position', name: 'Position', width: 20 },
    { key: 'games', name: 'Games', width: 20, sortable: true, filterable: true},
    { key: 'time', name: 'Mins', width: 20, sortable: true},
    { key: 'goals', name: 'Goals', width: 20, sortable: true},
    { key: 'assists', name: 'Assists', width: 20, sortable: true},
    { key: 'key_passes', name: 'Key Passes', width: 20, sortable: true},
    { key: 'shots', name: 'Shots', width: 20, sortable: true},
    { key: 'xG', name: 'xG', width: 20, sortable: true},
    { key: 'xA', name: 'xA', width: 20, sortable: true, title: "sss"},
    { key: 'npg', name: 'npg', width: 20, sortable: true},
    { key: 'npxG', name: 'npxG', width: 20, sortable: true},
    { key: 'xGBuildup', name: 'xGBuildup', width: 20, sortable: true},
    { key: 'xGChain', name: 'xGChain', width: 20, sortable: true},
    { key: 'yellow_cards', name: 'Yellow', width: 20, sortable: true},
    { key: 'red_cards', name: 'Red', width: 20, sortable: true}
];