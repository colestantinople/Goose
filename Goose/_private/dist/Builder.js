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
    static build(outerElement) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const gooseTags = Array.from((_a = outerElement.innerHTML.match(/<goose-([^>]*)>/g)) !== null && _a !== void 0 ? _a : []);
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
    static getPrefix() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield GooseUtil.sendRequest('Goose/goose-config.json');
            console.log(response);
        });
    }
    static fillHTMLTemplate(template, originalElement) {
        return __awaiter(this, void 0, void 0, function* () {
            // use a container to allow HTML tree parsing
            const container = document.createElement('div');
            container.innerHTML = template;
            // replace <goose-body/>
            const body = container.querySelector('goose-body');
            if (body)
                body.replaceWith(originalElement.innerHTML);
            // handle goose-insert- and data-goose- attributes
            let replacedHTML = container.innerHTML;
            Array.from(originalElement.attributes).forEach((attribute) => {
                if (!attribute.nodeName.includes('data-goose-'))
                    return;
                const name = attribute.nodeName.split('data-goose-')[1];
                const value = attribute.nodeValue;
                replacedHTML = replacedHTML.replace(new RegExp(`goose-insert-${name}`, 'g'), value);
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
            ]);
        });
    }
    static loadJS(componentName) {
        const path = GooseUtil.getRelativeUrlPath(`Goose/components/${componentName}/${componentName}.js`);
        GooseBuilder.loadResource(componentName, path, this.resourcesWithLoadedJS, 'script', [
            ['src', path]
        ]);
    }
    static loadResource(componentName, path, loadedArray, elementTagName, elementAttributes) {
        return __awaiter(this, void 0, void 0, function* () {
            // don't do anything if this component's resources are already loaded
            if (loadedArray.includes(componentName))
                return;
            else
                loadedArray.push(componentName);
            if (yield GooseUtil.doesFileExist(path)) {
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
GooseBuilder.prefix = GooseBuilder.getPrefix();
//# sourceMappingURL=Builder.js.map