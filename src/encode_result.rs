use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct EncodeResult {
    quran: String,
    explanations: Vec<String>,
    location_count: usize,
}

#[wasm_bindgen]
impl EncodeResult {
    pub fn new(quran: String, explanations: Vec<String>, location_count: usize) -> Self {
        Self {
            quran,
            explanations,
            location_count,
        }
    }

    #[wasm_bindgen]
    pub fn quran(&self) -> String {
        self.quran.to_owned()
    }

    #[wasm_bindgen]
    pub fn explanations(&self) -> Vec<String> {
        self.explanations.to_owned()
    }

    #[wasm_bindgen]
    pub fn location_count(&self) -> usize {
        self.location_count
    }
}
