// ESTRELLAS
const sc=document.getElementById('stars');
for(let i=0;i<60;i++){
  const s=document.createElement('div');
  s.className='star';
  const sz=Math.random()*2+0.5;
  s.style.cssText=`width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;opacity:0;animation-duration:${Math.random()*4+2}s;animation-delay:${Math.random()*4}s`;
  sc.appendChild(s);
}

// USES
const MAX_FREE=2;
const STORAGE_KEY='fdcc_uses';
let uses=parseInt(localStorage.getItem(STORAGE_KEY)||'0');
function updateUsesBadge(){
  const rem=MAX_FREE-uses;
  const el=document.getElementById('uses-txt');
  if(rem<=0){el.textContent='Acceso gratuito agotado — conseguí el acceso completo'}
  else if(rem===1){el.textContent='1 generación gratuita disponible'}
  else{el.textContent=`${rem} generaciones gratuitas disponibles`}
}
updateUsesBadge();

// NICHO
let nv='otro';
document.querySelectorAll('#nicho .opt').forEach(b=>{
  b.onclick=()=>{document.querySelectorAll('#nicho .opt').forEach(x=>x.classList.remove('on'));b.classList.add('on');nv=b.dataset.v};
});

// TONO
let tv='Motivacional y directo';
document.querySelectorAll('#tono .opt').forEach(b=>{
  b.onclick=()=>{document.querySelectorAll('#tono .opt').forEach(x=>x.classList.remove('on'));b.classList.add('on');tv=b.dataset.v};
});

// TOGGLES
document.querySelectorAll('#toggles input[type=checkbox]').forEach(cb=>{
  cb.onchange=()=>cb.closest('.tog-row').classList.toggle('on',cb.checked);
});

// PDF
let pdfNota='';
function handlePDF(input){
  const f=input.files[0];if(!f)return;
  document.getElementById('pdf-fn').textContent='📎 '+f.name;
  document.getElementById('pdf-drop').classList.add('on');
  pdfNota=`\nPDF ADJUNTO: El usuario subió un archivo llamado "${f.name}". Tomá el tema indicado como base y enriquecé el contenido de la app con información específica y relevante del nicho mencionado.`;
}

// GENERAR
function generar(){
  const nm=document.getElementById('nombre').value.trim();
  const tm=document.getElementById('tema').value.trim();
  const ex=document.getElementById('extra').value.trim();
  const mc=document.getElementById('marca').value.trim()||'FILMARTE · DC · CREADOR';
  const c1=document.getElementById('c1').value;
  const c2=document.getElementById('c2').value;

  if(!nm||!tm){alert('Completá el nombre y el tema de tu app para continuar.');return}

  // Verificar usos
  if(uses>=MAX_FREE){
    document.getElementById('output').style.display='none';
    document.getElementById('paywall').style.display='block';
    document.getElementById('paywall').scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }

  const fns=[];
  document.querySelectorAll('#toggles input:checked').forEach(c=>fns.push(c.dataset.fn));
  const nicho=nv==='otro'?tm:nv;

  const prompt=`Creá una mini app web completa en un ÚNICO archivo HTML para: "${nm}".

TEMA Y PÚBLICO: ${tm}
NICHO: ${nicho}${ex?'\nEXTRAS: '+ex:''}${pdfNota}
TONO: ${tv}
IDIOMA: español rioplatense (Argentina)
COLOR PRINCIPAL (fondo): ${c1}
COLOR DE ACENTO (botones, activos, destacados): ${c2}

FUNCIONES A INCLUIR:
${fns.map((f,i)=>`${i+1}. ${f}`).join('\n')}

REGLAS TÉCNICAS OBLIGATORIAS:
- Todo en UN ÚNICO archivo HTML. CSS y JS inline. Sin dependencias externas salvo Google Fonts.
- Diseño mobile-first, responsive, moderno y profesional.
- Fondo principal: ${c1}. Acento: ${c2}.
- TODOS los textos en blanco (#ffffff o #f0f0f0). NUNCA texto negro sobre fondo oscuro.
- Botones principales: fondo ${c2} con texto oscuro. Botones secundarios: borde ${c2} con texto blanco.
- Separaciones claras entre secciones.
- Si incluye Asistente IA: chat funcional con campo password para API key del usuario. Headers: Content-Type application/json, x-api-key [key], anthropic-version 2023-06-01, anthropic-dangerous-direct-browser-access true. Modelo: claude-sonnet-4-6.
- localStorage con prefijo: "app_${nm.replace(/\s+/g,'_').toLowerCase()}_"
- Pie de página: "${mc} · Creado con FILMARTE · DC · CREADOR by Digital Carmelo"
- Debe funcionar al abrirlo en el navegador o subirlo a Netlify Drop / GitHub Pages.

Devolvé ÚNICAMENTE el HTML completo. Sin explicaciones ni markdown. Empezando con <!DOCTYPE html>.`;

  // Incrementar uso
  uses++;
  localStorage.setItem(STORAGE_KEY,uses);
  updateUsesBadge();

  document.getElementById('prompt-txt').textContent=prompt;
  document.getElementById('output').style.display='block';
  document.getElementById('paywall').style.display='none';
  document.getElementById('output').scrollIntoView({behavior:'smooth',block:'start'});

  // Si llegó al límite, mostrar paywall después
  if(uses>=MAX_FREE){
    setTimeout(()=>{
      document.getElementById('paywall').style.display='block';
      document.getElementById('paywall').scrollIntoView({behavior:'smooth',block:'start'});
    },1000);
  }
}

function copiar(){
  navigator.clipboard.writeText(document.getElementById('prompt-txt').textContent).then(()=>{
    const b=event.target.closest('button');
    const o=b.textContent;b.textContent='✓ Copiado!';
    setTimeout(()=>b.textContent=o,2000);
  });
}
