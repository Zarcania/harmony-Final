// decommissioned function placeholder
console.info('send_booking_email decommissioned');
Deno.serve((_req)=>new Response(JSON.stringify({
    status: 'gone',
    message: 'send_booking_email has been decommissioned'
  }), {
    headers: {
      'Content-Type': 'application/json'
    },
    status: 410
  }));
