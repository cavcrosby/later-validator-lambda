import assert from 'assert';
import later from '@breejs/later';
import {LaterValidator} from './later-validator.js';

const laterValidator = new LaterValidator(later);

describe('Parse JSON functionality', function() {
  describe('Parse non-json string Input 1', function() {
    it('return newly created JSON', function() {
      const scheduleText = 'every 5 mins';
      return assert.equal(
          laterValidator.parseJson(scheduleText)[LaterValidator.SCHEDULE_KEY],
          scheduleText,
      );
    });
  });

  describe('Parse non-json string Input 2', function() {
    it('return newly created JSON', function() {
      const scheduleText = false;
      return assert.equal(
          laterValidator.parseJson(scheduleText)[LaterValidator.SCHEDULE_KEY],
          scheduleText,
      );
    });
  });

  describe('Parse non-json string Input 3', function() {
    it('return newly created JSON', function() {
      const scheduleText = 3;
      return assert.equal(
          laterValidator.parseJson(scheduleText)[LaterValidator.SCHEDULE_KEY],
          scheduleText,
      );
    });
  });

  describe('Parse non-json string Input 5', function() {
    it('return empty JSON', function() {
      return assert.equal(
          Object.keys(laterValidator.parseJson(null)).length, 0,
      );
    });
  });

  describe('Parse json string Input 1', function() {
    it('return JSON passed in', function() {
      const jsonStr = (
        `{"${LaterValidator.SCHEDULE_KEY}": "every 5 mins", "foo": "bar"}`
      );
      const parsedJson = laterValidator.parseJson(jsonStr);
      const json = JSON.parse(jsonStr);
      return assert.equal(
          Object.keys(json).every((key) =>(
            Object.prototype.hasOwnProperty.call(json, (key)) &&
            Object.prototype.hasOwnProperty.call(parsedJson, (key)) &&
            json[key] === parsedJson[key]),
          ),
          true,
      );
    });
  });
});

describe('Schedule validation functionality', function() {
  describe('Validate json Input 1', function() {
    it('return valid schedule', function() {
      return assert.equal(
          laterValidator.validate(
              {[LaterValidator.SCHEDULE_KEY]: 'every 5 mins'},
          ).valid,
          true,
      );
    });
  });

  describe('Validate json Input 2', function() {
    it('return invalid schedule', function() {
      return assert.equal(
          laterValidator.validate(
              {[LaterValidator.SCHEDULE_KEY]: 'every 5 hooplas'},
          ).valid,
          false,
      );
    });
  });

  describe('Validate parseJson Input 1', function() {
    it('return valid schedule', function() {
      return assert.equal(
          laterValidator.validate(
              laterValidator.parseJson('every 5 mins'),
          ).valid,
          true,
      );
    });
  });

  describe('Validate parseJson Input 2', function() {
    it('return valid schedule', function() {
      return assert.equal(
          laterValidator.validate(
              laterValidator.parseJson(
                  `{"${LaterValidator.SCHEDULE_KEY}": "every 5 mins"}`,
              ),
          ).valid,
          true,
      );
    });
  });

  describe('Validate parseJson Input 3', function() {
    it('return invalid schedule', function() {
      return assert.equal(
          laterValidator.validate(
              laterValidator.parseJson('hoopla')).valid,
          false,
      );
    });
  });

  describe('Validate parseJson Input 4', function() {
    it('return issue with \'hoopla\'', function() {
      return assert.equal(
          laterValidator.validate(
              laterValidator.parseJson('hoopla')).issue_with,
          'hoopla',
      );
    });
  });

  describe('Validate parseJson Input 5', function() {
    it('return issue with \'{"foo", "bar"}\'', function() {
      return assert.equal(
          laterValidator.validate(
              laterValidator.parseJson('{"foo", "bar"}')).issue_with,
          '{"foo", "bar"}',
      );
    });
  });

  describe('Validate parseJson Input 6', function() {
    it('return invalid schedule', function() {
      return assert.equal(
          laterValidator.validate(
              laterValidator.parseJson('false')).valid,
          false,
      );
    });
  });

  describe('Validate parseJson Input 7', function() {
    it('return invalid schedule', function() {
      return assert.equal(
          laterValidator.validate(
              laterValidator.parseJson('123')).valid,
          false,
      );
    });
  });

  describe('Validate parseJson Input 8', function() {
    it('return incomplete schedule', function() {
      return assert.equal(
          laterValidator.validate(
              laterValidator.parseJson('every 5')).incomplete,
          true,
      );
    });
  });

  describe('Validate parseJson Input 9', function() {
    it('return invalid but complete schedule', function() {
      return assert.equal(
          laterValidator.validate(
              laterValidator.parseJson(
                  '{"schedule": "every 5 hooplas"}',
              ),
          ).incomplete,
          false,
      );
    });
  });

  describe('Validate parseJson Input 10', function() {
    it('return valid schedule', function() {
      return assert.equal(
          laterValidator.validate(
              laterValidator.parseJson('')).valid,
          true,
      );
    });
  });
});

