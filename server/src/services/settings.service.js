const settingsRepository = require('../repositories/settings.repository');

const settingsService = {
  async getSettings() {
    return settingsRepository.getSettings();
  },

  async updateSettings(data) {
    return settingsRepository.updateSettings(data);
  },
};

module.exports = settingsService;
