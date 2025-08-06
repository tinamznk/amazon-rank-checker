import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Danh sách từ khóa & ASIN cần check
const KEYWORDS = [
  { keyword: "car bumper stickers and decals", asin: "B0C99SLC1J" },
  { keyword: "raccoon sticker", asin: "B0C99SLC1J" },
  { keyword: "bumper sticker car", asin: "B0C99SLC1J" },
  { keyword: "best bumper stickers", asin: "B0C99SLC1J" },
  { keyword: "car stickers funny", asin: "B0C99SLC1J" },
  { keyword: "bigfoot vinyl decal", asin: "B0C99SLC1J" }
];
async function checkKeywordRank(browser, keyword, asin) {
  const page = await browser.newPage();

  // 🛡 Giả lập trình duyệt thật
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    'accept-language': 'en-US,en;q=0.9'
  });

  // 🍪 Load cookies nếu có
  const cookiesPath = './cookies.json';
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'));
    await page.setCookie(...cookies);
    console.log("🍪 Cookies loaded.");
  }

  let found = null;

  for (let pageNum = 1; pageNum <= 3; pageNum++) {
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}&page=${pageNum}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Delay nhẹ để tránh bị chặn
      await new Promise(resolve => setTimeout(resolve, 2000));

      const products = await page.$$eval('div[data-component-type="s-search-result"]', nodes =>
        nodes.map(node => {
          const asin = node.getAttribute("data-asin");
          const hasPrice = node.querySelector(".a-price") !== null;
          const isVideo = node.innerHTML.includes("video-block") || node.innerText.toLowerCase().includes("video");
          return { asin, hasPrice, isVideo };
        }).filter(p => p.asin && p.hasPrice && !p.isVideo)
      );

      for (let i = 0; i < products.length; i++) {
        if (products[i].asin === asin) {
          found = `Page ${pageNum}, No ${i + 1}`;
          break;
        }
      }

    } catch (err) {
      console.error(`❌ Error loading ${url}: ${err.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 3000)); // delay giữa các lần gọi

    if (found) break;
  }

  await page.close();
  return { keyword, asin, rank: found || "Not in Top 150" };
}

async function main() {
  console.log("✅ Starting Amazon Rank Checker Script...");

  const browser = await puppeteer.launch({
    headless: "new", // dùng renderer mới để tránh lỗi detached frame
    executablePath: '/usr/bin/chromium',
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1920,1080",
      "--no-zygote",
      "--single-process"
    ]
  });

  for (const { keyword, asin } of KEYWORDS) {
    const result = await checkKeywordRank(browser, keyword, asin);
    console.log(`🔍 ${result.keyword} → ${result.rank}`);
  }

  await browser.close();
}

main();