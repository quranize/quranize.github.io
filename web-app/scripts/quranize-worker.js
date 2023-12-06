import EventStatus from "./event-status.js";
import init, { Quranize } from "./quranize/quranize.js";

let quranize;
let pendingEvents = [];

self.onmessage = event => {
    if (!quranize) {
        pendingEvents.push(event);
        return;
    }
    const message = event.data;
    switch (message.status) {
        case EventStatus.KeywordUpdated:
            const keyword = message.keyword;
            const encodeResults = quranize.encode(keyword);
            self.postMessage({ status: EventStatus.KeywordEncoded, keyword, encodeResults });
            break;
        case EventStatus.ResultClicked:
            const result = message.result;
            const locations = quranize.getLocations(result.quran);
            self.postMessage({ status: EventStatus.ResultLocated, result, locations });
            break;
    }
};

await init();
quranize = new Quranize();

self.postMessage({ status: EventStatus.EngineInitiated });
pendingEvents.forEach(self.onmessage);
pendingEvents = [];
