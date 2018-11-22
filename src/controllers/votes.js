const votesService = require('../services/votes.js');

const Log = require('../utils/logger');
const Error = require('../errors/statusError');
const utils = require('../utils/utils.js');
const CODES = require('../constants/httpCodes');

function throwErrorForQueryParams(queryParams) {
    if (!utils.isEmptyObject(queryParams)) {
        throw new Error(CODES.STATUS.BAD_REQUEST, 'Query params are not supported yet');
    }
}

const getVoteByCode = async (req, res) => {
    try {
      throwErrorForQueryParams(req.query);
      const { code } = req.params;
      const data = await votesService.getVoteByCode(code);
      if (utils.isEmptyArray(data)) {
        Log.warn(`Non existent ballot was requested with code: ${code}`);
        throw new Error(CODES.STATUS.NOT_FOUND, 'Ballot does not exists');
      }
      res.status(CODES.STATUS.OK).json(data);
    } catch (err) {
      res.status(err.code).send({ error: err.msg });
    }
};

module.exports = {getVoteByCode}