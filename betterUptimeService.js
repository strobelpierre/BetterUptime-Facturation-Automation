/* eslint-disable max-len */
const axios = require('axios');
const logger = require('pino')();
const config = {
  api_key: process.env.BETTERUPTIME_API_KEY,
  api_endpoint: process.env.BETTERUPTIME_API_ENDPOINT,
  calendar_id: process.env.BETTERUTIME_CALENDAR_ID,
};

/**
 * Format a date
 * @param {Date} date
 * @return {string}  `${year}-${month}-${day}`;
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = {
  getCalendars() {
    return axios.get(`${config.api_endpoint}on-calls`, {
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
      },
    }).catch((error) => {
      logger.error('getCalendars error', error);
      throw error;
    });
  },
  getCalendar(date) {
    const formattedDate = date ? `?date=${date.toISOString()}` : '';
    return axios.get(`${config.api_endpoint}on-calls/${config.calendar_id}${formattedDate}`, {
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
      },
    }).catch((error) => {
      logger.error('getCalendar error', error);
      throw error;
    });
  },
  getUser(result) {
    return {
      id: result.data.included[0].id,
      ...result.data.included[0].attributes,
    };
  },
  getIncidents(from, to) {
    const getAllIncidents = (url, incidents = []) => {
      return axios.get(url, {
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
        },
      })
          .then((response) => {
            const fetchedIncidents = incidents.concat(response.data.data);
            const nextPageUrl = response.data.pagination && response.data.pagination.next;
            if (nextPageUrl) {
              return getAllIncidents(nextPageUrl, fetchedIncidents); // Recursive call for the next page
            }
            return fetchedIncidents;
          })
          .catch((error) => {
            logger.error('getIncidents error', error);
            throw error;
          });
    };

    const formattedDate = `?from=${formatDate(from)}&to=${formatDate(to)}`;
    const initialUrl = `${config.api_endpoint}incidents${formattedDate}`;
    return getAllIncidents(initialUrl);
  },

};
