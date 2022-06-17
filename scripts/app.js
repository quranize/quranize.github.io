import init, { Quranize } from "./quranize.js";
const initPromise = init();
import suraNames from "./quran/sura-names.js";
Vue.createApp({
    data() {
        return {
            keyword: "",
            keywordPlaceholder: "memuat mesin ...",
            encodeResults: [],
            quranize: undefined,
            suraNames: suraNames,
            translations: {},
        };
    },
    methods: {
        initQuranize() {
            this.keywordPlaceholder = "menyalakan mesin ..";
            setTimeout(() => {
                this.quranize = new Quranize(5);
                this.keywordPlaceholder = "masyaallah";
                let hash = this.getLocationHash();
                if (!this.keyword && hash) {
                    this.setKeyword(hash);
                    history.pushState("", document.title, location.href.replace(/#.*$/, ""));
                }
            }, 25);
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
        clickEncodeResult(encodeResult) {
            encodeResult.expanded ^= true;
            if (encodeResult.locations.length < 40)
                encodeResult.locations.forEach(this.clickLocation);
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
        getLocationHash() {
            return location.hash.replace(/^#/, "");
        },
    },
    mounted() {
        initPromise.then(this.initQuranize);
        initPromise.then(this.initTranslations);
        window.onhashchange = () => this.setKeyword(this.getLocationHash());
    },
}).mount('#quranize-app');
