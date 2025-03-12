// src/app/api/admin/reset-user-password/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';

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
    const { userId, newPassword } = await request.json();
    
    if (!userId || !newPassword) {
      return NextResponse.json({ error: "User ID and new password are required" }, { status: 400 });
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }
    
    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );
    
    if (updateError) {
      console.error('Password update error:', updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // Log the password reset action for security audit
    console.log(`Admin user ${session.user.email} reset password for user ID ${userId}`);
    
    // Return success response
    return NextResponse.json({ 
      message: "Password reset successfully" 
    });
    
  } catch (error) {
    console.error('Error in admin password reset:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}