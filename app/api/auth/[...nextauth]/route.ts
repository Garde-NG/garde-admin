import NextAuth from "next-auth";
import { authOptions } from "../../_lib/next-auth-options";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export const runtime = "nodejs";
