function getCommandLineArg(name: string, def?: string): string;
function getCommandLineArg(name: string, def: number): number;

function getCommandLineArg(name: string, defaultValue?: any): any {
    for (let i=0; i<process.argv.length-1; i++) {
        if (process.argv[i] === name) {
            let strValue = process.argv[i+1]

            if (typeof defaultValue === "number") {
                return Number.parseFloat(strValue)
            }
            if (typeof defaultValue === "boolean") {
                return strValue.toLowerCase() === "true" || strValue.toLowerCase() === "yes"
            }
            
            return strValue;
        }
    }
    
    return defaultValue;
}

export { getCommandLineArg }