function isPrivateIpv4(host: string): boolean {
  const p = host.split('.').map(Number);
  if (p.length !== 4 || p.some(Number.isNaN)) return false;
  return p[0] === 10 || p[0] === 127 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168);
}
export function validateMapSourceEndpoint(raw: string): string[] {
  try {
    const u = new URL(raw);
    const h = u.hostname.toLowerCase();
    const errors:string[]=[];
    if (u.protocol !== 'https:') errors.push('https_required');
    if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h === '::1' || isPrivateIpv4(h)) errors.push('private_host_blocked');
    if (u.username || u.password) errors.push('embedded_credentials_blocked');
    return errors;
  } catch { return ['invalid_url']; }
}
