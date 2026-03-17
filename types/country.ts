export interface Timezone {
  zoneName: string;
  gmtOffset: number;
  gmtOffsetName: string;
  abbreviation: string;
  tzName: string;
}

export interface Flags {
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
  timezones: Timezone;
  latlng: [string, string];
  emoji: [string, string];
  languages: Record<string, string>;
  flag: string;
  flags: Flags;
  maps?: Record<string, string>;
}
