const resultsService = require('../services/results.js');

const {
  Log, CODES, utils, throwErrorForQueryParams, Error,
} = require('./validationUtils');

const getResultById = async (req, res) => {
  try {
    throwErrorForQueryParams(req.query);
    const { id } = req.params;
    if (!utils.isPositiveInteger(id)) {
      Log.warn(`Invalid Id = (${id}) was used to request results for poll by ID`);
      throw new Error(CODES.STATUS.BAD_REQUEST, 'Invalid poll ID');
    }
    const data = await resultsService.getResultById(id);
    if (utils.isEmptyArray(data)) {
      Log.warn(`Non existent data was requested with id: ${id}`);
      throw new Error(CODES.STATUS.NOT_FOUND, 'Poll does not exists');
    }
    res.status(CODES.STATUS.OK).json(data);
  } catch (err) {
    res.status(err.code).send({ error: err.msg });
  }
};

module.exports = { getResultById };
