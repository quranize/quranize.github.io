use quranize::{AyaGetter, Quranize};
use serde_wasm_bindgen::{to_value, Error};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = Quranize)]
pub struct JsQuranize {
    quranize: Quranize,
    aya_getter: AyaGetter<'static>,
}

#[derive(serde::Serialize)]
struct JsEncodeResult<'a> {
    quran: String,
    explanations: Vec<&'a str>,
    location_count: usize,
}

#[derive(serde::Serialize)]
struct JsLocation<'a> {
    sura_number: u8,
    aya_number: u16,
    before_text: &'a str,
    text: &'a str,
    after_text: &'a str,
}

#[derive(serde::Serialize)]
struct JsExplanation {
    alphabet: String,
    quran: String,
}

#[wasm_bindgen(js_class = Quranize)]
impl JsQuranize {
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

    #[wasm_bindgen(js_name = encode)]
    pub fn js_encode(&self, text: &str) -> Result<JsValue, Error> {
        to_value(&self.encode(text))
    }

    fn encode(&self, text: &str) -> Vec<JsEncodeResult> {
        self.quranize
            .encode(text)
            .into_iter()
            .map(|(quran, explanations, location_count)| JsEncodeResult {
                quran,
                explanations,
                location_count,
            })
            .collect()
    }

    #[wasm_bindgen(js_name = getLocations)]
    pub fn js_get_locations(&self, quran: &str) -> Result<JsValue, Error> {
        to_value(&self.get_locations(quran))
    }

    fn get_locations(&self, quran: &str) -> Vec<JsLocation> {
        let word_count = quran.split_whitespace().count() as u8;
        self.quranize
            .get_locations(quran)
            .iter()
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
            .collect()
    }

    #[wasm_bindgen(js_name = compressExplanation)]
    pub fn js_compress_explanation(&self, quran: &str, expl: &str) -> Result<JsValue, Error> {
        to_value(
            &compress_explanation(quran, expl)
                .into_iter()
                .map(|(e, q)| JsExplanation {
                    alphabet: e,
                    quran: q,
                })
                .collect::<Vec<_>>(),
        )
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

fn compress_explanation(quran: &str, expl: &str) -> Vec<(String, String)> {
    let mut eqs = vec![(String::new(), String::new())];
    for eq in expl.split('-').zip(quran.chars()) {
        let mut last1_eq = eqs.pop();
        let mut last2_eq = eqs.pop();
        let mut new_eq = None;
        match (&mut last2_eq, &mut last1_eq, eq) {
            (
                Some((ref mut last2_e, ref mut last2_q)),
                _,
                (e, q @ ('\u{0610}'..='\u{061A}' | '\u{064B}'..='\u{065F}' | '\u{0670}')),
            ) => {
                last2_e.push_str(e);
                last2_q.push(q);
            }
            (_, Some((_, ref mut last1_q)), ("", q)) => last1_q.push(q),
            (_, Some((ref mut last1_e, ref mut last1_q)), (e, q)) => {
                last1_e.push_str(e);
                last1_q.push(q);
                new_eq = Some((String::new(), String::new()));
            }
            _ => (),
        }
        for eq in [last2_eq, last1_eq, new_eq].into_iter().flatten() {
            eqs.push(eq);
        }
    }
    eqs.pop();
    eqs
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;

    #[test]
    fn test_encode() {
        let q = JsQuranize::new(0);
        let l = &q.get_locations(&q.encode("bismillah")[0].quran)[0];
        assert_eq!(l.sura_number, 1);
        assert_eq!(l.aya_number, 1);
        assert_eq!(l.before_text, "");
        assert_eq!(l.text, "بِسمِ اللَّهِ");
        assert_eq!(l.after_text, "الرَّحمٰنِ الرَّحيمِ");

        let l = &q.get_locations(&q.encode("bismillahirrohmanirrohim")[0].quran)[0];
        assert_eq!(l.before_text, "");
        assert_eq!(l.text, "بِسمِ اللَّهِ الرَّحمٰنِ الرَّحيمِ");
        assert_eq!(l.after_text, "");

        let l = &q.get_locations(&q.encode("arrohmanirrohim")[0].quran)[0];
        assert_eq!(l.sura_number, 1);
        assert_eq!(l.aya_number, 1);
        assert_eq!(l.before_text, "بِسمِ اللَّهِ");
        assert_eq!(l.text, "الرَّحمٰنِ الرَّحيمِ");
        assert_eq!(l.after_text, "");
    }

    #[test]
    fn test_get_highlight_boundary() {
        assert_eq!(get_highlight_boundary("ab cde f", 1, 3), (0, 8));
        assert_eq!(get_highlight_boundary("ab cde f", 2, 2), (3, 8));
        assert_eq!(get_highlight_boundary("ab cde f", 3, 1), (7, 8));
        assert_eq!(get_highlight_boundary("ab cde f", 1, 1), (0, 2));
    }

    #[test]
    fn test_compress_explanation() {
        assert_eq!(
            compress_explanation("بِرَبِّ النّاسِ", "b-i-r-o-b-b-i----n-n-a-s-"),
            to_vec_string_string(&[
                ("bi", "بِ"),
                ("ro", "رَ"),
                ("bbi", "بِّ"),
                ("nn", " النّ"),
                ("a", "ا"),
                ("s", "سِ"),
            ])
        );
    }

    fn to_vec_string_string(a: &[(&str, &str)]) -> Vec<(String, String)> {
        a.iter()
            .map(|(x, y)| (x.to_string(), y.to_string()))
            .collect()
    }
}
