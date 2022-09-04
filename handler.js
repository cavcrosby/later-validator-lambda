const later = require('@breejs/later');
const LaterValidator = require('./later-validator');

exports.laterScheduleValidator = async (event) => {
  console.log(event);
  const laterValidator = new LaterValidator(later);
  const results = laterValidator.validate(event.body);

  return {
    'statusCode': 200,
    'headers': {
      'Content-Type': 'application/json',
    },
    'body': JSON.stringify(results),
  };
};
