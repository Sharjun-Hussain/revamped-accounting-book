// NextAuth credentials provider backed by the Express + MySQL backend.
// Login is proxied to POST <backend>/auth/login; the backend JWT is kept in
// the session (backendToken) and attached to every backend call by
// src/lib/api.js and src/lib/backendFetch.js.
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').replace(/\/$/, '');

const toLegacyRole = (roles) => {
  const names = (roles || []).map((r) => r.name);
  if (names.includes('Super Admin')) return 'superadmin';
  if (names.includes('Mosque Admin')) return 'admin';
  return 'user';
};

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 3600, // 7 days (matches backend JWT_EXPIRES_IN)
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        let res;
        try {
          res = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
            cache: 'no-store',
          });
        } catch {
          throw new Error("Cannot reach the backend API. Is it running?");
        }

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.message || body.error || "Invalid email or password.");
        }

        // Backend envelope: { status, data: { token, user } }
        const { token, user } = body.data || {};
        if (!token || !user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: toLegacyRole(user.roles),
          backendToken: token,
          organizationId: user.organizationId || null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.backendToken = user.backendToken;
        token.accessToken = user.backendToken;
        token.organizationId = user.organizationId;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.backendToken = token.backendToken;
        session.accessToken = token.accessToken;
        session.organizationId = token.organizationId;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
