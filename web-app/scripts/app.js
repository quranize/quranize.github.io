import EventStatus from "./event-status.js";
import { createApp } from "./vue.esm-browser.js";
import { suraNames } from "./quran/meta.js";

const quranizeWorker = new Worker("scripts/quranize-worker.js", { type: "module" });

const app = createApp({
    data() {
        return {
            isEngineInitiated: false,
            keyword: "",
            encodeResults: [],
            supportSharing: "share" in navigator,
            examples: getExamples(),
            suraNames: suraNames,
            translations: { EN: { path: "./quran/en.sahih.js" }, ID: { path: "./quran/id.indonesian.js" } },
        };
    },
    computed: {
        hasResults() { return this.encodeResults.length > 0; },
        hasEmptyResult() { return this.isEngineInitiated && this.keyword !== "" && !this.hasResults; },
    },
    methods: {
        keywordInputted(event) {
            this.setKeyword(event.target.value);
        },
        deleteKeyword() {
            this.setKeyword("");
            this.$refs.keyword.focus();
        },
        setKeyword(keyword) {
            this.keyword = keyword;
            quranizeWorker.postMessage({ status: EventStatus.KeywordUpdated, keyword });
        },
        clickExpand(result) {
            if (!result.compressedExplanation) result.compressedExplanation = this.compressExplanation(result);
            if (!result.locations) quranizeWorker.postMessage({ status: EventStatus.ResultClicked, result: { quran: result.quran } });
            result.expanding ^= true;
        },
        compressExplanation(result) {
            let ce = [];
            result.explanations.forEach((e, i) => {
                let q = result.quran[i];
                if (q === "\u0651" || e === "") {
                    ce[ce.length - 1].quran += q;
                    ce[ce.length - 1].alphabet += e;
                } else {
                    ce.push({ quran: q, alphabet: e });
                }
            });
            return ce;
        },
        async clickTranslationSwitch(location, translation) {
            if (location.translations === undefined) location.translations = {};
            if (location.translations[translation] === undefined)
                location.translations[translation] = { selected: false };
            location.translations[translation].selected ^= true;
            if (!location.translations[translation].text)
                location.translations[translation].text =
                    (await this.getTranslation(translation))[`${location.sura_number}:${location.aya_number}`];
        },
        async getTranslation(translation) {
            if (!this.translations[translation]) return {};
            if (this.translations[translation].map) return this.translations[translation].map;
            let map = {};
            (await import(this.translations[translation].path)).default
                .split("\n")
                .map(l => l.split("|"))
                .filter(x => x.length === 3)
                .forEach(x => map[`${x[0]}:${x[1]}`] = x[2]);
            this.translations[translation].map = map;
            return map;
        },
        toArabicNumber(n) {
            if (n < 0) return `-${this.toArabicNumber(-n)}`;
            if (n < 10) return String.fromCharCode(0x0660 + n);
            return this.toArabicNumber(Math.floor(n / 10)) + this.toArabicNumber(n % 10);
        },
        tanzilURL(location) {
            return `https://tanzil.net/#${location.sura_number}:${location.aya_number}`;
        },
        share() {
            navigator.share({ url: `${location.href}#${encodeURIComponent(this.keyword.trim())}` });
        },
    },
    mounted() {
        const URLHash = location.hash.replace(/^#/, "");
        if (this.keyword) this.encodeResults = this.encode(this.keyword)
        else if (URLHash) {
            this.setKeyword(decodeURIComponent(URLHash));
            history.pushState({}, "", location.href.replace(/#.*$/, ""));
        }
        this.$refs.keyword.focus();
    },
}).mount("#quranize-app");

quranizeWorker.onmessage = event => {
    const message = event.data;
    switch (message.status) {
        case EventStatus.EngineInitiated:
            app.isEngineInitiated = true;
            break;
        case EventStatus.KeywordEncoded:
            if (message.keyword === app.keyword) app.encodeResults = message.encodeResults;
            break;
        case EventStatus.ResultLocated:
            const result = app.encodeResults.find(result => result.quran === message.result.quran);
            if (result) result.locations = message.locations;
            break;
    }
};

if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");

function getExamples() {
    let candidates = [
        "bismillah", "subhanallah", "alhamdulillah", "allahuakbar", "masyaallah", "insyaallah", "inna lillahi wainna ilaihi roji'un",
        "waantum muslimun", "ya ayyuhannas", "walaqod yassarna", "waltandur nafs", "tabaarokalladzi", "wabarron biwalidati",
    ];
    let examples = [];
    const EXAMPLE_COUNT = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < EXAMPLE_COUNT; i++)
        examples.push(...candidates.splice(Math.floor(Math.random() * candidates.length), 1));
    return examples;
}
