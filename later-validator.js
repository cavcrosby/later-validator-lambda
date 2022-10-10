/**
* Represents a later schedule expression validator.
*/
class LaterValidator {
  static DATE_KEY = 'date';
  static SCHEDULE_KEY = 'schedule';
  static NO_SCHEDULE_ERROR = -1;

  /**
  * Creates a new later validator.
  * @class LaterValidator
  * @param {object} later - Later library to use.
  */
  constructor(later) {
    this.later = later;
    this.scheduleText = null;
    this.validSchedule = false;
  }

  /**
  * @function parseJson
  * @memberof LaterValidator.prototype
  * @param {string} rawJson - A JSON string in its untouched form.
  * @return {object} An object parsed according to its implementation.
  */
  parseJson(rawJson) {
    let data = null;
    try {
      data = JSON.parse(rawJson);
      if (data !== null && typeof data !== 'object') {
        throw new Error('data is not JSON');
      } else if (data === null) {
        data = {};
      }
    } catch (err) {
      // Assume a sequence of plain text words (regardless of type) is just a
      // schedule.
      return {
        [this.constructor.SCHEDULE_KEY]: rawJson,
      };
    }

    return data;
  }

  /**
  * @function validate
  * @memberof LaterValidator.prototype
  * @param {object} parsedJson - Parsed json (see {@link parseJson}) assumed to
  *     possibly contain a Later schedule to validate.
  * @return {object} An object reporting if schedule is valid and if the
  *     schedule is not valid, the string slice where Later had issues parsing
  *     and if the schedule is incomplete.
  * @example
  * // returns { valid:true }
  * validate({'schedule': 'every 5 mins'});
  * @example
  * // returns { valid:false, incomplete:false, issue_with:'hooplas' }
  * validate({'schedule': 'every 5 hooplas'});
  */
  validate(parsedJson) {
    // needed so nested functions can access 'this' symbol
    const _this = this;

    this.scheduleText = function() {
      if (Object.keys(parsedJson).length === 0) {
        // no schedule (or an empty JSON) is a valid schedule
        return '';
      } else if (
        typeof parsedJson === 'object' &&
        !Object.prototype.hasOwnProperty.call(
            parsedJson, _this.constructor.SCHEDULE_KEY,
        )
      ) {
        return JSON.stringify(parsedJson);
      } else {
        return String(parsedJson[_this.constructor.SCHEDULE_KEY]);
      }
    }();

    const schedule = this.later.parse.text(this.scheduleText);
    if (schedule.error === this.constructor.NO_SCHEDULE_ERROR) {
      this.validSchedule = true;
      return {
        valid: this.validSchedule,
      };
    } else if (schedule.error === this.scheduleText.length) {
      this.validSchedule = false;
      return {
        valid: this.validSchedule,
        incomplete: true,
        issue_with: this.scheduleText.slice(schedule.error),
      };
    } else {
      this.validSchedule = false;
      return {
        valid: this.validSchedule,
        incomplete: false,
        issue_with: this.scheduleText.slice(schedule.error),
      };
    }
  }

  /**
  * @function isValid
  * @memberof LaterValidator.prototype
  * @param {object} parsedJson - Parsed json (see {@link parseJson}) assumed to
  *     possibly contain a date string in the ISO 8601 calendar date format.
  * @return {object} An object reporting if the date is an occurrence of the
  *     schedule, or an empty object if the parsedJson does not contain a date.
  * @see {@link validate}, as a schedule must first be validated to determine
  *     if a date is an occurrence of the schedule otherwise this will always
  *     be false.
  * @example
  * // returns { in_schedule:true }
  * validate({'schedule': 'every 5 mins'});
  * isValid({'date': '2013-03-22T10:00:00Z'});
  * @example
  * // returns { in_schedule:false }
  * validate({'schedule': 'every 5 mins'});
  * isValid({'date': '2013-03-22T11:17:00Z'});
  */
  isValid(parsedJson) {
    if (
      !Object.prototype.hasOwnProperty.call(parsedJson, LaterValidator.DATE_KEY)
    ) {
      return {};
    } else if (
      this.scheduleText === null ||
      !this.validSchedule ||
      isNaN(Date.parse(parsedJson[LaterValidator.DATE_KEY]))
    ) {
      return {
        in_schedule: false,
      };
    }

    return {
      in_schedule: this.later.schedule(
          this.later.parse.text(this.scheduleText),
      ).isValid(new Date(parsedJson[LaterValidator.DATE_KEY])),
    };
  }
}

module.exports = LaterValidator;
