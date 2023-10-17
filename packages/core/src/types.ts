export interface AppGlobalConfig {
    debug?: boolean;
    debugScope?: ConfigDebugAllowable & object;
    events?: string[];
    token?: string;
}

export interface AppInitProps {
    app: ContextFunction;
    append?: Boolean | null;
    globalConfig?: AppGlobalConfig;
    onAppMounted?: (mountedApp: Element) => any;
    root?: Element | null;
}

export interface Aria {
    label?: string;
    live?: 'assertive' | 'polite';
    role?: string;
}

export interface Es6Object<T = unknown> {
    [key: string | symbol]: T;
}

export interface LoomGlobal {
    console: Console;
}

export interface PlainObject<T = unknown> {
    [key: string]: T;
}

/* Template */
export interface TaggedTemplate {
    this?: ComponentContext;
    (
        chunks: TemplateStringsArray,
        ...interpolations: TemplateTagValue[]
    ): ComponentContext;
}

export interface TemplateFunction<Props extends object = {}> {
    (html: TaggedTemplate, props: ComponentArgs<Props>): ComponentContext;
}

export type TemplateRoot = Comment | Element | Text;

export type TemplateRootArray = TemplateRoot[];

export type TemplateTagValue =
    | boolean
    | ContextFunction
    | EventListenerOrEventListenerObject
    | MouseEventListener
    | Node
    | null
    | number
    | string
    | TemplateRoot
    | TemplateRootArray
    | TemplateTagValue[]
    | TemplateTagValueFunction
    | undefined
    | void;

export type TemplateTagValueFunction = () => TemplateTagValue;

export type TemplateNodeUpdate = (
    value: TemplateTagValue,
    valueCtx?: ComponentContextPartial
) => void;

/* Component */
// The component callable (external values to internal props)
export type Component<Props extends object = {}> = (
    props?: ComponentProps<Props>
) => ContextFunction;

export type ComponentArgs<Props extends object = {}> = ComponentBaseArgs &
    ComponentProps<Props>;

export type ComponentProps<Props extends object = {}> = {
    [P in keyof Props]: Props[P];
} & ComponentOptionalProps;
// Partial<ComponentOptionalProps> & T & Partial<ComponentBaseArgs>;

// This is internal context for a component & its template,
// which essentially provides caching capabilities w/ associated meta-data.
export interface ComponentContext<Props extends object = {}>
    extends LifeCycleHandlerProps {
    children: ComponentContextPartial[];
    chunks: TemplateStringsArray;
    ctxScopes: Map<TemplateFunction<Props>, ComponentContextPartial>;
    fingerPrint: TemplateFunction<Props>;
    fragment: boolean;
    key: string;
    lifeCycleState: LifeCycleState;
    lifeCycles: LifeCycleHookProps;
    node: ContextNodeGetter;
    parent: ComponentContextPartial;
    props: ComponentProps<Props>;
    render: TaggedTemplate;
    ref: RefContext;
    refs: Set<RefContext>;
    root: TemplateRoot | TemplateRootArray;
    values: Es6Object<TemplateTagValue>;
}

export type ComponentContextPartial = Partial<ComponentContext>;
// Every component will get these.
export type ComponentBaseArgs = LifeCycleHookProps & {
    createRef(): RefContext;
    ctxRefs(): IterableIterator<RefContext>;
    node: ContextNodeGetter;
};
// The component definition (internal props from external values)
// It takes a `TemplateFunction`.
export type ComponentFactory = <Props extends object = {}>(
    templateFunction: TemplateFunction<Props>
) => Component<Props>;

export interface ComponentOptionalProps {
    children?: TemplateTagValue;
    className?: string;
    key?: string;
    onClick?: MouseEventListener;
    ref?: RefContext;
}

// `ComponentContext` related types
export type ContextFunction = (
    ctx?: ComponentContextPartial
) => ComponentContextPartial;
// Returns the parent of `TemplateRoot` or `TemplateRootArray`.
export type ContextNodeGetter = () => TemplateRoot | TemplateRootArray;

/* Life-cycles */
export type LifeCycleHandler = (root?: TemplateRoot | TemplateRootArray) => any;

// Life-cycle handlers counterparts for caching the handlers.
// The handler will never change once set for a component.
export interface LifeCycleHandlerProps {
    beforeRender: LifeCycleHandler;
    created: LifeCycleHandler;
    mounted: LifeCycleHandler;
    rendered: LifeCycleHandler;
    unmounted: LifeCycleHandler;
}

