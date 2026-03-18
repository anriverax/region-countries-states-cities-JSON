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
  currency?: string;
  /** Country name translated into other languages */
  translations?: Translations;
}
