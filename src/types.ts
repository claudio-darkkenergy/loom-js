export interface Aria {
    label?: string;
    live?: 'assertive' | 'polite';
    role?: string;
}

// Framework
export type FrameworkSettings = PlainObject;

export interface FrameworkTemplate {
    (
        chunks: TemplateTagChunks,
        ...interpolations: TemplateTagValue[]
    ): DocumentFragment;
}

export interface NodeTemplateFunction<T = PlainObject> {
    (
        template: FrameworkTemplate,
        props: NodeTemplateFunctionProps<T>
    ): DocumentFragment;
}

export interface NodeTemplateFunctionBaseProps {
    aria?: Aria;
}

export type NodeTemplateFunctionProps<T = PlainObject> = {
    [P in keyof T]: T[P];
} &
    NodeTemplateFunctionBaseProps;

export type PlainObject<T = any> = { [key: string]: T };

/* Template */
export type DynamicTemplateNodesMap = Map<Node, number[]>;
export type TemplateEventHandler = EventListenerOrEventListenerObject;
export type TemplateNodeUpdate = (values: TemplateTagValue[]) => void;

export interface TemplateOptions {
    rootNode: Node;
    settings?: FrameworkSettings;
}

export interface TemplateSettings<T = PlainObject> {
    content: T;
    template: ComponentFunction<T>;
}

export interface TemplateStoreValue {
    /* Top-down [node, nodeIndex] */
    dynamicNodes: DynamicTemplateNodesMap;
    fragmentTemplate: DocumentFragment;
}

export interface TemplateUpdateStoreValue {
    chunks: TemplateTagChunks;
    updates: TemplateNodeUpdate[];
}

export type TemplateTagChunks = TemplateStringsArray & {
    raw: readonly string[];
};

export type TemplateTagValue =
    | Node
    | Node[]
    | null
    | number
    | string
    | TemplateEventHandler
    | undefined
    | void;

export interface ValueProp {
    value: TemplateTagValue;
}

// Component
export type ComponentFunction<T = NodeTemplateFunctionProps> = (
    props?: T,
    ctx?: ActivityContext
) => DocumentFragment;

export type ComponentWrapper = (
    template: NodeTemplateFunction
) => ComponentFunction;

// Event
export type MouseEventListener = <T = Element>(
    ev: SyntheticMouseEvent<T>
) => void;

export type SyntheticMouseEventListener = (this: HTMLElement, ev: MouseEvent) => any;

export interface SyntheticMouseEvent<T> extends MouseEvent {
    target: EventTarget & T;
}

// Activity
export interface ActivityContext {
    liveNodes?: ChildNode[];
    render?: FrameworkTemplate;
}

export type ActivityEffect<T = any> = (
    handler: ActivityHandler<T>
) => TemplateTagValue;

export type ActivityHandler<T = any> = (
    props?: ActivityHandlerProps<T>
) => TemplateTagValue;

export type ActivityHandlerProps<T> = ActivityValueProps<T> & ActivityMeta;

export interface ActivityMeta {
    ctx: ActivityContext;
}

export type ActivityUpdate<T = any> = (value: T) => void;

export interface ActivityValueProps<T> {
    value?: T;
}

export interface ActivityWorkers<T> {
    defaultValue?: T;
    effect: ActivityEffect<T>;
    update: ActivityUpdate<T>;
    value?: T;
}
