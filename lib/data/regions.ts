/**
 * Subdivision (region/state/emirate) lists for Manpower target markets.
 * Country code = ISO 3166-1 alpha-2. Returns null for countries with no curated list —
 * UI then falls back to a free-text input.
 */

export type RegionOption = { code: string; name: string };

const UAE_EMIRATES: RegionOption[] = [
  { code: "AZ", name: "Abu Dhabi" },
  { code: "DU", name: "Dubai" },
  { code: "SH", name: "Sharjah" },
  { code: "AJ", name: "Ajman" },
  { code: "UQ", name: "Umm Al Quwain" },
  { code: "RK", name: "Ras Al Khaimah" },
  { code: "FU", name: "Fujairah" },
];

const KSA_REGIONS: RegionOption[] = [
  { code: "01", name: "Riyadh" },
  { code: "02", name: "Makkah" },
  { code: "03", name: "Madinah" },
  { code: "04", name: "Eastern Province" },
  { code: "05", name: "Qassim" },
  { code: "06", name: "Ha'il" },
  { code: "07", name: "Tabuk" },
  { code: "08", name: "Northern Borders" },
  { code: "09", name: "Jazan" },
  { code: "10", name: "Najran" },
  { code: "11", name: "Al Bahah" },
  { code: "12", name: "Al Jawf" },
  { code: "14", name: "Asir" },
];

const QATAR_MUNICIPALITIES: RegionOption[] = [
  { code: "DA", name: "Doha" },
  { code: "RA", name: "Al Rayyan" },
  { code: "WA", name: "Al Wakrah" },
  { code: "KH", name: "Al Khor" },
  { code: "US", name: "Umm Salal" },
  { code: "MS", name: "Al Daayen" },
  { code: "SH", name: "Al Shamal" },
  { code: "ZA", name: "Al Shahaniya" },
];

const KUWAIT_GOVERNORATES: RegionOption[] = [
  { code: "KU", name: "Al Asimah (Capital)" },
  { code: "HA", name: "Hawalli" },
  { code: "FA", name: "Al Farwaniyah" },
  { code: "AH", name: "Al Ahmadi" },
  { code: "JA", name: "Al Jahra" },
  { code: "MU", name: "Mubarak Al-Kabeer" },
];

const BAHRAIN_GOVERNORATES: RegionOption[] = [
  { code: "13", name: "Capital" },
  { code: "14", name: "Southern" },
  { code: "15", name: "Muharraq" },
  { code: "17", name: "Northern" },
];

const OMAN_GOVERNORATES: RegionOption[] = [
  { code: "MA", name: "Muscat" },
  { code: "BS", name: "Al Batinah South" },
  { code: "BJ", name: "Al Batinah North" },
  { code: "DA", name: "Ad Dakhiliyah" },
  { code: "ZA", name: "Adh Dhahirah" },
  { code: "BU", name: "Al Buraimi" },
  { code: "SS", name: "Ash Sharqiyah South" },
  { code: "SJ", name: "Ash Sharqiyah North" },
  { code: "WU", name: "Al Wusta" },
  { code: "ZU", name: "Dhofar" },
  { code: "MU", name: "Musandam" },
];

const EGYPT_GOVERNORATES: RegionOption[] = [
  { code: "C", name: "Cairo" },
  { code: "ALX", name: "Alexandria" },
  { code: "GZ", name: "Giza" },
  { code: "DK", name: "Dakahlia" },
  { code: "BH", name: "Beheira" },
  { code: "FYM", name: "Faiyum" },
  { code: "GH", name: "Gharbia" },
  { code: "IS", name: "Ismailia" },
  { code: "MNF", name: "Monufia" },
  { code: "MN", name: "Minya" },
  { code: "QH", name: "Qalyubia" },
  { code: "PTS", name: "Port Said" },
  { code: "SHR", name: "Sharqia" },
  { code: "SUZ", name: "Suez" },
  { code: "ASN", name: "Aswan" },
  { code: "AST", name: "Asyut" },
  { code: "BNS", name: "Beni Suef" },
  { code: "DT", name: "Damietta" },
  { code: "JS", name: "South Sinai" },
  { code: "KFS", name: "Kafr El Sheikh" },
  { code: "MT", name: "Matrouh" },
  { code: "KB", name: "Qena" },
  { code: "SIN", name: "North Sinai" },
  { code: "SHG", name: "Sohag" },
  { code: "LX", name: "Luxor" },
  { code: "WAD", name: "New Valley" },
  { code: "BA", name: "Red Sea" },
];

const UK_NATIONS: RegionOption[] = [
  { code: "ENG", name: "England" },
  { code: "SCT", name: "Scotland" },
  { code: "WLS", name: "Wales" },
  { code: "NIR", name: "Northern Ireland" },
];

const US_STATES: RegionOption[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

const INDIA_STATES: RegionOption[] = [
  { code: "AN", name: "Andaman & Nicobar Islands" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CH", name: "Chandigarh" },
  { code: "CT", name: "Chhattisgarh" },
  { code: "DN", name: "Dadra & Nagar Haveli and Daman & Diu" },
  { code: "DL", name: "Delhi" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JK", name: "Jammu & Kashmir" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OR", name: "Odisha" },
  { code: "PY", name: "Puducherry" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TG", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UT", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
];

const REGIONS_BY_COUNTRY: Record<string, RegionOption[]> = {
  AE: UAE_EMIRATES,
  SA: KSA_REGIONS,
  QA: QATAR_MUNICIPALITIES,
  KW: KUWAIT_GOVERNORATES,
  BH: BAHRAIN_GOVERNORATES,
  OM: OMAN_GOVERNORATES,
  EG: EGYPT_GOVERNORATES,
  GB: UK_NATIONS,
  US: US_STATES,
  IN: INDIA_STATES,
};

const REGION_LABEL_BY_COUNTRY: Record<string, string> = {
  AE: "Emirate",
  SA: "Region",
  QA: "Municipality",
  KW: "Governorate",
  BH: "Governorate",
  OM: "Governorate",
  EG: "Governorate",
  GB: "Nation",
  US: "State",
  IN: "State / UT",
};

export function getRegions(countryCode: string | null | undefined): RegionOption[] | null {
  if (!countryCode) return null;
  return REGIONS_BY_COUNTRY[countryCode.toUpperCase()] ?? null;
}

export function getRegionLabel(countryCode: string | null | undefined): string {
  if (!countryCode) return "Region / state";
  return REGION_LABEL_BY_COUNTRY[countryCode.toUpperCase()] ?? "Region / state";
}
