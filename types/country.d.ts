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

export interface Country {
id: number;
  subRegionId: number;
  name: string;
  iso2: string;
  iso3: string;
  numericCode: string;
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
}
