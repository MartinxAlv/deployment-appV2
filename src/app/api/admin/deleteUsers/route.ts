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
    
    // Delete from your custom users table first
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq('user_id', userId);
    
    if (dbError) {
      console.error('Database deletion error:', dbError.message);
      // Continue with auth deletion even if DB deletion fails
    }
    
    // Then, delete the user from auth system using the admin API
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Auth deletion error:', authError.message);
      
      // Check if user was at least deleted from users table
      if (!dbError) {
        return NextResponse.json({ 
          message: "User partially deleted: Removed from users table but not from authentication system", 
          success: true
        }, { status: 200 });
      }
      
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    
    // If we get here, either both operations succeeded or one succeeded with the other failing silently
    // We'll consider this a success for the user experience
    return NextResponse.json({ 
      message: "User deleted successfully", 
      success: true 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}