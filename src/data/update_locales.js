const fs = require('fs');
const path = require('path');

// Read the timezones.json file
const timezonesPath = path.join(__dirname, 'src', 'assets', 'timezones.json');
const timezones = JSON.parse(fs.readFileSync(timezonesPath, 'utf8'));

// Define locale codes based on country codes
const getLocaleCode = (countryCode) => {
  const localeMap = {
    // English speaking countries
    'US': 'en_US',  // United States
    'GB': 'en_GB',  // United Kingdom
    'CA': 'en_CA',  // Canada
    'AU': 'en_AU',  // Australia
    'NZ': 'en_NZ',  // New Zealand
    'IE': 'en_IE',  // Ireland
    'ZA': 'en_ZA',  // South Africa
    'IN': 'en_IN',  // India
    'SG': 'en_SG',  // Singapore
    'HK': 'en_HK',  // Hong Kong
    'PH': 'en_PH',  // Philippines
    'MY': 'en_MY',  // Malaysia
    'JM': 'en_JM',  // Jamaica
    'TT': 'en_TT',  // Trinidad and Tobago
    'BB': 'en_BB',  // Barbados
    'BZ': 'en_BZ',  // Belize
    'GY': 'en_GY',  // Guyana
    'AG': 'en_AG',  // Antigua and Barbuda
    'BS': 'en_BS',  // Bahamas
    'DM': 'en_DM',  // Dominica
    'GD': 'en_GD',  // Grenada
    'KN': 'en_KN',  // Saint Kitts and Nevis
    'LC': 'en_LC',  // Saint Lucia
    'VC': 'en_VC',  // Saint Vincent and the Grenadines
    'AI': 'en_AI',  // Anguilla
    'BM': 'en_BM',  // Bermuda
    'VG': 'en_VG',  // British Virgin Islands
    'KY': 'en_KY',  // Cayman Islands
    'FK': 'en_FK',  // Falkland Islands
    'GI': 'en_GI',  // Gibraltar
    'MS': 'en_MS',  // Montserrat
    'SH': 'en_SH',  // Saint Helena
    'TC': 'en_TC',  // Turks and Caicos Islands
    
    // Spanish speaking countries
    'ES': 'es_ES',  // Spain
    'MX': 'es_MX',  // Mexico
    'AR': 'es_AR',  // Argentina
    'CL': 'es_CL',  // Chile
    'CO': 'es_CO',  // Colombia
    'VE': 'es_VE',  // Venezuela
    'PE': 'es_PE',  // Peru
    'EC': 'es_EC',  // Ecuador
    'UY': 'es_UY',  // Uruguay
    'PY': 'es_PY',  // Paraguay
    'BO': 'es_BO',  // Bolivia
    'CR': 'es_CR',  // Costa Rica
    'PA': 'es_PA',  // Panama
    'GT': 'es_GT',  // Guatemala
    'SV': 'es_SV',  // El Salvador
    'HN': 'es_HN',  // Honduras
    'NI': 'es_NI',  // Nicaragua
    'DO': 'es_DO',  // Dominican Republic
    'CU': 'es_CU',  // Cuba
    'PR': 'es_PR',  // Puerto Rico
    'GQ': 'es_GQ',  // Equatorial Guinea
    
    // French speaking countries
    'FR': 'fr_FR',  // France
    'BE': 'fr_BE',  // Belgium (French)
    'CH': 'fr_CH',  // Switzerland (French)
    'CA': 'fr_CA',  // Canada (French - will be overridden by English above)
    'LU': 'fr_LU',  // Luxembourg
    'MC': 'fr_MC',  // Monaco
    'SN': 'fr_SN',  // Senegal
    'ML': 'fr_ML',  // Mali
    'BF': 'fr_BF',  // Burkina Faso
    'NE': 'fr_NE',  // Niger
    'CI': 'fr_CI',  // Côte d'Ivoire
    'GN': 'fr_GN',  // Guinea
    'TD': 'fr_TD',  // Chad
    'CF': 'fr_CF',  // Central African Republic
    'CG': 'fr_CG',  // Republic of the Congo
    'GA': 'fr_GA',  // Gabon
    'CM': 'fr_CM',  // Cameroon
    'DJ': 'fr_DJ',  // Djibouti
    'MG': 'fr_MG',  // Madagascar
    'KM': 'fr_KM',  // Comoros
    'MU': 'fr_MU',  // Mauritius
    'SC': 'fr_SC',  // Seychelles
    'VU': 'fr_VU',  // Vanuatu
    'NC': 'fr_NC',  // New Caledonia
    'PF': 'fr_PF',  // French Polynesia
    'WF': 'fr_WF',  // Wallis and Futuna
    'YT': 'fr_YT',  // Mayotte
    'RE': 'fr_RE',  // Réunion
    'GP': 'fr_GP',  // Guadeloupe
    'MQ': 'fr_MQ',  // Martinique
    'GF': 'fr_GF',  // French Guiana
    'BL': 'fr_BL',  // Saint Barthélemy
    'MF': 'fr_MF',  // Saint Martin
    'PM': 'fr_PM',  // Saint Pierre and Miquelon
    
    // German speaking countries
    'DE': 'de_DE',  // Germany
    'AT': 'de_AT',  // Austria
    'CH': 'de_CH',  // Switzerland (German - will override French above)
    'LI': 'de_LI',  // Liechtenstein
    
    // Italian speaking countries
    'IT': 'it_IT',  // Italy
    'CH': 'it_CH',  // Switzerland (Italian - will override others above)
    'SM': 'it_SM',  // San Marino
    'VA': 'it_VA',  // Vatican City
    
    // Portuguese speaking countries
    'PT': 'pt_PT',  // Portugal
    'BR': 'pt_BR',  // Brazil
    'AO': 'pt_AO',  // Angola
    'MZ': 'pt_MZ',  // Mozambique
    'GW': 'pt_GW',  // Guinea-Bissau
    'CV': 'pt_CV',  // Cape Verde
    'ST': 'pt_ST',  // São Tomé and Príncipe
    'TL': 'pt_TL',  // East Timor
    'MO': 'pt_MO',  // Macau
    
    // Dutch speaking countries
    'NL': 'nl_NL',  // Netherlands
    'BE': 'nl_BE',  // Belgium (Dutch - will override French above)
    'SR': 'nl_SR',  // Suriname
    'AW': 'nl_AW',  // Aruba
    'CW': 'nl_CW',  // Curaçao
    'SX': 'nl_SX',  // Sint Maarten
    'BQ': 'nl_BQ',  // Caribbean Netherlands
    
    // Russian speaking countries
    'RU': 'ru_RU',  // Russia
    'BY': 'ru_BY',  // Belarus
    'KZ': 'ru_KZ',  // Kazakhstan
    'KG': 'ru_KG',  // Kyrgyzstan
    'TJ': 'ru_TJ',  // Tajikistan
    'TM': 'ru_TM',  // Turkmenistan
    'UZ': 'ru_UZ',  // Uzbekistan
    
    // Arabic speaking countries
    'SA': 'ar_SA',  // Saudi Arabia
    'EG': 'ar_EG',  // Egypt
    'AE': 'ar_AE',  // United Arab Emirates
    'QA': 'ar_QA',  // Qatar
    'KW': 'ar_KW',  // Kuwait
    'BH': 'ar_BH',  // Bahrain
    'OM': 'ar_OM',  // Oman
    'JO': 'ar_JO',  // Jordan
    'LB': 'ar_LB',  // Lebanon
    'SY': 'ar_SY',  // Syria
    'IQ': 'ar_IQ',  // Iraq
    'YE': 'ar_YE',  // Yemen
    'PS': 'ar_PS',  // Palestine
    'LY': 'ar_LY',  // Libya
    'TN': 'ar_TN',  // Tunisia
    'DZ': 'ar_DZ',  // Algeria
    'MA': 'ar_MA',  // Morocco
    'SD': 'ar_SD',  // Sudan
    'SO': 'ar_SO',  // Somalia
    'DJ': 'ar_DJ',  // Djibouti (will override French above)
    'KM': 'ar_KM',  // Comoros (will override French above)
    'MR': 'ar_MR',  // Mauritania
    
    // Chinese speaking countries/regions
    'CN': 'zh_CN',  // China (Simplified)
    'TW': 'zh_TW',  // Taiwan (Traditional)
    'HK': 'zh_HK',  // Hong Kong (will override English above)
    'MO': 'zh_MO',  // Macau (will override Portuguese above)
    'SG': 'zh_SG',  // Singapore (will override English above)
    
    // Japanese
    'JP': 'ja_JP',  // Japan
    
    // Korean
    'KR': 'ko_KR',  // South Korea
    'KP': 'ko_KP',  // North Korea
    
    // Hindi/other Indian languages
    'IN': 'hi_IN',  // India (will override English above)
    
    // Other major languages
    'TR': 'tr_TR',  // Turkey - Turkish
    'GR': 'el_GR',  // Greece - Greek
    'BG': 'bg_BG',  // Bulgaria - Bulgarian
    'RO': 'ro_RO',  // Romania - Romanian
    'HU': 'hu_HU',  // Hungary - Hungarian
    'CS': 'cs_CZ',  // Czech Republic - Czech
    'SK': 'sk_SK',  // Slovakia - Slovak
    'PL': 'pl_PL',  // Poland - Polish
    'HR': 'hr_HR',  // Croatia - Croatian
    'SI': 'sl_SI',  // Slovenia - Slovenian
    'RS': 'sr_RS',  // Serbia - Serbian
    'BA': 'bs_BA',  // Bosnia and Herzegovina - Bosnian
    'ME': 'sr_ME',  // Montenegro - Serbian
    'MK': 'mk_MK',  // North Macedonia - Macedonian
    'AL': 'sq_AL',  // Albania - Albanian
    'LT': 'lt_LT',  // Lithuania - Lithuanian
    'LV': 'lv_LV',  // Latvia - Latvian
    'EE': 'et_EE',  // Estonia - Estonian
    'FI': 'fi_FI',  // Finland - Finnish
    'SE': 'sv_SE',  // Sweden - Swedish
    'NO': 'no_NO',  // Norway - Norwegian
    'DK': 'da_DK',  // Denmark - Danish
    'IS': 'is_IS',  // Iceland - Icelandic
    'MT': 'mt_MT',  // Malta - Maltese
    'CY': 'el_CY',  // Cyprus - Greek
    'IL': 'he_IL',  // Israel - Hebrew
    'IR': 'fa_IR',  // Iran - Persian
    'AF': 'fa_AF',  // Afghanistan - Persian
    'PK': 'ur_PK',  // Pakistan - Urdu
    'BD': 'bn_BD',  // Bangladesh - Bengali
    'LK': 'si_LK',  // Sri Lanka - Sinhala
    'NP': 'ne_NP',  // Nepal - Nepali
    'BT': 'dz_BT',  // Bhutan - Dzongkha
    'MN': 'mn_MN',  // Mongolia - Mongolian
    'TH': 'th_TH',  // Thailand - Thai
    'LA': 'lo_LA',  // Laos - Lao
    'KH': 'km_KH',  // Cambodia - Khmer
    'VN': 'vi_VN',  // Vietnam - Vietnamese
    'MM': 'my_MM',  // Myanmar - Burmese
    'ID': 'id_ID',  // Indonesia - Indonesian
    'MS': 'ms_MY',  // Malaysia - Malay (will override English above)
    'BN': 'ms_BN',  // Brunei - Malay
    'PH': 'tl_PH',  // Philippines - Filipino (will override English above)
    'VU': 'bi_VU',  // Vanuatu - Bislama (will override French above)
    'FJ': 'fj_FJ',  // Fiji - Fijian
    'TO': 'to_TO',  // Tonga - Tongan
    'WS': 'sm_WS',  // Samoa - Samoan
    'KI': 'en_KI',  // Kiribati - English
    'TV': 'en_TV',  // Tuvalu - English
    'NR': 'en_NR',  // Nauru - English
    'PW': 'en_PW',  // Palau - English
    'FM': 'en_FM',  // Micronesia - English
    'MH': 'en_MH',  // Marshall Islands - English
    'SB': 'en_SB',  // Solomon Islands - English
    'PG': 'en_PG',  // Papua New Guinea - English
  };
  
  // Return specific locale or default to English
  return localeMap[countryCode] || 'en_US';
};

// Update each timezone entry
timezones.forEach(country => {
  country.timezones.forEach(timezone => {
    timezone.locale_code = getLocaleCode(country.code);
  });
});

// Write the updated data back to the file
fs.writeFileSync(timezonesPath, JSON.stringify(timezones, null, 2));

console.log('✅ Successfully updated timezones.json with locale_code field');

// Count locale codes
const localeCounts = {};
timezones.forEach(country => {
  country.timezones.forEach(timezone => {
    localeCounts[timezone.locale_code] = (localeCounts[timezone.locale_code] || 0) + 1;
  });
});

console.log('📊 Locale code distribution (top 10):');
const sortedLocales = Object.entries(localeCounts)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10);

sortedLocales.forEach(([locale, count]) => {
  console.log(`  ${locale}: ${count} timezones`);
});

console.log(`\nTotal unique locales: ${Object.keys(localeCounts).length}`);
