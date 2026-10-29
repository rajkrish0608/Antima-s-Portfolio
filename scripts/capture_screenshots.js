import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = './screenshots';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // ─────────────────────────────────────────────────────────────────────────
  // DESKTOP: 1600x900
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Capturing Desktop 1600x900...');
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle0' });

  // Wait for preloader finish animation (1.5s after 100%)
  await new Promise((r) => setTimeout(r, 2200));

  // Get total document scroll height and section bounds
  const info = await page.evaluate(() => {
    const vh = window.innerHeight;
    const sections = ['hero', 'about', 'work', 'journey', 'skills', 'awards', 'contact'];
    const bounds = sections.map((id) => {
      const el = document.getElementById(id);
      return el ? { id, top: el.offsetTop, height: el.offsetHeight } : null;
    });
    return {
      vh,
      bounds,
      totalScroll: document.documentElement.scrollHeight - window.innerHeight,
    };
  });

  console.log('Document info:', JSON.stringify(info, null, 2));

  // Helper to scroll and capture
  const snap = async (y, name) => {
    await page.evaluate((targetY) => {
      if (window.__director) {
        window.__director.setScroll(targetY);
      } else {
        window.scrollTo(0, targetY);
      }
    }, y);
    // Wait for frame render
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
    console.log(`Saved ${name}.png (y=${Math.round(y)})`);
  };

  const vh = info.vh;
  const lead = 0.78 * vh;

  // 1. Hero
  await snap(10, 'desktop_01_hero');

  // 2. Hero -> About blade transition
  const aboutTop = info.bounds[1].top;
  await snap(aboutTop - lead + 0.3 * vh, 'desktop_02_trans_hero_about');

  // 3. About
  await snap(aboutTop + 0.5 * vh, 'desktop_03_about');

  // 4. About -> Work blade transition
  const workTop = info.bounds[2].top;
  await snap(workTop - lead + 0.3 * vh, 'desktop_04_trans_about_work');

  // 5. Work (Card 1, Card 2, Card 3)
  await snap(workTop + 0.3 * vh, 'desktop_05_work_card1');
  await snap(workTop + 1.8 * vh, 'desktop_06_work_card2');
  await snap(workTop + 3.2 * vh, 'desktop_07_work_card3');

  // 6. Work -> Journey transition
  const journeyTop = info.bounds[3].top;
  await snap(journeyTop - lead + 0.3 * vh, 'desktop_08_trans_work_journey');

  // 7. Journey
  await snap(journeyTop + 0.6 * vh, 'desktop_09_journey');

  // 8. Journey -> Toolkit transition
  const skillsTop = info.bounds[4].top;
  await snap(skillsTop - lead + 0.3 * vh, 'desktop_10_trans_journey_skills');

  // 9. Toolkit / Skills
  await snap(skillsTop + 0.6 * vh, 'desktop_11_skills_orbit');

  // 10. Toolkit -> Awards transition
  const awardsTop = info.bounds[5].top;
  await snap(awardsTop - lead + 0.3 * vh, 'desktop_12_trans_skills_awards');

  // 11. Awards
  await snap(awardsTop + 0.8 * vh, 'desktop_13_awards');

  // 12. Awards -> Contact blade transition
  const contactTop = info.bounds[6].top;
  await snap(contactTop - lead + 0.3 * vh, 'desktop_14_trans_awards_contact_blade');

  // 13. Contact
  await snap(contactTop + 0.8 * vh, 'desktop_15_contact');

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE: 390x844
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\nCapturing Mobile 390x844...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2200));

  const mobileInfo = await page.evaluate(() => {
    const sections = ['hero', 'about', 'work', 'journey', 'skills', 'awards', 'contact'];
    return sections.map((id) => {
      const el = document.getElementById(id);
      return el ? { id, top: el.offsetTop, height: el.offsetHeight } : null;
    });
  });

  const snapMob = async (y, name) => {
    await page.evaluate((targetY) => {
      if (window.__director) {
        window.__director.setScroll(targetY);
      } else {
        window.scrollTo(0, targetY);
      }
    }, y);
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
    console.log(`Saved ${name}.png (y=${Math.round(y)})`);
  };

  await snapMob(10, 'mobile_01_hero');
  await snapMob(mobileInfo[1].top + 200, 'mobile_02_about');
  await snapMob(mobileInfo[2].top + 400, 'mobile_03_work');
  await snapMob(mobileInfo[3].top + 200, 'mobile_04_journey');
  await snapMob(mobileInfo[4].top + 200, 'mobile_05_skills');
  await snapMob(mobileInfo[5].top + 200, 'mobile_06_awards');
  await snapMob(mobileInfo[6].top + 300, 'mobile_07_contact');

  await browser.close();
  console.log('\nAll screenshots captured successfully.');
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
