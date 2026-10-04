import {consoleDiagnostics} from '/Users/tien/Developer/ChronoShift/e2e/console.ts';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
let listener:any;const records=consoleDiagnostics({on(_name:any,fn:any){listener=fn;}} as any);
const emit=(text:string,fn:()=>any)=>listener({text:()=>text,args:()=>[{jsonValue:fn}]});
let first:any,second:any;emit('[ChronoShift] first',()=>new Promise(r=>first=r));emit('[ChronoShift] second',()=>new Promise(r=>second=r));
let flushed=false;const drain=records.flush().then(()=>flushed=true);second({slot:2});await Promise.resolve();assert.equal(flushed,false);
// A console event that arrives while the first batch drains must also be captured.
let third:any;emit('[ChronoShift] third',()=>new Promise(r=>third=r));first({slot:1});await Promise.resolve();assert.equal(flushed,false);third({slot:3});await drain;
assert.deepEqual([...records],['[{"slot":1}]','[{"slot":2}]','[{"slot":3}]']);
let called=false;emit('other-library event',()=>{called=true;throw new Error('Must not read');});await records.flush();assert.equal(called,false);assert.equal(records.length,3);
for(const [kind,value] of [['non-Error navigation text','Execution context was destroyed'],['sync serialization',new Error('Unexpected sync failure')]]){
 let callback:any;const x=consoleDiagnostics({on(_n:any,f:any){callback=f;}} as any);
 callback({text:()=>'[ChronoShift] rejected',args:()=>[{jsonValue:()=>{if(kind==='sync serialization')throw value;return Promise.reject(value)}}]});
 await assert.rejects(x.flush(),(e:any)=>e instanceof AggregateError&&e.errors[0]===value);
}
console.log('PASS: reverse completion preserves event order; flush waits for mid-drain event; non-ChronoShift filtered; non-Error navigation text and sync errors surfaced.');
writeFileSync('/tmp/chronoshift-live-code/helper-independent.json',JSON.stringify({revision:'d3f6a423c22f2ebc44d1ee1ea690e14c8056bdbc',result:'pass',time:new Date().toISOString()},null,2));
