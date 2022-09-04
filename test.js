const assert = require('assert');
const later = require('@breejs/later');
const LaterValidator = require('./later-validator');

const laterValidator = new LaterValidator(later);

describe('Validate string Input 1', function() {
  it('return valid schedule', function() {
    return assert.equal(laterValidator.validate('every 5 mins').valid, true);
  });
});

describe('Validate json Input 1', function() {
  it('return valid schedule', function() {
    return assert.equal(
        laterValidator.validate('{"schedule": "every 5 mins"}').valid,
        true,
    );
  });
});

describe('Validate null Input', function() {
  it('return valid schedule', function() {
    return assert.equal(laterValidator.validate('').valid, true);
  });
});

describe('Validate string Input 2', function() {
  it('return invalid schedule', function() {
    return assert.equal(laterValidator.validate('hoopla').valid, false);
  });
});

describe('Validate string Input 3', function() {
  it('return issue with \'hoopla\'', function() {
    return assert.equal(laterValidator.validate('hoopla').issue_with, 'hoopla');
  });
});

describe('Validate string Input 4', function() {
  it('return issue with \'{"foo", "bar"}\'', function() {
    return assert.equal(
        laterValidator.validate('{"foo", "bar"}').issue_with,
        '{"foo", "bar"}',
    );
  });
});

describe('Validate string Input 5', function() {
  it('return invalid schedule', function() {
    return assert.equal(laterValidator.validate('false').valid, false);
  });
});

describe('Validate string Input 6', function() {
  it('return invalid schedule', function() {
    return assert.equal(laterValidator.validate('123').valid, false);
  });
});

describe('Validate json Input 2', function() {
  it('return invalid schedule', function() {
    return assert.equal(
        laterValidator.validate('{"foo": "every 5 mins"}').valid,
        false,
    );
  });
});
