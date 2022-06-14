import { GooseUtil } from "./Util.js";

export class GooseBuilder {
  private static resourcesWithLoadedCSS = [];
  private static resourcesWithLoadedJS = [];

  private static prefix = GooseBuilder.getPrefix();

  static async build(outerElement: HTMLElement) {
    const gooseTags: string[] = Array.from(outerElement.innerHTML.match(/<goose-([^>]*)>/g) ?? []);

    await Promise.all(gooseTags.map(async (tag) => {
      const tagName = tag.replace(/\%3E/g, '>') // remove html escape
        .replace(/[<>]/g, '') // remove arrow braces
        .split(' ')[0]; // remove attributes

      await this.loadCSS(tagName);

      const elements: HTMLElement[] = Array.from(outerElement.querySelectorAll(tagName)) as HTMLElement[];

      return new Promise<void>(async (resolve) => {
        const html: string = await GooseUtil.sendRequest(`Goose/components/${tagName}/${tagName}.html`);
        await Promise.all(elements.map(async (element) => {
          return new Promise<void>(async (subResolve) => {
            element.innerHTML = await this.fillHTMLTemplate(html, element);
            subResolve();
          });
        }));

        this.loadJS(tagName);
        resolve();
      })
    }));
  }

  static async getPrefix() {
    const response = await GooseUtil.sendRequest('Goose/goose-config.json');
    console.log(response);
  }

  static async fillHTMLTemplate(template: string, originalElement: HTMLElement): Promise<string> {
    // use a container to allow HTML tree parsing
    const container = document.createElement('div');
    container.innerHTML = template;

    // replace <goose-body/>
    const body = container.querySelector('goose-body');
    if (body) body.replaceWith(originalElement.innerHTML);

    // handle goose-insert- and data-goose- attributes
    let replacedHTML = container.innerHTML;
    Array.from(originalElement.attributes).forEach((attribute: Attr) => {
      if (!attribute.nodeName.includes('data-goose-')) return;

      const name = attribute.nodeName.split('data-goose-')[1];
      const value = attribute.nodeValue;

      replacedHTML = replacedHTML.replace(new RegExp(`goose-insert-${name}`, 'g'), value);
    });
    container.innerHTML = replacedHTML;

    // replace all goose-components within the container
    await GooseBuilder.build(container);

    return container.innerHTML;
  }

  static async loadCSS(componentName: string) {
    const path: string = GooseUtil.getRelativeUrlPath(`Goose/components/${componentName}/${componentName}.css`);
    GooseBuilder.loadResource(componentName, path, this.resourcesWithLoadedCSS, 'link', [
      ['href', path],
      ['rel', 'stylesheet']
    ]);
  }

  static loadJS(componentName: string) {
    const path: string = GooseUtil.getRelativeUrlPath(`Goose/components/${componentName}/${componentName}.js`);
    GooseBuilder.loadResource(componentName, path, this.resourcesWithLoadedJS, 'script', [
      ['src', path]
    ]);
  }

  static async loadResource(
    componentName: string,
    path: string,
    loadedArray: string[],
    elementTagName: 'link' | 'script',
    elementAttributes: string[][]
  ) {
    // don't do anything if this component's resources are already loaded
    if (loadedArray.includes(componentName)) return;
    else loadedArray.push(componentName);

    if (await GooseUtil.doesFileExist(path)) {
      // create link/script element and put it at the end of the <head>
      const link = document.createElement(elementTagName);
      elementAttributes.forEach((attributePair) => {
        link.setAttribute(attributePair[0], attributePair[1])
      });
      document.head.appendChild(link);
    }
  }
}
