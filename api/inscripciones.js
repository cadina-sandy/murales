module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'Método no permitido'});
  const origin = req.headers.origin;
  if (origin !== 'https://murales-two.vercel.app') return res.status(403).json({error:'Origen no permitido'});
  const url = process.env.GOOGLE_SCRIPT_URL, secret = process.env.FORM_SECRET;
  if (!url || !secret) return res.status(503).json({error:'Inscripciones aún no habilitadas'});
  const d = req.body;
  if (!d || typeof d !== 'object') return res.status(400).json({error:'Datos inválidos'});
  const limits={nombre:150,curso:60,acompanante:150,vinculo:80,correo:200,telefono:40,titulo:200,eje:100,idea:20000,comentarios:20000,id:100};
  const clean={};
  for(const [key,max] of Object.entries(limits)) {
    const v=d[key]??'';
    if(typeof v!=='string'||v.length>max)return res.status(400).json({error:'Revisa los datos'});
    clean[key]=v.trim();
  }
  if(['nombre','curso','correo','telefono'].some(k=>!clean[k])||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.correo)||! /^[a-zA-Z0-9-]{8,100}$/.test(clean.id))return res.status(400).json({error:'Revisa los datos obligatorios'});
  if(['idea','comentarios'].some(k=>clean[k]&&clean[k].split(/\s+/u).length>200))return res.status(400).json({error:'Máximo 200 palabras'});
  try {
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret,data:clean}),signal:AbortSignal.timeout(25000)});
    const result=await response.json();
    if(!response.ok||!result.codigo)return res.status(502).json({error:'No se pudo confirmar el registro. Inténtalo nuevamente.'});
    return res.status(201).json({codigo:result.codigo});
  }catch(_){return res.status(502).json({error:'No se pudo confirmar el registro. Inténtalo nuevamente.'});}
};
