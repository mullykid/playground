import Loggers from '../logger/index' 

import * as Express from 'express'
import { IExpressProcessor } from 'periscope-commons/express/ExpressUtils';

const LOGGER = Loggers.getLogger("auth.MetaController")

export default class MetaController {
    constructor() {
    }

    bindToExpress(express: IExpressProcessor) {
        express.get('/meta/version.json', this.getMetaVersion)
        express.get('/meta/time', this.getTime);
    }

    getMetaVersion(req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) {
        let meta = {
            version: process.env.SERVICE_VERSION,
            build: process.env.BUILD_NUMBER
        }
        
        res.send(meta)
    }

    getTime(req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) {
        let currentTimeMilis = Date.now();
        
        let result = {
            currentTime: new Date(currentTimeMilis),
            currentTimeMilis
        }

        res.send(result);
    }
}
