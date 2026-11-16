// Standalone synthetic prototype. No family data or game integration.
export const PHRASES = Object.freeze([
  ['G4','G4','A4','G4','C5','B4'],
  ['G4','G4','A4','G4','D5','C5'],
  ['G4','G4','G5','E5','C5','B4','A4'],
  ['F5','F5','E5','C5','D5','C5']
]);
export const KEYS = Object.freeze(['G4','A4','B4','C5','D5','E5','F5','G5']);
export function newSong(stage = 1) {
  if (!Number.isInteger(stage) || stage < 1 || stage > 5) throw new RangeError('stage');
  return {stage, phrase:0, note:0, complete:false};
}
export function press(state, key) {
  if (!KEYS.includes(key)) return {state, sound:null, advanced:false};
  if (state.complete) return {state, sound:key, advanced:false};
  const expected = PHRASES[state.phrase][state.note];
  if (state.stage !== 1 && key !== expected) return {state, sound:key, advanced:false};
  const sound = state.stage === 1 ? expected : key;
  const n = state.note + 1;
  const end = n === PHRASES[state.phrase].length;
  const done = end && state.phrase === PHRASES.length - 1;
  return {state:{...state, phrase:done ? state.phrase : state.phrase + Number(end), note:end ? 0 : n, complete:done}, sound, advanced:true};
}

// Synthetic practice state, independent of real family saves.
export function newPractice(stage = 2) {
  if (!Number.isInteger(stage) || stage < 2 || stage > 5) throw new RangeError('practice stage');
  return {stage, unlocked:1, phrase:0, note:0, repetitions:0, mistakes:0, extraHelp:false, cycleComplete:false, clean:true, joining:false, complete:false};
}
export function practicePress(state, key) {
  if (!KEYS.includes(key) || state.complete) return {state,sound:KEYS.includes(key)?key:null,advanced:false};
  const phrase=PHRASES[state.phrase], expected=phrase[state.note];
  if(key!==expected){const mistakes=state.mistakes+1;return {state:{...state,mistakes,extraHelp:mistakes>=3,clean:false},sound:key,advanced:false};}
  const next=state.note+1, end=next===phrase.length, completed=end&&state.phrase===PHRASES.length-1;
  return {state:{...state,phrase:end&&!completed?state.phrase+1:state.phrase,note:end?0:next,unlocked:end&&!completed?Math.max(state.unlocked,state.phrase+2):state.unlocked,repetitions:0,mistakes:0,extraHelp:false,cycleComplete:end,clean:true,joining:false,complete:completed},sound:key,advanced:true,completed};
}

// Validate only the module's own progress. Unknown versions and malformed data are ignored.
export function restoreProgress(value) {
  if (!value || value.v !== 1 || !value.state || typeof value.state !== 'object') return null;
  const s=value.state;
  if (!Number.isInteger(s.stage)||s.stage<1||s.stage>5||!Number.isInteger(s.phrase)||s.phrase<0||s.phrase>=PHRASES.length||!Number.isInteger(s.note)||s.note<0||s.note>=PHRASES[s.phrase].length)return null;
  if(s.stage===1){if(Object.keys(s).some(k=>!['stage','phrase','note','complete'].includes(k)))return null;if(typeof s.complete!=='boolean')return null;return {stage:1,phrase:s.phrase,note:s.note,complete:s.complete};}
  if(Object.keys(s).some(k=>!['stage','unlocked','phrase','note','repetitions','mistakes','extraHelp','cycleComplete','clean','joining','complete'].includes(k)))return null;
  if(!Number.isInteger(s.unlocked)||s.unlocked<1||s.unlocked>4||s.phrase>=s.unlocked||!Number.isInteger(s.repetitions)||s.repetitions<0||s.repetitions>100000||!Number.isInteger(s.mistakes)||s.mistakes<0||s.mistakes>100000||typeof s.extraHelp!=='boolean'||typeof s.cycleComplete!=='boolean'||typeof s.clean!=='boolean'||(s.joining!=null&&typeof s.joining!=='boolean')||(s.complete!=null&&typeof s.complete!=='boolean')||(s.joining&&s.unlocked<2))return null;
  return {stage:s.stage,unlocked:s.unlocked,phrase:s.phrase,note:s.note,repetitions:s.repetitions,mistakes:s.mistakes,extraHelp:s.extraHelp,cycleComplete:s.cycleComplete,clean:s.clean,joining:s.joining===true,complete:s.complete===true};
}

