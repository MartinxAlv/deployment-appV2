import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function PUT(request: Request) {
  try {
    // Parse the request body as JSON
    const body = await request.json();
    const { userId, email, name, role } = body;
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    
    console.log(`Updating user with ID: ${userId}`, { email, name, role });
    
    // Update user data in the users table
    const { data, error: dbError } = await supabaseAdmin
      .from("users")
      .update({
        name,
        email,
        role
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (dbError) {
      console.error('Database update error:', dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // If email has changed, update it in the auth system using admin API
    if (email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email: email }
      );
      
      if (authError) {
        console.error('Auth update error:', authError.message);
        return NextResponse.json({ 
          message: "User partially updated: Updated in users table but email change failed in authentication system",
          data: data,
          error: authError.message
        }, { status: 200 });
      }
    }
    
    return NextResponse.json({ 
      message: "User updated successfully", 
      data: data
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}