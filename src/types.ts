export interface Aria {
    label?: string;
    live?: 'assertive' | 'polite';
    role?: string;
}

export type AsyncComponentNode = () => Promise<ComponentNode>;
export type ComponentNode = ContextFunction | TemplateRoot;

export interface PlainObject<T = any> {
    [key: string]: T;
}

export interface ValueProp<T = TemplateTagValue> {
    value: T;
}

/* Template */
export type ContextNodeGetter = () => TemplateRoot | undefined;

export interface TaggedTemplate {
    this?: TemplateContext;
    (
        chunks: TemplateStringsArray,
        ...interpolations: TemplateTagValue[]
    ): TemplateRoot;
}

export interface TemplateContext {
    beforeRender?: LifeCycleHandler;
    created?: LifeCycleHandler;
    fingerPrint?: RenderFunction<unknown>;
    lifeCycles?: LifeCycleHandlerProps;
    mounted?: LifeCycleHandler;
    node?: ContextNodeGetter;
    ref?: RefContext;
    refs?: Set<RefContext>;
    render?: TaggedTemplate;
    rendered?: LifeCycleHandler;
    root?: TemplateRoot;
    unmounted?: LifeCycleHandler;
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

// Component
// The component callable (external values to internal props)
export interface Component<T = unknown> {
    (
        props?: T & {
            className?: string;
            ref?: RefContext;
        }
    ): ContextFunction;
}

// The component definition (internal props from external values)
export type ComponentFunction = <T = unknown>(
    renderFunction: RenderFunction<
        T &
            LifeCycleHandlerProps & {
                className?: string;
                ctx: () => RefContext;
                ctxRefs: () => IterableIterator<RefContext>;
                node: ContextNodeGetter;
            }
    >
) => Component<T>;

export type ContextFunction = (ctx?: TemplateContext) => TemplateRoot;
export type LifeCycleHandler = (node: Node | undefined) => any;

export interface LifeCycleHandlerProps {
    onBeforeRender: LifeCycleListener;
    onCreated: LifeCycleListener;
    onMounted: LifeCycleListener;
    onRendered: LifeCycleListener;
    onUnmounted: LifeCycleListener;
}

export type LifeCycleListener = (handler: LifeCycleHandler) => void;

export interface ReactiveComponent<T = any, P = any> {
    (transform?: (props?: T) => P): ComponentNode;
}

export type RefContext = Omit<
    TemplateContext,
    'fingerPrint' | 'lifeCycles' | 'ref' | 'render' | 'root'
> &
    LifeCycleHandlerProps;

export interface RenderFunction<T> {
    (render: TaggedTemplate, props: T): TemplateRoot;
}

// Event
export type MouseEventListener = <T>(ev?: SyntheticMouseEvent<T>) => void;

export type SyntheticMouseEventListener = (
    this: HTMLElement,
    ev: MouseEvent
) => any;

export type SyntheticMouseEvent<T = EventTarget> = Event & {
    currentTarget: T;
    target: T;
};

// Activity
export type ActivityEffect<T = any> = (
    handler: ActivityHandler<T>,
    cache?: any[]
) => ContextFunction;

export type ActivityHandler<T> = (
    props: ValueProp<T>
) => ComponentNode | AsyncComponentNode;
export type ActivityTransform<V, I = V> = (
    props: ValueProp<V> & {
        input: I;
        update: (valueInput: V, force?: boolean) => void;
    },
    force?: boolean
) => void | Promise<void>;

// Config
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
