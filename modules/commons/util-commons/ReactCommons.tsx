import * as React from 'react'

import LOGGERS from 'util-commons/logger';
const LOGGER = LOGGERS.getLogger("components.ReactCommons");

/** What can be typically passed as a prop to a component and later rendered with simple { props.value } */
export type ReactElem<P = {}> = React.ReactElement<P> | string | null; 

/** What a FunctionComponent can return. Convienient to force it sometimes to verify if you're components are correct. */
export type FunctionComponentResult<P = {}> = React.ReactElement<P> | null;

/** Shared set of props */
export interface CommonProps extends React.PropsWithChildren<any> {
    className?: string,
    style?: React.CSSProperties
}

/** Shared set of props for components we want to define Height */
export interface CommonPropsWithHeight extends CommonProps {
    height?: number;
}

export interface CommonTableProps extends CommonPropsWithHeight {
    onRowClick?: (rowIndex: number, row: object) => void
}

export type BootstrapStyle = {primary?: boolean} | {success?: boolean} | {info?: boolean} | {danger?: boolean} | {warning?: boolean;}
export type BootstrapTextStyle = BootstrapStyle | {muted?: boolean}

// export interface BootstrapStyle {
//     primary?: boolean;
//     success?: boolean;
//     info?: boolean;
//     danger?: boolean;
//     warning?: boolean;
// }

// export interface BootstrapTextStyle extends BootstrapStyle {
//     muted?: boolean;
// }

export function getClassName(props: BootstrapTextStyle, baseClass: string, otherClassName?: string) {
    let suffix = "default"
    
    if ((props as any).primary) { suffix="primary" }
    if ((props as any).success) { suffix="success" }
    if ((props as any).info)    { suffix="info" }
    if ((props as any).danger)  { suffix="danger" }
    if ((props as any).warning) { suffix="warning" }
    if ((props as any).muted)   { suffix="muted" }
    
    return `${baseClass} ${baseClass}-${suffix}${otherClassName ? " " + otherClassName : ""}`;
}

export function validateProps(props: any) {
    let s = props.style as React.CSSProperties | undefined;

    if (s?.padding || s?.height || s?.paddingBottom || s?.paddingTop || s?.paddingLeft || s?.paddingRight ) {
        LOGGER.warn("You specified padding or height. This is illegal and is ignored.")

        delete s.padding;
        delete s.paddingLeft;
        delete s.paddingRight;
        delete s.paddingTop;
        delete s.paddingBottom;
        delete s.height;
    }
}

export function getHeight(height: number | 'auto' | undefined, defValue: number) {
    if (height==='auto' || height===undefined) {
        return defValue
    }

    return height;
}
/**
 * In React a function accessing the state receives the state from the moment the function is defined - not the current state.
 * Typically this is not an issue: if your state changed, the components gets rerendered which creates new instances of the functions with access to current state.
 * 
 * Consider following component. The onInc function gets the value v and sets the state to v+1. All good
 * 
 * const Exp = (props: any) => {
 *    const [ v, setV ] = useState<number>(0);
 * 
 *    const onInc = () => {
 *        setV( v+1 );
 *    }
 * }
 * 
 * Now, the problem starts when there is chance the same function is executed after the state has already changed.  
 * Using useRef, can solve it because it have always one value. But when you update the Ref it's not re-render.
 *
 * This hook creates a useState backwards compatible hook, that allows the developer:
 *   a) to access the most current value of the state variable, by using the useRef
 *   b) to modify the state variable by using the traditional setXXX
 * 
 * More info at: https://www.npmjs.com/package/react-usestateref
 */
export function useStateRef<S>(initValue: S): [S, React.Dispatch<React.SetStateAction<S>>, React.MutableRefObject<S>] {
    const [state, setState] = React.useState(initValue)
    const ref = React.useRef(state)

    // We don't want to create a new dispatch function again and again, so using the useCallback hook to memorize it.
    const dispatch = React.useCallback(function(val:any) {
        // Calculating a new value of the state variable. 
        // If the dispatch function received a function, we need to call it. Otherwise use the explicitly given value.
        ref.current = typeof val === "function" ? val(ref.current) : val

        // Updating the state variable, so that the re-rendering will happen.
        setState(ref.current)
    }, []);

    return [state, dispatch, ref]
}

export function useTimeout(callback: ()=>void, delay:number|null) {
    const timeoutRef = React.useRef<NodeJS.Timeout>();
    const callbackRef = React.useRef(callback);
  
    // Remember the latest callback:
    //
    // Without this, if you change the callback, when setTimeout kicks in, it
    // will still call your old callback.
    //
    // If you add `callback` to useEffect's deps, it will work fine but the
    // timeout will be reset.
    React.useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);
  
    // Set up the timeout:
  
    React.useEffect(() => {
        if (typeof delay === 'number') {
            timeoutRef.current = setTimeout(() => callbackRef.current(), delay);
  
            // Clear timeout if the components is unmounted or the delay changes:
            return () => timeoutRef.current && clearTimeout(timeoutRef.current);
        }
    }, [delay]);
  
    // In case you want to manually clear the timeout from the consuming component...:
    return timeoutRef.current;
  }
  