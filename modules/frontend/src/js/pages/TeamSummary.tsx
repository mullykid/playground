import * as React from 'react'; 
import { useState, useMemo } from 'react';
import { Auth } from 'util-commons'
import { QueryParameters } from 'util-commons/QueryParametersEnconding'
import { round2DecimalPlaces } from 'util-commons/FormatUtils'
import { useEffectToLoadData, LoadState } from "../components/LoadIndicator";
import { Breadcrumbs } from "./App";
import { Grid, Box, Tab, Tabs, Typography } from '@mui/material';
import { makeStyles, createStyles } from '@mui/styles'
import DataGrid, {Column, SortColumn} from 'react-data-grid';
import { GenericDataComponent } from '../components/GenericDataComponent'
import { FormControl, InputLabel, MenuItem, OutlinedInput } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { pageStyles, TabPanel, a11yProps } from './Common'
import { isNumber } from 'util';

interface ITeamSummaryProps{
}

interface ITeamSummary {
    id: string,
    title: string,
    matches?: number,
    deep?: number,
    deep_allowed?: number,
    draws?: number,
    loses?: number,    
    npxG?: number, //expected goals without penalties and own goals
    npxGA?: number, //expected goals without penalties and own goals against
    npxGD?: number, //npxG - npxGA
    pts?: number,
    scored?: number,  //goals scored.
    missed?: number, //goals against.
    goaldiff?: number,
    wins?: number,
    xG?: number,    //expected goals
    xGA?: number,   //expected goals against
    xpts?: number
}

export interface ITeam{
    id: string,
    title: string,
    history: ITeamSummary[]
}

export const TeamSummary = (props: ITeamSummaryProps) => {
    const [dataGridData, setDataGridData] = useState<any>([])
    const [tabValue, setTabValue] = useState<number>(0)
    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
    const [position, setPosition] = useState<string[]>([])
    const [games, setGames] = useState<number>(0)
    const [league, setLeague] = useState<string>("EPL")
    const [season, setSeason] = useState<number>(2022)

    const classes = pageStyles();

    const loadData = async() => {
        let data = await Auth.authFetch('/api/teams', {
            league: league,                        
            season: season            
        });
        if (data.status === 'OK'){
            let teamResults: ITeamSummary[] = []
            //console.log(data)
            data.results[0].forEach((v:ITeam, i:number) => {          
                let team: ITeamSummary = {id:"", title:"", pts: 0, scored: 0, matches: 0, wins: 0, loses: 0, draws: 0, missed:0, goaldiff: 0, deep:0, deep_allowed:0, xpts:0, xG:0, xGA:0, npxG:0, npxGA:0, npxGD:0 }
                team.id = v.id
                team.title = v.title
                let hist = games === 0 ? games : v.history.length - games
                for (let t = hist;t<v.history.length;t++){
                    let rec = v.history[t]
                    team.pts += rec.pts
                    team.scored += rec.scored
                    team.matches += rec.wins + rec.loses + rec.draws
                    team.wins += rec.wins
                    team.loses += rec.loses
                    team.draws += rec.draws   
                    team.missed += rec.missed 
                    team.deep += rec.deep
                    team.deep_allowed += rec.deep_allowed                 
                    team.xpts += rec.xpts
                    team.xG += rec.xG
                    team.xGA += rec.xGA                    
                    team.npxG += rec.npxG
                    team.npxGA += rec.npxGA
                    team.npxGD += rec.npxGD
                    team.goaldiff += (rec.scored - rec.missed)
                }
                team.xG = round2DecimalPlaces(team.xG)
                team.xGA = round2DecimalPlaces(team.xGA)
                team.npxG = round2DecimalPlaces(team.npxG)
                team.npxGA = round2DecimalPlaces(team.npxGA)
                team.npxGD = round2DecimalPlaces(team.npxGD)
                teamResults.push(team)
            })
            teamResults.sort((a, b) => b.pts - a.pts || b.goaldiff - a.goaldiff)
            
            setDataGridData(teamResults)         
        }       
        
        return true
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
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

    type Comparator = (a: ITeamSummary, b: ITeamSummary) => number;   
    const getComparator = (sortColumn: string): Comparator => {
        switch (sortColumn) {
            case 'title':           
            return (a, b) => {
                return a[sortColumn].localeCompare(b[sortColumn]);
            };           
            /*case 'wins':
            return (a, b) => {
                return a[sortColumn] - b[sortColumn];
            };*/
            default:
                return (a:any, b:any) => {
                    return a[sortColumn] - b[sortColumn];
                };
        }
    }

    const sortedRows = useMemo((): readonly ITeamSummary[] => {
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

    let loadState = useEffectToLoadData(loadData, [league, games, season])

    return (
        <div >
            <Breadcrumbs breadcrumbs={ [ "Team Summary" ] } />
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
    { key: 'title', name: 'Team', resizable: false, frozen: true, summaryFormatter() {
        return <strong>Total</strong>;
      }
    },
    { key: 'matches', name: 'Matches', resizable: true, width: 80 },
    { key: 'wins', name: 'Win', resizable: true, width: 80 },
    { key: 'draws', name: 'Draw', resizable: true, width: 80 },
    { key: 'loses', name: 'Loss', resizable: true, width: 80 },
    { key: 'scored', name: 'Scored', resizable: true, width: 80 },
    { key: 'missed', name: 'Against', resizable: true, width: 80 },  
    { key: 'goaldiff', name: 'Goal Diff', resizable: true, width: 80 },    
    { key: 'deep', name: 'Deep', resizable: true, width: 80 },
    { key: 'deep_allowed', name: 'Deep Allowed', resizable: true, width: 80 },
    { key: 'npxG', name: 'npxG', resizable: true, width: 80 },
    { key: 'npxGA', name: 'npxGA', resizable: true, width: 80 },
    { key: 'npxGD', name: 'npxGD', resizable: true, width: 80 },
    { key: 'xG', name: 'xG', resizable: true, width: 80 },
    { key: 'xGA', name: 'xGA', resizable: true, width: 80 },
    { key: 'pts', name: 'Points', resizable: true, width: 80 },
  ];