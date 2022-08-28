export interface AppInitProps {
    app: ComponentNode;
    append?: Boolean | null;
    onAppMounted?: (mountedApp: Node) => any;
    root?: HTMLElement;
}

export interface Aria {
    label?: string;
    live?: 'assertive' | 'polite';
    role?: string;
}

export interface PlainObject<T = any> {
    [key: string]: T;
}

export interface ValueProp<T = TemplateTagValue> {
    value: T;
}

/* Template */
export interface TaggedTemplate {
    this?: ComponentContextPartial;
    (
        chunks: TemplateStringsArray,
        ...interpolations: TemplateTagValue[]
    ): TemplateRoot;
}

export type TemplateRoot = Node | NodeListOf<ChildNode>;
export type TemplateTagValue =
    | boolean
    | ComponentNode
    | EventListenerOrEventListenerObject
    | MouseEventListener
    | null
    | number
    | string
    | TemplateTagValue[]
    | TemplateTagValueFunction
    | undefined
    | void;
export type TemplateTagValueFunction = () => TemplateTagValue;
export type TemplateNodeUpdate = (values: TemplateTagValue[]) => void;

/* Component */
// The component callable (external values to internal props)
export interface Component<T extends {} = {}> {
    (props?: T & Partial<RenderProps>): ContextFunction;
}

// This is internal context for a component & its template,
// which essentially provides caching capabilities w/ associated meta-data.
export interface ComponentContext extends LifeCycleHandlerProps {
    fingerPrint?: RenderFunction<never>;
    lifeCycles?: LifeCycleHookProps;
    node?: ContextNodeGetter;
    ref?: RefContext;
    refs?: Set<RefContext>;
    render?: TaggedTemplate;
    root?: TemplateRoot;
}

export type ComponentNodeAsync = () => Promise<ComponentNode>;
export type ComponentNode = ContextFunction | TemplateRoot;
export type ComponentContextPartial = Partial<ComponentContext>;
// Every component will get these.
// `className` could be `undefined` since that would need to get passed
// into the component as a prop.
export type ComponentDefaultProps = LifeCycleHookProps & {
    ctx(): RefContext;
    ctxRefs(): IterableIterator<RefContext>;
    node: ContextNodeGetter;
};
// The component definition (internal props from external values)
// It takes a `RenderFunction`.
export type ComponentFactory = <T extends {} = {}>(
    renderFunction: RenderFunction<T & RenderProps>
) => Component<T>;

export interface ComponentOptionalProps {
    children?: TemplateTagValue;
    className?: string;
    ref?: RefContext;
}

// `ComponentContext` related types
export type ContextFunction = (ctx?: ComponentContextPartial) => TemplateRoot;
export type ContextNodeGetter = () => TemplateRoot | null | undefined;

/* Life-cycles */
export type LifeCycleHandler = (node: Node | undefined) => any;

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

export interface ReactiveComponent<T = any, P = any> {
    (transform?: (props?: T) => P): ComponentNode;
}

export interface RefContext
    extends Partial<LifeCycleHandlerProps>,
        LifeCycleHookProps {
    node?: ContextNodeGetter;
}

export interface RenderFunction<P = {}> {
    (render: TaggedTemplate, props: P & RenderProps): TemplateRoot;
}

export type RenderProps = ComponentDefaultProps & ComponentOptionalProps;

/* Event */
export type MouseEventListener = <T>(ev?: SyntheticMouseEvent<T>) => void;
export type SyntheticMouseEventListener = (
    this: HTMLElement,
    ev: MouseEvent
) => any;
export type SyntheticMouseEvent<T = EventTarget> = Event & {
    currentTarget: T;
    target: T;
};

/* Activity */
export type ActivityEffect<T = any> = (
    handler: ActivityHandler<T>,
    cache?: any[]
) => ContextFunction;
export type ActivityHandler<T> = (
    props: ValueProp<T>
) => ComponentNode | ComponentNodeAsync;
export type ActivityTransform<V, I = V> = (
    props: ValueProp<V> & {
        input: I;
        update: (valueInput: V, force?: boolean) => void;
    },
    force?: boolean
) => void | Promise<void>;

/* Routing */
export interface OnRouteOptions {
    href?: string;
    onHash?: (loc: Location) => void;
    replace?: boolean;
}

export interface RouteUpdateHandler {
    (loc: Location): any;
}

/* Config */
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
}

export type GlobalWindow = Window & typeof globalThis;

export interface NodeFilter {
    SHOW_ALL: -1;
}

export interface GlobalConfig {
    config: Config;
}
