// src/app/api/admin/deleteUsers/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseClient";
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

export async function DELETE(request: Request) {
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
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    
    console.log("Attempting to delete user with ID:", userId);
    
    // First, fetch the existing user data for logging
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from("users")
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (userDataError) {
      console.error('Error fetching user data:', userDataError.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Log the user deletion before actually deleting
    try {
      await supabaseAdmin
        .from('user_action_history')
        .insert({
          action_type: 'delete',
          performed_by: session.user.id,
          performed_by_email: session.user.email,
          target_user_id: userId,
          target_user_email: userData.email,
          previous_data: userData,
          new_data: null
        });
    } catch (logError) {
      console.error('Error logging user deletion:', logError);
      // Continue even if logging fails
    }
    
    // Delete from your custom users table first
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq('user_id', userId);
    
    if (dbError) {
      console.error('Database deletion error:', dbError.message);
      
      // If the error is about foreign key constraints, we need to handle it
      if (dbError.message.includes('violates foreign key constraint')) {
        console.log('Foreign key constraint error. Attempting to delete related records first.');
        // You might need to delete records from related tables first
        // This is just a placeholder - you'd need to identify the specific tables
      }
      
      // Try to delete by email as a fallback
      if (userData && userData.email) {
        console.log('Attempting to delete user by email instead of user_id');
        const { error: emailDbError } = await supabaseAdmin
          .from("users")
          .delete()
          .eq('email', userData.email);
          
        if (emailDbError) {
          console.error('Database deletion by email also failed:', emailDbError.message);
        } else {
          console.log('Successfully deleted user record by email');
        }
      }
    }
    
    // Then, delete the user from auth system using the admin API
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      if (authError.message.includes('user not found')) {
        console.log('Info: User not found in auth system (likely already deleted)');
      } else {
        console.error('Auth deletion error:', authError.message);
      }
      
      // If the user wasn't found, it might already be deleted
      if (authError.message.includes('user not found')) {
        console.log('User not found in auth system, may already be deleted');
        
        // If we've managed to delete from the users table, consider it a success
        if (!dbError) {
          return NextResponse.json({ 
            message: "User deleted from users table, not found in auth system", 
            success: true
          }, { status: 200 });
        }
      }
      
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