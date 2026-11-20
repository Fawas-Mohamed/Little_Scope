import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PHASE = process.env.QA_PHASE || 'after';
const VIEWPORTS = [
  ['2560x1440', 2560, 1440], ['1920x1080', 1920, 1080], ['1680x1050', 1680, 1050],
  ['1440x900', 1440, 900], ['1366x768', 1366, 768], ['1280x720', 1280, 720],
  ['1024x768-desktop', 1024, 768], ['1024x1366', 1024, 1366], ['820x1180', 820, 1180],
  ['768x1024', 768, 1024], ['1024x768-tablet-landscape', 1024, 768],
  ['430x932', 430, 932], ['414x896', 414, 896], ['390x844', 390, 844],
  ['375x667', 375, 667], ['360x640', 360, 640], ['320x568', 320, 568],
  ['844x390-landscape', 844, 390], ['667x375-landscape', 667, 375],
];
const SECTIONS = [
  ['hero', '#top'], ['story', '#story'], ['flavours', '.showcase'],
  ['reviews', '#reviews'], ['instagram', '#instagram'], ['footer', '#contact'],
];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function mkdirFor(file) { await fs.mkdir(path.dirname(file), { recursive: true }); }
function safeName(value) { return value.replace(/[^a-z0-9-]+/gi, '-').toLowerCase(); }

async function inspect(page, point) {
  return page.evaluate((label) => {
    const visible = (el) => {
      const style = getComputedStyle(el), r = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.01 && r.width > 0 && r.height > 0;
    };
    const outside = [...document.body.querySelectorAll('*')].filter(visible).map((el) => {
      const r = el.getBoundingClientRect();
      if (r.left >= -1 && r.right <= innerWidth + 1) return null;
      return { tag: el.tagName.toLowerCase(), className: typeof el.className === 'string' ? el.className : '',
        text: (el.innerText || '').trim().slice(0, 80), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
    }).filter(Boolean).slice(0, 30);
    return { point: label, viewport: [innerWidth, innerHeight], scrollWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth, outside };
  }, point);
}

async function runAxe(page) {
  await page.evaluate(() => document.getAnimations().forEach((animation) => animation.finish()));
  return new AxeBuilder({ page }).withTags(TAGS).analyze();
}

test('storefront viewport, section, overflow, console, and axe audit', async ({ browser, browserName }) => {
  const report = { browser: browserName, phase: PHASE, viewports: [], axe: [] };
  const failures = [];
  const screenshotRoot = path.join(ROOT, 'screenshots', PHASE, browserName);
  const context = await browser.newContext({ viewport: { width: 2560, height: 1440 }, hasTouch: true, colorScheme: 'light' });
  const page = await context.newPage();
  const events = { errors: [], warnings: [], resourceErrors: [], pageErrors: [], failedRequests: [], badResponses: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'warning') events.warnings.push(msg.text());
    if (msg.type() === 'error') {
      if (msg.text().includes('Failed to load resource')) events.resourceErrors.push({ text: msg.text(), url: msg.location().url });
      else events.errors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => events.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    const failure = { url: request.url(), error: request.failure()?.errorText };
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(request.url())) events.resourceErrors.push(failure);
    else events.failedRequests.push(failure);
  });
  page.on('response', (response) => { if (response.status() >= 400) events.badResponses.push({ status: response.status(), url: response.url() }); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await Promise.race([page.evaluate(() => document.fonts?.ready), page.waitForTimeout(2_000)]);
  for (const [name, width, height] of VIEWPORTS) {
    const eventStart = Object.fromEntries(Object.entries(events).map(([key, values]) => [key, values.length]));
    await page.setViewportSize({ width, height });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(100);
    const diagnostics = [];
    for (const [sectionName, selector] of SECTIONS) {
      const locator = page.locator(selector).first();
      await locator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
      const file = path.join(screenshotRoot, safeName(name), `${sectionName}.png`);
      await mkdirFor(file);
      await locator.screenshot({ path: file, animations: 'disabled', timeout: 20_000 });
      diagnostics.push(await inspect(page, `${sectionName}:entry`));

      if (sectionName === 'flavours') {
        const metrics = await page.locator('.showcase-track').evaluate((track) => {
          const section = track.querySelector('.showcase');
          return { top: track.getBoundingClientRect().top + scrollY, step: (track.offsetHeight - section.offsetHeight) / 6 };
        });
        for (let i = 0; i < 7; i += 1) {
          await page.evaluate(({ top, step, index }) => scrollTo(0, top + step * index), { ...metrics, index: i });
          await page.waitForTimeout(80);
          const productFile = path.join(screenshotRoot, safeName(name), `flavours-${String(i + 1).padStart(2, '0')}.png`);
          await page.locator('.showcase').screenshot({ path: productFile, animations: 'disabled', timeout: 20_000 });
          diagnostics.push(await inspect(page, `flavours-${String(i + 1).padStart(2, '0')}`));
        }
      }
    }

    await page.evaluate(() => scrollTo(0, 0));
    const firstHeadingCount = await page.getByRole('heading', { level: 1 }).count();
    const currentEvents = Object.fromEntries(Object.entries(events).map(([key, values]) => [key, values.slice(eventStart[key])]));
    const detail = { name, width, height, diagnostics, events: currentEvents, firstHeadingCount };
    report.viewports.push(detail);
    if (diagnostics.some((d) => d.horizontalOverflow)) failures.push(`${name}: horizontal document overflow`);
    if (currentEvents.errors.length || currentEvents.warnings.length || currentEvents.pageErrors.length || currentEvents.failedRequests.length || currentEvents.badResponses.length) failures.push(`${name}: browser errors or failed requests`);
    if (firstHeadingCount !== 1) failures.push(`${name}: expected exactly one storefront h1, found ${firstHeadingCount}`);
    if (name === '1440x900' || name === '320x568') {
      const result = await runAxe(page);
      report.axe.push({ viewport: name, violations: result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })) })) });
      if (result.violations.some((v) => v.impact === 'critical' || v.impact === 'serious')) failures.push(`${name}: axe serious/critical violations`);
    }
  }

  const resultFile = path.join(ROOT, 'results', `${PHASE}-${browserName}-storefront.json`);
  await mkdirFor(resultFile);
  await fs.writeFile(resultFile, JSON.stringify(report, null, 2));
  await context.close();
  expect(failures, failures.join('\n')).toEqual([]);
});

