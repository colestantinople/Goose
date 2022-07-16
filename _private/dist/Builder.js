import { GooseUtil } from "./Util.js";
;
export class GooseBuilder {
    static _RESERVED_NAMES = [
        '-body',
        '-insert',
        '-slot',
    ];
    static resourcesWithLoadedCSS = [];
    static resourcesWithLoadedJS = [];
    // Components for which errors have been emitted
    static errorComponents = [];
    static componentsWithErrorMessagesLogged = [];
    static _config = null;
    static _prefix = null;
    static async getConfig() {
        if (this._config)
            return this._config;
        const response = await GooseUtil.sendRequest('/Goose/goose-config.json');
        this._config = JSON.parse(response);
        return this._config;
    }
    static async getPrefix() {
        if (this._prefix)
            return this._prefix;
        else {
            const config = await this.getConfig();
            if (config.prefix)
                this._prefix = config.prefix;
            else
                this._prefix = 'goose';
        }
        return this._prefix;
    }
    static async getReservedNames() {
        const prefix = await this.getPrefix();
        return this._RESERVED_NAMES.map((suffix) => prefix + suffix);
    }
    static async build(outerElement, previousElements) {
        const prefix = await this.getPrefix();
        const config = await this.getConfig();
        const gooseTags = GooseUtil.uniqueFilter(Array.from(outerElement.innerHTML.match(new RegExp(`<${prefix}-([^>]*)>`, 'g')) ?? []).map((fullOpenTag) => {
            return fullOpenTag.replace(/\%3E/g, '>') // remove html escape
                .replace(/[<>]/g, '') // remove arrow braces
                .split(' ')[0]; // remove attributes
        }));
        await Promise.all(gooseTags.map(async (tagName) => {
            // don't try to build goose-body, goose-slot, goose-insert, etc.
            const reservedNames = await GooseBuilder.getReservedNames();
            if (reservedNames.includes(tagName.toLowerCase()))
                return;
            // check for invalid structure
            if (GooseBuilder.errorComponents.includes(tagName))
                return;
            GooseBuilder.checkForRecursiveBuild(tagName, previousElements);
            // load CSS and get components
            await this.loadCSS(tagName);
            const elements = Array.from(outerElement.querySelectorAll(tagName));
            // fill HTML
            const html = await GooseUtil.sendRequest(`/Goose/components/${tagName}/${tagName}.html`);
            await Promise.all(elements.map(async (element) => {
                return new Promise(async (subResolve) => {
                    const contents = await this.fillHTMLTemplate(html, element, previousElements.concat(tagName));
                    if (config.show_structure) {
                        element.innerHTML = contents;
                    }
                    else {
                        element.insertAdjacentHTML('afterend', contents);
                        element.remove();
                    }
                    subResolve();
                });
            }));
            // load JS
            this.loadJS(tagName);
        }));
    }
    // catch recursive component implementations
    static async checkForRecursiveBuild(tagName, previousElements) {
        if (previousElements.includes(tagName)) {
            // IMMEDIATELY push into errorComponents to prevent multithread re-runs
            GooseBuilder.errorComponents.push(tagName);
            // Build error message
            let loopTree = '';
            for (let i = previousElements.indexOf(tagName); i < previousElements.length; i++) {
                loopTree += previousElements[i] + ' -> ';
                GooseBuilder.errorComponents.push(previousElements[i]);
            }
            loopTree += tagName;
            if (!GooseBuilder.componentsWithErrorMessagesLogged.includes(tagName)) {
                GooseBuilder.componentsWithErrorMessagesLogged.push(tagName);
                throw new Error(['Goose Error: Recursive component implementation.\n',
                    'It appears that you have included a component within itself, possibly in a roundabout way through',
                    'other components.  Such a loop would result in an infinite loading cycle; Goose has prevented this.\n',
                    'Thank Mr Goose.\n',
                    'The cycle is found in the components: '
                ].join('\n') + loopTree);
            }
            else
                return;
        }
    }
    static async fillHTMLTemplate(template, originalElement, previousElements) {
        const prefix = await this.getPrefix();
        const config = await GooseBuilder.getConfig();
        // use a container to allow HTML tree parsing
        const container = document.createElement('div');
        container.innerHTML = template;
        // replace <goose-body/>
        const body = container.querySelector(`${prefix}-body`);
        if (body)
            body.replaceWith(originalElement.innerHTML);
        // replace <goose-slot-i/>
        const slots = Array.from(container.querySelectorAll(`${prefix}-slot`));
        const slotIDs = slots.map((slot) => {
            return slot.getAttribute('data-slot-id');
        });
        const slotInserts = Array.from(originalElement.children).filter((child) => {
            return child.tagName.toLowerCase() === `${prefix}-insert`;
        });
        await Promise.all(slots.map((slot, i) => {
            const id = slotIDs[i];
            const inserts = slotInserts.filter((insert) => {
                return insert.getAttribute('data-slot-id') === id;
            });
            if (inserts.length === 0)
                return; // no insert given
            if (inserts.length > 1)
                throw new Error(`Too many inserts for slot ${i} of ${originalElement.tagName.toLowerCase()}`);
            return new Promise(async (resolve, reject) => {
                const appendedNode = config.show_structure ? inserts[0] : inserts[0].childNodes[0];
                await GooseBuilder.replaceTemplateWith(slot, appendedNode);
                resolve();
            });
        }));
        // handle goose-insert- and data-goose- attributes
        let replacedHTML = container.innerHTML;
        Array.from(originalElement.attributes).forEach((attribute) => {
            if (!attribute.nodeName.includes(`data-${prefix}-`))
                return;
            const name = attribute.nodeName.split(`data-${prefix}-`)[1];
            const value = attribute.nodeValue;
            replacedHTML = replacedHTML.replace(new RegExp(`${prefix}-insert-${name}`, 'g'), value);
        });
        container.innerHTML = replacedHTML;
        // replace all goose-components within the container
        await GooseBuilder.build(container, previousElements);
        return container.innerHTML;
    }
    static async loadCSS(componentName) {
        const path = GooseUtil.getRelativeUrlPath(`/Goose/components/${componentName}/${componentName}.css`);
        GooseBuilder.loadResource(componentName, path, this.resourcesWithLoadedCSS, 'link', [
            ['href', path],
            ['rel', 'stylesheet']
        ], 'css');
    }
    static loadJS(componentName) {
        const path = GooseUtil.getRelativeUrlPath(`/Goose/components/${componentName}/${componentName}.js`);
        GooseBuilder.loadResource(componentName, path, this.resourcesWithLoadedJS, 'script', [
            ['src', path]
        ], 'js');
    }
    static async loadResource(componentName, path, loadedArray, elementTagName, elementAttributes, type) {
        const config = await this.getConfig();
        // don't do anything if this component's resources are already loaded
        if (loadedArray.includes(componentName))
            return;
        else
            loadedArray.push(componentName);
        // if file is explicitly stated to not exist, don't check
        if (config?.resources[componentName] && config?.resources[componentName][type] === false)
            return;
        else if (await GooseUtil.doesFileExist(path)) {
            // create link/script element and put it at the end of the <head>
            const link = document.createElement(elementTagName);
            elementAttributes.forEach((attributePair) => {
                link.setAttribute(attributePair[0], attributePair[1]);
            });
            document.head.appendChild(link);
        }
    }
    /**
     * Replaces replacedTemplateNode with replacerNode if and only if config.show_structure is false, otherwise appends replacerNode to replacedTemplateNode
     */
    static async replaceTemplateWith(templateNode, replacerNode) {
        const config = await GooseBuilder.getConfig();
        if (config.show_structure)
            templateNode.appendChild(replacerNode);
        else
            templateNode.replaceWith(replacerNode);
    }
}
//# sourceMappingURL=Builder.js.map