// Completion markers contain no performance or touch data.
export function markStageCompleted(markers,stage) {
  const previous=Array.isArray(markers)?markers.filter(n=>Number.isInteger(n)&&n>=1&&n<=5):[];
  if(!Number.isInteger(stage)||stage<1||stage>5)return [...new Set(previous)].sort();
  return [...new Set([...previous,stage])].sort();
}

// Musical notes only, stored on this device for songbook playback. No audio or touch coordinates.
export function validPerformance(notes) {
  if(!Array.isArray(notes)||notes.length<1||notes.length>400)return null;
  let prev=-1, output=[];
  for(const n of notes){if(!n||typeof n!=='object'||Object.keys(n).some(k=>!['key','ms'].includes(k))||!KEYS.includes(n.key)||!Number.isFinite(n.ms)||n.ms<0||n.ms>600000||n.ms<prev)return null;prev=n.ms;output.push({key:n.key,ms:Math.round(n.ms)});}
  return output;
}
// Only a genuine straight-through note prefix is retained on-device.
export function validFinalDraft(state,notes) {
  if(!state || state.stage<2 || state.stage>5 || state.complete)return null;
  const prefixLength=PHRASES.slice(0,state.phrase).reduce((n,p)=>n+p.length,0)+state.note;
  const valid=validPerformance(notes), expected=PHRASES.flat();
  if(!valid || valid.length!==prefixLength || valid.length>=expected.length || !valid.every((n,i)=>n.key===expected[i]))return null;
  return valid;
}
export function compatibleSave(saved) {
  if(!saved||typeof saved!=='object'||Array.isArray(saved)||saved.v!==1||!Number.isInteger(saved.stage)||saved.stage<1||saved.stage>5)return false;
  if(Object.keys(saved).some(k=>!['v','stage','who','state','completedStages','performances','candles','cakeReady','incentive','finalDraft','sound','together','fullscreenPreference','autoMove','songHits','nextStage','playedToday','volume','panelTheme'].includes(k)))return false;
  if(saved.volume!=null&&!(typeof saved.volume==='number'&&saved.volume>=0.2&&saved.volume<=1))return false;
  if(saved.panelTheme!=null&&!['auto','light','dark'].includes(saved.panelTheme))return false;
  if(saved.playedToday!=null&&!validPlayedToday(saved.playedToday))return false;
  if(saved.autoMove!=null&&typeof saved.autoMove!=='boolean')return false;
  if(saved.songHits!=null&&!validSongHits(saved.songHits))return false;
  if(saved.nextStage!=null&&!(saved.nextStage===1||saved.nextStage===2))return false;
  if(saved.sound!=null&&!['sine','triangle','bell'].includes(saved.sound))return false;
  if(saved.together!=null&&typeof saved.together!=='boolean')return false;
  if(saved.fullscreenPreference!=null&&typeof saved.fullscreenPreference!=='boolean')return false;
  if(saved.who!=null&&!['Rayna','Mommy','Daddy','Grandpa','Valley friend'].includes(saved.who))return false;
  if(saved.state!=null&&(!restoreProgress(saved)||saved.state.stage!==saved.stage))return false;
  if(saved.completedStages!=null&&(!Array.isArray(saved.completedStages)||saved.completedStages.some(x=>!Number.isInteger(x)||x<1||x>5)))return false;
  if(saved.performances!=null&&(typeof saved.performances!=='object'||Array.isArray(saved.performances)||Object.entries(saved.performances).some(([k,v])=>!['1','2','3','4','5'].includes(k)||!validPerformance(v))))return false;
  if(saved.candles!=null&&(!Array.isArray(saved.candles)||saved.candles.length!==4||saved.candles.some(x=>typeof x!=='boolean')))return false;
  if(saved.cakeReady!=null&&typeof saved.cakeReady!=='boolean')return false;
  if(saved.incentive!=null&&!validIncentive(saved.incentive))return false;
  if(saved.finalDraft!=null&&!validFinalDraft(saved.state,saved.finalDraft))return false;
  return true;
}
// Model-side timing guard only; this is not a rendered flash-safety certification.
export function visualDelay(now,last){return Math.max(0,350-(now-last))}
// Direction relative to the keyboard viewport, in CSS-pixel coordinates.
export function keyDirection(left,width,scroll,viewport) {
  if (![left,width,scroll,viewport].every(Number.isFinite) || width<=0 || viewport<=0)return 'unknown';
  if(left<scroll)return 'left';
  if(left+width>scroll+viewport)return 'right';
  return 'visible';
}

