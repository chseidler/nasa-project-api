const { parse } = require('csv-parse');
const fs = require('fs');
const { resolve } = require('path');

const habitablePlanets = [];

function isHabitablePlanet(planet) {
  return planet.koi_disposition === 'CONFIRMED'
    && +planet.koi_insol > 0.36
    && +planet.koi_insol < 1.11
    && +planet.koi_prad < 1.6;
}

function loadPlanetsData() {
  return new Promise((res, rej) => {
    fs.createReadStream('src/data/kepler_data.csv')
      .pipe(parse({
        comment: '#',
        columns: true,
      }))
      .on('data', (data) => {
        if (isHabitablePlanet(data)) {
          habitablePlanets.push(data);
        }
      })
      .on('error', (err) => rej(err))
      .on('end', () => resolve());
  });
}

module.exports = {
  loadPlanetsData,
  planets: habitablePlanets,
};
