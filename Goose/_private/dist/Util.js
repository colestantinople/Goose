var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class GooseUtil {
    static sendRequest(absPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const promise = new Promise((resolve, reject) => {
                const req = new XMLHttpRequest();
                req.onload = () => {
                    if (req.status === 200) {
                        resolve(req.responseText);
                    }
                    else {
                        reject();
                    }
                };
                req.open('GET', absPath);
                req.send();
            });
            return promise;
        });
    }
    static doesFileExist(absPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const promise = new Promise((resolve, reject) => {
                const req = new XMLHttpRequest();
                req.onload = () => {
                    if (req.status === 404) {
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                };
                try {
                    req.open('HEAD', absPath);
                    req.send();
                }
                catch (e) {
                    // console.log(e);
                }
            });
            return promise;
        });
    }
    /**
     * @example '../siteimages/logo.svg' => 'colestanley.ca/siteimages/logo.svg'
     */
    static getFullUrlPath(url) {
        const locationParts = window.location.href.split('/'), urlParts = url.split('/');
        for (let i = 0; i < urlParts.length; i++) {
            if (urlParts[i] === '..') {
                locationParts.pop();
                locationParts.pop();
                urlParts.splice(0, 1);
                i--;
            }
            else if (urlParts[i] === '.') {
                locationParts.pop();
                urlParts.splice(0, 1);
                i--;
            }
        }
        return locationParts.join('/') + '/' + urlParts.join('/');
    }
    static getRelativeUrlPath(url) {
        const pagePath = window.location.href.replace(window.location.origin, ''), slashCount = pagePath.match(/\//g).length;
        let windowRelativePath = url.replace(window.location.origin, '');
        for (let i = 0; i < slashCount - 1; i++)
            windowRelativePath = '../' + windowRelativePath;
        return windowRelativePath;
    }
}
//# sourceMappingURL=Util.js.map