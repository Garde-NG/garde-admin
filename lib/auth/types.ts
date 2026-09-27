export type TwoFactorMethod = "email_otp" | "totp";
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  user_type: "admin" | "customer";
  is_two_factor_enabled: boolean;
  two_factor_method: TwoFactorMethod | null;
  is_passwordless_enabled: boolean;
  created_at: string;
  updated_at: string;
}
export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
export interface LoginChallenge {
  pending_token: string;
  two_factor_setup_required: boolean;
  two_factor_method: TwoFactorMethod | null;
}
export interface Setup {
  method: TwoFactorMethod;
  pending_token?: string;
  totp_secret: string | null;
  totp_otpauth_uri: string | null;
}