// Life-cycle hooks are passed to each component as default props.
export interface LifeCycleHookProps {
    onBeforeRender: LifeCycleHook;
    onCreated: LifeCycleHook;
    onMounted: LifeCycleHook;
    onRendered: LifeCycleHook;
    onUnmounted: LifeCycleHook;
}

export type LifeCycleHook = (handler: LifeCycleHandler) => void;

export type LifeCycleState = {
    value: keyof LifeCycleHandlerProps | null;
};

export interface ReactiveComponent<T = any, P = any> {
    (transform?: (props?: T) => P): ContextFunction;
}

export interface RefContext
    extends Partial<LifeCycleHandlerProps>,
        LifeCycleHookProps {
    node?: ContextNodeGetter;
}

// @Deprecated
export type RenderFunction = TemplateFunction;

// @Deprecated
export type RenderProps = ComponentProps;

// A pass-through component
export type SimpleComponent<Props extends object> = (
    props: ComponentProps<Props>
) => TemplateTagValue;

/* Event */
export type MouseEventListener = <T>(ev: SyntheticMouseEvent<T>) => void;

export type SyntheticMouseEventListener = (
    this: HTMLElement,
    ev: MouseEvent
) => any;
export type SyntheticMouseEvent<T = EventTarget> = Event & {
    currentTarget: T;
    target: T;
};

/* Activity */
export type ActivityEffect<V> = (
    action: ActivityEffectAction<V>
) => ContextFunction;

export type ActivityEffectAction<V> = (
    valueProp: ValueProp<V>
) => TemplateTagValue;

export interface ActivityOptions {
    deep?: boolean;
    force?: boolean;
}

export type ActivityTransform<V = unknown, I = V> = (
    ctx: { value: V } & {
        input: I;
        update: (valueInput: V) => void;
    }
) => void | Promise<void>;

export interface ValueProp<V = unknown> {
    value: V;
}

/* Routing */
export interface OnRouteOptions {
    href?: string;
    replace?: boolean;
}

/* Config */
export type ConfigDebug = false | ConfigDebugAllowable;

export interface ConfigDebugAllowable {
    activity?: boolean;
    creation?: boolean;
    console?: boolean;
    error?: boolean;
    mutations?: boolean;
    updates?: boolean;
    warn?: boolean;
}

export type ConfigEvent =
    | 'abort'
    | 'animationcancel'
    | 'animationend'
    | 'animationiteration'
    | 'auxclick'
    | 'blur'
    | 'cancel'
    | 'canplay'
    | 'canplaythrough'
    | 'change'
    | 'click'
    | 'close'
    | 'contextmenu'
    | 'cuechange'
    | 'dblclick'
    | 'drag'
    | 'dragend'
    | 'dragenter'
    | 'dragexit'
    | 'dragleave'
    | 'dragover'
    | 'dragstart'
    | 'durationchange'
    | 'ended'
    | 'error'
    | 'focus'
    | 'formdata'
    | 'gotpointercapture'
    | 'input'
    | 'invalid'
    | 'keydown'
    | 'keypress'
    | 'keyup'
    | 'load'
    | 'loadeddata'
    | 'loadedmetadata'
    | 'loadend'
    | 'loadstart'
    | 'lostpointercapture'
    | 'mousedown'
    | 'mouseenter'
    | 'mouseleave'
    | 'mousemove'
    | 'mouseout'
    | 'mouseover'
    | 'mouseup'
    | 'pause'
    | 'play'
    | 'playing'
    | 'pointercancel'
    | 'pointerdown'
    | 'pointerenter'
    | 'pointerleave'
    | 'pointermove'
    | 'pointerout'
    | 'pointerover'
    | 'pointerup'
    | 'reset'
    | 'resize'
    | 'scroll'
    | 'select'
    | 'selectionchange'
    | 'selectstart'
    | 'submit'
    | 'touchcancel'
    | 'touchstart'
    | 'transitioncancel'
    | 'transitionend'
    | 'transitionrun'
    | 'transitionstart'
    | 'wheel';

export interface Config {
    events: ConfigEvent[] & string[];
    TOKEN: string;
    tokenRe: RegExp;
    tokenReGlobal: RegExp;
}

export type GlobalWindow = Window & typeof globalThis;

export interface NodeFilter {
    SHOW_ALL: -1;
}

export interface GlobalConfig {
    config: Config;
}
