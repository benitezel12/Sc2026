async function editarDonacionAdmin(id){
  const h=donationHistory.find(x=>x.donacion_id===id);
  if(!h)return;
  const nombre=window.prompt("Bienhechor:",h.bienhechor||"");
  if(nombre===null||!nombre.trim())return;
  const telefono=window.prompt("Teléfono:",h.telefono||"");
  if(telefono===null)return;
  const gestor=window.prompt("Gestionado por:",h.gestionado_por||h.vendedor_nombre||"");
  if(gestor===null||!gestor.trim())return;
  const articulo=donationItems.find(x=>x.id===h.articulo_id);
  const obs=window.prompt("Observación:",h.observacion||"");
  if(obs===null)return;
  if(!window.confirm("¿Guardar los cambios de esta donación?"))return;
  const {data,error}=await sb.rpc("admin_actualizar_donacion",{
    p_donacion_id:id,
    p_bienhechor:nombre.trim(),
    p_telefono:telefono.trim()||null,
    p_observacion:obs.trim()||null,
    p_gestionado_por:gestor.trim(),
    p_articulo_id:articulo.id,
    p_tipo_aporte:h.tipo_aporte,
    p_cantidad:h.cantidad,
    p_monto:h.monto,
    p_medio_entrega:h.medio_entrega
  });
  if(error){alert(error.message);return;}
  if(data){alert("Donación actualizada.");await loadDonaciones();}
}

async function eliminarDonacionAdmin(id){
  const h=donationHistory.find(x=>x.donacion_id===id);
  if(!h)return;
  if(!window.confirm("¿Eliminar este registro de donación? Esta acción no se puede deshacer."))return;
  const {data,error}=await sb.rpc("admin_eliminar_donacion",{p_donacion_id:id});
  if(error){alert(error.message);return;}
  if(data){alert("Donación eliminada.");await loadDonaciones();}
}

const _renderDonacionesBase=renderDonaciones;
renderDonaciones=function(){
  _renderDonacionesBase();
  const cards=[...document.querySelectorAll("#donationHistory > .border")];
  const visibles=document.querySelector("#dnFiltroRubro")?.value
    ? donationHistory.filter(x=>x.codigo_rubro===document.querySelector("#dnFiltroRubro").value)
    : donationHistory;
  cards.forEach((card,i)=>{
    const h=visibles[i];
    if(!h)return;
    let row=card.querySelector(".donation-maint");
    if(!row){
      row=document.createElement("div");
      row.className="donation-maint d-flex gap-2 mt-2 flex-wrap";
      card.appendChild(row);
    }
    if(h.telefono&&!row.querySelector(".donation-whatsapp")){
      const wa=document.createElement("button");
      wa.className="donation-whatsapp btn btn-sm btn-success";
      wa.textContent="💬 Agradecer por WhatsApp";
      wa.onclick=()=>abrirWhatsAppAgradecimiento(h.bienhechor,h.telefono,h.articulo);
      row.appendChild(wa);
    }
    if(donationProfile?.rol==="ADMIN"&&!row.querySelector(".donation-edit")){
      const edit=document.createElement("button");
      edit.className="donation-edit btn btn-sm btn-outline-secondary";
      edit.textContent="Editar";
      edit.onclick=()=>editarDonacionAdmin(h.donacion_id);
      const del=document.createElement("button");
      del.className="donation-delete btn btn-sm btn-outline-danger";
      del.textContent="Eliminar";
      del.onclick=()=>eliminarDonacionAdmin(h.donacion_id);
      row.append(edit,del);
    }
  });
};
