/* =====================================================
   SUPABASE SERVICE - supabase.js
   ===================================================== */

export const SUPABASE_URL   = 'https://sbwfrigdhivipmmkzgag.supabase.co';
export const SUPABASE_ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2ZyaWdkaGl2aXBtbWt6Z2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzEzNzIsImV4cCI6MjA5NDg0NzM3Mn0.tKhZOKyOjBZkyh6lJ22A77xd2TPjns3vtNaM1W5pPO8';
export const SUPABASE_TABLE = 'apps';

export async function fetchProducts() {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=*`,
        {
            headers: {
                'apikey':        SUPABASE_ANON,
                'Authorization': 'Bearer ' + SUPABASE_ANON,
                'Content-Type':  'application/json'
            }
        }
    );
    if (!response.ok) {
        throw new Error('Supabase error — status: ' + response.status);
    }
    return await response.json();
}
