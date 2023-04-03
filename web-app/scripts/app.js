import init, { Quranize } from "./quranize.js";
import suraNames from "./quran/sura-names.js";

await init();
let quranizeCap = 23;
let quranize = new Quranize(quranizeCap);

Vue.createApp({
    data() {
        return {
            keyword: "",
            encodeResults: [],
            translations: {},
        };
    },
    computed: {
        suraNames() { return suraNames; },
        hasResults() { return this.encodeResults.length > 0; },
        hasEmptyResult() { return this.keyword.trim() != "" && this.encodeResults.length == 0; },
        examples() {
            let candidates = [
                "bismillah", "masyaallah", "subhanallah", "alhamdulillah", "allahuakbar", "wa'tashimuu bihablillah",
                "wabassirilladzina", "walaqod yassarna", "waltandur nafs", "tabaarokalladzi", "wabarron biwalidati",
            ];
            let taken = [];
            const COUNT = 4 + new Date() % 2;
            for (let i = 0; i < COUNT; i++)
                taken.push(...candidates.splice(new Date() % candidates.length, 1));
            return taken;
        },
        availableTranslations() { return { "EN": "en.sahih", "ID": "id.indonesian" }; },
        supportSharing() { return "share" in navigator; },
    },
    methods: {
        encode(keyword) {
            if (keyword.length > quranizeCap && quranizeCap < 100) {
                quranizeCap += 10;
                quranize = new Quranize(quranizeCap);
            }
            return quranize.encode(keyword);
        },
        setKeyword(keyword) {
            this.keyword = keyword;
            this.encodeResults = this.encode(keyword);
        },
        updateKeyword(event) {
            this.setKeyword(event.target.value);
        },
        clickExample(example) {
            this.setKeyword(example);
        },
        clickEncodeResult(result) {
            result.listed ^= true;
            if (!result.locations) result.locations = quranize.getLocations(result.quran);
        },
        clickExplanation(result) {
            result.explained ^= true;
        },
        clickTranslationSwitch(location, translation) {
            delete location.translation;
            if (location.selectedTranslation == translation) {
                delete location.selectedTranslation;
            } else {
                location.selectedTranslation = translation;
                this.fetchTranslations(translation)
                    .then(t => location.translation = t[`${location.sura_number}:${location.aya_number}`]);
            }
        },
        async fetchTranslations(translation) {
            if (this.translations[translation]) return this.translations[translation];
            let translations = {};
            (await import(`./quran/${this.availableTranslations[translation]}.js`)).default
                .split("\n")
                .map(l => l.split("|"))
                .filter(x => x.length == 3)
                .forEach(x => translations[`${x[0]}:${x[1]}`] = x[2]);
            this.translations[translation] = translations;
            return translations;
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
