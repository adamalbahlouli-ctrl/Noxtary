// ============================================================
// NOXTARY — api.js
// جميع عمليات الاتصال بـ Supabase
// ============================================================

let productsData = [];

async function fetchProducts() {
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
    if (!response.ok) throw new Error('Supabase error — status: ' + response.status);
    productsData = await response.json();
    return productsData;
}
