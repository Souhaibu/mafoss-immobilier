// Accès public à Supabase (API REST), sans dépendance : lecture du catalogue et envoi des demandes.
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './config.js';
const rest=`${SUPABASE_URL}/rest/v1`;
const headers={apikey:SUPABASE_PUBLISHABLE_KEY};
const columns='id,title,region,city,district,type,transaction,area,rooms,baths,image,visual,feature,description,demo';
export async function fetchProperties(){
  const response=await fetch(`${rest}/properties?select=${columns}&published=eq.true&order=sort_order.asc,created_at.desc`,{headers,signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error(`Catalogue indisponible (${response.status})`);
  const properties=await response.json();
  return properties.map(property=>typeof property.visual==='string'?{...property,visual:property.visual.replace(/illustration\s+IA\b/gi,'Illustration conceptuelle')}:property);
}
export async function sendContactRequest(request){
  const response=await fetch(`${rest}/contact_requests`,{method:'POST',headers:{...headers,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(request),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`Envoi impossible (${response.status})`);
}
