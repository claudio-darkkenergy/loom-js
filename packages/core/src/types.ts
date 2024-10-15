export interface AppGlobalConfig {
    debug?: boolean;
    debugScope?: ConfigDebugAllowable & object;
    events?: string[];
    token?: string;
}

export interface AppInitProps {
    app: ContextFunction;
    append?: boolean | null;
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

export type AttrsTemplateTagValue = PlainObject<TemplateTagValue> & {
    id?: string;
    className?: string;
    style?: TemplateTagValue | PlainObject<TemplateTagValue>;
};

export type OnTemplateTagValue =
    PlainObject<EventListenerOrEventListenerObject>;

type SpecialTemplateTagValue = AttrsTemplateTagValue | OnTemplateTagValue;

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
    | Component
    | ContextFunction
    | EventListenerOrEventListenerObject
    | MouseEventListener
    | SyntheticRouteEventListener
    | Node
    | null
    | number
    | PlainObject<TemplateTagValue>
    | SpecialTemplateTagValue
    | string
    | TemplateRoot
    | TemplateRootArray
    | TemplateTagValue[]
    | TemplateTagValueFunction
    | undefined
    | void;

export type TemplateTagValueFunction = <T>(props?: T) => TemplateTagValue;

export type TemplateNodeUpdate = (
    value: TemplateTagValue,
    valueCtx?: ComponentContextPartial
) => void;

/* Component */
export type AnyComponent<Props extends object = {}> =
    | Component<Props>
    | SimpleComponent<Props>;
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
    children: Map<number | string, ComponentContextPartial>;
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

export type ComponentOptionalProps = Partial<{
    attrs: AttrsTemplateTagValue;
    children: TemplateTagValue;
    className: string;
    id: string;
    key: string;
    on: OnTemplateTagValue;
    onClick: SyntheticRouteEventListener | EventListenerOrEventListenerObject;
    ref: RefContext;
    routeProps: RouteValue;
    style: TemplateTagValue | PlainObject<TemplateTagValue>;
}>;

// `ComponentContext` related types
export type ContextFunction = (
    ctx?: ComponentContextPartial,
    dryRun?: boolean
) => ComponentContextPartial;
// Returns the parent of `TemplateRoot` or `TemplateRootArray`.
export type ContextNodeGetter = () => TemplateRoot | TemplateRootArray;

// A pass-through component
export type SimpleComponent<
    Props extends object = {},
    Return extends TemplateTagValue = TemplateTagValue
> = (props: ComponentProps<Props>) => Return;

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

/* Event */
export type MouseEventListener = <T>(ev: SyntheticMouseEvent<T>) => void;

export type SyntheticMouseEventListener = (
    this: HTMLElement,
    ev: MouseEvent
) => any;
export type SyntheticMouseEvent<T = EventTarget> = Event & {
    ctrlKey: boolean;
    currentTarget: T;
    target: T;
};
export type SyntheticRouteEvent<T extends EventTarget = Element> = Event & {
    altKey: boolean;
    ctrlKey: boolean;
    currentTarget: T;
    metaKey: boolean;
    shiftKey: boolean;
    target: T;
};
export type SyntheticRouteEventListener = <
    T extends EventTarget = HTMLAnchorElement
>(
    event: SyntheticRouteEvent<T> | null,
    options?: OnRouteOptions
) => any;

/* Activity */
export type ActivityEffect<V> = (
    action: ActivityEffectAction<V>
) => ContextFunction;

export type ActivityEffectAction<V> = (
    valueProp: ValueProp<V>
) => TemplateTagValue;

export interface ActivityOptions<V = unknown, I = V> {
    deep?: boolean;
    force?: boolean;
    transform?: ActivityTransform<V, I>;
}

export type ActivityTransform<V = unknown, I = V> = (ctx: {
    input: I;
    update: (valueInput: V) => void;
    value: V;
}) => void | Promise<void>;

export type RouteValue = {
    raw: Location;
    matchedRoute?: string;
    params: {
        [key: string]: string;
    };
    pathname?: string | undefined;
};

export type ValueProp<V = unknown> = {
    value: V;
};

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

/* Utilities */
export type GetProps<T extends (props: any) => any> = T extends (
    props: infer P
) => any
    ? P
    : any;
