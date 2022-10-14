const later = require('@breejs/later');
const LaterValidator = require('./later-validator');

exports.laterScheduleValidator = async (event) => {
  console.log(event);
  const laterValidator = new LaterValidator(later);
  const bodyJson = laterValidator.parseJson(event.body);

  const validateResults = laterValidator.validate(bodyJson);
  const isValidDateResults = laterValidator.isValid(bodyJson);
  Object.keys(isValidDateResults).forEach(
      (key) => validateResults[key] = isValidDateResults[key],
  );

  const genScheduleInstancesResults = laterValidator.genScheduleInstances();
  Object.keys(genScheduleInstancesResults).forEach(
      (key) => validateResults[key] = genScheduleInstancesResults[key],
  );

  return {
    'statusCode': 200,
    'headers': {
      'Content-Type': 'application/json',
    },
    'body': JSON.stringify(validateResults),
  };
};
