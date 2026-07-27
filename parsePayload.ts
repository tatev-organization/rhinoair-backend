export function formatPayloadToText(payload: any) {
  if (!payload || !payload.systems) return "No payload details available.";
  let text = "";
  
  payload.systems.forEach((s: any, i: number) => {
    text += `System ${i + 1}: ${s.name || 'Unnamed'}\n`;
    text += `  Type: ${s.sysType} | Brand: ${s.brand} | Tier: ${s.tier} | Tons: ${s.tons}\n`;
    
    if (s.sysType === 'multi' && s.heads && s.heads.length > 0) {
      text += `  Heads: ${s.heads.map((h: any) => h.type).join(', ')}\n`;
    }
    
    if (s.zoned) {
       text += `  Zoned: Yes (${s.zoneCount || 2} zones)\n`;
    }
    
    const activeAddons = Object.entries(s.addons || {})
      .filter(([_, v]: any) => v.on)
      .map(([k, v]: any) => `${k}${v.qty ? `(Qty:${v.qty})` : ''}`)
      .join(', ');
    if (activeAddons) text += `  Add-ons: ${activeAddons}\n`;
    
    if (s.notes) text += `  Notes: ${s.notes}\n`;
    text += '\n';
  });

  const projAddons = Object.entries(payload.project?.addons || {})
      .filter(([_, v]: any) => v.on)
      .map(([k, v]: any) => `${k}${v.qty ? `(Qty:${v.qty})` : ''}`)
      .join(', ');
  if (projAddons) {
    text += `Project Add-ons: ${projAddons}\n\n`;
  }
  
  return text.trim();
}
