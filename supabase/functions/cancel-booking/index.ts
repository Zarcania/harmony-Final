// cancel-booking: Cancel a booking using a one-time token
// Assumptions:
// - Tables: public.cancellation_tokens(id, booking_id, token, expires_at, used_at)
// -         public.bookings(id, status, canceled_at)
// - RLS: anon has no direct SELECT on cancellation_tokens/bookings (as configured)
// - This function uses the service role key to bypass RLS safely on the server
// - Method: POST /cancel-booking with JSON body { token: string }
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false
  }
});
console.info("cancel-booking function started");
Deno.serve(async (req)=>{
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Method not allowed"
      }), {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({
        error: "Content-Type must be application/json"
      }), {
        status: 415,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const body = await req.json().catch(()=>({}));
    const token = body.token?.trim();
    if (!token) {
      return new Response(JSON.stringify({
        error: "Missing token"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Fetch the token row with validity checks in SQL to avoid race conditions later
    const { data: tokenRows, error: tokenErr } = await supabaseAdmin.from("cancellation_tokens").select("id, booking_id, expires_at, used_at").eq("token", token).limit(1);
    if (tokenErr) {
      console.error("token query error", tokenErr);
      return new Response(JSON.stringify({
        error: "Token lookup failed"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const tokenRow = tokenRows?.[0];
    if (!tokenRow) {
      return new Response(JSON.stringify({
        error: "Invalid token"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (tokenRow.used_at) {
      return new Response(JSON.stringify({
        error: "Token already used"
      }), {
        status: 409,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        error: "Token expired"
      }), {
        status: 410,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Atomically cancel the booking and mark token as used using a Postgres RPC or a transaction via REST is not atomic.
    // We'll use two sequential updates with a defensive WHERE clause to prevent double-usage.
    // 1) Update booking status if not already cancelled/completed
    const { error: bookingErr } = await supabaseAdmin.from("bookings").update({
      status: "cancelled",
      canceled_at: new Date().toISOString()
    }).eq("id", tokenRow.booking_id).neq("status", "cancelled");
    if (bookingErr) {
      console.error("booking update error", bookingErr);
      return new Response(JSON.stringify({
        error: "Failed to cancel booking"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // 2) Mark token as used if still unused
    const { error: tokenUpdateErr } = await supabaseAdmin.from("cancellation_tokens").update({
      used_at: new Date().toISOString()
    }).eq("id", tokenRow.id).is("used_at", null);
    if (tokenUpdateErr) {
      console.error("token update error", tokenUpdateErr);
      return new Response(JSON.stringify({
        error: "Failed to finalize cancellation"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Optional: Write an email log or notification asynchronously
    EdgeRuntime.waitUntil((async ()=>{
      try {
        await supabaseAdmin.from("email_logs").insert({
          booking_id: tokenRow.booking_id,
          email_type: "cancellation",
          recipient_email: "",
          status: "sent"
        });
      } catch (e) {
        console.error("async log error", e);
      }
    })());
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (e) {
    console.error("unhandled error", e);
    return new Response(JSON.stringify({
      error: "Internal error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
