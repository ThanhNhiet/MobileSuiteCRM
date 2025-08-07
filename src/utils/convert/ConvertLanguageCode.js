/*
    Convert language code from ISO 639-1 to human-readable format
*/
export const convertLanguageCode = (code) => {
    code_lower = code.toLowerCase();
    const languageMap = {
        'en': 'English',
        'fr': 'French',
        'es': 'Spanish',
        'de': 'German',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'vi': 'Vietnamese',
    };
    return languageMap[code_lower] || code_lower;
};

/*
    Convert locale code to human-readable format
*/
export const convertLocaleCode = (locale) => {
    locale_lower = locale.toLowerCase();
    const localeMap = {
        'en_us': 'English (US)',
        'en_gb': 'English (UK)',
        'fr_fr': 'French (France)',
        'fr_ca': 'French (Canada)',
        'es_es': 'Spanish (Spain)',
        'es_mx': 'Spanish (Mexico)',
        'de_de': 'German (Germany)',
        'zh_cn': 'Chinese (Simplified)',
        'zh_tw': 'Chinese (Traditional)',
        'ja_jp': 'Japanese (Japan)',
        'ko_kr': 'Korean (South Korea)',
        'pt_br': 'Portuguese (Brazil)',
        'pt_pt': 'Portuguese (Portugal)',
        'ru_ru': 'Russian (Russia)',
        'vi_vn': 'Vietnamese (Vietnam)',
    };
    return localeMap[locale_lower] || locale_lower;
}