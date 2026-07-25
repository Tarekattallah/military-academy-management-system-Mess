const Settings = require('../models/settings.model');

const settingsRepository = {
  async getSettings() {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    return settings;
  },

  async updateSettings(data) {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(data);
    } else {
      settings.appName = data.appName !== undefined ? data.appName : settings.appName;
      settings.unitCode = data.unitCode !== undefined ? data.unitCode : settings.unitCode;
      settings.language = data.language !== undefined ? data.language : settings.language;
      await settings.save();
    }
    return settings;
  },
};

module.exports = settingsRepository;
