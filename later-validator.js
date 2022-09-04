/**
* Represents a later schedule expression validator.
*/
class LaterValidator {
  static SCHEDULE_KEY = 'schedule';
  static NO_SCHEDULE_ERROR = -1;

  /**
  * Creates a new later validator.
  * @class LaterValidator
  * @param {object} later - Later library to use.
  */
  constructor(later) {
    this.later = later;
  }

  /**
  * @function validate
  * @memberof LaterValidator.prototype
  * @param {string} rawSchedule - Later schedule to validate, can either be a
  *     JSON string or a plain text string.
  * @return {object} An object reporting if schedule is valid and if the
  *     schedule is not valid, the string slice where Later had issues parsing.
  * @example
  * // returns { "valid":true }
  * validate('every 5 mins');
  * @example
  * // returns { "valid":true }
  * validate('{"schedule": "every 5 mins"}');
  * @example
  * // returns { "valid":false, "issue_with":"hooplas" }
  * validate('{"schedule": "every 5 hooplas"}');
  */
  validate(rawSchedule) {
    let data = null;
    // needed so nested functions can access 'this' symbol
    const _this = this;
    try {
      data = JSON.parse(rawSchedule);
      if (data !== null && typeof data !== 'object') {
        throw new Error('data is not JSON');
      }
    } catch (err) {
      data = {
        [this.constructor.SCHEDULE_KEY]: rawSchedule,
      };
    }

    const scheduleText = function() {
      if (data === null) {
        // no schedule is a valid schedule
        return '';
      } else if (
        typeof data === 'object' &&
        !Object.prototype.hasOwnProperty.call(
            data, _this.constructor.SCHEDULE_KEY,
        )
      ) {
        return JSON.stringify(data);
      } else {
        return String(data[_this.constructor.SCHEDULE_KEY]);
      }
    }();

    const schedule = this.later.parse.text(scheduleText);
    if (schedule.error === this.constructor.NO_SCHEDULE_ERROR) {
      return {
        valid: true,
      };
    } else {
      return {
        valid: false,
        issue_with: scheduleText.slice(schedule.error),
      };
    }
  }
}

module.exports = LaterValidator;
