export interface Country {
  id: string;
  name: string;
  iso2_code: string;
  iso3_code: string;
  phone_code: string;
  currency_code: string;
  currency_name: string;
  currency_name_translations: Record<string, string>;
  currency_symbol: string;
  flag_emoji: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CountryMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface CountryList {
  items: Country[];
  meta: CountryMeta;
}

export interface CountryInput {
  name: string;
  iso2_code: string;
  iso3_code: string;
  phone_code: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  flag_emoji: string;
  is_active?: boolean;
}
