// src/app/api/admin/logUserAction/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseClient";
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  try {
    // Check authentication
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
    
    // Parse the request body
    const { actionType, targetUserId, targetUserEmail, previousData, newData } = await request.json();
    
    if (!actionType || !targetUserEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Create the history record
    const { data, error } = await supabaseAdmin
      .from('user_action_history')
      .insert({
        action_type: actionType,
        performed_by: session.user.id,
        performed_by_email: session.user.email,
        target_user_id: targetUserId,
        target_user_email: targetUserEmail,
        previous_data: previousData || {},
        new_data: newData || {}
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error logging user action:', error);
      return NextResponse.json({ error: "Failed to log action" }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Action logged successfully",
      record: data
    });
    
  } catch (error) {
    console.error('Error in log user action API:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}