const express = require('express');
const router = express.Router();

// Example routes - add your API endpoints here
router.get('/health', (req, res) => {
  res.json({ status: 'API is healthy' });
});

router.post('/generate-prd', (req, res) => {
  // Placeholder for PRD generation endpoint
  res.json({ message: 'PRD generation endpoint' });
});

router.post('/generate-problem', (req, res) => {
  // Placeholder for problem generation endpoint
  res.json({ message: 'Problem generation endpoint' });
});

router.post('/generate-roast', (req, res) => {
  // Placeholder for roast generation endpoint
  res.json({ message: 'Roast generation endpoint' });
});

router.post('/generate-usps', (req, res) => {
  // Placeholder for USPs generation endpoint
  res.json({ message: 'USPs generation endpoint' });
});

module.exports = router;
