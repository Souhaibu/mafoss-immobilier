import {CONTACT} from './config.js';
import {sendContactRequest} from './api.js';
import {escapeHtml as esc} from './catalogue.js';
export const $=(s,root=document)=>root.querySelector(s),$$=(s,root=document)=>[...root.querySelectorAll(s)];
export function contactLinks(message='Bonjour, je souhaite parler d’un projet immobilier.',subject='Projet immobilier'){
  return `<a class="button button-gold" href="https://wa.me/${CONTACT.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">WhatsApp <span aria-hidden="true">↗</span></a><a class="button button-outline" href="tel:${CONTACT.phone.replace(/[^\d+]/g,'')}">Appeler <span aria-hidden="true">↗</span></a><a class="button button-outline" href="mailto:${esc(CONTACT.email)}?subject=${encodeURIComponent(subject)}&amp;body=${encodeURIComponent(message)}">E-mail <span aria-hidden="true">↗</span></a>`;
}
export function openContact(propertyId='',project=''){
  $('#contact-status').textContent='';const form=$('#contact-form');form.dataset.propertyId=typeof propertyId==='string'?propertyId:'';
  if(project)form.elements.project.value=project;$('#contact-dialog').showModal();
}
export function initShared(){
  $$('.contact-trigger').forEach(b=>b.addEventListener('click',()=>openContact('',b.dataset.project||'')));
  $$('.credits-trigger').forEach(b=>b.addEventListener('click',()=>$('#credits-dialog').showModal()));
  $$('dialog').forEach(d=>{$('.dialog-close',d)?.addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
  const menu=$('.menu-toggle');menu?.addEventListener('click',()=>{const expanded=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',expanded);menu.setAttribute('aria-label',expanded?'Fermer le menu':'Ouvrir le menu');$('#navigation').classList.toggle('open',expanded)});
  $$('#navigation a').forEach(a=>a.addEventListener('click',()=>{menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Ouvrir le menu');$('#navigation')?.classList.remove('open')}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){menu.click();menu.focus()}});
  $$('[data-contact-channels]').forEach(el=>{el.innerHTML=contactLinks();el.hidden=false});
  $$('[data-footer-contacts]').forEach(el=>{el.innerHTML=`<a href="tel:+221774212484">${esc(CONTACT.phone)}</a><a href="https://wa.me/221774212484" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a>`;el.hidden=false});
  const page=document.body.dataset.page;$$('#navigation a').forEach(a=>{if(a.dataset.page===page)a.setAttribute('aria-current','page')});
  $('#contact-form')?.addEventListener('submit',async e=>{
    e.preventDefault();const form=e.target,status=$('#contact-status'),submit=$('[type=submit]',form),data=Object.fromEntries(new FormData(form));
    if(data.website){status.textContent='Le formulaire n’a pas été transmis. Contactez-nous directement par téléphone ou e-mail.';return}
    const email=data.email.trim(),phone=data.phone.trim();
    if(!email&&!phone){status.textContent='Indiquez un e-mail ou un numéro de téléphone pour recevoir une réponse.';form.elements.email.focus();return}
    if(!data.consent){status.textContent='Votre accord est nécessaire pour traiter cette demande.';return}
    submit.disabled=true;status.textContent='Envoi en cours…';
    try{await sendContactRequest({project:data.project,name:data.name.trim(),email:email||null,phone:phone||null,location:data.location.trim(),budget:data.budget?Number(data.budget):null,message:data.message.trim(),property_id:form.dataset.propertyId||null,consent:true});form.reset();form.dataset.propertyId='';status.textContent='Votre demande a été enregistrée. L’équipe pourra vous répondre avec les coordonnées indiquées.'}
    catch{status.textContent='La demande n’a pas été enregistrée. Réessayez ou contactez-nous au +221 77 421 24 84 / MAFOSHOLDING@gmail.com.'}
    finally{submit.disabled=false}
  });
}
export function initModel(){
  const canvas=$('#residence');if(!canvas)return;
  const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;observer.disconnect();import('./residence.js').then(m=>m.initResidence(canvas)).catch(()=>{canvas.hidden=true;const image=document.createElement('img');image.src='assets/villa-concept.webp';image.alt='Illustration conceptuelle de résidence, alternative à la maquette 3D';image.className='model-fallback';canvas.after(image);$('#model-instructions').textContent='Aperçu illustratif. La 3D n’est pas disponible dans ce navigateur.';$$('.model-controls button,.model-options button').forEach(b=>b.disabled=true)})},{rootMargin:'250px'});observer.observe(canvas);
}
