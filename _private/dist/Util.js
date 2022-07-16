export class GooseUtil {
    static async sendRequest(absPath) {
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
    }
    static async doesFileExist(absPath) {
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
    static uniqueFilter(a) {
        return a.filter((element, index) => {
            for (let i = index + 1; i < a.length; i++) {
                if (element === a[i])
                    return false;
            }
            return true;
        });
    }
}
//# sourceMappingURL=Util.js.map