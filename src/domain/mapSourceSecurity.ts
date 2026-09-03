function isPrivateIpv4(host: string): boolean {
  const p = host.split('.').map(Number);
  if (p.length !== 4 || p.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [first, second] = p;
  if (first === undefined || second === undefined) return false;
  return first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
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
