import init, { Quranize } from "./quranize.js";
import suraNames from "./quran/sura-names.js";

const initPromise = init();

Vue.createApp({
    data() {
        return {
            keyword: "",
            keywordPlaceholder: "..",
            encodeResults: [],
            quranize: undefined,
            translations: {},
            selectedTranslation: "EN",
        };
    },
    computed: {
        hasEmptyResult() {
            return this.keyword.trim() != "" && this.encodeResults.length == 0;
        },
        examples() {
            let candidates = [
                "masyaallah", "subhanallah", "alhamdulillah", "allahuakbar", "wa'tashimuu bihablillah",
                "innaddiina 'indallah", "walaqod yassarna", "innaa anzalnaahu", "tabaarokalladzi", "wabarron biwalidati",
            ];
            let taken = [];
            const COUNT = 4 + new Date() % 3;
            for (let i = 0; i < COUNT; i++)
                taken.push(...candidates.splice(new Date() % candidates.length, 1));
            return taken;
        },
        availableTranslations() {
            return { "EN": "en.sahih", "ID": "id.indonesian" };
        },
        suraNames() {
            return suraNames;
        },
        supportSharing() {
            return "share" in navigator;
        },
    },
    methods: {
        initQuranize() {
            this.quranize = new Quranize(7);
            this.keywordPlaceholder = "masyaallah";
            let URLHash = location.hash.replace(/^#/, "");
            if (this.keyword) this.encodeResults = this.quranize.encode(this.keyword)
            else if (URLHash) {
                this.setKeyword(decodeURIComponent(URLHash));
                history.pushState({}, "", location.href.replace(/#.*$/, ""));
            }
            else this.$refs.keyword.focus();
        },
        async initTranslations(translation) {
            this.unsetLocationTranslations();
            (await import(`./quran/${this.availableTranslations[translation]}.js`)).default
                .split("\n")
                .map(l => l.split("|"))
                .filter(x => x.length == 3)
                .forEach(x => this.translations[`${x[0]}:${x[1]}`] = x[2]);
            this.setLocationTranslations();
        },
        unsetLocationTranslations() {
            this.encodeResults.forEach(r => r.locations && r.locations.forEach(l => delete l.translation));
        },
        setLocationTranslations() {
            this.encodeResults.forEach(r => r.locations && r.locations.forEach(this.setTranslation));
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
        clickExample(example) {
            this.setKeyword(example);
        },
        clickEncodeResult(result) {
            result.listed ^= true;
            if (!result.locations) result.locations = this.quranize.get_locations(result.quran);
            result.locations.forEach(this.setTranslation);
        },
        clickExplanation(result) {
            result.explained ^= true;
        },
        clickTranslationSwitch(translation) {
            if (this.selectedTranslation != translation) {
                this.selectedTranslation = translation;
                this.initTranslations(translation);
            }
        },
        toArabicNumber(n) {
            if (n < 0) return `-${this.toArabicNumber(-n)}`;
            if (n < 10) return String.fromCharCode(0x0660 + n);
            return this.toArabicNumber(Math.floor(n / 10)) + this.toArabicNumber(n % 10);
        },
        share() {
            navigator.share({ url: `${location.href}#${encodeURIComponent(this.keyword.trim())}` });
        },
        animateKeywordPlaceholder() {
            if (this.quranize) return;
            this.keywordPlaceholder = this.keywordPlaceholder.length < 7 ? this.keywordPlaceholder + "." : ".";
            setTimeout(this.animateKeywordPlaceholder, 500);
        },
    },
    async mounted() {
        this.animateKeywordPlaceholder();
        await initPromise;
        this.initTranslations(this.selectedTranslation);
        this.initQuranize();
    },
}).mount("#quranize-app");

if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("/service-worker.js");
