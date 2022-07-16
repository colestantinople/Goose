import { GooseBuilder } from './dist/Builder.js';

await GooseBuilder.build(document.body, []);

window.dispatchEvent(new Event('GooseLoaded'));
