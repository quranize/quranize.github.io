mod encode_result;
mod location;

use encode_result::EncodeResult;
use location::Location;
use quranize::{AyaGetter, Quranize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = Quranize)]
pub struct QuranizeEngine {
    quranize: Quranize,
    aya_getter: AyaGetter<'static>,
}

#[wasm_bindgen(js_class = Quranize)]
impl QuranizeEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(min_harfs: usize) -> Self {
        Self {
            quranize: match min_harfs {
                0 => Default::default(),
                _ => Quranize::new(min_harfs),
            },
            aya_getter: Default::default(),
        }
    }

    #[wasm_bindgen]
    pub fn encode(&self, text: &str) -> Vec<EncodeResult> {
        self.quranize
            .encode(text)
            .into_iter()
            .map(|(quran, explanations, location_count)| {
                EncodeResult::new(
                    quran,
                    explanations.iter().map(|s| s.to_string()).collect(),
                    location_count,
                )
            })
            .collect()
    }

    #[wasm_bindgen]
    pub fn get_locations(&self, quran: &str) -> Vec<Location> {
        let word_count = quran.split_whitespace().count() as u8;
        self.quranize
            .get_locations(quran)
            .iter()
            .map(|&(sn, an, wn)| {
                let text = self.aya_getter.get(sn, an).unwrap_or_default();
                let (l, r) = get_highlight_boundary(text, wn, word_count);
                Location::new(
                    sn,
                    an,
                    &text[..l.max(1) - 1],
                    &text[l..r],
                    &text[r.min(text.len() - 1) + 1..],
                )
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode() {
        let q = QuranizeEngine::new(0);
        let l = &q.get_locations(&q.encode("bismillah")[0].quran())[0];
        assert_eq!(l.sura_number(), 1);
        assert_eq!(l.aya_number(), 1);
        assert_eq!(l.before_text(), "");
        assert_eq!(l.text(), "بِسمِ اللَّهِ");
        assert_eq!(l.after_text(), "الرَّحمٰنِ الرَّحيمِ");

        let l = &q.get_locations(&q.encode("bismillahirrohmanirrohim")[0].quran())[0];
        assert_eq!(l.before_text(), "");
        assert_eq!(l.text(), "بِسمِ اللَّهِ الرَّحمٰنِ الرَّحيمِ");
        assert_eq!(l.after_text(), "");

        let l = &q.get_locations(&q.encode("arrohmanirrohim")[0].quran())[0];
        assert_eq!(l.sura_number(), 1);
        assert_eq!(l.aya_number(), 1);
        assert_eq!(l.before_text(), "بِسمِ اللَّهِ");
        assert_eq!(l.text(), "الرَّحمٰنِ الرَّحيمِ");
        assert_eq!(l.after_text(), "");
    }

    #[test]
    fn test_get_highlight_boundary() {
        assert_eq!(get_highlight_boundary("ab cde f", 1, 3), (0, 8));
        assert_eq!(get_highlight_boundary("ab cde f", 2, 2), (3, 8));
        assert_eq!(get_highlight_boundary("ab cde f", 3, 1), (7, 8));
        assert_eq!(get_highlight_boundary("ab cde f", 1, 1), (0, 2));
    }
}
