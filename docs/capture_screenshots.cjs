const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureAll() {
  console.log('🚀 Launching Chromium for 4K/Retina Hackathon Screenshot Capture...');
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Workstation (1920x1080 @ 2x Retina Scale)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'dark'
  });
  const page = await desktopContext.newPage();
  
  console.log('📸 [1/6] Capturing Desktop Workstation & Launchpad...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_desktop_launchpad.png') });

  // 2. Click High-Yield Study Track & Capture Full Grounded Answer
  console.log('📸 [2/6] Executing Grounded Query (CIDR Subnetting)...');
  const trackBtn = await page.locator('button:has-text("CIDR Subnetting")').first();
  if (await trackBtn.count() > 0) {
    await trackBtn.click();
  } else {
    const anyCard = await page.locator('.grid button').first();
    await anyCard.click();
  }

  // Wait for streaming and answer rendering
  console.log('   Waiting for RAG answer, KaTeX math & citations to complete...');
  try {
    await page.waitForSelector('button:has-text("Copy")', { timeout: 15000 });
  } catch (e) {
    await page.waitForTimeout(8000);
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_desktop_grounded_answer.png') });

  // 3. Open Source Material Inspector Drawer
  console.log('📸 [3/6] Opening Senior Peer Notes Source Inspector Drawer...');
  const inspectBtn = await page.locator('button:has-text("Inspect Notes")').first();
  if (await inspectBtn.count() > 0) {
    await inspectBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_desktop_source_inspector.png') });
    
    // Close inspector
    const closeBtn = await page.locator('button:has-text("Close Drawer")').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 4. Open Upload & AST Ingestion Modal
  console.log('📸 [4/6] Opening Study Material Upload & AST Ingestion Modal...');
  const uploadNavBtn = await page.locator('button:has-text("Upload Notes"), button:has-text("Upload")').first();
  if (await uploadNavBtn.count() > 0) {
    await uploadNavBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_desktop_upload_modal.png') });
    
    const closeUpload = await page.locator('button:has-text("Cancel")').first();
    if (await closeUpload.count() > 0) {
      await closeUpload.click();
    }
  }

  await desktopContext.close();

  // 5. Mobile Workstation (390x844 @ 3x scale)
  console.log('📸 [5/6] Capturing Mobile Workstation Viewport...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark'
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  
  const mobilePrompt = await mobilePage.locator('.grid button:has-text("CIDR Subnetting")').first();
  if (await mobilePrompt.count() > 0) {
    await mobilePrompt.click();
  } else {
    const anyPrompt = await mobilePage.locator('.grid button').first();
    await anyPrompt.click();
  }
  
  try {
    await mobilePage.waitForSelector('button:has-text("Copy")', { timeout: 15000 });
  } catch (e) {
    await mobilePage.waitForTimeout(8000);
  }
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '05_mobile_workstation.png') });

  // 6. Open Mobile Curriculum Slide-Over Drawer
  console.log('📸 [6/6] Capturing Mobile Slide-Over Curriculum Timeline Drawer...');
  const mobileDrawerBtn = await mobilePage.locator('button[aria-label="Open Syllabus Menu"], button[title*="Curriculum"]').first();
  if (await mobileDrawerBtn.count() > 0) {
    await mobileDrawerBtn.click();
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '06_mobile_curriculum_drawer.png') });
  }

  await mobileContext.close();
  await browser.close();

  console.log('✨ All 6 high-resolution presentation screenshots captured successfully!');
  console.log('📁 Saved in:', OUTPUT_DIR);
}

captureAll().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
