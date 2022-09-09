import init, { Quranize } from "./quranize.js";
import suraNames from "./quran/sura-names.js";

const initPromise = init();

Vue.createApp({
    data() {
        return {
            keyword: "",
            keywordPlaceholder: "...",
            encodeResults: [],
            quranize: undefined,
            suraNames: suraNames,
            translations: {},
            supportSharing: "share" in navigator,
        };
    },
    computed: {
        hasEmptyResult() {
            return this.keyword.trim() != "" && this.encodeResults.length == 0;
        },
    },
    methods: {
        initQuranize() {
            this.quranize = new Quranize(7);
            this.keywordPlaceholder = "masyaallah";
            let hash = location.hash.replace(/^#/, "");
            if (!this.keyword && hash) {
                this.setKeyword(decodeURIComponent(hash));
                history.pushState({}, "", location.href.replace(/#.*$/, ""));
            }
            this.$refs.keyword.focus();
        },
        async initTranslations() {
            (await import("./quran/id.indonesian.js")).default
                .split("\n")
                .map(l => l.split("|"))
                .filter(e => e.length == 3)
                .forEach(e_1 => this.translations[`${e_1[0]}:${e_1[1]}`] = e_1[2]);
            this.encodeResults.forEach(r => r.locations.forEach(this.setTranslation));
        },
        setTranslation(location) {
            if (!location.translation)
                location.translation = this.translations[`${location.sura_number}:${location.aya_number}`];
        },
        setKeyword(keyword) {
            this.keyword = keyword;
            if (this.quranize) this.encodeResults = this.quranize.encode(keyword);
        },
        updateKeyword(event) {
            this.setKeyword(event.target.value);
        },
        clickEncodeResult(result) {
            result.expanded ^= true;
            if (!result.locations) result.locations = this.quranize.get_locations(result.quran);
            if (result.locations.length <= 30) result.locations.forEach(this.clickLocation);
        },
        clickLocation(location) {
            location.expanded ^= true;
            this.setTranslation(location);
        },
        toArabicNumber(n) {
            if (n < 0) return `-${this.toArabicNumber(-n)}`;
            if (n < 10) return String.fromCharCode(0x0660 + n);
            return this.toArabicNumber(Math.floor(n / 10)) + this.toArabicNumber(n % 10);
        },
        share() {
            navigator.share({ url: `${location.href}#${encodeURIComponent(this.keyword.trim())}` });
        },
    },
    async mounted() {
        await initPromise;
        this.initTranslations();
        this.initQuranize();
    },
}).mount("#quranize-app");

if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("/service-worker.js");
