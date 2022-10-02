use wasm_bindgen::prelude::*;

use quranize::{AyaGetter, Quranize};

#[wasm_bindgen(js_name = Quranize)]
pub struct JsQuranize {
    quranize: Quranize,
    aya_getter: AyaGetter<'static>,
}

#[derive(serde::Serialize)]
struct JsEncodeResult<'a> {
    quran: String,
    explanations: Vec<&'a str>,
}

#[derive(serde::Serialize)]
struct JsLocation<'a> {
    sura_number: u8,
    aya_number: u16,
    before_text: &'a str,
    text: &'a str,
    after_text: &'a str,
}

#[wasm_bindgen(js_class = Quranize)]
impl JsQuranize {
    #[wasm_bindgen(constructor)]
    pub fn new(min_harfs: usize) -> Self {
        Self {
            quranize: match min_harfs {
                0 => Quranize::default(),
                _ => Quranize::new(min_harfs),
            },
            aya_getter: AyaGetter::default(),
        }
    }

    #[wasm_bindgen(js_name = encode)]
    pub fn js_encode(&self, text: &str) -> Result<JsValue, serde_wasm_bindgen::Error> {
        serde_wasm_bindgen::to_value(&self.encode(text))
    }

    fn encode(&self, text: &str) -> Vec<JsEncodeResult> {
        self.quranize
            .encode(text)
            .into_iter()
            .map(|(quran, explanations)| JsEncodeResult {
                quran,
                explanations,
            })
            .collect()
    }

    #[wasm_bindgen(js_name = get_locations)]
    pub fn js_get_locations(&self, quran: &str) -> Result<JsValue, serde_wasm_bindgen::Error> {
        serde_wasm_bindgen::to_value(&self.get_locations(quran))
    }

    fn get_locations(&self, quran: &str) -> Vec<JsLocation> {
        let word_count = quran.split_whitespace().count() as u8;
        let mut locations: Vec<_> = self
            .quranize
            .get_locations(quran)
            .map(|&(sn, an, wn)| {
                let text = self.aya_getter.get(sn, an).unwrap_or_default();
                let (l, r) = get_highlight_boundary(text, wn, word_count);
                JsLocation {
                    sura_number: sn,
                    aya_number: an,
                    before_text: &text[..l.max(1) - 1],
                    text: &text[l..r],
                    after_text: &text[r.min(text.len() - 1) + 1..],
                }
            })
            .collect();
        locations.reverse();
        locations
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode() {
        let q = JsQuranize::new(5);
        let l = &q.get_locations(&q.encode("bismillah")[0].quran)[0];
        assert_eq!(l.sura_number, 1);
        assert_eq!(l.aya_number, 1);
        assert_eq!(l.before_text, "");
        assert_eq!(l.text, "بِسْمِ اللَّهِ");
        assert_eq!(l.after_text, "الرَّحْمَـٰنِ الرَّحِيمِ");

        let l = &q.get_locations(&q.encode("bismillah hirrohman nirrohim")[0].quran)[0];
        assert_eq!(l.before_text, "");
        assert_eq!(l.text, "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ");
        assert_eq!(l.after_text, "");

        let l = &q.get_locations(&q.encode("arrohman nirrohim")[0].quran)[0];
        assert_eq!(l.sura_number, 1);
        assert_eq!(l.aya_number, 1);
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