test('storefront quick view, cart checkout, and admin order smoke', async ({ browser, browserName }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const events = { errors: [], pageErrors: [], badResponses: [] };
  const accessibility = [];
  page.on('console', (msg) => { if (msg.type() === 'error') events.errors.push(msg.text()); });
  page.on('pageerror', (error) => events.pageErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) events.badResponses.push({ status: response.status(), url: response.url() }); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.explore').click();
  const dialog = page.getByRole('dialog', { name: /quick view/i });
  await expect(dialog).toBeVisible();
  const qvAxe = await runAxe(page);
  accessibility.push({ state: 'quick-view', violations: qvAxe.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').map((v) => v.id) });
  await page.getByRole('button', { name: /add to cart/i }).click();
  await expect(page.getByRole('button', { name: /added/i })).toBeVisible();
  await page.waitForTimeout(550);
  await page.getByRole('button', { name: /^Cart/ }).first().click();
  const cart = page.getByRole('dialog', { name: 'Your cart' });
  await expect(cart).toBeVisible();
  const cartAxe = await runAxe(page);
  accessibility.push({ state: 'cart', violations: cartAxe.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').map((v) => v.id) });
  await cart.getByRole('button', { name: 'Checkout' }).click();
  await cart.getByLabel('Full name').fill('QA Customer');
  await cart.getByLabel('Email').fill('qa@example.com');
  await cart.getByLabel('Delivery address').fill('24 Test Street');
  await cart.getByRole('button', { name: /place order/i }).click();
  await expect(cart.getByText(/is confirmed/i)).toBeVisible();
  const orderId = await cart.locator('b').first().textContent();
  await page.goto('/#/admin');
  await page.getByLabel('Email').fill('admin@littlescoop.com');
  await page.locator('input[type="password"]').fill('admin123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.a-content h1')).toBeVisible();
  await page.goto('/#/admin/orders');
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
  await expect(page.getByText(orderId, { exact: true })).toBeVisible();
  const resultFile = path.join(ROOT, 'results', `${PHASE}-${browserName}-checkout.json`);
  await mkdirFor(resultFile);
  await fs.writeFile(resultFile, JSON.stringify({ browser: browserName, orderId, events, accessibility }, null, 2));
  await context.close();
  expect(accessibility.flatMap((x) => x.violations)).toEqual([]);
  expect(events).toEqual({ errors: [], pageErrors: [], badResponses: [] });
});

test('admin pages, dialogs, and responsive layouts', async ({ browser, browserName }) => {
  const report = { browser: browserName, pages: [], dialogs: [] };
  const failures = [];
  for (const [viewportName, width, height] of [['desktop', 1440, 900], ['phone', 360, 640]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: viewportName === 'phone' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (msg) => { if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text()); });
    await page.goto('/#/admin');
    await page.getByLabel('Email').fill('admin@littlescoop.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('.a-content h1')).toBeVisible();

    for (const [key, pathName, heading] of [
      ['dashboard', '/#/admin', null], ['orders', '/#/admin/orders', 'Orders'],
      ['products', '/#/admin/products', 'Products'], ['customers', '/#/admin/customers', 'Customers'],
      ['reviews', '/#/admin/reviews', 'Reviews'], ['coupons', '/#/admin/coupons', 'Coupons'],
      ['settings', '/#/admin/settings', 'Settings'],
    ]) {
      await page.goto(pathName);
      const title = page.locator('.a-content h1').first();
      await expect(title).toBeVisible();
      if (heading) await expect(title).toHaveText(heading);
      const result = await runAxe(page);
      const violations = result.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
        .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => ({ target: n.target, failureSummary: n.failureSummary })) }));
      report.pages.push({ viewport: viewportName, page: key, violations, errors: [...errors] });
      if (violations.length || errors.length) failures.push(`${viewportName}/${key}: axe serious/critical or browser errors`);
      const file = path.join(ROOT, 'screenshots', PHASE, browserName, 'admin', viewportName, `${key}.png`);
      await mkdirFor(file);
      await page.locator('.a-shell').screenshot({ path: file, animations: 'disabled' });

      if (key === 'settings') {
        for (const tab of ['Store', 'Delivery & tax', 'Notifications', 'Account', 'Data']) {
          await page.getByRole('button', { name: tab, exact: true }).click();
          const tabResult = await runAxe(page);
          const serious = tabResult.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').map((v) => v.id);
          report.pages.push({ viewport: viewportName, page: `settings-${tab}`, violations: serious, errors: [...errors] });
          if (serious.length) failures.push(`${viewportName}/settings-${tab}: axe serious/critical violations`);
        }
      }
    }

    if (viewportName === 'desktop') {
      await page.goto('/#/admin/products');
      await page.getByRole('button', { name: 'Add product' }).click();
      const productDialog = page.getByRole('dialog', { name: 'Add product' });
      await expect(productDialog).toBeVisible();
      let result = await runAxe(page);
      let serious = result.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
        .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => ({ target: n.target, failureSummary: n.failureSummary })) }));
      report.dialogs.push({ name: 'add-product', violations: serious });
      if (serious.length) failures.push('add-product dialog: axe serious/critical violations');
      await page.keyboard.press('Escape');
      await expect(productDialog).not.toBeVisible();

      await page.goto('/#/admin/orders');
      const openOrder = page.getByRole('button', { name: /^Open LS-/ }).first();
      await openOrder.click();
      const orderDialog = page.getByRole('dialog', { name: /^Order LS-/ });
      await expect(orderDialog).toBeVisible();
      result = await runAxe(page);
      serious = result.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
        .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => ({ target: n.target, failureSummary: n.failureSummary })) }));
      report.dialogs.push({ name: 'order-drawer', violations: serious });
      if (serious.length) failures.push('order drawer: axe serious/critical violations');
    }
    await context.close();
  }
  const file = path.join(ROOT, 'results', `${PHASE}-${browserName}-admin.json`);
  await mkdirFor(file);
  await fs.writeFile(file, JSON.stringify(report, null, 2));
  expect(failures, failures.join('\n')).toEqual([]);
});

