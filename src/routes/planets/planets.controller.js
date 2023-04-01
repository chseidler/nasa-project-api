const { getAllPlanets } = require('../../models/planets.model');

async function httpGetAllPlanets(req, res) {
  const retorno = await getAllPlanets();
  return res.status(200).json(retorno);
}

module.exports = {
  httpGetAllPlanets,
};
