// Per-origin Mac-local preference. This is separate from all learning data.
// The release/SW lifecycle module stays storage-free and unchanged.
export const MAC_LOCAL_MODE_KEY='math-explorer-runtime-mode-v1';
export function isMacLocalMode(){
 try{
  return location.protocol==='http:'&&
   (location.hostname==='127.0.0.1'||location.hostname==='localhost')&&
   localStorage.getItem(MAC_LOCAL_MODE_KEY)==='mac-local';
 }catch{return false;}
}
