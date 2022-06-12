import init, { Quranize } from "./quranize.js";
const initPromise = init();
Vue.createApp({
    data() {
        return {
            keyword: "",
            keywordPlaceholder: "memuat mesin ...",
            encodeResults: [],
            quranize: undefined,
            suraNames: ["الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "ابراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبإ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الانسان", "المرسلات", "النبإ", "النازعات", "عبس", "التكوير", "الإنفطار", "المطففين", "الإنشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"],
            translations: {},
        };
    },
    methods: {
        initQuranize() {
            this.keywordPlaceholder = "menyalakan mesin ..";
            setTimeout(() => {
                this.quranize = new Quranize(5);
                this.keywordPlaceholder = "";
                this.setKeyword(window.location.hash.replace(/^#/, ""));
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
    },
    mounted() {
        initPromise.then(this.initQuranize);
        initPromise.then(this.initTranslations);
        window.onhashchange = () => this.setKeyword(window.location.hash.replace(/^#/, ""));
    },
}).mount('#quranize-app');
