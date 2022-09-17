import { Config, ConfigEvent } from './types';

// Accepted events: https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers
const defaultEvents: ConfigEvent[] = [
    'abort',
    'animationcancel',
    'animationend',
    'animationiteration',
    'auxclick',
    'blur',
    'cancel',
    'canplay',
    'canplaythrough',
    'change',
    'click',
    'close',
    'contextmenu',
    'cuechange',
    'dblclick',
    'drag',
    'dragend',
    'dragenter',
    'dragexit',
    'dragleave',
    'dragover',
    'dragstart',
    'durationchange',
    'ended',
    'error',
    'focus',
    'formdata',
    'gotpointercapture',
    'input',
    'invalid',
    'keydown',
    'keypress',
    'keyup',
    'load',
    'loadeddata',
    'loadedmetadata',
    'loadend',
    'loadstart',
    'lostpointercapture',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseout',
    'mouseover',
    'mouseup',
    'pause',
    'play',
    'playing',
    'pointercancel',
    'pointerdown',
    'pointerenter',
    'pointerleave',
    'pointermove',
    'pointerout',
    'pointerover',
    'pointerup',
    'reset',
    'resize',
    'scroll',
    'select',
    'selectionchange',
    'selectstart',
    'submit',
    'touchcancel',
    'touchstart',
    'transitioncancel',
    'transitionend',
    'transitionrun',
    'transitionstart',
    'wheel'
];
let events: ConfigEvent[] & string[] = defaultEvents;
const getTokenRe = () =>
    new RegExp(`${TOKEN}|${window.encodeURIComponent(TOKEN)}`);
let TOKEN = '⚡';
let tokenRe = getTokenRe();

/**
 * If there are missing events from the `config` list of events (see
 *      https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers) which are valid & used within
 *      the application code, use this helper to add those events so the template renderer is aware of them.
 * @param eventsToAppend [Default: `ConfigEvent[]`] A list of event names missing from `ConfigEvent` which
 *      will be appended to the default list of events (see `ConfigEvent`.)
 * @returns The updated list of the `config` events.
 */
export const appendEvents = (eventsToAppend: string[]) =>
    ((events as unknown) = events.concat(eventsToAppend));

/**
 * Contains the framework configuration.
 */
export const config: Config = {
    events,
    TOKEN,
    tokenRe
};

/**
 * Use this to customize the `config` TOKEN used by the template renderer during dynamic value resolution.
 * @param value [Default: `'⚡'`] The TOKEN value to set in the `config`. This is the placeholder token
 *      used by the template renderer during dynamic value resolution.
 * @returns The `config` TOKEN value.
 */
export const setToken = (value: string) => {
    TOKEN = value;
    tokenRe = getTokenRe();
    return TOKEN;
};
