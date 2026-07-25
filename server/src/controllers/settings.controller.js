const settingsService = require('../services/settings.service');
const catchAsync = require('../utils/catchAsync');

const getSettings = catchAsync(async (req, res) => {
  const result = await settingsService.getSettings();
  res.status(200).json({ success: true, data: result });
});

const updateSettings = catchAsync(async (req, res) => {
  const result = await settingsService.updateSettings(req.body);
  res.status(200).json({ success: true, data: result });
});

module.exports = { getSettings, updateSettings };
