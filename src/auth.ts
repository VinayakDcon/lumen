/* eslint-disable */
import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

// Check if credentials exist, otherwise log warning and allow fallback
const hasCredentials =
  !!process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  !!process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET;

if (!hasCredentials) {
  console.warn(
    "NextAuth Microsoft Entra ID credentials missing. Running in mock session mode. Configure .env.local for production."
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(hasCredentials
      ? [
        MicrosoftEntraID({
          clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
          clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
          issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
        }),
      ]
      : []),
  ],
  callbacks: {
    async signIn({ user }) {
      if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
        return true;
      }
      const email = (user.email || "").toLowerCase().trim();
      if (!email.endsWith("@dcontour.tech")) {
        return false;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiUrl}/api/me?email=${encodeURIComponent(email)}`);
        if (!res.ok) {
          console.warn(`[Auth] Sign-in rejected for ${email}: Backend responded with status ${res.status}`);
          return false;
        }
        return true;
      } catch (err) {
        console.error("[Auth] Database verification during sign-in failed:", err);
        return false;
      }
    },
    async session({ session, token }) {
      // Mock session logic when bypass mode is active
      if (!hasCredentials || process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
        session.user = {
          name: "Vinayak Chouhan",
          email: "vinayak.chouhan@dcontour.tech",
          image: "https://avatar.vercel.sh/vinayak",
          id: "usr-1",
          emailVerified: null,
        } as any;
        // Add custom fields
        (session as any).role = "SOFTWARE_LEAD";
        return session;
      }

      // Real callbacks
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin", // Fallback customized signin page if needed
  },
  secret: process.env.AUTH_SECRET || "pmo_secret_token_change_me_in_production_123456",
});
