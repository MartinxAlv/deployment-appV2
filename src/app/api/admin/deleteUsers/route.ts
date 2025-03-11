import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function DELETE(request: Request) {
  try {
    // Parse the request body as JSON
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    
    console.log("Attempting to delete user with ID:", userId);
    
    // First, delete the user from auth system using the admin API
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Auth deletion error:', authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    
    // Then delete from your custom users table
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq('user_id', userId);
    
    if (dbError) {
      console.error('Database deletion error:', dbError.message);
      
      // Check if the user still exists in auth despite the attempted deletion
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (authUser) {
        console.error('User still exists in auth system after deletion attempt');
        return NextResponse.json({ error: "Failed to delete user from authentication system" }, { status: 400 });
      }
      
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }
    
    // Verify both deletions were successful
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    // Removed unused variable checkError - simply don't capture it as a variable
    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select()
      .eq('user_id', userId)
      .single();
    
    if (authUser || dbUser) {
      console.error('User still exists after deletion:', { authExists: !!authUser, dbExists: !!dbUser });
      return NextResponse.json({ 
        error: "User deletion partially failed", 
        details: { authExists: !!authUser, dbExists: !!dbUser } 
      }, { status: 400 });
    }
    
    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}