import EventStatus from "./event-status.js";
import init, { Quranize, compressExplanation } from "./quranize/quranize.js";

let quranizeMinHarfs = 70;
let quranize;
let pendingEvent;

self.onmessage = event => {
    if (!quranize) {
        pendingEvent = event;
        return;
    }
    const message = event.data;
    switch (message.status) {
        case EventStatus.KeywordUpdated:
            const keyword = message.keyword;
            if (keyword.length > quranizeMinHarfs * 0.7) {
                quranizeMinHarfs = keyword.length * 3;
                quranize = new Quranize(quranizeMinHarfs);
            }
            const encodeResults = quranize.encode(keyword);
            self.postMessage({ status: EventStatus.KeywordEncoded, keyword, encodeResults });
            break;
        case EventStatus.ResultClicked:
            const quran = message.quran;
            const compactExpls = compressExplanation(quran, message.expl);
            const locations = quranize.getLocations(quran);
            self.postMessage({ status: EventStatus.ResultLocated, quran, compactExpls, locations });
            break;
    }
};

await init();
quranize = new Quranize(quranizeMinHarfs);

self.postMessage({ status: EventStatus.EngineInitiated });

if (pendingEvent) self.onmessage(pendingEvent);
