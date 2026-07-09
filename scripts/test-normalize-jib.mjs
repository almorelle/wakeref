// Harnais de tuning de `normalizeJib` (dictée libre du jib).
// Rejoue de vrais logs (STT brut → ATTENDU) et mesure la récupération.
//   node scripts/test-normalize-jib.mjs
// Conventions : HS/TS/FS/BS ; presses en DEUX mots ; tricks nommés CAPITALISÉS ;
// pas de virgule en sortie ; boardslide/lipslide NU → boardslide/backlip (backside
// par défaut), frontside qualifié → frontboard/frontlip. Vocab : scripts/jib-atoms.md.
import { normalizeJib } from '../src/lib/normalizeJib.js'

const CASES = [
  // ── Log 1 (2026-06-29, passes simples) ──
  ['Entrée de 7, backlip sorti 86 blindes', 'Entrée 270, backlip, sortie 90 blind'],
  ['transfert to back lip, sortie blind', 'Transfert to backlip, sortie blind'],
  ['entre TOSIDE 2 7 frontes, backlip sorti 4 5 frontes', 'Entrée TS FS 270, backlip, sortie FS 450'],
  ['Transfaire Tantrum, sortie blind.', 'Transfert Tantrum, sortie blind'],
  ['transfert tantrum, tout deux sept blindes', 'Transfert Tantrum to 270 blind'],
  ['50-50, sortie, 3-6 back.', '50-50, sortie BS 360'],
  ['Board slide, back 1, sortie de 7.', 'Boardslide, BS 180, sortie 270'],
  ['Olyon back 1 90 back 2 7 back', 'Ollie on, BS 180, BS 90, BS 270'],
  ['entre est street hillside 180 front sortie 180 back', 'Entrée street HS FS 180, sortie BS 180'],
  ['Bord slide Réentrée', 'Boardslide, re-entry'],
  ['Bord slide réentrée', 'Boardslide, re-entry'],
  ['Entrée illside, board slide. Sortie 180, re-entry toe side. Sortie 180 back.', 'Entrée HS, boardslide, sortie 180, re-entry TS, sortie BS 180'],
  ['Front clip, front board, blind.', 'Frontlip, frontboard, blind'],
  ['50-50, nos presses, sorti back 1.', '50-50, nose press, sortie BS 180'],
  ['5050 Tail Press, sorti back 1.', '50-50, tail press, sortie BS 180'],
  ['entrée inside 50 50', 'Entrée HS, 50-50'],
  ['Entrez Healside 50-50', 'Entrée HS, 50-50'],
  ['Backbend, rail to rail, to the set out.', 'Boardslide, rail to rail, to 270 out'],
  ['50 50, rail tour rail tour rail', '50-50, rail to rail to rail'],
  ['50 50 rail to rail back lip sortie blind', '50-50, rail to rail backlip, sortie blind'],

  // ── Log 2 (2026-06-29, passes denses) ──
  ['To-side transfert over gap.', 'TS transfert over gap'],
  ['Olyon, board slide to blind out.', 'Ollie on, boardslide to blind out'],
  ['au lionne transfert tout sorti blind', 'Ollie on, transfert to sortie blind'],
  ['Odeon, board slide, sortie blind.', 'Ollie on, boardslide, sortie blind'],
  ['Olion transfert sorti blind.', 'Ollie on, transfert, sortie blind'],
  ['Oli en bord slide, sortie blind.', 'Ollie on, boardslide, sortie blind'],
  ['30 sphères, front 2.7mm, melon grab 90 out', 'Transfert, FS 270, melon grab, 90 out'],
  ['transfert de 7mm melons de grabe sorti 90mm', 'Transfert 270, melon grab, sortie 90'],
  ['transfert 2.7mm Mellon Grabe, sortie 90mm', 'Transfert 270, melon grab, sortie 90'],
  ['Transfer 3-6 frontes to board slide.', 'Transfert FS 360 to boardslide'],
  ['Transfer 3-6 fronte au bord slide.', 'Transfert FS 360 to boardslide'],
  ['Transfaire tantrum, baclip.', 'Transfert Tantrum, backlip'],
  ['Transfaire Tentrum backlip', 'Transfert Tantrum, backlip'],
  ['Ollion, board slide, NOSpress 180 front de cette back', 'Ollie on, boardslide, nose press, FS 180, BS 270'],
  ['All-in, board slide Nose Press 180 front de setback out', 'Ollie on, boardslide, nose press, FS 180, BS 270 out'],
  ['Ollion Bandslide Nosepress 180 front de setback', 'Ollie on, boardslide, nose press, FS 180, BS 270'],
  ['transfert hillback 2.7 hardware tail press to blind', 'Transfert HS BS 270 hardway, tail press to blind'],
  ['transfer de setback inside Hardway Tail Press Sortie blind', 'Transfert BS 270 hardway, tail press, sortie blind'],
  ['Ollion to Olly backlip tailpress sortie blind', 'Ollie on to ollie backlip, tail press, sortie blind'],
  ['All-Yone, tout Allie, backlip, tailpress, sortie 90 back', 'Ollie on to ollie backlip, tail press, sortie BS 90'],
  ['Ollion, Olly backlip, Tailpress sorti 90 blindes.', 'Ollie on, ollie backlip, tail press, sortie 90 blind'],
  ['Transfère mexican role', 'Transfert Mexican Roll'],
  ['Transfère mexicain', 'Transfert Mexican Roll'],
  ['TOSIDE BACK 1, PRED-CELL 2, SETBACK HARDWAY, PRED-CELL OUT, SORTY BLIND', 'TS BS 180, Pretzel to BS 270, hardway, Pretzel out, sortie blind'],
  ['TOS Sideback 1, Bretzel 2 Setback, Hardway, Bretzel Out, sortie blind.', 'TS BS 180, Pretzel BS 270, hardway, Pretzel out, sortie blind'],
  ['transfert trop side de cette front-back lip', 'Transfert TS FS 270, backlip'],
  ['Transferto side de cette front backlip sorti vrapt', 'Transfert TS FS 270, backlip, sortie wrapped'],
  ['Transferto side de cette front back clip sorti Vrap', 'Transfert TS FS 270, backlip, sortie wrapped'],
  ['Ollion back 1, tout Olli frontside board slide, sorti 2-7.', 'Ollie on BS 180 to ollie, frontboard, sortie 270'],
  ['Entrée Bacain, tout au lit, front de bord, sortie de cette front.', 'Entrée BS 180 to ollie, frontboard, sortie FS 270'],

  // ── Grabs (vocab validé 2026-06-30 — nom seul / nom+grab / grab+nom) ──
  ['grab melon', 'melon grab'],
  ['indy', 'indy grab'],
  ['mute grab', 'mute grab'],
  ['transfert melon sortie blind', 'Transfert melon grab, sortie blind'],
  ['nose grab', 'nose grab'],
  ['grab tail', 'tail grab'],
  ['stalefish', 'stalefish grab'],
  ['transfert nose press, sortie blind', 'Transfert nose press, sortie blind'],

  // ── Log 3 (2026-06-30, live, STT plus dégradé — garbles récurrents ajoutés) ──
  ['transfert de cette front grave melone sorti 90', 'Transfert FS 270 melon grab sortie 90'],
  ['2 sets back', 'BS 270'],
  ['backside 2 set out', 'BS 270 out'],
  ['On lyon board slide no spress 180 front', 'Ollie on boardslide nose press FS 180'],
  ['transfert de cette fronte grab melon sorti 90', 'Transfert FS 270 melon grab sortie 90'],

  // ── Log 4 (2026-06-30, SANS biais — STT bien plus propre) ──
  ['Oulian Board Slide sorti blind.', 'Ollie on boardslide sortie blind'],
  ['transfert 36 fronte, 2 boardslide', 'Transfert FS 360 to boardslide'],
  ['Transfaire inside the setback hardware, tail press sorti blind.', 'Transfert HS BS 270 hardway tail press sortie blind'],
  ['All-Yone, All-E Backlip, Tail Press, sortie 90 blindes.', 'Ollie on ollie backlip tail press sortie 90 blind'],
  ['Toss side, back end, pretzel de cette back hardware, pretzel blind.', 'TS BS 180 Pretzel BS 270 hardway Pretzel blind'],
  ['Toss side, transfert de cette front, back lip, sortie frappe.', 'TS transfert FS 270 backlip sortie wrapped'],
  ['Back 1, Oli front board, sortie de cette front.', 'BS 180 ollie frontboard sortie FS 270'],
  ['nose press 2 front side 180', 'nose press to FS 180'],

  // ── Log 5 (2026-06-30, sans biais — focus board slide & garbles back-un) ──
  ['Scare call.', 'Scarecrow'],
  ['Board slide, sortie 180 frontes.', 'Boardslide sortie FS 180'],
  ['transfert board slide sorti 180', 'Transfert boardslide sortie 180'],
  ['transfert front clip, board slide', 'Transfert frontlip boardslide'],
  ['50-50, 2 bornes slide.', '50-50 to boardslide'],
  ['180 frontes, 2 boards slide', 'FS 180 to boardslide'],
  ['Transfer board slide, sortie blind.', 'Transfert boardslide sortie blind'],
  ['transfert 5050 to board slide sorti de set blind', 'Transfert 50-50 to boardslide sortie 270 blind'],
  ['transfert à bord de slide', 'Transfert boardslide'],
  ['Transfaire 180 frontes, sortie, bac 1.', 'Transfert FS 180 sortie BS 180'],
  ['TOSIDE transfert Bakin sorti 180', 'TS transfert BS 180 sortie 180'],
  ['180 frontes, tout réentrée, board slide.', 'FS 180 to re-entry boardslide'],
  ['180 front-to-board slide, sortie de setback blind.', 'FS 180 to boardslide sortie BS 270 blind'],
  ['transfert de l\'autre côté de cette front sortie blind', 'Transfert 180 FS 270 sortie blind'],
  ['transfer de setback, pretzel de set out', 'Transfert BS 270 Pretzel 270 out'],
  ['transfert front lip towards line', 'Transfert frontlip to boardslide'],

  // ── Log 6 (2026-07-01, sans biais — structure jib ; garbles de TRICKS non chassés) ──
  ['transfert au side 3 6 frontes', 'Transfert TS FS 360'],
  ['transfert au side de cette fronte', 'Transfert TS FS 270'],
  ['Bonne slide to blind.', 'Boardslide to blind'],
  ['3 6 back gap front clip 2 bore slide', 'BS 360 gap frontlip to boardslide'],

  // ── Log 7 (2026-07-02, dictée libre, structure dense — VOCAB seul, sans injection) ──
  ['transfert front clip to board slide', 'Transfert frontlip to boardslide'],
  ['transfert board slide sorti 180 frontes', 'Transfert boardslide sortie FS 180'],
  ['180 fronte 2 boardslide', 'FS 180 to boardslide'],
  ['transfert tout bord slide', 'Transfert to boardslide'],
  ['180 tout front de bord', '180 to frontboard'],
  ['transfert toside back 1 sorti 180', 'Transfert TS BS 180 sortie 180'],
  ['transferts 180 frontes sorti back 1', 'Transfert FS 180 sortie BS 180'],
  ['front clip 2 board slide sorti de cette bac', 'Frontlip to boardslide sortie BS 270'],
  ['front clip 2 boardslide de set back out', 'Frontlip to boardslide BS 270 out'],
  ['180 frontes out to reentry board slide', 'FS 180 out to re-entry boardslide'],
  ['180 front to board slide sorti de setback blind', 'FS 180 to boardslide sortie BS 270 blind'],
  ['180 front au bord slide sorti backside 270', 'FS 180 to boardslide sortie BS 270'],
  ['transfert de cette bac sortie pretzel 270', 'Transfert BS 270 sortie Pretzel 270'],
  ['entrée 2 7 sorti 4 5', 'Entrée 270 sortie 450'],
  ['entrée de cette bac sortie 5 4', 'Entrée BS 270 sortie 540'],
  ['transfert 3 6 frontes tout 5050', 'Transfert FS 360 to 50-50'],
  ['5050 tout front de bord no express', '50-50 to frontboard nose press'],
  ['transferts bord slide de cette fronte out', 'Transfert boardslide FS 270 out'],
  ['transfert 180 frontes nos presses', 'Transfert FS 180 nose press'],
  ['3 6 back gap front clip 2 board slide', 'BS 360 gap frontlip to boardslide'],
  ['inside backside 3 6 gap front clip to board slide', 'HS BS 360 gap frontlip to boardslide'],
  ['toe side back 1 pretzel 2 setback sorti pretzel blinde', 'TS BS 180 Pretzel BS 270 sortie Pretzel blind'],
  ['scarecro transfer', 'Scarecrow transfert'],
  ['transfert backlip slide sorti de cette fronte', 'Transfert backlip sortie FS 270'],
  ['transfert backlip slide tail press sortie blind', 'Transfert backlip tail press sortie blind'],
]

// métrique unique : contenu (virgules + casse ignorées — on ne produit plus de virgules).
const content = (s) => s.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim()

let ok = 0
CASES.forEach(([dit, attendu], i) => {
  const got = normalizeJib(dit)
  const pass = content(got) === content(attendu)
  if (pass) ok++
  console.log(`${pass ? '✅' : '❌'} ${i + 1}.`)
  if (!pass) {
    console.log(`   dit    : ${dit}`)
    console.log(`   obtenu : ${got}`)
    console.log(`   ATTENDU: ${attendu}`)
  }
})
console.log(`\n=== ${ok}/${CASES.length} contenu OK ===`)
