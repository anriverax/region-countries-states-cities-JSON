export * from "./country"
export * from "./state"
export * from "./city"
export * from "./region"
export * from "./subregion"
export * from "./language"

import { Country } from "./country"
import { State } from "./state"
import { City } from "./city"
import { Region } from "./region"
import { Subregion } from "./subregion"
import { Language } from "./language"

export declare function getCountries(): Country[];
export declare function getStates(): State[];
export declare function getRegions(): Region[];
export declare function getSubregions(): Subregion[];
export declare function getLanguages(): Language[];
export declare function getCountryById(id: number): Country | null;
export declare function getCountryByIso2(iso2: string): Country | null;
export declare function getStateByCode(code: string): State | null;
export declare function getStatesOfCountry(iso2: string): State[];
export declare function getStatesOfCountryById(countryId: number): State[];
export declare function getCitiesOfCountry(iso2: string): City[];
export declare function getCitiesOfState(stateId: number): City[];
export declare function searchCity(query: string): (City & { countryIso2: string })[];