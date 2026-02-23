export const AVATAR_COLOURS: Record<string, { bg: string; border: string; text: string }> = {
  CI: { bg:'rgba(74,140,111,.18)',  border:'rgba(74,140,111,.32)',  text:'#8FE77A' },
  GH: { bg:'rgba(234,139,67,.15)', border:'rgba(234,139,67,.28)', text:'#F5C78A' },
  CM: { bg:'rgba(46,134,98,.18)', border:'rgba(46,134,98,.30)', text:'#7ECBA9' },
  ET: { bg:'rgba(74,140,111,.12)',  border:'rgba(74,140,111,.22)',  text:'#8FE77A' },
  KE: { bg:'rgba(218,60,61,.12)',  border:'rgba(218,60,61,.22)',  text:'#F5A5A5' },
  NG: { bg:'rgba(168,85,247,.15)', border:'rgba(168,85,247,.28)', text:'#D8B4FE' },
  SN: { bg:'rgba(46,134,98,.12)', border:'rgba(46,134,98,.22)', text:'#7ECBA9' },
  MA: { bg:'rgba(234,139,67,.12)', border:'rgba(234,139,67,.22)', text:'#F5C78A' },
  ZA: { bg:'rgba(74,140,111,.15)', border:'rgba(74,140,111,.28)', text:'#8FE77A' },
  TZ: { bg:'rgba(218,60,61,.12)', border:'rgba(218,60,61,.22)', text:'#F5A5A5' },
};
export const DEFAULT_AVATAR = { bg:'rgba(28,28,30,.6)', border:'rgba(28,28,30,1)', text:'#999' };
export function getAvatarColour(iso2: string) {
  return AVATAR_COLOURS[iso2] ?? DEFAULT_AVATAR;
}
