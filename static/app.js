const sb=supabase.createClient(SC.url,SC.key);
async function requireUser(){let {data:{session}}=await sb.auth.getSession();if(!session&&location.pathname!="/")location="/";return session}
if(location.pathname!=="/") requireUser();
async function login(){let email=document.querySelector("#email").value,password=document.querySelector("#password").value;let {error}=await sb.auth.signInWithPassword({email,password});document.querySelector("#msg").textContent=error?error.message:"Acceso correcto";if(!error)location="/dashboard"}
document.querySelector("#logout")?.addEventListener("click",async()=>{await sb.auth.signOut();location="/"});
async function loadDashboard(){let {data}=await sb.from("boletas").select("estado,precio");let counts={};let vendido=0;(data||[]).forEach(x=>{counts[x.estado]=(counts[x.estado]||0)+1;if(["PAGADA","UTILIZADA"].includes(x.estado))vendido+=Number(x.precio)});let vals=[["Total",(data||[]).length],["Disponibles",counts.DISPONIBLE||0],["Asignadas",counts.ASIGNADA||0],["Pagadas",(counts.PAGADA||0)+(counts.UTILIZADA||0)],["Entradas",counts.UTILIZADA||0],["Vendido","RD$ "+vendido.toLocaleString()]];document.querySelector("#kpis").innerHTML=vals.map(v=>`<div class="col-6 col-lg-4"><div class="card kpi shadow-sm p-3"><small class="text-muted">${v[0]}</small><div class="fs-3 fw-bold">${v[1]}</div></div></div>`).join("")}
async function loadVendedores(){
  const [{data:vendedores,error},{data:boletas},{data:entregas}]=await Promise.all([
    sb.from("vendedores").select("*").order("nombre"),
    sb.from("boletas").select("vendedor_id,estado,precio"),
    sb.from("entregas_dinero").select("vendedor_id,monto")
  ]);
  if(error){sellerList.innerHTML=error.message;return;}
  sellerList.innerHTML=(vendedores||[]).map(v=>{
    const bs=(boletas||[]).filter(b=>b.vendedor_id===v.id);
    const pagadas=bs.filter(b=>["PAGADA","UTILIZADA"].includes(b.estado));
    const pendientes=bs.filter(b=>b.estado==="ASIGNADA");
    const vendido=pagadas.reduce((s,b)=>s+Number(b.precio||0),0);
    const entregado=(entregas||[]).filter(e=>e.vendedor_id===v.id).reduce((s,e)=>s+Number(e.monto||0),0);
    const porEntregar=Math.max(0,vendido-entregado);
    return `<div class="card p-3 mb-3 shadow-sm">
      <div class="d-flex justify-content-between align-items-start"><div><b class="fs-5">${v.nombre}</b><div>${v.telefono||""}</div><small class="text-muted">${v.email||""}</small></div><span class="badge text-bg-success">${v.activo?"Activo":"Inactivo"}</span></div>
      <hr class="my-2">
      <div class="row g-2 text-center">
        <div class="col-4"><small class="text-muted d-block">Asignadas</small><b>${bs.length}</b></div>
        <div class="col-4"><small class="text-muted d-block">Pagadas</small><b>${pagadas.length}</b></div>
        <div class="col-4"><small class="text-muted d-block">Pendientes</small><b>${pendientes.length}</b></div>
        <div class="col-4"><small class="text-muted d-block">Vendido</small><b>RD$ ${vendido.toLocaleString()}</b></div>
        <div class="col-4"><small class="text-muted d-block">Entregado</small><b>RD$ ${entregado.toLocaleString()}</b></div>
        <div class="col-4"><small class="text-muted d-block">Por entregar</small><b>RD$ ${porEntregar.toLocaleString()}</b></div>
      </div>
    </div>`;
  }).join("");
}
async function crearVendedor(){let {error}=await sb.from("vendedores").insert({nombre:vn.value,telefono:vt.value||null,email:ve.value||null});alert(error?error.message:"Vendedor creado");if(!error)loadVendedores()}
async function loadBoletas(){let [{data:b},{data:v}]=await Promise.all([sb.from("boletas").select("id,numero,estado,vendedor_id,vendida_a,area_pastoral_comprador").order("numero"),sb.from("vendedores").select("id,nombre").eq("activo",true).order("nombre")]);vend.innerHTML='<option value="">Seleccione vendedor</option>'+(v||[]).map(x=>`<option value="${x.id}">${x.nombre}</option>`).join("");tickets.innerHTML=(b||[]).map(x=>`<div class="card p-2 mb-2 shadow-sm"><div class="d-flex flex-row justify-content-between align-items-center gap-2"><div><b>#${x.numero}</b><div class="small text-muted">Vendida a: ${x.vendida_a||"Sin registrar"}</div><div class="small text-muted">Área: ${x.area_pastoral_comprador||"Sin registrar"}</div></div><div class="d-flex gap-2 align-items-center flex-wrap justify-content-end"><span class="badge text-bg-secondary">${x.estado}</span>${x.estado==="ASIGNADA"?`<button class="btn btn-sm btn-outline-primary" onclick="registrarComprador(${x.id},\'${x.numero}\',\'${(x.vendida_a||"").replaceAll("\'","\\\'")}\',\'${x.area_pastoral_comprador||""}\')">${x.vendida_a?"Editar comprador":"Vendida a"}</button><button class="btn btn-sm btn-success" onclick="marcarPagada(${x.id},\'${x.numero}\')">Marcar pagada</button>`:""}</div></div></div>`).join("")}
async function asignar(){
  const vendedorId=Number(vend.value);
  const desde=Number(document.querySelector("#desde")?.value);
  const hasta=Number(document.querySelector("#hasta")?.value);
  if(!vendedorId||!desde||!hasta){alert("Selecciona vendedor y rango de boletas.");return;}
  if(desde>hasta){alert("El número inicial no puede ser mayor que el final.");return;}
  const {data,error}=await sb.rpc("asignar_boletas",{p_vendedor_id:vendedorId,p_numero_desde:desde,p_numero_hasta:hasta});
  if(error){alert("No se pudo asignar: "+error.message);return;}
  alert(data+" boleta(s) asignada(s) correctamente.");
  await loadBoletas();
}

async function marcarPagada(boletaId,numero){if(!confirm("¿Marcar la boleta #"+numero+" como pagada?"))return;const {data,error}=await sb.rpc("marcar_boleta_pagada",{p_boleta_id:boletaId});if(error){alert("No se pudo registrar el pago: "+error.message);return;}if(!data){alert("La boleta no pudo marcarse como pagada. Verifica su estado.");return;}alert("Boleta #"+numero+" marcada como PAGADA.");await loadBoletas();}


async function registrarComprador(boletaId,numero,actual,areaActual){const nombre=prompt("¿A quién se vendió la boleta #"+numero+"?",actual||"");if(nombre===null)return;const limpio=nombre.trim();if(!limpio){alert("Escribe el nombre del comprador.");return;}const opciones=["CJ","ADS","Escuela Básica","Politécnico","Deporte","Otros"];const mensaje="Área pastoral del comprador:\n1. CJ\n2. ADS\n3. Escuela Básica\n4. Politécnico\n5. Deporte\n6. Otros";const pred=areaActual?String(opciones.indexOf(areaActual)+1):"";const sel=prompt(mensaje,pred);if(sel===null)return;const n=Number(sel);if(!Number.isInteger(n)||n<1||n>6){alert("Selecciona un número del 1 al 6.");return;}const area=opciones[n-1];const {error}=await sb.from("boletas").update({vendida_a:limpio,area_pastoral_comprador:area}).eq("id",boletaId).eq("estado","ASIGNADA");if(error){alert("No se pudo guardar: "+error.message);return;}alert("Comprador y área pastoral registrados.");await loadBoletas();}
