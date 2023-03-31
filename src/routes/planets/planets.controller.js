const { getAllPlanets } = require('../../models/planets.model');

async function httpGetAllPlanets(req, res) {
  const result = await res.status(200).json(getAllPlanets());
  return result;
}

module.exports = {
  httpGetAllPlanets,
};
