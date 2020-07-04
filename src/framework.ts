import {
    FrameworkSettings,
    TemplateOptions,
    TemplateSettings
} from './index.d';

export default class Framework {
    static Settings: FrameworkSettings = {
        debug: false
    };

    rootNode: Node;
    virtualNode: DocumentFragment = document.createDocumentFragment();

    constructor({
        rootNode = document.body as Node,
        settings = {}
    }: TemplateOptions) {
        this.rootNode = rootNode;
        Framework.Settings = Object.assign(Framework.Settings, settings);
    }

    load({ content, template }: TemplateSettings) {
        this.virtualNode.appendChild(template(content));
        return this;
    }

    render() {
        // Empty the root node.
        while (this.rootNode.firstChild) {
            this.rootNode.removeChild(this.rootNode.firstChild);
        }

        // Render the virtual node into the dom.
        this.rootNode.appendChild(this.virtualNode);
    }
}
