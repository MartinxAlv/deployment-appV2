// src/app/api/admin/userHistory/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseClient";
import { getServerSession } from 'next-auth';

// GET - Fetch user action history
export async function GET(request: Request) {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession();
    
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
    
    // Get URL query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const actionType = url.searchParams.get('action_type');
    
    // Build the query
    let query = supabaseAdmin
      .from('user_action_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    // Add action_type filter if provided
    if (actionType) {
      query = query.eq('action_type', actionType);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching user history:', error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in user history API:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Restore a deleted user
export async function POST(request: Request) {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession();
    
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
    
    // Parse request body
    const { historyId } = await request.json();
    
    if (!historyId) {
      return NextResponse.json({ error: "Missing historyId" }, { status: 400 });
    }
    
    // Fetch the history record
    const { data: historyRecord, error: historyError } = await supabaseAdmin
      .from('user_action_history')
      .select('*')
      .eq('id', historyId)
      .single();
    
    if (historyError || !historyRecord) {
      console.error('Error fetching history record:', historyError);
      return NextResponse.json({ error: "History record not found" }, { status: 404 });
    }
    
    // Only allow restoring deleted users
    if (historyRecord.action_type !== 'delete') {
      return NextResponse.json({ error: "Can only restore deleted users" }, { status: 400 });
    }
    
    
    // Restore the user in auth system first (if they were completely deleted)
    // We'll need to recreate the user with a temporary password
    const temporaryPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);
    
    // Get user data from the history record
    const userData = historyRecord.previous_data;
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        restored: true,
        restored_by: session.user.email,
        restored_at: new Date().toISOString()
      }
    });
    
    if (authError) {
      console.error('Error recreating user in auth:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
    
    // Now restore the user in the users table
    // Now restore the user in the users table
const { error: dbError } = await supabaseAdmin
.from("users")
.upsert({
  user_id: authData.user.id,
  email: userData.email,
  name: userData.name,
  role: userData.role
}, { 
  onConflict: 'email',
  ignoreDuplicates: false
});
    
    if (dbError) {
      console.error('Error restoring user in database:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    
    // Create a new history record for the restoration
    const { error: historyInsertError } = await supabaseAdmin
      .from('user_action_history')
      .insert({
        action_type: 'restore',
        performed_by: session?.user?.id,
        performed_by_email: session?.user?.email,
        target_user_id: authData.user.id,
        target_user_email: userData.email,
        previous_data: historyRecord.previous_data,
        new_data: {
          user_id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          needs_password_reset: true
        }
      });
    
    if (historyInsertError) {
      console.error('Error creating history record for restoration:', historyInsertError);
      // Not a critical error, we can still continue
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "User restored successfully", 
      userId: authData.user.id,
      needsPasswordReset: true
    });
    
  } catch (error) {
    console.error('Error in restore user API:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}