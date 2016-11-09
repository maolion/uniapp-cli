declare module 'cli-spinner' {
    export class Spinner {
        /** Creates a new spinner object with the default options. */
        constructor(name: string);
        
        /** Starts the spinner. */
        start(): void;

        /** Stops the spinner. Accepts a Boolean parameter to clean the console. */
        stop(clean?: boolean): void;

        /** Sets the spinner string. Accepts either a String or an Integer index to reference the built-in spinners. */
        setSpinnerString(spinnerString: number | string): void;
        
        /** Sets the spinner animation speed. */
        setSpinnerDelay(spinnerDelay: number): void;
        
        /** Sets the default spinner string for all newly created instances. Accepts either a String or an Integer index to reference the built-in spinners. */
        setDefaultSpinnerString(spinnerString: number | string): void;

        /** Sets the default spinner delay for all newly created instances. */
        setDefaultSpinnerDelay(spinnerDelay: number): void;

        /** Sets the spinner title. Use printf-style strings to position the spinner. */
        setSpinnerTitle(spinnerTitle: string): void;

        /** Returns true/false depending on whether the spinner is currently spinning. */
        isSpinning(): boolean;
    }
}