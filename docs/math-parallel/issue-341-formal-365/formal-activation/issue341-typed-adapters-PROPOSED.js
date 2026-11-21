// PROPOSAL ONLY. This file is not imported by production or copied into the repository.
// After independent approval, this optional representation preserves the existing
// audit's .type convention; 145 entries still represent113 mathematical families.
import {ISSUE341_NORMALIZED_ADAPTERS} from './issue341-candidate-feedback.js';
export const ISSUE341_PROPOSED_TYPED_ADAPTERS=Object.freeze(
 ISSUE341_NORMALIZED_ADAPTERS.flatMap(family=>family.types.map(type=>{
  const {types,...rest}=family;
  return Object.freeze({...rest,
   id:types.length===1?family.id:family.id+'-'+type,type,
   sourceFamilyId:family.id,
   sources:Object.freeze(family.sources.filter(source=>source.type===type)),
   binding:(task,context)=>task?.type===type?family.binding(task,context):null
  });
 }))
);
