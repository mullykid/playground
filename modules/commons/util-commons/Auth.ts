const BASE_URL = '/auth/login';
const LOCAL_STORAGE_SESSION = "savedSession";

const FETCH_CACHE_TIMEOUT = 60000; //60 secs

import { UrlBuilder } from './QueryParametersEnconding';
import * as EJSON from './EjsonParser';
import Loggers from './logger';
const LOGGER = Loggers.getLogger("commons.Auth");

import { AUTH_USERNAME, AUTH_ROLES, AUTH_TAGS } from "./HeaderNames"

interface ILoginResponse {
    data: any;
    result: string;
    token?: string;
    lastLoginTimestamp?: Date
}

export class AuthClass {
    session: ILoginResponse | null;
    _timeoutHandler?: () => void;

    constructor() {
        this.session = null;
    }

    setTimeOutHandler(handler: () => void) {
        this._timeoutHandler = handler;
    }

    timeoutHandler() {
        if (this._timeoutHandler) {
            this._timeoutHandler();
        }
    }

    async restoreSavedSession() {
        if (this.session) {
            return true;
        }

        let sessionToken = localStorage.getItem(LOCAL_STORAGE_SESSION);

        if (sessionToken) {
            try {
                if (await this.tryLogin({ token: sessionToken })) {
                    return true;
                }
            }
            catch (e) {
                //Do nothing - just assume we failed to restore session.
            }

            // If the login failed, removing the stored session token
            localStorage.removeItem(LOCAL_STORAGE_SESSION);
        }

        return false;
    }

    getAuthHeader() {
        if (this.session && this.session.token) {
            return "Token " + this.session.token;
        }

        return "";
    }

    buildHeaders(additionalHeaders: any = {}) {
        return { 
            ...additionalHeaders,
            
            Authorization: this.getAuthHeader()//,
           // [AUTH_TAGS]: (this.getAuthInfo().authTags || []).join(";"),
            //[AUTH_USERNAME]: this.getAuthInfo().username, 
            //[AUTH_ROLES]: this.getAuthInfo().roles.join(";")
        }
    }

    getAuthInfo() {
        if (this.session) {
            return this.session.data;
        }
        else {
            return null;
        }
    }

    getAuthTags() {
        let sessionInfo = this.getAuthInfo();

        if (sessionInfo && Array.isArray(sessionInfo.authTags)) {
            return sessionInfo.authTags as string[];
        }
        else {
            return [];
        }
    }

    async tryLogin(authData: ({ username: string, password: string } | { token: string })) {
        let authHeader = "";

        function isToken(authData: any): authData is { token: string } {
            return typeof authData.token === "string";
        }

        if (isToken(authData)) {
            authHeader = 'Token ' + authData.token
        }
        else {
            authHeader = 'Basic ' + Buffer.from(authData.username + ":" + authData.password).toString('base64')
        }

        let response = await fetch(BASE_URL + "?_ts=" + Date.now(), { headers: { Authorization: authHeader } });
        let responseAsJson = await response.json() as ILoginResponse;

        if (responseAsJson.result == 'success' && responseAsJson.token) {
            this.session = responseAsJson;

            localStorage.setItem(LOCAL_STORAGE_SESSION, responseAsJson.token);

            return true;
        }

        throw Object.assign(responseAsJson, response);
    }

    async authMethod(method: "POST" | "PUT" | "DELETE" | "PATCH" | "GET", url: string, payload: any, id: string | undefined, ...queryParams: any[]) {
        // If id is defined, we will add it as one path parameters. Otherwise supply empty array of path parameters
        url = this.buildUrl(url, queryParams, id!==undefined ? [ id ] : []);
        
        // Invalidate whole fetchCache instead of just this url: DELETE, POST, PUT and PATCH are executed extremely rare, usually around Admin features only
        // delete this.fetchCache[url]
        for (let x in this.fetchCache) {
            delete this.fetchCache[x]
        };

        let response = await fetch(url, {
            headers: this.buildHeaders( payload!==undefined ? { "Content-Type": "application/json" } : undefined ),
            method: method,
            body: payload!==undefined ? EJSON.stringify(payload) : undefined
        });

        let body: any = await response.text();

        try {
            body = EJSON.parse(body);
        }
        catch (error) {
            LOGGER.error("Could not parse {} as EJSON object. Returning string", body)
        }

        return { statusCode: response.status, body, ok: response.ok };
    }

