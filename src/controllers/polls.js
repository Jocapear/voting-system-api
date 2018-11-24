const { param, validationResult } = require('express-validator/check');
const pollService = require('../services/polls.js');
const userService = require('../services/users.js');

const {
  Log, CODES, utils, throwErrorForQueryParams, Error, checkValidationResult,
} = require('./validationUtils');

const validate = (method) => {
  switch (method) {
    default: return [];
  }
};

const getPolls = async (req, res) => {
  try {
    throwErrorForQueryParams(req.query);
    // checkValidationResult(validationResult(req));
    const data = await pollService.getPolls();
    res.status(CODES.STATUS.OK).json(data);
  } catch (err) {
    res.status(err.code).send({ error: err.msg });
  }
};

const getPollById = async (req, res) => {
  try {
    throwErrorForQueryParams(req.query);
    const { id } = req.params;
    if (!utils.isPositiveInteger(id)) {
      Log.warn(`Invalid Id = (${id}) was used to request a poll by ID`);
      throw new Error(CODES.STATUS.BAD_REQUEST, 'Invalid poll ID');
    }
    const data = await pollService.getPollById(id);
    if (utils.isEmptyArray(data)) {
      Log.warn(`Non existent data was requested with id: ${id}`);
      throw new Error(CODES.STATUS.NOT_FOUND, 'Poll does not exists');
    }
    res.status(CODES.STATUS.OK).json(data);
  } catch (err) {
    res.status(err.code).send({ error: err.msg });
  }
};

const postPoll = async (req, res) => {
  try {
    throwErrorForQueryParams(req.query);
    const {
      title, details, creation_date, close_date, acceptance_percentage, anonymity, questions, users,
    } = req.body;

    const usersIds = [];
    for (const i in users) {
      const email = users[i];
      const id = await userService.getUserIdByEmail(email);
      if (id === null) {
        Log.warn('One or more users does not exist');
        throw new Error(CODES.STATUS.BAD_REQUEST, 'Cannot create anoymous poll, one or more users does not exist.');
      }
      usersIds.push(id);
    }

    if (anonymity) {
      const poll_id = await pollService.postPoll(title, details, creation_date, close_date, acceptance_percentage, anonymity);
      Log.info(`New anonymous poll created with ID: ${poll_id}`);
      createClosed_question(poll_id, anonymity, questions);
      addUsersToPoll(usersIds, poll_id, anonymity);
      res.status(CODES.STATUS.CREATED).send(`Anonymous poll created with ID: ${poll_id}`);
    } else {
      Log.warn('Non-anoymous poll creation still not supported');
      throw new Error(CODES.STATUS.BAD_REQUEST, 'Cannot create non-anoymous polls');
    }
  } catch (err) {
    res.status(err.code).send({ error: err.msg });
  }
};

const createClosed_question = async (poll_id, anonymity, questions) => {
  try {
    let questionsLenght = 0;
    for (const x in questions) {
      questionsLenght++;
    }
    // Log.info(`Creating ${questionsLenght} questions`);
    let priority;
    for (priority = 1; priority <= questionsLenght; priority++) {
      // Log.info(`Creating question ${priority}`);
      const question = questions[priority - 1];
      await pollService.createClosed_question(poll_id, anonymity, priority, question.question);
      // Log.info(`New closed question created for poll with ID: ${poll_id}`);
      createClosed_options(poll_id, anonymity, priority, question.options);
      // res.status(CODES.STATUS.CREATED).send(`Question ${priority} created for poll with ID ${poll_id}`);
    }
  } catch (err) {
    res.status(err.code).send({ error: err.msg });
  }
};

const createClosed_options = async (poll_id, anonymity, priority, options) => {
  let optionsLenght = 0;
  for (const y in options) {
    optionsLenght++;
  }
  // Log.info(`Creating ${optionsLenght} options`);
  let option_priority;
  for (option_priority = 1; option_priority <= optionsLenght; option_priority++) {
    await pollService.createClosed_option(poll_id, anonymity, priority, option_priority, options[option_priority - 1].option_text);
    // Log.info(`New closed option created for poll with ID: ${poll_id}`);
    // res.status(CODES.STATUS.CREATED).send(`Option created for poll with ID ${poll_id} and question ${priority}`);
  }
};

const addUsersToPoll = async (usersIds, poll_id, anonymity) => {
  for (const i in usersIds) {
    await pollService.addUsersToPoll(usersIds[i], poll_id, anonymity);
  }
};

module.exports = { validate, getPolls, getPollById, postPoll };
