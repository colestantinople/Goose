import { GooseUtil } from "./Util.js";
export class GooseBuilder {
    static resourcesWithLoadedCSS = [];
    static resourcesWithLoadedJS = [];
    static _config = null;
    static _prefix = null;
    static async getConfig() {
        if (this._config)
            return this._config;
        const response = await GooseUtil.sendRequest('Goose/goose-config.json');
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
    static async build(outerElement) {
        const prefix = await this.getPrefix();
        const gooseTags = Array.from(outerElement.innerHTML.match(new RegExp(`<${prefix}-([^>]*)>`, 'g')) ?? []);
        await Promise.all(gooseTags.map(async (tag) => {
            const tagName = tag.replace(/\%3E/g, '>') // remove html escape
                .replace(/[<>]/g, '') // remove arrow braces
                .split(' ')[0]; // remove attributes
            await this.loadCSS(tagName);
            const elements = Array.from(outerElement.querySelectorAll(tagName));
            return new Promise(async (resolve) => {
                const html = await GooseUtil.sendRequest(`Goose/components/${tagName}/${tagName}.html`);
                await Promise.all(elements.map(async (element) => {
                    return new Promise(async (subResolve) => {
                        element.innerHTML = await this.fillHTMLTemplate(html, element);
                        subResolve();
                    });
                }));
                this.loadJS(tagName);
                resolve();
            });
        }));
    }
    static async fillHTMLTemplate(template, originalElement) {
        const prefix = await this.getPrefix();
        const config = await this.getConfig();
        // use a container to allow HTML tree parsing
        const container = document.createElement('div');
        container.innerHTML = template;
        // replace <goose-body/>
        const body = container.querySelector(`${prefix}-body`);
        if (body)
            body.replaceWith(originalElement.innerHTML);
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
        await GooseBuilder.build(container);
        return container.innerHTML;
    }
    static async loadCSS(componentName) {
        const path = GooseUtil.getRelativeUrlPath(`Goose/components/${componentName}/${componentName}.css`);
        GooseBuilder.loadResource(componentName, path, this.resourcesWithLoadedCSS, 'link', [
            ['href', path],
            ['rel', 'stylesheet']
        ], 'css');
    }
    static loadJS(componentName) {
        const path = GooseUtil.getRelativeUrlPath(`Goose/components/${componentName}/${componentName}.js`);
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
}
//# sourceMappingURL=Builder.js.map