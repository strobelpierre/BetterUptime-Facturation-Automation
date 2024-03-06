/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
// Importations nécessaires
const logger = require('pino')();
const _ = require('lodash');
const betterUptimeService = require('./betterUptimeService');
const config = {
  betterUptimeWeekStartHour: process.env.BETTERUTPIME_WEEK_START_HOUR,
  betterUptimeWeekEndHours: process.env.BETTERUTPIME_WEEK_END_HOUR,
  betterUptimeWeekEndStartHour: process.env.BETTERUTPIME_WEEKEND_START_HOUR,
  betterUptimeWeekEndHours: process.env.BETTERUTPIME_WEEKEND_END_HOUR,
};
// Fonctions utilitaires pour la gestion des dates
function getLastDayOfTheMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isWeekend(date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function isWeekday(date) {
  return date.getDay() > 0 && date.getDay() < 6;
}

function isInTimeRange(date, startHour, endHour) {
  const hour = date.getHours() + date.getMinutes() / 60;
  return hour >= startHour && hour <= endHour;
}
function calculateDurationInMinutes(started_at, resolved_at) {
  // Assurez-vous que les dates sont valides avant de continuer
  if (!started_at || !resolved_at) return null;

  // Convertit les chaînes de date en objets Date
  const start = new Date(started_at);
  const end = new Date(resolved_at);

  // Vérifiez que les objets Date sont valides
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    logger.error('L\'une des dates est invalide.');
    return null;
  }

  // Calcule la différence en millisecondes
  const difference = end.getTime() - start.getTime();

  // Convertit la différence en minutes et arrondit au nombre entier le plus proche
  return Math.round(difference / 60000); // 1 minute = 60000 millisecondes
}

// Fonctions pour la récupération et le traitement des calendriers utilisateurs
function fetchUserCalendars(startDate, endDate) {
  const promises = [];
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateCopy = new Date(date);
    const promise = betterUptimeService.getCalendar(dateCopy)
        .then((calendar) => betterUptimeService.getUser(calendar))
        .then((user) => ({...user, date: new Date(dateCopy)}));
    promises.push(promise);
  }
  return Promise.all(promises);
}

function countWeekdaysAndWeekends(users) {
  return users.reduce((acc, {last_name, date}) => {
    const key = last_name;
    if (!acc[key]) {
      acc[key] = {last_name, weekdays: 0, weekends: 0};
    }
    if (isWeekend(date)) {
      acc[key].weekends += 1;
    } else {
      acc[key].weekdays += 1;
    }
    return acc;
  }, {});
}

// Fonction principale pour obtenir la répartition des jours
function getRepartitionDayBetterUptime(startDate) {
  const lastDay = getLastDayOfTheMonth(startDate);
  return fetchUserCalendars(startDate, lastDay)
      .then((userCalendars) => {
        return countWeekdaysAndWeekends(userCalendars);
      });
}

// Fonctions pour la gestion des incidents
function filterAndLogIncidents(incidents) {
  const weekdayIncidents = [];
  const weekendIncidents = [];

  incidents.forEach((incident) => {
    const {acknowledged_at, started_at, resolved_at, acknowledged_by} = incident.attributes;
    const startDate = new Date(started_at);
    if (!acknowledged_at && !acknowledged_by) {
      logger.info(`Incident ${incident.id} non sélectionné car non reconnu.`);
      return;
    }

    if (isWeekday(startDate) && isInTimeRange(startDate, config.betterUptimeWeekStartHour, config.betterUptimeWeekEndHours)) {
      logger.info(`Incident ${incident.id} sélectionné car en semaine (${config.betterUptimeWeekStartHour} à ${config.betterUptimeWeekEndHours}).`);
      weekdayIncidents.push({
        'id': incident.id,
        'started_at': started_at,
        'resolved_at': resolved_at,
        'duration': calculateDurationInMinutes(started_at, resolved_at),
        'acknowledged_at': acknowledged_at,
        'acknowledged_by': acknowledged_by,
      });
    } else if (isWeekend(startDate) && isInTimeRange(startDate, 10, 22)) {
      logger.info(`Incident ${incident.id} sélectionné car le week-end ( ${config.betterUptimeWeekEndStartHour} à ${config.betterUptimeWeekEndEndHour}).`);
      weekendIncidents.push({
        'id': incident.id,
        'started_at': started_at,
        'resolved_at': resolved_at,
        'duration': calculateDurationInMinutes(started_at, resolved_at),
        'acknowledged_at': acknowledged_at,
        'acknowledged_by': acknowledged_by,
      });
    } else {
      logger.info(`Incident ${incident.id} not selected because not in the hour .`);
    }
  });

  return {weekdayIncidents, weekendIncidents};
}

function haveAStartDate() {
  logger.error(process.argv);
  if (process.argv[2] && process.argv[2] === '--startDate') {
    return true;
  }
  logger.error('--startDate is Missing');
  return false;
}

function haveAEndDate() {
  if (process.argv[4] && process.argv[4] === '--endDate') {
    return true;
  }
  logger.error('--endDate is Missing');
  return false;
}
function haveCorrectFormatDate(date) {
  return typeof date === 'object';
}

function checkParameters(startDate, endDate) {
  if (haveAStartDate() && haveAEndDate()) {
    if (haveCorrectFormatDate(startDate) && haveCorrectFormatDate(endDate)) {
      return true;
    }
  }
  return false;
}

// Fonction principale
function main() {
  const startDate = new Date(process.argv[3]);
  const endDate = new Date(process.argv[5]);

  if (!checkParameters(startDate, endDate)) {
    logger.error('Wrong paramaters or date format');
    process.exit();
  }

  getRepartitionDayBetterUptime(startDate)
      .then((userRepartition) => {
        logger.info(userRepartition);
        return betterUptimeService.getIncidents(startDate, endDate);
      })
      .then((response) => {
        if (!response) {
          throw new Error('La réponse de getIncidents est mal formée ou vide.');
        }
        const {weekdayIncidents, weekendIncidents} = filterAndLogIncidents(response); // Assurez-vous que `filterAndLogIncidents` attend un tableau d'incidents directement
        const grouppedWeekDayIncidents = _.groupBy(weekdayIncidents, 'acknowledged_by');
        const grouppedWeekEndDayIncidents = _.groupBy(weekendIncidents, 'acknowledged_by');
        logger.info(grouppedWeekDayIncidents);
        logger.info(grouppedWeekEndDayIncidents);
      })
      .catch((error) => {
        logger.error(error);
        logger.error('An error occurred:', error.message);
      });
}
main();
