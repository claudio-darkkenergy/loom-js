import * as globalConfig from './config';
import { FrameworkSettings, TemplateOptions, TemplateSettings } from './types';

export class Framework {
    static Settings: FrameworkSettings = {
        debug: false
    };

    rootNode: HTMLElement;
    virtualNode: DocumentFragment;

    constructor({ config = {}, rootNode, settings = {} }: TemplateOptions) {
        // Merge the all config inputs into one global config the framework will have access to.
        const { global } = Object.assign(
            globalConfig.config,
            { global: config.global || window },
            config
        );

        if (!global) {
            throw new Error(
                `Window must be set on the global config, but got ${global}`
            );
        }

        this.rootNode = rootNode || global.document.body;
        this.virtualNode = global.document.createDocumentFragment();
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
