import init, { Quranize } from "./quranize/quranize.js";

await init();
const quranize = new Quranize();

self.onmessage = event => {
    const { method, args } = event.data;
    const returnValue = method in quranize ? quranize[method](...args) : undefined;
    self.postMessage({ method, args, returnValue });
};
