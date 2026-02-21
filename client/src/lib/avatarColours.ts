export const AVATAR_COLOURS: Record<string, { bg: string; border: string; text: string }> = {
  CI: { bg:'rgba(66,126,255,.18)',  border:'rgba(66,126,255,.32)',  text:'#93B4FF' },
  GH: { bg:'rgba(245,158,11,.15)', border:'rgba(245,158,11,.28)', text:'#FCD34D' },
  CM: { bg:'rgba(124,58,237,.18)', border:'rgba(124,58,237,.30)', text:'#C4B5FD' },
  ET: { bg:'rgba(34,197,94,.12)',  border:'rgba(34,197,94,.22)',  text:'#6EE7B7' },
  KE: { bg:'rgba(239,68,68,.12)',  border:'rgba(239,68,68,.22)',  text:'#FCA5A5' },
  NG: { bg:'rgba(168,85,247,.15)', border:'rgba(168,85,247,.28)', text:'#D8B4FE' },
  SN: { bg:'rgba(20,184,166,.12)', border:'rgba(20,184,166,.22)', text:'#5EEAD4' },
  MA: { bg:'rgba(251,146,60,.12)', border:'rgba(251,146,60,.22)', text:'#FED7AA' },
  ZA: { bg:'rgba(99,102,241,.15)', border:'rgba(99,102,241,.28)', text:'#C7D2FE' },
  TZ: { bg:'rgba(236,72,153,.12)', border:'rgba(236,72,153,.22)', text:'#FBCFE8' },
};
export const DEFAULT_AVATAR = { bg:'rgba(44,50,64,.6)', border:'rgba(44,50,64,1)', text:'#7A8499' };
export function getAvatarColour(iso2: string) {
  return AVATAR_COLOURS[iso2] ?? DEFAULT_AVATAR;
}
