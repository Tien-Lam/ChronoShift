import config from '../../../../playwright.config';
export default {...config,testDir:process.cwd()+'/e2e',webServer:undefined,reporter:[['list']],workers:1,retries:0,outputDir:process.cwd()+'/docs/qa/ci-lifecycle-2026-10-05/code/test-results',use:{...config.use,baseURL:'http://127.0.0.1:4262/'}};
