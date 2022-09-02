import * as Crypto from "crypto";

import * as FormatUtils from 'periscope-commons/FormatUtils'

const ALGORITHM = 'aes-256-ctr';
const SECRET_KEY = 'lkjsfksdflkasd12lk3jlksdfsdfsdfk'
const IV_LEN = 16;
const IV = Crypto.randomBytes(IV_LEN);

export function encryptPassword(password: string, username: string) {
    const cipher = Crypto.createCipheriv(ALGORITHM, ('utf-8' + username + SECRET_KEY).substring(0, 32), IV);
    const encrypted = Buffer.concat( [cipher.update(Buffer.from(password, 'utf-8')), cipher.final()]);

    return IV.toString('hex') + encrypted.toString('hex');
}

export function decryptPassword(passwordEnc: string | null | undefined, username: string) {
    // If the passwordEnc is empty string, undefined or null
    if (!passwordEnc) {
        return undefined;
    }
    
    const iv = Buffer.from(passwordEnc.substr(0, IV_LEN*2), 'hex');
    const encrypted = Buffer.from(passwordEnc.substr(IV_LEN*2), 'hex');

    const cipher = Crypto.createDecipheriv(ALGORITHM, ('utf-8' + username + SECRET_KEY).substring(0, 32), iv);
    const decrpyted = Buffer.concat( [cipher.update(encrypted), cipher.final()]);

    return decrpyted.toString('utf-8');
}

// This is a legacy function to decode passwords already stored in files, but using old encryption
export function decryptPasswordOld(key: string, text: string) {
    const CRYPT_ALG = 'aes-256-cbc';
    const IV= "1231123498765432"
    
    let encryptedText = Buffer.from(text, 'hex');
    let decipher = Crypto.createDecipheriv(CRYPT_ALG, Buffer.from(FormatUtils.padString(key, 32, "0")), IV);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export function getPasswordHash(username: string, password: string) {
    let hash = Crypto.createHmac('sha1', 'utf8' + username);

    hash.update(password, 'utf8');
    return hash.digest("hex");
}
