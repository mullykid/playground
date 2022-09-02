import ConfigFileBackend from "./ConfigFileBackend"

import Loggers from '../logger/index';
import { parse } from "periscope-commons/EjsonParser";
import { decryptPassword, decryptPasswordOld, encryptPassword } from "../CryptoUtils";
import { deepCopy } from "../ObjectUtils";

const LOGGER = Loggers.getLogger("commons.UserCredentialsSecret");

export interface IUserCredentials {
    username: string,
    password: string
}

export interface IUserCredentialsPreparedToPersist {
    username: string,
    passwordEnc: string,
}

export class UserCredentialsSecret extends ConfigFileBackend<IUserCredentials, IUserCredentialsPreparedToPersist> {
    prepareForPersist(parsedData: any): IUserCredentialsPreparedToPersist | null {
        if (!parsedData.username) {
            throw "No username given in the config file."
        }
        
        if (!parsedData.password && !parsedData.passwordEnc) {
            throw "No password present!"
        }

        // Checking if the password is encrypted with old standard
        // If so, we are going to decrypt it and in next step encrypt with new algorithm
        if (!parsedData.password && parsedData.passwordEnc) {
            try {
                const password = decryptPasswordOld(parsedData.username + this.keySuffix, parsedData.passwordEnc);

                if (password) {
                    LOGGER.info("Password was persisteed with old encryption.")

                    parsedData.password = password;
                }
            } catch (error) {
                // Do nothing - password could not be decrypted with old algorythm
            }
        }

        if (parsedData.password) {
            LOGGER.info("Encrypting password.");
 
            return {
                username: parsedData.username,
                passwordEnc: encryptPassword(parsedData.username + this.keySuffix, parsedData.password)
            }
        }

        return null;
    }

    fillDefaults(data: IUserCredentialsPreparedToPersist): IUserCredentials {
        // At this stage the passwordEnc should always be present. 
        // But we'll make sure... 
        const decryptedPassword = decryptPassword(data.passwordEnc as string, data.username);
        if (decryptedPassword===undefined) {
            throw `Could not decrypt password.`
        }

        return {
            username: data.username,
            password: decryptedPassword
        };
    }

    constructor(filename: string, private readonly keySuffix = '') {
        super(filename);
    }
}