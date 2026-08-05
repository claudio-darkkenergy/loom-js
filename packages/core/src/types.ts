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

type ValidAttrValue = string | boolean | number | undefined | null;
type StyleProp = ValidAttrValue | Record<string, ValidAttrValue> | StyleProp[];

type PossibleAttrs = {
    [key: string]: ValidAttrValue | Record<string, ValidAttrValue>;
};

export type AttrsTemplateTagValue = PossibleAttrs & {
    id?: string;
    className?: string;
    style?: StyleProp;
};

export type OnTemplateTagValue = Record<
    string,
    EventListenerOrEventListenerObject
>;

type SpecialTemplateTagValue = AttrsTemplateTagValue | OnTemplateTagValue;

export interface TaggedTemplate {
    this?: ComponentContext;
    (
        chunks: TemplateStringsArray,
        ...interpolations: TemplateTagValue[]
    ): ComponentContext;
}

export type TemplateFunction<Props extends object = {}> = (
    html: TaggedTemplate,
    props: ComponentOutputProps<Props>
) => ComponentContext;

export type TemplateRoot = Comment | Element | Text;

export type TemplateRootArray = TemplateRoot[];

export type TemplateTagValueBase =
    | boolean
    | Component
    | ContextFunction
    | EventListenerOrEventListenerObject
    | EventListener
    | SyntheticRouteEventListener
    | Node
    | null
    | number
    | SpecialTemplateTagValue
    | string
    | TemplateRoot
    | TemplateRootArray
    | undefined
    | void;

export type TemplateTagValue =
    | TemplateTagValueBase
    | Record<string, TemplateTagValueBase>
    | TemplateTagValue[];

export type TemplateTagValueFunction = <T>(props?: T) => TemplateTagValue;

export type TemplateNodeUpdate = (
    value: TemplateTagValue,
    valueCtx?: ComponentContextPartial
) => void;

/* Component */
export type AnyComponent<Props extends object = {}> =
    Component<Props> | SimpleComponent<Props>;
// The component callable (external values to internal props)
export type Component<Props extends object = {}> = (
    props?: ComponentInputProps<Props>
) => ContextFunction;

// @deprecated
export type ComponentArgs<Props extends object = {}> = ComponentBaseProps &
    ComponentInputProps<Props>;

// @deprecated
export type ComponentProps<Props extends object = {}> =
    ComponentOutputProps<Props>;

export type ComponentInputProps<Props extends object = {}> = {
    [P in keyof Props]: Props[P];
} & ReservedProps;

export type ComponentBaseProps = LifeCycleHookProps & UtilityProps;

export type ComponentOutputProps<Props extends object = {}> =
    ComponentBaseProps & Omit<ComponentInputProps<Props>, 'ref'>;

// This is internal context for a component & its template,
// which essentially provides caching capabilities w/ associated meta-data.
export interface ComponentContext<Props extends object = {}>
    extends LifeCycleHandlerProps, Pick<ReservedProps, 'key' | 'ref'> {
    children: Map<number | string, ComponentContextPartial>;
    chunks: TemplateStringsArray;
    ctxScopes: Map<TemplateFunction<Props>, ComponentContextPartial>;
    fingerPrint: TemplateFunction<Props>;
    fragment: boolean;
    lifeCycleState: LifeCycleState;
    lifeCycles: LifeCycleHookProps;
    node: ContextNodeGetter;
    parent: ComponentContextPartial;
    props: ComponentInputProps<Props>;
    render: TaggedTemplate;
    refs: Set<RefContext>;
    root: TemplateRoot | TemplateRootArray;
    values: Es6Object<TemplateTagValue>;
}

export type ComponentContextPartial = Partial<ComponentContext>;
// Every component will get these.
export type UtilityProps = {
    createRef(): RefContext;
    ctxRefs(): IterableIterator<RefContext>;
    node: ContextNodeGetter;
};
export type ComponentBaseArgs = LifeCycleHookProps & UtilityProps;
// The component definition (internal props from external values)
// It takes a `TemplateFunction`.
export type ComponentFactory = <Props extends object = {}>(
    templateFunction: TemplateFunction<Props>
) => Component<Props>;

// Options for `defineElement`. Encapsulation is opt-in: with no `shadow`, a
// registered element renders into the light DOM, where app CSS applies.
export type DefineElementOptions = {
    shadow?: ShadowRootInit | false;
    // Pushed onto the shadow root's `adoptedStyleSheets`. Ignored without
    // `shadow` — light-DOM content is styled by the document already.
    styles?: CSSStyleSheet[];
};

// @deprecated
export type ComponentOptionalProps = ReservedProps;

export type ReservedProps = {
    attrs?: AttrsTemplateTagValue;
    children?: TemplateTagValue | TemplateTagValue[];
    className?: string;
    id?: string;
    key?: number | string;
    on?: OnTemplateTagValue;
    onClick?: SyntheticRouteEventListener | EventListenerOrEventListenerObject;
    ref?: RefContext;
    routeProps?: RouteValue;
    style?: StyleProp;
};

// `ComponentContext` related types
export type ContextFunction = (
    ctx?: ComponentContextPartial,
    dryRun?: boolean
) => ComponentContextPartial;
// Returns the parent of `TemplateRoot` or `TemplateRootArray`.
export type ContextNodeGetter = () => TemplateRoot | TemplateRootArray;

// A pass-through component
export type SimpleComponent<Props extends object = {}> = (
    props: ComponentInputProps<Props>
) => ContextFunction | ContextFunction[];

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
    extends Partial<LifeCycleHandlerProps>, LifeCycleHookProps {
    node?: ContextNodeGetter;
}

// @Deprecated
export type RenderFunction = TemplateFunction;

// @Deprecated
export type RenderProps = ComponentOutputProps;

/* Event */
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
