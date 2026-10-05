import {expect} from 'bun:test';
const source=await Bun.file('e2e/uncontrolled.spec.ts').text();
const start=source.indexOf('clientTest.afterEach(')+'clientTest.afterEach('.length;
const end=source.indexOf(');\nasync function hardReload',start);
const hookText=source.slice(start,end);
const transpiled=new Bun.Transpiler({loader:'ts'}).transformSync(`const hook = ${hookText};`);
const evidence=new WeakMap();
const hook=new Function('evidence',transpiled+'; return hook;')(evidence);
const results=[];
for(const mode of ['passing-clean','passing-capture-error','failed-clean','failed-document-ended']){
 let flushes=0;const records:any=Object.assign(['known-event'],{async flush(){flushes++;if(mode==='passing-capture-error')throw expectedError;}});
 const expectedError=new AggregateError([new Error('Unexpected serialization failure')],'Console capture failed');
 const page={async evaluate(){if(mode==='failed-document-ended')throw new Error('closed');return{controller:{state:'activated'},ready:'true'};}};evidence.set(page,records);
 const attached:any[]=[];const info={status:mode.startsWith('passing')?'passed':'failed',expectedStatus:'passed',async attach(name:string,data:any){attached.push({name,...data,body:JSON.parse(data.body)});}};
 let caught:any;try{await hook({page},info)}catch(error){caught=error;}
 expect(flushes).toBe(1);expect(attached.length).toBe(mode==='passing-clean'?0:1);
 if(mode==='passing-capture-error'){expect(caught).toBe(expectedError);expect(attached[0].body.captureFailed).toBe(true);}
 else expect(caught).toBeUndefined();
 if(mode==='failed-document-ended')expect(attached[0].body.snapshot).toEqual({unavailable:'document-ended-before-snapshot'});
 results.push({mode,flushes,attached,rethrewCaptureError:caught===expectedError});
}
await Bun.write('docs/qa/ci-lifecycle-2026-10-05/code/hook-delta.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
