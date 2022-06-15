var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GooseUtil } from "./Util.js";
export class GooseBuilder {
    static getConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._config)
                return this._config;
            const response = yield GooseUtil.sendRequest('Goose/goose-config.json');
            this._config = JSON.parse(response);
            return this._config;
        });
    }
    static getPrefix() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._prefix)
                return this._prefix;
            else {
                const config = yield this.getConfig();
                if (config.prefix)
                    this._prefix = config.prefix;
                else
                    this._prefix = 'goose';
            }
            return this._prefix;
        });
    }
    static build(outerElement) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const prefix = yield this.getPrefix();
            const gooseTags = Array.from((_a = outerElement.innerHTML.match(new RegExp(`<${prefix}-([^>]*)>`, 'g'))) !== null && _a !== void 0 ? _a : []);
            yield Promise.all(gooseTags.map((tag) => __awaiter(this, void 0, void 0, function* () {
                const tagName = tag.replace(/\%3E/g, '>') // remove html escape
                    .replace(/[<>]/g, '') // remove arrow braces
                    .split(' ')[0]; // remove attributes
                yield this.loadCSS(tagName);
                const elements = Array.from(outerElement.querySelectorAll(tagName));
                return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    const html = yield GooseUtil.sendRequest(`Goose/components/${tagName}/${tagName}.html`);
                    yield Promise.all(elements.map((element) => __awaiter(this, void 0, void 0, function* () {
                        return new Promise((subResolve) => __awaiter(this, void 0, void 0, function* () {
                            element.innerHTML = yield this.fillHTMLTemplate(html, element);
                            subResolve();
                        }));
                    })));
                    this.loadJS(tagName);
                    resolve();
                }));
            })));
        });
    }
    static fillHTMLTemplate(template, originalElement) {
        return __awaiter(this, void 0, void 0, function* () {
            const prefix = yield this.getPrefix();
            const config = yield this.getConfig();
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
            yield GooseBuilder.build(container);
            return container.innerHTML;
        });
    }
    static loadCSS(componentName) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = GooseUtil.getRelativeUrlPath(`Goose/components/${componentName}/${componentName}.css`);
            GooseBuilder.loadResource(componentName, path, this.resourcesWithLoadedCSS, 'link', [
                ['href', path],
                ['rel', 'stylesheet']
            ], 'css');
        });
    }
    static loadJS(componentName) {
        const path = GooseUtil.getRelativeUrlPath(`Goose/components/${componentName}/${componentName}.js`);
        GooseBuilder.loadResource(componentName, path, this.resourcesWithLoadedJS, 'script', [
            ['src', path]
        ], 'js');
    }
    static loadResource(componentName, path, loadedArray, elementTagName, elementAttributes, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield this.getConfig();
            // don't do anything if this component's resources are already loaded
            if (loadedArray.includes(componentName))
                return;
            else
                loadedArray.push(componentName);
            // if file is explicitly stated to not exist, don't check
            if ((config === null || config === void 0 ? void 0 : config.resources[componentName]) && (config === null || config === void 0 ? void 0 : config.resources[componentName][type]) === false)
                return;
            else if (yield GooseUtil.doesFileExist(path)) {
                // create link/script element and put it at the end of the <head>
                const link = document.createElement(elementTagName);
                elementAttributes.forEach((attributePair) => {
                    link.setAttribute(attributePair[0], attributePair[1]);
                });
                document.head.appendChild(link);
            }
        });
    }
}
GooseBuilder.resourcesWithLoadedCSS = [];
GooseBuilder.resourcesWithLoadedJS = [];
GooseBuilder._config = null;
GooseBuilder._prefix = null;
//# sourceMappingURL=Builder.js.map