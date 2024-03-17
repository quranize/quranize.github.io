use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Location {
    sura_number: u8,
    aya_number: u16,
    before_text: String,
    text: String,
    after_text: String,
}

#[wasm_bindgen]
impl Location {
    pub fn new(
        sura_number: u8,
        aya_number: u16,
        before_text: &str,
        text: &str,
        after_text: &str,
    ) -> Self {
        Self {
            sura_number,
            aya_number,
            before_text: before_text.to_string(),
            text: text.to_string(),
            after_text: after_text.to_string(),
        }
    }

    #[wasm_bindgen]
    pub fn sura_number(&self) -> u8 {
        self.sura_number
    }

    #[wasm_bindgen]
    pub fn aya_number(&self) -> u16 {
        self.aya_number
    }

    #[wasm_bindgen]
    pub fn before_text(&self) -> String {
        self.before_text.to_owned()
    }

    #[wasm_bindgen]
    pub fn text(&self) -> String {
        self.text.to_owned()
    }

    #[wasm_bindgen]
    pub fn after_text(&self) -> String {
        self.after_text.to_owned()
    }
}
