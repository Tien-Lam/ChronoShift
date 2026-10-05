import {test,expect} from '@playwright/test';
test('first failure then success',async({page},info)=>{await page.goto('/');await expect(page.locator('main')).toBeVisible();expect(info.retry).toBe(1)});
test('expected failure',async()=>{test.fail();expect(1).toBe(2)});