describe('Schedule generation functionality', function() {
  describe('Generate schedules 1', function() {
    it(`return ${laterValidator.numScheduleInstances} schedules instances`,
        function() {
          laterValidator.validate(
              {[LaterValidator.SCHEDULE_KEY]: 'every 5 mins'},
          );
          return assert.equal(
              laterValidator.genScheduleInstances()[
                  LaterValidator.SCHEDULE_INSTANCES_KEY
              ].length,
              laterValidator.numScheduleInstances,
          );
        });
  });

  describe('Generate schedules 2', function() {
    it(`return 0 schedules instances`, function() {
      laterValidator.validate({[LaterValidator.SCHEDULE_KEY]: ''});
      return assert.equal(
          laterValidator.genScheduleInstances()[
              LaterValidator.SCHEDULE_INSTANCES_KEY
          ].length,
          0,
      );
    });
  });

  describe('Generate schedules 3', function() {
    it(`return 0 schedules instances invalid schedule`, function() {
      laterValidator.validate(
          {[LaterValidator.SCHEDULE_KEY]: 'every 5 hooplas'},
      );
      return assert.equal(
          laterValidator.genScheduleInstances()[
              LaterValidator.SCHEDULE_INSTANCES_KEY
          ].length,
          0,
      );
    });
  });
});

describe('Date validation functionality', function() {
  describe('Validate json Input 1', function() {
    it('return valid date', function() {
      laterValidator.validate({[LaterValidator.SCHEDULE_KEY]: 'every 5 mins'});
      return assert.equal(
          laterValidator.isValid(
              {[LaterValidator.DATE_KEY]: '2013-03-22T10:00:00Z'},
          ).in_schedule,
          true,
      );
    });
  });

  describe('Validate json Input 2', function() {
    it('return invalid date', function() {
      laterValidator.validate({[LaterValidator.SCHEDULE_KEY]: 'every 5 mins'});
      return assert.equal(
          laterValidator.isValid(
              {[LaterValidator.DATE_KEY]: '2013-03-22T11:17:00Z'},
          ).in_schedule,
          false,
      );
    });
  });

  describe('Validate no date parseJson Input 1', function() {
    it('return invalid date', function() {
      const parsedJson = laterValidator.parseJson(
          `{"${LaterValidator.SCHEDULE_KEY}": "every 5 mins"}`,
      );
      laterValidator.validate(parsedJson);
      return assert.equal(
          Object.keys(laterValidator.isValid(parsedJson)).length, 0,
      );
    });
  });

  describe('Validate improper (NaN) parseJson Input 1', function() {
    it('return invalid date', function() {
      const parsedJson = laterValidator.parseJson(
          `{"${LaterValidator.SCHEDULE_KEY}": "every 5 mins", ` +
          `"${LaterValidator.DATE_KEY}": "I AM A DATE, FEAR ME"}`,
      );
      laterValidator.validate(parsedJson);
      return assert.equal(
          laterValidator.isValid(parsedJson).in_schedule, false,
      );
    });
  });

  describe('Validate no schedule validation parseJson Input 1', function() {
    it('return invalid date', function() {
      const localLaterValidator = new LaterValidator(later);
      const parsedJson = localLaterValidator.parseJson(
          `{"${LaterValidator.SCHEDULE_KEY}": "every 5 mins", ` +
          `"${LaterValidator.DATE_KEY}": "2013-03-22T10:00:00Z"}`,
      );
      return assert.equal(
          localLaterValidator.isValid(parsedJson).in_schedule,
          false,
      );
    });
  });

  describe(
      'Validate invalid schedule validation parseJson Input 1',
      function() {
        it('return invalid date', function() {
          const parsedJson = laterValidator.parseJson(
              `{"${LaterValidator.SCHEDULE_KEY}": "hoopla", ` +
          `"${LaterValidator.DATE_KEY}": "2013-03-22T10:00:00Z"}`,
          );
          laterValidator.validate(parsedJson);
          return assert.equal(
              laterValidator.isValid(parsedJson).in_schedule, false,
          );
        });
      });
});
