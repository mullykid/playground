import * as Express from "express"
import Loggers from '../logger/index' 

const LOGGER = Loggers.getLogger("commons.express.Utils");

export type HandleFunction = (req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) => void | Promise<void>;

export interface IExpressProcessor {
    get:    (path: string, handle: HandleFunction) => void;
    patch:  (path: string, handle: HandleFunction) => void;
    put:    (path: string, handle: HandleFunction) => void;
    post:   (path: string, handle: HandleFunction) => void;
    delete: (path: string, handle: HandleFunction) => void;

    listen(port: number, hostname?: string): Promise<void>
}

abstract class AbstractExpressHandlerWithoutListen<T extends (IExpressProcessor | Express.Express)> implements IExpressProcessor {
    readonly next: T;
    
    constructor(next: T) {
        this.next = next;
    }

    abstract handleRequest(handle: HandleFunction, req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction): void
    abstract listen(port: number, hostname?: string): Promise<void>;

    patch(path: string, handle: HandleFunction): void {
        this.next.patch(path, (req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) => this.handleRequest(handle, req, res, errorHandler))
    }

    get(path: string, handle: HandleFunction): void {
        this.next.get(path, (req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) => this.handleRequest(handle, req, res, errorHandler))
    }

    post(path: string, handle: HandleFunction): void {
        this.next.post(path, (req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) => this.handleRequest(handle, req, res, errorHandler))
    }

    put(path: string, handle: HandleFunction): void {
        this.next.put(path, (req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) => this.handleRequest(handle, req, res, errorHandler))
    }

    delete(path: string, handle: HandleFunction): void {
        this.next.delete(path, (req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) => this.handleRequest(handle, req, res, errorHandler))
    }

    useController(...controllers: IController[]) {
        for (let controller of controllers) {
            controller.bindToExpress(this);
        }

        return this;
    }
}

export abstract class AbstractExpressHandler extends AbstractExpressHandlerWithoutListen<IExpressProcessor> {
    listen(port: number, hostname?: string) {
        return this.next.listen(port, hostname);
    }
}

export class ExpressWrapper extends AbstractExpressHandlerWithoutListen<Express.Express> implements IExpressProcessor {
    constructor(expressApp: Express.Express = Express().use(Express.json())) {
        super(expressApp);
    }

    // This is a handy wrapper that makes sure that there is no unhandled exception inside asynchronous Express handles
    // If an error arrives, it will be cought and passed to the next function. 
    async handleRequest(handle: HandleFunction, req: Express.Request, res: Express.Response, next: Express.NextFunction) { 
        try {
            // Some handles might already take the next function into account, so we add it for compatibility...
            await handle(req, res, next);
        }
        catch (error) {
            next(error);
        }
    }

    listen(port: number, hostname?: string): Promise<void> {
        return new Promise( (resolve, reject) => {
            let callback = () => {
                LOGGER.info("Express listening on port {}", port);

                resolve();
            }
            
            try {
                if (hostname) {
                    this.next.listen(port, hostname, callback);
                }
                else {
                    this.next.listen(port, callback);
                }    
            }
            catch (error) {
                reject(error);
            }
        })
    }
}

export class ExpressLoggingHandler extends AbstractExpressHandler {
    async handleRequest(handle: HandleFunction, req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) {
        return handle(req, res, errorHandler);
    }

    constructor(i: IExpressProcessor) {
        super(i);

        LOGGER.error("ExpressLoggingHandler is deprecated, should not be used!")
    }
}

export class ExpressNotFoundErrorHandler extends AbstractExpressHandler {
    async handleRequest(handle: HandleFunction, req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) {
        try {
            await handle(req, res, errorHandler);
        }
        catch (error: any) {
            const errorMessage = error.message || error;
            if (typeof errorMessage==="string" && errorMessage.toLocaleLowerCase()==="not found") {
                throw new HttpException(404, `Cannot find ${req.url}`)
            }
            else {
                throw error;
            }
        }
    }
}

export class MongoErrorHandler extends AbstractExpressHandler {
    handleError(req: Express.Request, res: Express.Response, error: any) {
        let errorName = error.name;
        let errorMessage = error.errorMessage;

        if (errorName==="MongoNetworkError" || errorName==="MongoError" && errorMessage==="Topology was destroyed") {
            LOGGER.fatal("Connection to MongoDB lost. Killing the service");

            process.exit(-1);
        }

        throw error;
    }

    async handleRequest(handle: HandleFunction, req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) {
        try {
            await handle(req, res, errorHandler);
        }
        catch (error) {
            this.handleError(req, res, error);
        }
    }
}

export class HttpExceptionHandler extends AbstractExpressHandler { 
    private static LOGGER = Loggers.getLogger("commons.express.RequestLogger")

    async handleRequest(handle: HandleFunction, req: Express.Request, res: Express.Response, errorHandler: Express.NextFunction) {
        try {
            HttpExceptionHandler.LOGGER.info("{} {}", req.method, req.url);

            await handle(req, res, errorHandler);

            // If the response at this time is not finished, we'll send an OK response
            if (!res.finished) {
                res.send({result: "OK"})
            }
        }
        catch (error) {
            HttpExceptionHandler.LOGGER.error("{} {}: Error while processing request. {}", req.method, req.url, error);

            const errorResponse = error instanceof HttpException ? error : {
                code: 500,
                message: "Internal server error"
            };

            res.status(errorResponse.code).send({
                result: "Error",
                message: errorResponse.message
            })
        }
        finally {
            HttpExceptionHandler.LOGGER.debug("{} {}: Done", req.method, req.url);
        }
    }
}

export class HttpException {
    public constructor(readonly code: number, readonly message: string) {
    }
}

export interface IController {
    bindToExpress(express: IExpressProcessor): void;
}