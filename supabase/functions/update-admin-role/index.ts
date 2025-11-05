// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCors, handleOptions } from '../utils/cors.ts';
Deno.serve(async (req)=>{
  const origin = req.headers.get('Origin') ?? undefined;
  const corsHeaders = buildCors(origin);
  const opt = handleOptions(req);
  if (opt) return opt;
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({
        error: 'Email required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      return new Response(JSON.stringify({
        error: listError.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const user = users.users.find((u)=>u.email === email);
    if (!user) {
      return new Response(JSON.stringify({
        error: 'User not found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 1) Marquer le compte comme admin dans les métadonnées (optionnel côté app)
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
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
    // 2) Source de vérité pour l'app: public.profiles.is_admin = true
    //    - crée la ligne si absente (on conflict)
    const { error: upsertError } = await supabaseAdmin.from('profiles').upsert({
      user_id: user.id,
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
    return new Response(JSON.stringify({
      success: true,
      message: 'Admin role added successfully',
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
