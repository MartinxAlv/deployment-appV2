import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

// ✅ Fetch users from Supabase
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.from("users").select("*");

    if (error) {
      console.error("❌ Supabase Error:", error);
      return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
