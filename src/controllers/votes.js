const { body, param, validationResult } = require('express-validator/check');
const votesService = require('../services/votes.js');
const {
  Log, CODES, utils, throwErrorForQueryParams, Error, checkValidationResult, alreadyVoted,
} = require('./validationUtils');

const validate = (method) => {
  switch (method) {
    case 'getVoteByCode': {
      return [
        param('code').exists().withMessage('Code required')
          .isAlphanumeric()
          .withMessage('Invalid Code'),
      ];
    }
    case 'postVote': {
      return [
        body('id')
          .exists().withMessage('Id required')
          .isInt()
          .withMessage('Invalid Id'),
        body('anonymity')
          .exists().withMessage('Anonimity atribute is required')
          .isBoolean()
          .withMessage('Invalid type'),
        body('questions')
          .exists().withMessage('Questions are required'),
      ];
    }
    default: return [];
  }
};

const getAnonymousVoteByCode = async (req, res) => {
  try {
    throwErrorForQueryParams(req.query);
    checkValidationResult(validationResult(req));
    const { code } = req.params;
    const data = await votesService.getAnonymousVoteByCode(code);
    if (utils.isEmptyArray(data)) {
      Log.warn(`Non existent ballot was requested with code: ${code}`);
      throw new Error(CODES.STATUS.NOT_FOUND, 'Ballot does not exists');
    }
    res.status(CODES.STATUS.OK).json(data);
  } catch (err) {
    res.status(err.code).send({ error: err.msg });
  }
};

const postAnonymousVote = async (req, res) => {
  try {
    throwErrorForQueryParams(req.query);
    checkValidationResult(validationResult(req));
    const { id, anonymity, questions } = req.body;
    await alreadyVoted(req.user.email, id);
    const data = await votesService.postAnonymousVote(id, anonymity, questions);
    // Set status as 'voted'
    res.status(CODES.STATUS.OK).json(data);
  } catch (err) {
    res.status(err.code).send({ error: err.msg });
  }
};

module.exports = { validate, getAnonymousVoteByCode, postAnonymousVote };
