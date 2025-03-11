import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient"; // Ensure correct import

// ✅ Fetch users from Supabase
export async function GET() {
  try {
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
