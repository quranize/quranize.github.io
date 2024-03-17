import EventStatus from "./event-status.js";
import init, { Quranize } from "./quranize/quranize.js";

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
            const encodeResults = quranize.encode(keyword);
            console.debug(encodeResults[0].quran());
            console.debug(encodeResults[0].explanations());
            console.debug(encodeResults[0].location_count());
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
quranize = new Quranize(70);

self.postMessage({ status: EventStatus.EngineInitiated });

if (pendingEvent) {
    self.onmessage(pendingEvent);
    pendingEvent = undefined;
}
