import init, { Quranize } from "./quranize/quranize.js";
import { createApp } from "./vue.esm-browser.js"
import { suraNames } from "./quran/meta.js"

await init();
let quranizeCap = 23;
let quranize = new Quranize(quranizeCap);

createApp({
    data() {
        let exampleCandidates = [
            "bismillah", "masyaallah", "subhanallah", "alhamdulillah", "allahuakbar", "waantum muslimun",
            "ya ayyuhannas", "walaqod yassarna", "waltandur nafs", "tabaarokalladzi", "wabarron biwalidati",
        ];
        let examples = [];
        const EXAMPLE_COUNT = 4 + new Date() % 3;
        for (let i = 0; i < EXAMPLE_COUNT; i++)
            examples.push(...exampleCandidates.splice(new Date() % exampleCandidates.length, 1));

        return {
            keyword: "",
            supportSharing: "share" in navigator,
            encodeResults: [],
            examples: examples,
            translations: {
                EN: { path: "./quran/en.sahih.js" },
                ID: { path: "./quran/id.indonesian.js" },
            },
            suraNames: suraNames,
        };
    },
    computed: {
        hasResults() { return this.encodeResults.length > 0; },
        hasEmptyResult() { return this.keyword.trim() != "" && this.encodeResults.length === 0; },
    },
    methods: {
        updateKeyword(event) {
            this.setKeyword(event.target.value);
        },
        setKeyword(keyword) {
            this.keyword = keyword;
            this.encodeResults = this.encode(keyword);
        },
        encode(keyword) {
            if (keyword.length > quranizeCap && quranizeCap < 100) {
                quranizeCap = quranizeCap * 3 >> 1;
                quranize = new Quranize(quranizeCap);
            }
            return quranize.encode(keyword);
        },
        clickExample(example) {
            this.setKeyword(example);
        },
        clickExpand(result) {
            result.expanding ^= true;
            if (!result.locations) result.locations = quranize.getLocations(result.quran);
        },
        clickExplanation(result) {
            if (!result.compressedExplanation)
                result.compressedExplanation = this.compressExplanation(result);
            result.explaining ^= true;
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
            if (this.translations[translation].map)
                return this.translations[translation].map;

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

if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("service-worker.js");
