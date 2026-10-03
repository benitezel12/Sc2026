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