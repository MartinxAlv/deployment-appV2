import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabaseClient";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email || "";
        const password = credentials?.password || "";

        // 🔹 Attempt to sign in user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user) {
          console.error("Auth Error:", error?.message);
          throw new Error(error?.message || "Invalid credentials");
        }

        console.log("Authenticated User ID:", data.user.id);

        // 🔹 Fetch user role from Supabase "users" table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("user_id, role") // ✅ Ensure user_id and role are selected
          .eq("user_id", data.user.id)
          .single();

        // 🔹 Debugging Logs
        console.log("User Data from DB:", userData);
        console.log("Error from DB Query:", userError);

        if (userError || !userData) {
          console.error("Error fetching user role:", userError?.message || "No user found");
          throw new Error("Failed to fetch user role");
        }

        // ✅ Return session with user role included
        return {
          id: data.user.id,
          email: data.user.email,
          role: userData.role, // Include role in session
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },

  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      console.log("Session Callback - Token Data:", token);
      session.user.id = token.id;
      session.user.role = token.role; // Ensure role is stored in session
      return session;
    },
    async jwt({ token, user }: { token: any; user?: any }) {
      console.log("JWT Callback - User Data:", user);
      if (user) {
        token.id = user.id;
        token.role = user.role; // Store role in token
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
