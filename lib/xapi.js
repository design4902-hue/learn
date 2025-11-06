import { v4 as uuidv4 } from 'uuid';

// xAPI Verb IDs following ADL xAPI spec
export const VERBS = {
  INITIALIZED: {
    id: 'http://adlnet.gov/expapi/verbs/initialized',
    display: { 'en-US': 'initialized' }
  },
  PROGRESSED: {
    id: 'http://adlnet.gov/expapi/verbs/progressed',
    display: { 'en-US': 'progressed' }
  },
  COMPLETED: {
    id: 'http://adlnet.gov/expapi/verbs/completed',
    display: { 'en-US': 'completed' }
  },
  PASSED: {
    id: 'http://adlnet.gov/expapi/verbs/passed',
    display: { 'en-US': 'passed' }
  },
  FAILED: {
    id: 'http://adlnet.gov/expapi/verbs/failed',
    display: { 'en-US': 'failed' }
  },
  ANSWERED: {
    id: 'http://adlnet.gov/expapi/verbs/answered',
    display: { 'en-US': 'answered' }
  },
  EXPERIENCED: {
    id: 'http://adlnet.gov/expapi/verbs/experienced',
    display: { 'en-US': 'experienced' }
  },
  WATCHED: {
    id: 'http://id.tincanapi.com/verb/watched',
    display: { 'en-US': 'watched' }
  },
  INTERACTED: {
    id: 'http://adlnet.gov/expapi/verbs/interacted',
    display: { 'en-US': 'interacted' }
  }
};

export const ACTIVITY_TYPES = {
  COURSE: 'http://adlnet.gov/expapi/activities/course',
  MODULE: 'http://adlnet.gov/expapi/activities/module',
  ASSESSMENT: 'http://adlnet.gov/expapi/activities/assessment',
  QUESTION: 'http://adlnet.gov/expapi/activities/question',
  MEDIA: 'http://adlnet.gov/expapi/activities/media',
  INTERACTION: 'http://adlnet.gov/expapi/activities/interaction'
};

// Create xAPI statement
export function createStatement({
  actor,
  verb,
  object,
  result = null,
  context = null,
  timestamp = new Date().toISOString()
}) {
  const statement = {
    id: uuidv4(),
    actor: {
      objectType: 'Agent',
      mbox: `mailto:${actor.email}`,
      name: actor.name
    },
    verb,
    object,
    timestamp
  };

  if (result) {
    statement.result = result;
  }

  if (context) {
    statement.context = context;
  }

  return statement;
}

// Helper to create activity object
export function createActivity(id, name, description, type) {
  return {
    objectType: 'Activity',
    id,
    definition: {
      type,
      name: { 'en-US': name },
      description: { 'en-US': description }
    }
  };
}

// Helper to create result object
export function createResult({
  score = null,
  success = null,
  completion = null,
  duration = null,
  response = null
}) {
  const result = {};

  if (score !== null) {
    result.score = {
      scaled: score,
      raw: Math.round(score * 100),
      min: 0,
      max: 100
    };
  }

  if (success !== null) result.success = success;
  if (completion !== null) result.completion = completion;
  if (duration !== null) result.duration = duration;
  if (response !== null) result.response = response;

  return Object.keys(result).length > 0 ? result : null;
}

// Helper to create context object
export function createContext({
  registration = null,
  parentActivity = null,
  groupingActivity = null,
  extensions = null
}) {
  const context = {};

  if (registration) context.registration = registration;

  if (parentActivity || groupingActivity) {
    context.contextActivities = {};
    if (parentActivity) context.contextActivities.parent = [parentActivity];
    if (groupingActivity) context.contextActivities.grouping = [groupingActivity];
  }

  if (extensions) context.extensions = extensions;

  return Object.keys(context).length > 0 ? context : null;
}