    async authPost(url: string, obj: any, ...params: any[]) {
        return this.authMethod("POST", url, obj, undefined, ...params);
    }

    async authPut(url: string, obj: any, id?: any) {
        return this.authMethod("PUT", url, obj, id);
    }

    async authPatch(url: string, obj: any, id?: any) {        
        return this.authMethod("PATCH", url, obj, id);
    }

    async authDelete(url: string, id?: any) {
        return this.authMethod("DELETE", url, undefined, id);
    }

    authGet(url: string, ...params: any[]) {
        return this.authMethod("GET", url, undefined, undefined, ...params);
    }

    private buildUrl(url: string, queryParams: any[], pathParams: any[]) {
        let urlBuilder = new UrlBuilder(url);

        for (let pathParam of pathParams) {
            urlBuilder.addPathParameter(pathParam)
        }

        for (let queryParamsObject of queryParams) {
            for (let queryParamName in queryParamsObject) {
                let queryParamValue = queryParamsObject[queryParamName];
                // Skiping the parameters that are not actually set.
                if (queryParamValue !== undefined) {
                    urlBuilder.addQueryParameter(queryParamName, queryParamsObject[queryParamName]);
                }
            }
        }

        return urlBuilder.build();
    }

    readonly fetchCache: { [url: string]: Promise<any> } = {}

    authFetch(url: string, ...params: any[]) {
        const fullUrl = this.buildUrl(url, params, []);

        if (this.fetchCache[fullUrl] !== undefined) {
            LOGGER.debug("Request for url {} found in cache. Returning...", fullUrl);

            return this.fetchCache[fullUrl];
        }
        else {
            LOGGER.debug("Request for url {} not found in cache. Starting it...", fullUrl);

            // When the _authFetch promise resolves (successful or failed), 
            // start counting the FETCH_CACHE_TIMEOUT and remove the promise from cache when that time elapses. 
            let result = this._authFetch(fullUrl).finally(() => setTimeout(() => { delete this.fetchCache[fullUrl] }, FETCH_CACHE_TIMEOUT));
           
            // What we return must be the promise returned by the .finally() segment, not the original promise returned by _authFetch
            // Otherwise if there is exception in the original one, the .finally() promise will also throw an exception that will not be caught.
            return this.fetchCache[fullUrl] = result;
        }
    }

    async _authFetch(url: string) {
        let response = await fetch(url, { 
            headers: this.buildHeaders(),
        } );

        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                this.timeoutHandler()

                throw { code: response.status, codeName: 'InvalidSession', message: 'The session has expired', errmsg: 'The session has expired' }
            }

            try {
                let responsePayload = EJSON.parse(await response.text());

                if (responsePayload && responsePayload.error) {
                    throw responsePayload.error;
                }
            }
            catch (error) {
                //Do nothing
            }

            throw { code: response.status, codeName: 'UnknownError', errmsg: 'Ooops... Something went wrong' };
        }

        return EJSON.parse(await response.text());
    }

    logout() {
        localStorage.removeItem(LOCAL_STORAGE_SESSION);

        this.session = null;
    }

    async authPutForObjectId(url: string, obj: any, id?: any) {
        if (id !== undefined) {
            url += (url.endsWith("/") ? "" : "/") + encodeURIComponent(EJSON.stringify(id));
        }
        let response = await fetch(url, {
            headers: {
                Authorization: this.getAuthHeader(),
                "Content-Type": "application/json"
            },
            method: "PUT",
            body: EJSON.stringify(obj)
        });
        return response.status;
    }

}

export default new AuthClass();
