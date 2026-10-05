import base from '/Users/tien/Developer/ChronoShift/playwright.config.ts';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testDir:'/Users/tien/Developer/ChronoShift/e2e',workers:1,retries:0,webServer:undefined,reporter:'list',outputDir:`${import.meta.dir}/matched-${process.env.REVIEW_VARIANT}`,projects:base.projects!.filter(p=>p.name==='iphone-emulation'),use:{...base.use,baseURL:`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT}`,trace:'off',screenshot:'off'}});
