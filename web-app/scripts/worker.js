import init, { Quranize } from "./quranize/quranize.js";

await init();
const quranize = new Quranize();

self.onmessage = event => {
    const { method, args } = event.data;
    self.postMessage({ method, args, returnValue: quranize[method]?.(...args) });
};
