use wasm_bindgen::prelude::*;

use quranize::{
    quran::{AyaGetter, SIMPLE_PLAIN},
    Quranize,
};

#[wasm_bindgen(js_name = Quranize)]
pub struct JsQuranize {
    quranize: Quranize,
    aya_index: AyaGetter<'static>,
}

#[wasm_bindgen(js_class = Quranize)]
impl JsQuranize {
    #[wasm_bindgen(constructor)]
    pub fn new(word_count_limit: u8) -> Self {
        Self {
            quranize: match word_count_limit {
                0 => Quranize::default(),
                n => Quranize::new(n),
            },
            aya_index: AyaGetter::new(SIMPLE_PLAIN),
        }
    }

    #[wasm_bindgen(js_name = encode)]
    pub fn js_encode(&self, text: &str) -> JsValue {
        JsValue::from_serde(&self.encode(text)).unwrap()
    }

    fn encode<'a>(&'a self, text: &'a str) -> Vec<JsEncodeResult<'a>> {
        self.quranize
            .encode(text)
            .into_iter()
            .map(|(quran, locations, explanations)| JsEncodeResult {
                locations: self.to_js_locations(&quran, locations.iter()),
                quran,
                explanations,
            })
            .collect()
    }

    fn to_js_locations<'a, I>(&self, quran: &str, locations: I) -> Vec<JsLocation>
    where
        I: Iterator<Item = &'a (u8, u16, u8)>,
    {
        let word_count = quran.split_whitespace().count() as u8;
        locations
            .map(|&(sura_number, aya_number, word_number)| {
                let text = self.aya_index.get(sura_number, aya_number).unwrap();
                let (l, r) = get_highlight_boundary(text, word_number, word_count);
                JsLocation {
                    sura_number,
                    aya_number,
                    before_text: &text[..l.max(1) - 1],
                    text: &text[l..r],
                    after_text: &text[r.min(text.len() - 1) + 1..],
                }
            })
            .collect()
    }
}

fn get_highlight_boundary(text: &str, word_number: u8, word_count: u8) -> (usize, usize) {
    let mut left = 0;
    let mut right = text.len();
    let mut counted_words = 0;
    for (i, c) in text.char_indices() {
        if i == 0 || c == ' ' {
            counted_words += 1;
        }
        if c == ' ' && counted_words == word_number {
            left = i + 1;
        }
        if c == ' ' && counted_words == word_number + word_count {
            right = i;
            break;
        }
    }
    (left, right)
}

#[derive(serde::Serialize)]
struct JsEncodeResult<'a> {
    quran: String,
    locations: Vec<JsLocation>,
    explanations: Vec<&'a str>,
}

#[derive(serde::Serialize)]
struct JsLocation {
    sura_number: u8,
    aya_number: u16,
    before_text: &'static str,
    text: &'static str,
    after_text: &'static str,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode() {
        let q = JsQuranize::new(0);
        let l = &q.encode("bismillah")[0].locations[0];
        assert_eq!(l.before_text, "");
        assert_eq!(l.text, "بِسْمِ اللَّهِ");
        assert_eq!(l.after_text, "الرَّحْمَـٰنِ الرَّحِيمِ");

        let l = &q.encode("bismillah hirrohman nirrohim")[0].locations[0];
        assert_eq!(l.before_text, "");
        assert_eq!(l.text, "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ");
        assert_eq!(l.after_text, "");

        let l = &q.encode("arrohman nirrohim")[0].locations[0];
        assert_eq!(l.before_text, "بِسْمِ اللَّهِ");
        assert_eq!(l.text, "الرَّحْمَـٰنِ الرَّحِيمِ");
        assert_eq!(l.after_text, "");
    }

    #[test]
    fn test_get_highlight_boundary() {
        assert_eq!(get_highlight_boundary("ab cde f", 1, 3), (0, 8));
        assert_eq!(get_highlight_boundary("ab cde f", 2, 2), (3, 8));
        assert_eq!(get_highlight_boundary("ab cde f", 3, 1), (7, 8));
        assert_eq!(get_highlight_boundary("ab cde f", 1, 1), (0, 2));
    }
}
