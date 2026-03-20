
const shortid = require("shortid");
const URL = require("../models/url");

// URL validation function
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

async function handleGenerateNewShortURL(req, res) {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  if (!isValidURL(url)) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    const shortID = shortid.generate();

    await URL.create({
      shortId: shortID,
      redirectURL: url,
      visitHistory: [],
    });

    return res.redirect(`/?id=${shortID}`);
  } catch (error) {
    console.error("Error generating short URL:", error);
    return res.status(500).json({ error: "Failed to generate short URL" });
  }
}

async function handleGetAnalytics(req, res) {
  try {
    const shortId = req.params.shortId;
    
    if (!shortId) {
      return res.status(400).json({ error: "Short ID is required" });
    }

    const result = await URL.findOne({ shortId });

    if (!result) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    return res.json({
      shortId: result.shortId,
      redirectURL: result.redirectURL,
      totalClicks: result.visitHistory.length,
      analytics: result.visitHistory,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
}

module.exports = {
  handleGenerateNewShortURL,
  handleGetAnalytics,
};
