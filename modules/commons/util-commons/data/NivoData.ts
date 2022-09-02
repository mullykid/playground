import { dellColors, DELL_COLORS } from "../DellColorUtils";

export interface DataSerie<T = number> {
    id: string,
    label?: string,
    color?: string,
    data: DataSerieValue<T>[],
}

export interface DataSerieValue<T = number> {
    x: T,
    y: number
}

/**
 * This method creates data series 
 * 
 * @param data source data in format: { x, y1, y2, y3, ..., yn}[]
 * @param xKey name of the x property, exp. timestamp or x
 * @param yKeys name of the y properties to extract from, exp. [ "y1", "y2", ..., "yn" ]
 * @param labels optional list of labels for the data series that will be created. 
 */

export function createDataSeries<T>(data: { [name: string]: T | number}[], xKey: string, yKeys: string[], colors: string[], labels?: string[]): DataSerie<T>[] {
    let result: DataSerie<T>[] = [];

    for (let i=0; i<yKeys.length; i++) {
        let metricKey = yKeys[i];
        let metricLabel = (labels && labels[i]) || metricKey

        let formattedDataMetric: DataSerie<T> = {
            id: labels && labels[i] || metricLabel,
            data: [],
            color: colors[i] || DELL_COLORS[i % DELL_COLORS.length]
        }

        for (let dataRecord of data) {
            if (dataRecord[metricKey] !== undefined) {
                formattedDataMetric.data.push( {
                    x: dataRecord[xKey] as T,
                    y: dataRecord[metricKey] as number
                })
            }
        }

        result.push(formattedDataMetric)
    }

    return result;
}

export function mergeDataSeries<T>(data: DataSerie<T>[], xKey: string): { [name: string]: T | number }[] {
    let result = [] as { [name: string]: T | number }[];
    
    function findResultElem( x: T ) {
        let xx = result.filter( (v) => v[xKey] instanceof Date ? (v[xKey] as any).getTime() === (x as any).getTime() : v[xKey] === x);

        if (xx.length>0) {
            return xx[0];
        }
        else {
            let elem = { [xKey]: x }
            result.push(elem);

            return elem;
        }
    }

    for (let dataSerie of data) {
        for (let dataValue of dataSerie.data) {
            let elem = findResultElem( dataValue.x );
            elem[ dataSerie.id ] = dataValue.y;
        }
    }

    return result;
}