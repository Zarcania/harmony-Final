// @ts-nocheck
// Déclare Deno pour l'analyse TS hors runtime Deno
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCors, handleOptions } from '../utils/cors.ts';
Deno.serve(async (req)=>{
  const opt = handleOptions(req);
  if (opt) return opt;
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const origin = req.headers.get('Origin') ?? undefined;
    const corsHeaders = buildCors(origin);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({
        error: 'Email and password required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    if (existingUser) {
      const userExists = existingUser.users.find((u)=>u.email === email);
      if (userExists) {
        return new Response(JSON.stringify({
          message: 'User already exists',
          user: userExists
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    });
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Créer/mettre à jour la ligne de profil avec is_admin = true (source de vérité côté app)
    if (data.user?.id) {
      const { error: upsertError } = await supabaseAdmin.from('profiles').upsert({
        user_id: data.user.id,
        is_admin: true
      }, {
        onConflict: 'user_id'
      });
      if (upsertError) {
        return new Response(JSON.stringify({
          error: upsertError.message
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: data.user?.user_metadata?.role,
        profiles_is_admin: true
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    const origin = req.headers.get('Origin') ?? undefined;
    const corsHeaders = buildCors(origin);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
