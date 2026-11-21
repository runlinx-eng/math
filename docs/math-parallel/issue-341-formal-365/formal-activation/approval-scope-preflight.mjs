// #341 human-approval boundary preview; read-only and intentionally non-promotable.
// This is not the production registry, manifest writer or authorization verifier.
import {readFileSync} from "node:fs";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";

export function inspectIssue341ApprovalScope(request, proposal=null) {
  const requireCond = (ok, message) => { if (!ok) throw new Error("ISSUE341_SCOPE_REFUSED: " + message); };
  requireCond(request && request.schema === "issue-341-reviewable-admission-requests/1", "unknown admission request schema");
  requireCond(request.status === "REQUEST_MATERIALS_ONLY_NOT_MANIFEST", "admission document is not a request-only snapshot");
  requireCond(Array.isArray(request.rows) && request.rows.length === 365 && request.requestedPositions === 365, "expected immutable 365-request input");
  requireCond(request.newGrantedA === 0 && request.formalStrictA === 813, "formal A baseline differs from the reviewed snapshot");
  const head=request.sourceSnapshot?.head;
  requireCond(typeof head === "string" && /^[0-9a-f]{40}$/.test(head), "source HEAD missing or malformed");
  // This request is a frozen review snapshot, not a movable ref. Refreshing
  // code HEAD requires a new reviewed request and an explicit guard update.
  requireCond(head === "fec2d5446c979741e3207a0c70f3e792a10eb5cf",
    "request HEAD differs from reviewed PR #351 source");
  const identities=new Map(), nativePositions=new Set(), families=new Map(), groups={P007:0,P009:0,B:0};
  const makeKey=r=>r.packet+"\u0000"+r.sessionId+"\u0000"+r.index;
  for (const row of request.rows) {
    requireCond(row && typeof row === "object" && ["P007","P009","B"].includes(row.group), "unknown request group");
    requireCond(typeof row.packet === "string" && row.packet.length>0 && typeof row.sessionId === "string" && row.sessionId.length>0, "missing source identity");
    requireCond(Number.isSafeInteger(row.index) && row.index >= 0 && row.position === row.sessionId+":"+row.index, "source index/position mismatch");
    requireCond(typeof row.nodeId === "string" && row.nodeId.length>0 && typeof row.type === "string" && row.type.length>0 && /^[a-f0-9]{64}$/.test(row.taskHash), "invalid exact source identity");
    const adapter=row.admissionChoice?.typesAwareAdapter;
    requireCond(typeof adapter === "string" && adapter === "issue341-"+row.packet && row.admissionChoice?.selected === "PLANNED_TYPES_AWARE_113_NOT_ACTIVATED", "family/adapter not in selected non-activated representation");
    requireCond(row.currentWindowCodeHead === head && row.independentHumanApproval === "PENDING" && row.newFeedback?.independentHumanApproval === "PENDING", "independent human approval is not pending; re-review needed");
    requireCond(row.formalA === "NOT_GRANTED" && row.officialManifestWritten === false && row.newFeedback?.method === null, "formal gate or method claim differs from reviewed request");
    requireCond(row.existingMathematicalEvidence?.status === "REUSED_NO_NEW_PROOF_REQUEST" && typeof row.existingMathematicalEvidence?.moduleSha256 === "string", "original math contract evidence missing");
    requireCond(row.archivedFixture?.memberSha256 && row.archivedFixture?.resultsMemberSha256, "archived original input reference missing");
    // Native session/index is globally unique across packets, not merely
    // unique within a packet. Otherwise cross-packet aliasing defeats the
    // exact-source admission boundary even if 365 request rows remain.
    const nativeKey=JSON.stringify([row.sessionId,row.index]);
    requireCond(!nativePositions.has(nativeKey), "duplicate native position across packets "+row.position);
    nativePositions.add(nativeKey);
    const k=makeKey(row);
    requireCond(!identities.has(k), "duplicate source position "+row.position);
    identities.set(k,row);
    if (!families.has(adapter)) families.set(adapter,[]);
    families.get(adapter).push(row);
    groups[row.group]++;
    if (row.group==="P007") requireCond(row.existingMathematicalEvidence.preserveAdditionalTwoCheckGate === true, "P007 two-check preservation missing");
  }
  requireCond(groups.P007===30 && groups.P009===27 && groups.B===308 && families.size===113, "reviewed group/family cardinality changed");
  requireCond(nativePositions.size===365, "distinct native source count differs");
  requireCond([...families.values()].filter(x=>x.length>1).length===71 && [...families.values()].filter(x=>x.length>1).reduce((s,x)=>s+x.length,0)===323, "multi-position family cardinality changed");
  let selectedKeys=new Set();
  if (proposal !== null) {
    requireCond(proposal && proposal.schema === "issue341-hypothetical-source-scope/1", "proposal must be hypothetical source-scope schema");
    requireCond(proposal.sourceHead === head, "hypothetical source HEAD does not match reviewed code");
    requireCond(Array.isArray(proposal.rows), "hypothetical scope must provide rows");
    const required=["packet","sessionId","index","nodeId","taskHash","type","adapter"].sort();
    for (const row of proposal.rows) {
      requireCond(row && typeof row === "object" && !Array.isArray(row), "invalid scoped identity");
      requireCond(JSON.stringify(Object.keys(row).sort())===JSON.stringify(required), "scope has extra/missing attributes; approval assertions are forbidden");
      const k=makeKey(row),original=identities.get(k);
      requireCond(original, "scope includes unknown packet/source position");
      requireCond(!selectedKeys.has(k), "duplicate hypothetical scope identity");
      requireCond(original.nodeId===row.nodeId && original.taskHash===row.taskHash && original.type===row.type && original.admissionChoice.typesAwareAdapter===row.adapter, "scope includes wrong node/hash/type/adapter");
      selectedKeys.add(k);
    }
  }
  const affected=[],perPosition=[];
  let multiFamilies=0,multiPositions=0,partialFamilies=0,overreach=0;
  for (const [adapter,rows] of families) {
    const count=rows.filter(r=>selectedKeys.has(makeKey(r))).length;
    if(rows.length>1){multiFamilies++;multiPositions+=rows.length;}
    if(count>0){
      if(count<rows.length){partialFamilies++;overreach+=rows.length-count;}
      affected.push({adapter,familyPositions:rows.length,hypotheticallySelected:count,notSelected:rows.length-count,
        familyWideBindingWouldOverreach:count<rows.length,
        requiredBoundary:"EXACT_SESSION_INDEX_NODE_TASKHASH_AND_MANIFEST_ALLOWLIST"});
    }
    for(const row of rows){
      perPosition.push({packet:row.packet,group:row.group,position:row.position,nodeId:row.nodeId,taskHash:row.taskHash,type:row.type,
        adapter, familyMemberCount:rows.length,hypotheticallySelected:selectedKeys.has(makeKey(row)),
        independentHumanApproval:"PENDING",formalA:"NOT_GRANTED",
        status:"ONLY_SIMULATED_SOURCE_SCOPE_NO_PRODUCTION_REGISTRATION"});
    }
  }
  perPosition.sort((a,b)=>a.group.localeCompare(b.group)||a.packet.localeCompare(b.packet)||a.position.localeCompare(b.position));
  return {
    schema:"issue341-approval-scope-readonly-preflight/1",
    result:"PASS_STRUCTURE_ONLY_NOT_FORMAL_MATH_OR_FEEDBACK_APPROVAL",
    readOnly:true,officialManifestWritten:false,productionRegistrationPerformed:false,
    sourceHead:head,formalAExisting813:813,newFormalAGrants:0,scopeMode:proposal?"HYPOTHETICAL_SOURCE_SELECTION":"NO_SELECTION_REQUESTED",
    allCandidates:{positions:request.rows.length,families:families.size,groups,multiPositionFamilies:multiFamilies,positionsInMultiPositionFamilies:multiPositions},
    hypotheticalScope:{selectedPositions:selectedKeys.size,affectedFamilies:affected.length,partialFamilies,familyWideOverreachPositions:overreach,
      warning:"Selecting a family adapter is NEVER sufficient to authorize a partial set of exact sources."},
    activationAllowed:false,independentHumanApproval:"PENDING",
    guard:"Exact source AND officially approved manifest source allowlist required after independent human approval. No grants or runtime changes are generated.",
    familyScope:affected,perPosition
  };
}

const invoked=process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url);
if (invoked) {
  try {
    const args=process.argv.slice(2);
    if (args.length!==0 && !(args.length===2 && args[0]==="--hypothetical-scope"))
      throw new Error("usage: node approval-scope-preflight.mjs [--hypothetical-scope <local-json-file>]");
    const dir=dirname(fileURLToPath(import.meta.url));
    const requests=JSON.parse(readFileSync(join(dir,"admission-requests-365.json"),"utf8"));
    const scope=args.length?JSON.parse(readFileSync(resolve(args[1]),"utf8")):null;
    console.log(JSON.stringify(inspectIssue341ApprovalScope(requests,scope),null,2));
  }catch(err){console.error(String(err.message||err));process.exitCode=1;}
}