test('dark theme, reduced motion, zoom, and storage recovery', async ({ browser, browserName }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', reducedMotion: 'reduce', hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBeTruthy();
  expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBeTruthy();
  const variants = [];
  for (const zoom of [1.25, 1.5, 2]) {
    await page.evaluate((value) => { document.documentElement.style.zoom = String(value); }, zoom);
    await page.waitForTimeout(100);
    const result = await page.evaluate(() => ({ zoom: getComputedStyle(document.documentElement).zoom, width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    variants.push(result);
    const file = path.join(ROOT, 'screenshots', PHASE, browserName, 'variants', `zoom-${Math.round(zoom * 100)}.png`);
    await mkdirFor(file);
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  }
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
  await page.goto('/#/admin/products');
  await page.getByLabel('Email').fill('admin@littlescoop.com');
  await page.locator('input[type="password"]').fill('admin123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.goto('/#/admin/products');
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  await context.close();

  const blocked = await browser.newContext({ viewport: { width: 360, height: 640 } });
  await blocked.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      Storage.prototype[method] = () => { throw new DOMException('Storage disabled', 'SecurityError'); };
    }
  });
  const noStoragePage = await blocked.newPage();
  noStoragePage.on('pageerror', (error) => errors.push(error.message));
  await noStoragePage.goto('/#/admin/products');
  await noStoragePage.getByLabel('Email').fill('admin@littlescoop.com');
  await noStoragePage.locator('input[type="password"]').fill('admin123');
  await noStoragePage.getByRole('button', { name: 'Sign in' }).click();
  await noStoragePage.goto('/#/admin/products');
  await expect(noStoragePage.getByRole('heading', { name: 'Products' })).toBeVisible();
  await blocked.close();

  const report = { browser: browserName, variants, storageDisabled: true, errors };
  const file = path.join(ROOT, 'results', `${PHASE}-${browserName}-variants.json`);
  await mkdirFor(file);
  await fs.writeFile(file, JSON.stringify(report, null, 2));
  expect(errors).toEqual([]);
  expect(variants.every((v) => v.scrollWidth <= v.width)).toBeTruthy();
});
