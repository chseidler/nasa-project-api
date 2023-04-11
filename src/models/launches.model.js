const axios = require('axios');

const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;

const newLaunch = {
  flightNumber: 100,
  mission: 'Kepler Exploration X',
  rocket: 'Explorer IS1',
  launchDate: new Date('December 27, 2030'),
  target: 'Kepler-442 b',
  customers: ['ZTM', 'NASA'],
  upcoming: true,
  success: true,
};

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function findLaunch(filter) {
  const retorno = await launchesDatabase.findOne(filter);
  return retorno;
}

async function saveLaunch(launch) {
  await launchesDatabase.findOneAndUpdate({
    flightNumber: launch.flightNumber,
  }, launch, {
    upsert: true,
  });
}

async function populateLaunches() {
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: 'rocket',
          select: {
            name: 1,
          },
        },
        {
          path: 'payloads',
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    throw new Error('Launch data download error');
  }

  const launchDocs = response.data.docs;
  launchDocs.forEach(async (launchDoc) => {
    const { payloads } = launchDoc;
    const customers = payloads.flatMap((payload) => payload.customers);

    const launch = {
      flightNumber: launchDoc.flight_number,
      mission: launchDoc.name,
      rocket: launchDoc.rocket.name,
      launchDate: launchDoc.date_local,
      upcoming: launchDoc.upcoming,
      success: launchDoc.success,
      customers,
    };

    await saveLaunch(launch);
  });
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat',
  });

  if (!firstLaunch) {
    await populateLaunches();
  }
}

async function existsLaunchWithId(launchId) {
  const retorno = await findLaunch({
    flightNumber: launchId,
  });

  return retorno;
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber');

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }

  return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  const retorno = await launchesDatabase
    .find({}, { _id: 0, __v: 0 })
    .skip(skip)
    .limit(limit);
  return retorno;
}

saveLaunch(newLaunch);

async function scheduleNewLaunch(launchData) {
  const planet = await planets.findOne({
    keplerName: launchData.target,
  });

  if (!planet) {
    throw new Error('No matching planet found');
  }

  const newFlightNumber = await getLatestFlightNumber() + 1;

  const newLaunchSet = Object.assign(launchData, {
    success: true,
    upcoming: true,
    customers: ['Zero to Mastery', 'NASA'],
    flightNumber: newFlightNumber,
  });

  await saveLaunch(newLaunchSet);
}

async function abortLaunchById(launchId) {
  const retorno = await launchesDatabase.updateOne({
    flightNumber: launchId,
  }, {
    upcoming: false,
    success: false,
  });

  return retorno.modifiedCount === 1;
}

module.exports = {
  existsLaunchWithId,
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunchById,
  loadLaunchData,
};
