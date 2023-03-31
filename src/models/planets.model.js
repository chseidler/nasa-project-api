const fs = require('fs');
const { parse } = require('csv-parse');
const { resolve } = require('path');

const planets = require('./planets.mongo');

function isHabitablePlanet(planet) {
  return planet.koi_disposition === 'CONFIRMED'
    && +planet.koi_insol > 0.36
    && +planet.koi_insol < 1.11
    && +planet.koi_prad < 1.6;
}

async function savePlanet(planet) {
  try {
    await planets.updateOne({
      keplerName: planet.kepler_name,
    }, {
      keplerName: planet.kepler_name,
    }, {
      upsert: true,
    });
  } catch (err) {
    console.error(err);
  }
}

function loadPlanetsData() {
  return new Promise((res, rej) => {
    fs.createReadStream('src/data/kepler_data.csv')
      .pipe(parse({
        comment: '#',
        columns: true,
      }))
      .on('data', async (data) => {
        if (isHabitablePlanet(data)) {
          await savePlanet(data);
        }
      })
      .on('error', (err) => rej(err))
      .on('end', () => resolve());
  });
}

async function getAllPlanets() {
  const result = await planets.find({});
  return result;
}

module.exports = {
  loadPlanetsData,
  getAllPlanets,
};
