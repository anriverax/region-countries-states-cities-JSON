export interface State {
  id: number;
  name: string;
  countryId: number;
  iso2: string;
  latitude: string;
  longitude: string;
  translations: Record<string, string>;
  _new?: boolean;
}