// Magic-play encouragement: reward only deliberate matching notes; wrong notes still advance.
export function magicIncentive(previous, expected, played, endOfPhrase = false) {
  const p = previous || {hits:0, taps:0, fireflies:0, lineHits:0, lineTaps:0, invite:false};
  if (!KEYS.includes(expected) || !KEYS.includes(played)) return p;
  const correct = expected === played, lineHits = p.lineHits + Number(correct), lineTaps = p.lineTaps + 1;
  const qualified = (p.qualified||0) + Number(endOfPhrase && lineHits / lineTaps >= .8);
  return {hits:p.hits+Number(correct), taps:p.taps+1, qualified, fireflies:Math.min(qualified>=4?40:39,p.fireflies+Number(correct)),
    lineHits:endOfPhrase?0:lineHits, lineTaps:endOfPhrase?0:lineTaps,
    invite:endOfPhrase && lineTaps > 0 && lineHits / lineTaps >= .8};
}

export function validIncentive(p){return !!p && typeof p==="object" && Object.keys(p).every(k=>["hits","taps","fireflies","lineHits","lineTaps","invite","qualified"].includes(k)) && [p.hits,p.taps,p.fireflies,p.lineHits,p.lineTaps].every(x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000) && p.hits<=p.taps && p.fireflies<=40 && (p.qualified==null||(Number.isSafeInteger(p.qualified)&&p.qualified>=0&&p.qualified<=1000000)) && p.lineHits<=p.lineTaps && typeof p.invite==="boolean"}

// Learning without being taught (Fable call 3, Nov 16). Only stages 1 and 2 move by themselves; stages 3-5 are a grown-up's choice.
// Up: two full Magic-play songs in a row with at least 80% glowing-key hits. Down: a Glow-follow song where extra help was
// needed on 3 or more of its 4 lines. Never announced. history = the last stage-1 song hit percents (at most 2).
export const AUTO_UP_PERCENT = 80, AUTO_UP_SONGS = 2, STUCK_LINES = 3;
export function validSongHits(x){return Array.isArray(x)&&x.length<=AUTO_UP_SONGS&&x.every(p=>Number.isInteger(p)&&p>=0&&p<=100)}
export function autoStageAfterSong(stage, history, song) {
  const recent = validSongHits(history) ? history : [];
  if (stage === 1 && Number.isInteger(song?.hitPercent) && song.hitPercent >= 0 && song.hitPercent <= 100) {
    const next = [...recent, song.hitPercent].slice(-AUTO_UP_SONGS);
    return next.length === AUTO_UP_SONGS && next.every(p => p >= AUTO_UP_PERCENT) ? {stage:2, songHits:[]} : {stage:1, songHits:next};
  }
  if (stage === 2 && Number.isInteger(song?.helpLines)) return song.helpLines >= STUCK_LINES ? {stage:1, songHits:[]} : {stage:2, songHits:recent};
  return {stage, songHits:recent};
}

// Who she has played the song for today (picker shows them wearing their party hat). Names only, no times.
export const FAMILY = Object.freeze(['Rayna','Mommy','Daddy','Grandpa','Valley friend']);
export function validPlayedToday(x){return !!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>k==='date'||k==='who')&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&Array.isArray(x.who)&&x.who.length<=FAMILY.length&&x.who.every(n=>FAMILY.includes(n))&&new Set(x.who).size===x.who.length}
