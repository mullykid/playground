import { getPropValue } from './ObjectUtils'
import { getCommandLineArg } from './CommandLine'

import * as Fs from 'fs'
import * as Path from 'path'

let camelCase = require('camelcase')

import Loggers from './logger/index';
const LOGGER = Loggers.getLogger('commons.config')

export default class ConfigHelper {
    private readonly configName: string;
    
    private readonly moduleName: string;
    private readonly baseDir: string;

    /** Array of loaded config objects, arranged from the most important to least important */
    private prodConfig: any;
    private devConfig: any;
    
    /** Will try to load */
    constructor(private readonly levelsUp: number = 1, configName: string = "config/config") {
        this.configName = configName;

        this.moduleName = Path.basename(process.cwd());
        this.baseDir = Path.dirname(process.cwd());

        this.loadConfigObjects();
    }

    private loadConfigObjects() {
        try {
            const configPath = this.findConfigFile(this.configName + ".js");
            this.prodConfig = this.loadConfigObject(configPath);
        }
        catch (error) {
            LOGGER.fatal("Configuration could not be read: ", error);
            process.exit(-1);
        }

        try {
            const configPath = this.findConfigFile(this.configName+"-dev.js");
            this.devConfig = this.loadConfigObject(configPath);
        }
        catch (error) {
            LOGGER.debug("Dev config cannot be read:", error)
        }
    }
    
    private readAndCompile(filename: string) {
        let fileContents = Fs.readFileSync(filename, { encoding: "utf8" } );
        let Module = require('module');
        var m = new Module();
        m._compile(fileContents, filename);
        return m.exports;
    }

    private loadConfigObject(path: string) {
        LOGGER.debug("Loading config", path);
        
        let configModule = this.readAndCompile(path);

        if (configModule.default) {
            return configModule.default;
        }

        throw `Could not find default export in the file ${path}. Make sure it is a well behaved js module and ends with module.exports.default=config statement`;
    }

    isDefined(configPropertyName: string): boolean {
        return this.getConfigValue(configPropertyName) !== undefined;
    }

    getConfigValue(configPropertyName: string, defValue: string): string;
    getConfigValue<T>(configPropertyName: string, defValue: T): T;
    getConfigValue(configPropertyName: string): any | undefined;

    getConfigValue(configPropertyName: string, defValue?: any): any {
        let configValue = defValue;
        
        // Checking if the prodConfig defines the value
        if (this.prodConfig) {
            configValue = getPropValue(this.prodConfig, configPropertyName, configValue); 
        }

        // Check if the devConfig overrides the value
        if (this.devConfig) {
            configValue = getPropValue(this.devConfig, configPropertyName, configValue);
        }

        // Check if the command line overrides the value
        let cmdOverrideName = "--" + camelCase(configPropertyName);
        return getCommandLineArg(cmdOverrideName, configValue as any);
    }

    getConfigValueOrFail(configPropertyName: string, errorMessage?: string): any {
        let result = this.getConfigValue(configPropertyName);

        if (result===undefined) {
            throw(`Config parameter ${configPropertyName} is required. ${errorMessage}`)
        }
        else {
            return result;
        }
    }

    isDevelopmentMode() {
        return this.devConfig !== undefined;
    }

    getModuleName() {
        // In production, the MODULE_NAME environment variable defines the name of the module.
        return process.env['MODULE_NAME'] ?? this.moduleName;
    }

    findConfigFile(configName: string) {
        let levelsUpLeft = this.levelsUp;
        let currentDir = '';

        let result: string | null = null;

        while (levelsUpLeft>=0) {
            let fullPath = Path.join( this.baseDir, currentDir, this.moduleName, configName )
    
            if (Fs.existsSync(fullPath)) {
                LOGGER.info("Found config file {}", fullPath)

                result=fullPath;
            }
            else {
                LOGGER.debug("Config file {} doesn't exists.", fullPath)
            }
            
            currentDir += "../"
            levelsUpLeft--;
        }

        if (result === null) {
            throw `Could not locate config file ${configName}`
        }

        return result;
    }
}
