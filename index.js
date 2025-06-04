const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors({
  origin: 'https://stage-forum.bell.ca',
  methods: ['GET']
}));
const port = process.env.PORT || 3000;

// Virgin page to scrape
const targetUrl = "https://www.virginplus.ca/fr/phones/phones-summary.html";
const browserlessUrl = "https://production-sfo.browserless.io/content";
const token = "2SIb60dwXdzNQlG048bfbbda2d58baa30d618d5bbde0b3e59"; // 🔑 Use your Browserless API token

// Root route
app.get('/', (req, res) => {
  res.send('Virgin Product Scraper is running!');
});

// Scraper API route
app.get('/list', async (req, res) => {
  try {
    const { data: html } = await axios.post(
      browserlessUrl,
      { url: targetUrl },
      {
        headers: { "Cache-Control": "no-cache" },
        params: { token }
      }
    );

    const $ = cheerio.load(html);
    const products = [];

    $(".item.phone").each((_, el) => {
      const name = $(el).find(".phoneTitle").text().trim();

      let link = $(el).find("a[href*='phone-details.html']").attr("href");
      if (link && link.startsWith("phone-details.html")) {
        link = `https://www.virginplus.ca/fr/phones/${link}`;
      }

      const rawImg =
        $(el).find("img.phonepic").attr("src") ||
        $(el).find("img.phonepic").attr("data-ng-src") ||
        $(el).find("img.phonepic").attr("data-src");

      const img = rawImg?.startsWith("/") ? `https://www.virginplus.ca${rawImg}` : rawImg;

      const desc = $(el).find(".priceSubInfo").text().trim().replace(/\s+/g, ' ');

      if (name && link && img) {
        products.push({
          category: targetUrl,
          name,
          link,
          img,
          desc
        });
      }
    });

    res.set('Access-Control-Allow-Origin', 'https://stage-forum.bell.ca');
    res.json({ products });

  } catch (error) {
    console.error("Scraping failed:", error.message);
    res.status(500).json({ error: "Failed to scrape Virgin products" });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
