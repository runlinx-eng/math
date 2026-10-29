// Local, lossless storage envelope. Small/legacy JSON stays byte-for-byte plain.
// No observations, attempts or drafts are discarded. Backup downloads remain JSON.
const FORMAT='math-storage/lzw16-v1',PREFIX='{"format":"'+FORMAT+'"',RESET=256,MAX=65535;
export const MAX_BACKUP_BYTES=50_000_000;
export const COMPRESS_AT=2_000_000;
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
const checksum=bytes=>{let h=2166136261;for(const n of bytes)h=Math.imul(h^n,16777619)>>>0;return h.toString(16).padStart(8,'0');};
function encode(bytes){if(!bytes.length)return'';const codes=[],dict=new Map();let next=257,w=bytes[0];for(let i=1;i<bytes.length;i++){const n=bytes[i],key=w*256+n,k=dict.get(key);if(k!==undefined){w=k;continue;}codes.push(w);if(next<=MAX)dict.set(key,next++);else{codes.push(RESET);dict.clear();next=257;}w=n;}codes.push(w);const binary=new Uint8Array(codes.length*2);codes.forEach((n,i)=>{binary[i*2]=n&255;binary[i*2+1]=n>>>8;});const chunks=[];for(let i=0;i<binary.length;i+=16384)chunks.push(String.fromCharCode(...binary.subarray(i,i+16384)));return btoa(chunks.join(''));}
function decode(data,expected){if(typeof data!=='string'||data.length>MAX_BACKUP_BYTES*3||!Number.isSafeInteger(expected)||expected<0||expected>MAX_BACKUP_BYTES)throw Error('压缩记录大小无效。');const raw=atob(data);if(raw.length%2)throw Error('压缩记录不完整。');const bytes=new Uint8Array(expected);let dict=[],next=257,prev='',offset=0;
 for(let i=0;i<raw.length;i+=2){const code=raw.charCodeAt(i)|(raw.charCodeAt(i+1)<<8);if(code===RESET){dict=[];next=257;prev='';continue;}let value;if(code<256)value=String.fromCharCode(code);else if(code<next&&dict[code]!==undefined)value=dict[code];else if(code===next&&prev)value=prev+prev[0];else throw Error('压缩记录编码无效。');if(offset+value.length>expected)throw Error('压缩记录超出声明大小。');for(let j=0;j<value.length;j++)bytes[offset++]=value.charCodeAt(j);if(prev&&next<=MAX)dict[next++]=prev+value[0];prev=value;}
 if(offset!==expected)throw Error('压缩记录长度不一致。');return bytes;
}
export function unpackText(raw){if(raw===null||!raw.startsWith(PREFIX))return raw;const box=JSON.parse(raw);if(box.format!==FORMAT)throw Error('存储格式不支持。');const bytes=decode(box.data,box.bytes);if(checksum(bytes)!==box.checksum)throw Error('记录校验失败，原记录没有被覆盖。');return decoder.decode(bytes);}
export function packText(text,threshold=COMPRESS_AT){if(typeof text!=='string')throw Error('存储内容必须是文本。');if(text.length<threshold)return text;const bytes=encoder.encode(text);if(bytes.length>MAX_BACKUP_BYTES)throw Error('学习记录超过本机单份保存上限，请先导出。');if(decoder.decode(bytes)!==text)return text;const packed=JSON.stringify({format:FORMAT,bytes:bytes.length,checksum:checksum(bytes),data:encode(bytes)});return packed.length<text.length?packed:text;}
export function readStored(key,storage=globalThis.localStorage){return unpackText(storage.getItem(key));}
export function writeStored(key,text,storage=globalThis.localStorage){const packed=packText(text);storage.setItem(key,packed);return packed.length;}
