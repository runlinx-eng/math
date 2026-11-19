// Keep the offline-release identity and the reviewed bootstrap hash in sync.
// No product sources, learner records or mathematical review fingerprints are inferred.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const releaseRe=/^math-explorer-[a-z0-9][a-z0-9-]{3,120}$/;
const locations=[
 ['dist/sw.js',/(^const CACHE\s*=\s*')([^']+)(';\s*$)/m],
 ['dist/space.js',/(^const RELEASE\s*=\s*')([^']+)(';\s*$)/m],
 ['dist/exploration.js',/(^const RELEASE\s*=\s*')([^']+)(';\s*$)/m],
 ['dist/learning/learn.js',/(^registerClientRelease\(')([^']+)('\);\s*$)/m],
 ['dist/learn.html',/(^const STARTUP_RELEASE\s*=\s*')([^']+)(';\s*$)/m]
];
const entryPath='dist/learning/learn.js';
const entryPin=/(^const STARTUP_ENTRY_SHA256\s*=\s*')([0-9a-f]{64})(';\s*$)/m;
const fixturePin=/("sourceHashes"\s*:\s*\{[^}]*?"dist\/learning\/learn\.js"\s*:\s*")([0-9a-f]{64})(")/m;
const digest=text=>createHash('sha256').update(text).digest('hex');
const load=(dir,path)=>readFileSync(join(dir,path),'utf8');

function one(text,re,path){
 const all=[...text.matchAll(new RegExp(re.source,re.flags.replace('g','')+'g'))];
 if(all.length!==1)throw Error(`${path}: expected exactly one recognized release/hash pin, found ${all.length}`);
 return all[0][2];
}
function pin(text,re,value,path){
 one(text,re,path);
 return text.replace(re,(_all,start,_old,end)=>start+value+end);
}
function readSource(dir){
 const data=new Map(locations.map(([path,re])=>[path,{text:load(dir,path),re}]));
 const filename='dist/learn.html';
 one(data.get(filename).text,entryPin,filename+' entry digest');
 return data;
}
function fixtures(dir){
 const folder=join(dir,'tests/fixtures'),found=[];
 for(const file of readdirSync(folder).filter(s=>/\.cjs$/.test(s)).sort()){
  const path='tests/fixtures/'+file,text=load(dir,path);
  if(!text.includes('"dist/learning/learn.js"'))continue;
  found.push({path,text,hash:one(text,fixturePin,path)});
 }
 if(found.length===0)throw Error('No reviewed navigation fixtures with learn.js source hashes');
 return found;
}
function verify(source,rows){
 const identities=locations.map(([path,re])=>({path,release:one(source.get(path).text,re,path)}));
 const version=identities[0].release;
 if(!releaseRe.test(version))throw Error(`Invalid offline release: ${version}`);
 for(const item of identities)if(item.release!==version)
  throw Error(`Release mismatch: ${item.path}=${item.release}, expected ${version}`);
 const sourceHash=digest(source.get(entryPath).text);
 const recorded=one(source.get('dist/learn.html').text,entryPin,'dist/learn.html entry digest');
 if(recorded!==sourceHash)throw Error(`Startup entry digest stale: expected ${sourceHash}`);
 for(const f of rows)if(f.hash!==sourceHash)
  throw Error(`Reviewed navigation source hash stale: ${f.path}; do not weaken fixture assertions`);
 return {release:version,sha256:sourceHash,reviewedFixtures:rows.length};
}
export function checkRelease(dir=root){
 return verify(readSource(dir),fixtures(dir));
}
export function syncRelease({dir=root,release,baseLearnSource}={}){
 if(typeof release!=='string'||!releaseRe.test(release))
  throw Error('Supply an explicit safe --release math-explorer-* identifier');
 const source=readSource(dir),rows=fixtures(dir);
 const currentLearn=source.get(entryPath).text;
 const base=baseLearnSource??execFileSync('git',['show','HEAD:'+entryPath],
  {cwd:dir,encoding:'utf8',maxBuffer:2*1024*1024});
 const learnRe=source.get(entryPath).re;
 const normalize=s=>pin(s,learnRe,'RELEASE_ONLY',entryPath);
 if(normalize(currentLearn)!==normalize(base))
  throw Error('learn.js contains non-release changes; review source and fixture hashes manually');
 const oldHash=digest(base);
 const updates=new Map();
 for(const [path,re] of locations){
  const record=source.get(path);
  updates.set(path,pin(record.text,re,release,path));
 }
 const nextHash=digest(updates.get(entryPath));
 updates.set('dist/learn.html',pin(updates.get('dist/learn.html'),entryPin,nextHash,
  'dist/learn.html entry digest'));
 for(const f of rows){
  if(f.hash!==oldHash&&f.hash!==nextHash)
   throw Error(`${f.path}: reviewed hash is not the HEAD or target source; manual review required`);
  updates.set(f.path,pin(f.text,fixturePin,nextHash,f.path));
 }
 // Validate the entire staged bundle before making any filesystem changes.
 const staged=new Map([...source].map(([path,record])=>[path,{...record,text:updates.get(path)}]));
 verify(staged,rows.map(f=>({...f,hash:one(updates.get(f.path),fixturePin,f.path)})));
 const changed=[];
 for(const [path,after] of updates){
  const before=source.get(path)?.text??rows.find(f=>f.path===path)?.text;
  if(after!==before){writeFileSync(join(dir,path),after);changed.push(path);}
 }
 return {release,sha256:nextHash,reviewedFixtures:rows.length,changed};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const mode=process.argv[2];
  let result;
  if(mode==='check'&&process.argv.length===3)result=checkRelease();
  else if(mode==='sync'&&process.argv[3]==='--release'&&process.argv.length===5)
   result=syncRelease({release:process.argv[4]});
  else throw Error('Usage: node scripts/ci-release-sync.mjs check | sync --release math-explorer-...');
  process.stdout.write('RELEASE_SYNC_OK '+JSON.stringify(result)+'\n');
 }catch(error){process.stderr.write('RELEASE_SYNC_FAILED '+error.message+'\n');process.exitCode=1;}
}
