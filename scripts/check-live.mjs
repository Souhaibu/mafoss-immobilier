// Vérifications HTTP en lecture seule. N'insère aucune demande et n'accède à aucun dossier client.
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '../dist/config.js';
import {fetchProperties} from '../dist/api.js';
const items=await fetchProperties();
console.log(JSON.stringify({catalogue:'ok',published:items.length,demo:items.filter(p=>p.demo).length,hasPrivatePrices:items.some(p=>'price' in p)}));
for(const table of ['contact_requests','property_prices','admin_users']){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(12000)});
  console.log(JSON.stringify({table,anonymousReadStatus:response.status}));
  if(![401,403].includes(response.status)){process.exitCode=1;console.error('Vérifier les droits de lecture anonymes de '+table)}
}
