// src/app/api/admin/addUser/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

export async function POST(request: Request) {
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
    const { email, password, name, userRole } = body;

    // Debug log to verify what's being received
    console.log('Received request with data:', { email, name, userRole });

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`Attempting to create user with email: ${email}, role: ${userRole}`);
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm the email
    });

    if (authError) {
      console.error('User creation error:', authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData?.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Make sure the role is explicitly set to the provided value
    const role = userRole === 'admin' ? 'admin' : 'technician';
    
    // Insert the user into your users table with the name field and explicit role
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .upsert({
        user_id: authData.user.id,
        email: email,
        name: name,
        role: role // Explicitly set the role
      }, { 
        onConflict: 'email'
      });

    if (dbError) {
      console.error('Database insertion error:', dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // Log the user creation action
    const userData = {
      user_id: authData.user.id,
      email: email,
      name: name,
      role: role
    };
    
    try {
      await supabaseAdmin
        .from('user_action_history')
        .insert({
          action_type: 'create',
          performed_by: session.user.id,
          performed_by_email: session.user.email,
          target_user_id: authData.user.id,
          target_user_email: email,
          previous_data: null,
          new_data: userData
        });
    } catch (logError) {
      console.error('Error logging user creation:', logError);
      // Continue even if logging fails
    }

    return NextResponse.json({ 
      message: "User created successfully", 
      userId: authData.user.id,
      role: role // Return the role in the response for verification
    }, { status: 200 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}