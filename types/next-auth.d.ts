import type { User as ApiUser } from "@/lib/auth/types";
import type { GardeToken } from "@/lib/auth/next-auth-shared";
import "next-auth";
declare module "next-auth" {
  interface User { authToken: GardeToken }
  interface Session {
    user?: ApiUser;
    authStep?: "authenticated" | "two_factor";
    challenge?: { setupRequired: boolean; method: "email_otp" | "totp" | null };
    authError?: "SessionExpired" | "ServiceUnavailable";
  }
}
