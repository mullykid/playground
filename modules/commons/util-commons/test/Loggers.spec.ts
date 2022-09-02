import { should, expect } from 'chai';
import DefLoggerFactory, {LoggerFactory, LogLevel, ILogger} from '../logger/index';

describe("LoggerFactory", ()=> {
    it("getParentLoggerName", ()=>{
        expect(DefLoggerFactory.getParentLoggerName("backend"), "ROOT");
        expect(DefLoggerFactory.getParentLoggerName("backend.genericComponent"), "backend");
        expect(DefLoggerFactory.getParentLoggerName("foo.bar.boo"), "foo.bar");
    })

    it("getLogger", () => {
        let [ LF, l1, l2, l3, l4, l5, l6 ] = initLoggers();

        expect(l1.isWarnEnabled()).true;
        expect(l1.isInfoEnabled()).false;

        expect(l2.isWarnEnabled()).true;
        expect(l2.isInfoEnabled()).false;

        expect(l3.isWarnEnabled()).true;
        expect(l3.isInfoEnabled()).true;
        expect(l3.isDebugEnabled()).true;
        expect(l3.isTraceEnabled()).false;
       
        expect(l4.isWarnEnabled()).true;
        expect(l4.isInfoEnabled()).true;
        expect(l4.isDebugEnabled()).true;
        expect(l4.isTraceEnabled()).false;

        expect(l5.isWarnEnabled()).true;
        expect(l5.isInfoEnabled()).true;
        expect(l5.isDebugEnabled()).true;
        expect(l5.isTraceEnabled()).false;

        expect(l6.isWarnEnabled()).true;
        expect(l6.isInfoEnabled()).true;
        expect(l6.isDebugEnabled()).false;
        expect(l6.isTraceEnabled()).false;
    });

    it("Test propagation on levelChange of defined logger", () => {
        let [ LF, l1, l2, l3, l4, l5, l6 ] = initLoggers();
    
        l3.setLogLevel(LogLevel.FATAL);

        expect(l3.isWarnEnabled()).false;
        expect(l3.isInfoEnabled()).false;
        expect(l3.isDebugEnabled()).false;
        expect(l3.isTraceEnabled()).false;
        expect(l3.isFatalEnabled()).true;
       
        expect(l4.isWarnEnabled()).false;
        expect(l4.isInfoEnabled()).false;
        expect(l4.isDebugEnabled()).false;
        expect(l4.isTraceEnabled()).false;
        expect(l4.isFatalEnabled()).true;

        expect(l5.isWarnEnabled()).false;
        expect(l5.isInfoEnabled()).false;
        expect(l5.isDebugEnabled()).false;
        expect(l5.isTraceEnabled()).false;
        expect(l5.isFatalEnabled()).true;

        expect(l6.isWarnEnabled()).true;
        expect(l6.isInfoEnabled()).true;
        expect(l6.isDebugEnabled()).false;
        expect(l6.isTraceEnabled()).false;
    })

    it("Test propagation on levelChange of undefined logger", () => {
        let [ LF, l1, l2, l3, l4, l5, l6 ] = initLoggers();
    
        l4.setLogLevel(LogLevel.FATAL);

        expect(l3.isFatalEnabled()).true;
        expect(l3.isWarnEnabled()).true;
        expect(l3.isWarnEnabled()).true;
        expect(l3.isInfoEnabled()).true;
        expect(l3.isDebugEnabled()).true;
        expect(l3.isTraceEnabled()).false;
       
        expect(l4.isWarnEnabled()).false;
        expect(l4.isInfoEnabled()).false;
        expect(l4.isDebugEnabled()).false;
        expect(l4.isTraceEnabled()).false;
        expect(l4.isFatalEnabled()).true;

        expect(l5.isWarnEnabled()).false;
        expect(l5.isInfoEnabled()).false;
        expect(l5.isDebugEnabled()).false;
        expect(l5.isTraceEnabled()).false;
        expect(l5.isFatalEnabled()).true;

        expect(l6.isWarnEnabled()).true;
        expect(l6.isInfoEnabled()).true;
        expect(l6.isDebugEnabled()).false;
        expect(l6.isTraceEnabled()).false;

        l5.setLogLevel(LogLevel.TRACE);

        expect(l5.isFatalEnabled()).true;
        expect(l5.isWarnEnabled()).true;
        expect(l5.isInfoEnabled()).true;
        expect(l5.isDebugEnabled()).true;
        expect(l5.isTraceEnabled()).true;

        expect(l6.isWarnEnabled()).true;
        expect(l6.isInfoEnabled()).true;
        expect(l6.isDebugEnabled()).false;
        expect(l6.isTraceEnabled()).false;

    })

    it("Test propagation on unsetting logLevel", () => {
        let [ LF, l1, l2, l3, l4, l5, l6 ] = initLoggers();
    
        expect(l3.isFatalEnabled()).true;
        expect(l3.isErrorEnabled()).true;
        expect(l3.isWarnEnabled()).true;
        expect(l3.isInfoEnabled()).true;
        expect(l3.isDebugEnabled()).true;
        expect(l3.isTraceEnabled()).false;

        l3.setLogLevel(undefined);

        expect(l3.isFatalEnabled()).true;
        expect(l3.isErrorEnabled()).true;
        expect(l3.isWarnEnabled()).true;
        expect(l3.isInfoEnabled()).false;
        expect(l3.isDebugEnabled()).false;
        expect(l3.isTraceEnabled()).false;
       
        expect(l4.isFatalEnabled()).true;
        expect(l4.isErrorEnabled()).true;
        expect(l4.isWarnEnabled()).true;
        expect(l4.isInfoEnabled()).false;
        expect(l4.isDebugEnabled()).false;
        expect(l4.isTraceEnabled()).false;

        expect(l5.isFatalEnabled()).true;
        expect(l5.isErrorEnabled()).true;
        expect(l5.isWarnEnabled()).true;
        expect(l5.isInfoEnabled()).false;
        expect(l5.isDebugEnabled()).false;
        expect(l5.isTraceEnabled()).false;

        expect(l6.isWarnEnabled()).true;
        expect(l6.isInfoEnabled()).true;
        expect(l6.isDebugEnabled()).false;
        expect(l6.isTraceEnabled()).false;
    })

    it("Test update configuration", () => {
        let [ LF, l1, l2, l3 ] = initLoggers();
    
        expect(l1.isWarnEnabled()).true;
        expect(l1.isInfoEnabled()).false;
        expect(l3.isDebugEnabled()).true;
        expect(l3.isTraceEnabled()).false;
    
        LF.setConfig( {
            loggers: {
                "ROOT": "INFO"
            }
        })
    
        expect(l1.isWarnEnabled()).true;
        expect(l1.isInfoEnabled()).true;
        expect(l1.isDebugEnabled()).false;
    
        expect(l3.isWarnEnabled()).true;
        expect(l3.isInfoEnabled()).true;
        expect(l3.isDebugEnabled()).false;
    })
})


function initLoggers(): [ LoggerFactory, ILogger, ILogger, ILogger, ILogger, ILogger, ILogger] {
    let LF = new LoggerFactory();
        
    LF.setConfig( {
        loggers: { 
            "ROOT": "WARN",
            "l1.l2.l3": "DEBUG",
            "l1.l2.l3.l4.l5.l6": "INFO"
        }
    });

    let l1 = LF.getLogger("l1");
    let l2 = LF.getLogger("l1.l2");
    let l3 = LF.getLogger("l1.l2.l3");
    let l4 = LF.getLogger("l1.l2.l3.l4");
    let l5 = LF.getLogger("l1.l2.l3.l4.l5");
    let l6 = LF.getLogger("l1.l2.l3.l4.l5.l6");
    
    return [ LF, l1, l2, l3, l4, l5, l6 ];
}