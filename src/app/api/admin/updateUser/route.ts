// src/app/api/admin/updateUser/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseClient";
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Get admin status from the user table
    const { data: adminCheck, error: adminCheckError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();
    
    if (adminCheckError || !adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    
    // Parse the request body as JSON
    const body = await request.json();
    const { userId, email, name, role } = body;
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    
    console.log(`Updating user with ID: ${userId}`, { email, name, role });
    
    // First, fetch the existing user data for comparison and logging
    const { data: oldUserData, error: oldUserError } = await supabaseAdmin
      .from("users")
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (oldUserError) {
      console.error('Error fetching original user data:', oldUserError.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
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
    if (email && email !== oldUserData.email) {
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
    
    // Log the user update
    try {
      await supabaseAdmin
        .from('user_action_history')
        .insert({
          action_type: 'update',
          performed_by: session.user.id,
          performed_by_email: session.user.email,
          target_user_id: userId,
          target_user_email: email || oldUserData.email,
          previous_data: oldUserData,
          new_data: data
        });
    } catch (logError) {
      console.error('Error logging user update:', logError);
      // Continue even if logging fails
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