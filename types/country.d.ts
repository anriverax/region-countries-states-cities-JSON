export interface Timezone {
  zoneName: string;
  gmtOffset: number;
  gmtOffsetName: string;
  abbreviation: string;
  tzName: string;
}

export interface ImageAsset {
  png: string;
  svg: string;
}

/**
 * Translations of the country name in different languages, keyed by ISO 639-1
 * language code.
 *
 * @example
 * { "es": "Alemania", "fr": "Allemagne", "pt": "Alemanha" }
 */
export type Translations = Record<string, string>;

export interface Country {
  id: number;
  subRegionId: number;
  name: string;
  iso2: string;
  iso3: string;
  numericCode: string;
  /** Dialling / phone prefix, e.g. "+503" */
  phoneCode: string;
  capital: string;
  tld: string;
  flag: string;
  emoji: [string, string];
  timezones: Timezone;
  latlng: [string, string];
  languages: Record<string, string>;
  flags: ImageAsset;
  maps?: Record<string, string>;
  coatOfArms?: ImageAsset;
  /** ISO 4217 currency code, e.g. "USD", "EUR" */
  currency: string;
  /** Full name of the currency, e.g. "United States dollar" */
  currency_name: string;
  /** Currency symbol, e.g. "$", "€" */
  currency_symbol: string;
  /** Native name of the country in its own language */
  native: string | null;
  /** Country population */
  population: number;
  /** GDP in millions USD */
  gdp: number | null;
  /** Region name, e.g. "Asia", "Europe" */
  region: string;
  /** Region numeric ID */
  region_id: number;
  /** Sub-region name, e.g. "Southern Asia" */
  subregion: string;
  /** Demonym / nationality adjective, e.g. "Afghan", "American" */
  nationality: string;
  /** Area in square kilometres */
  area_sq_km: number | null;
  /** Postal code format pattern (# = digit), e.g. "#####" */
  postal_code_format: string | null;
  /** Postal code validation regex */
  postal_code_regex: string | null;
  /** Country name translated into other languages */
  translations: Translations;
  /** Wikidata entity ID, e.g. "Q889" */
  wikiDataId: string | null;
}
