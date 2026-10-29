import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeKnowledgeNames} from '../dist/spatial-names.js';
import {relationExplanation} from '../dist/spatial-reasons.js';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),source=fs.readFileSync(path.join(root,'dist/data/atlas.json'));
const atlas=JSON.parse(source),names=makeKnowledgeNames(atlas),nodes=new Map(atlas.nodes.map(n=>[n.id,n]));
const edges=atlas.edges.map(e=>{const explanation=relationExplanation(e);return {from:e.prerequisiteId,to:e.topicId,strength:e.strength,fromName:names.get(e.prerequisiteId),toName:names.get(e.topicId),fromGoal:nodes.get(e.prerequisiteId).description,toGoal:nodes.get(e.topicId).description,sourceReason:e.reason,reviewed:explanation.reviewed,...(explanation.reviewed?{chineseReason:explanation.text}:{})};});
const reviewed=edges.filter(e=>e.reviewed).length,items=atlas.nodes.filter(n=>names.get(n.id)!==n.title).map(n=>({id:n.id,sourceTitle:n.title,displayName:names.get(n.id),sourceGoal:n.description}));
const output={schema:1,source:'dist/data/atlas.json',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),summary:{nodes:atlas.nodes.length,sourceEdges:edges.length,reviewedReasons:reviewed,pendingReasons:edges.length-reviewed,adaptedNames:items.length},adaptedNames:items,edges};
const filename=path.join(root,'docs/spatial-exploration/relation-review.json'),text=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check')){if(!fs.existsSync(filename)||fs.readFileSync(filename,'utf8')!==text)throw Error('Relation review inventory is stale.');}
else{fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,text);}
console.log(JSON.stringify(output.summary));
