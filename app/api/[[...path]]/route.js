import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { hashPassword, verifyPassword, generateToken, getUserFromRequest } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { sampleCourses, sampleModules } from '@/lib/sampleData';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function createResponse(data, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

// ==================== AUTH ROUTES ====================

async function handleRegister(request) {
  try {
    const { name, email, password, organization } = await request.json();
    
    if (!name || !email || !password) {
      return createResponse({ error: 'Missing required fields' }, 400);
    }

    const db = await getDb();
    const users = db.collection('users');
    
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return createResponse({ error: 'User already exists' }, 400);
    }

    const userId = uuidv4();
    const newUser = {
      userId,
      name,
      email,
      organization: organization || '',
      password: hashPassword(password),
      role: 'learner',
      createdAt: new Date().toISOString(),
      enrolledCourses: []
    };

    await users.insertOne(newUser);
    const token = generateToken(userId, email);

    return createResponse({
      success: true,
      user: { userId, name, email, organization: newUser.organization, role: newUser.role },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    return createResponse({ error: 'Registration failed' }, 500);
  }
}

async function handleLogin(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return createResponse({ error: 'Email and password required' }, 400);
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ email });
    
    if (!user || !verifyPassword(password, user.password)) {
      return createResponse({ error: 'Invalid credentials' }, 401);
    }

    const token = generateToken(user.userId, user.email);
    return createResponse({
      success: true,
      user: { userId: user.userId, name: user.name, email: user.email, organization: user.organization, role: user.role },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return createResponse({ error: 'Login failed' }, 500);
  }
}

async function handleGetCurrentUser(request) {
  try {
    const userToken = getUserFromRequest(request);
    if (!userToken) return createResponse({ error: 'Unauthorized' }, 401);

    const db = await getDb();
    const user = await db.collection('users').findOne({ userId: userToken.userId });
    
    if (!user) return createResponse({ error: 'User not found' }, 404);

    return createResponse({
      userId: user.userId,
      name: user.name,
      email: user.email,
      organization: user.organization,
      role: user.role,
      enrolledCourses: user.enrolledCourses || []
    });
  } catch (error) {
    console.error('Get user error:', error);
    return createResponse({ error: 'Failed to get user' }, 500);
  }
}

// ==================== COURSE ROUTES ====================

async function handleGetCourses(request) {
  try {
    const db = await getDb();
    const courses = db.collection('courses');
    
    const count = await courses.countDocuments();
    if (count === 0) await courses.insertMany(sampleCourses);

    const allCourses = await courses.find({}).toArray();
    
    const userToken = getUserFromRequest(request);
    if (userToken) {
      const user = await db.collection('users').findOne({ userId: userToken.userId });
      const enrolledIds = user?.enrolledCourses || [];
      return createResponse(allCourses.map(course => ({ ...course, enrolled: enrolledIds.includes(course.id) })));
    }

    return createResponse(allCourses);
  } catch (error) {
    console.error('Get courses error:', error);
    return createResponse({ error: 'Failed to fetch courses' }, 500);
  }
}

async function handleGetCourse(request, courseId) {
  try {
    const db = await getDb();
    const course = await db.collection('courses').findOne({ id: courseId });
    if (!course) return createResponse({ error: 'Course not found' }, 404);

    const userToken = getUserFromRequest(request);
    if (userToken) {
      const user = await db.collection('users').findOne({ userId: userToken.userId });
      course.enrolled = user?.enrolledCourses?.includes(courseId) || false;
    }

    return createResponse(course);
  } catch (error) {
    console.error('Get course error:', error);
    return createResponse({ error: 'Failed to fetch course' }, 500);
  }
}

async function handleEnrollCourse(request, courseId) {
  try {
    const userToken = getUserFromRequest(request);
    if (!userToken) return createResponse({ error: 'Unauthorized' }, 401);

    const db = await getDb();
    const course = await db.collection('courses').findOne({ id: courseId });
    if (!course) return createResponse({ error: 'Course not found' }, 404);

    const user = await db.collection('users').findOne({ userId: userToken.userId });
    if (user.enrolledCourses?.includes(courseId)) {
      return createResponse({ error: 'Already enrolled' }, 400);
    }

    await db.collection('users').updateOne(
      { userId: userToken.userId },
      { $push: { enrolledCourses: courseId } }
    );

    await db.collection('enrollments').insertOne({
      enrollmentId: uuidv4(),
      userId: userToken.userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      status: 'in-progress',
      completedModules: [],
      lastAccessedAt: new Date().toISOString()
    });

    return createResponse({ success: true, message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Enroll error:', error);
    return createResponse({ error: 'Failed to enroll' }, 500);
  }
}

// ==================== MODULE ROUTES ====================

async function handleGetModules(request, courseId) {
  try {
    const userToken = getUserFromRequest(request);
    if (!userToken) return createResponse({ error: 'Unauthorized' }, 401);

    const db = await getDb();
    const modules = db.collection('modules');
    
    const count = await modules.countDocuments({ courseId });
    if (count === 0 && sampleModules[courseId]) {
      await modules.insertMany(sampleModules[courseId]);
    }

    const courseModules = await modules.find({ courseId }).sort({ order: 1 }).toArray();
    if (courseModules.length === 0) return createResponse({ error: 'Modules not found' }, 404);

    const enrollment = await db.collection('enrollments').findOne({ userId: userToken.userId, courseId });
    const completedModules = enrollment?.completedModules || [];

    return createResponse(courseModules.map(module => ({ ...module, completed: completedModules.includes(module.id) })));
  } catch (error) {
    console.error('Get modules error:', error);
    return createResponse({ error: 'Failed to fetch modules' }, 500);
  }
}

async function handleGetModule(request, courseId, moduleId) {
  try {
    const userToken = getUserFromRequest(request);
    if (!userToken) return createResponse({ error: 'Unauthorized' }, 401);

    const db = await getDb();
    const module = await db.collection('modules').findOne({ id: moduleId, courseId });
    if (!module) return createResponse({ error: 'Module not found' }, 404);

    const enrollment = await db.collection('enrollments').findOne({ userId: userToken.userId, courseId });
    module.completed = enrollment?.completedModules?.includes(moduleId) || false;

    return createResponse(module);
  } catch (error) {
    console.error('Get module error:', error);
    return createResponse({ error: 'Failed to fetch module' }, 500);
  }
}

// ==================== xAPI STATEMENT ROUTES ====================

async function handlePostStatement(request) {
  try {
    const userToken = getUserFromRequest(request);
    if (!userToken) return createResponse({ error: 'Unauthorized' }, 401);

    const statement = await request.json();
    if (!statement.actor || !statement.verb || !statement.object) {
      return createResponse({ error: 'Invalid xAPI statement' }, 400);
    }

    const db = await getDb();
    const statementWithMeta = {
      ...statement,
      id: statement.id || uuidv4(),
      stored: new Date().toISOString(),
      authority: { objectType: 'Agent', mbox: 'mailto:lrs@ethicscomply.com', name: 'Ethics Compliance LRS' }
    };

    await db.collection('xapi_statements').insertOne(statementWithMeta);

    if (statement.verb.id.includes('completed')) {
      await updateEnrollmentProgress(db, userToken.userId, statement);
    }

    return createResponse({ success: true, id: statementWithMeta.id, stored: statementWithMeta.stored });
  } catch (error) {
    console.error('Post statement error:', error);
    return createResponse({ error: 'Failed to store statement' }, 500);
  }
}

async function handleGetStatements(request) {
  try {
    const userToken = getUserFromRequest(request);
    if (!userToken) return createResponse({ error: 'Unauthorized' }, 401);

    const url = new URL(request.url);
    const verb = url.searchParams.get('verb');
    const activityId = url.searchParams.get('activity');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    const db = await getDb();
    const query = { 'actor.mbox': `mailto:${userToken.email}` };
    if (verb) query['verb.id'] = verb;
    if (activityId) query['object.id'] = activityId;

    const results = await db.collection('xapi_statements')
      .find(query).sort({ timestamp: -1 }).limit(limit).toArray();

    return createResponse({ statements: results, count: results.length });
  } catch (error) {
    console.error('Get statements error:', error);
    return createResponse({ error: 'Failed to fetch statements' }, 500);
  }
}

async function updateEnrollmentProgress(db, userId, statement) {
  try {
    const objectId = statement.object.id;
    const moduleMatch = objectId.match(/module-(.+)-(.+)/);
    if (!moduleMatch) return;

    const courseId = `course-${moduleMatch[1]}`;
    const moduleId = statement.object.id.split('/').pop();

    await db.collection('enrollments').updateOne(
      { userId, courseId },
      { 
        $addToSet: { completedModules: moduleId },
        $set: { lastAccessedAt: new Date().toISOString() }
      }
    );

    const enrollment = await db.collection('enrollments').findOne({ userId, courseId });
    const totalModules = await db.collection('modules').countDocuments({ courseId });
    const completedCount = enrollment.completedModules?.length || 0;
    const progress = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    await db.collection('enrollments').updateOne(
      { userId, courseId },
      { 
        $set: { 
          progress,
          status: progress === 100 ? 'completed' : 'in-progress',
          completedAt: progress === 100 ? new Date().toISOString() : null
        }
      }
    );
  } catch (error) {
    console.error('Update progress error:', error);
  }
}

// ==================== PROGRESS & ANALYTICS ROUTES ====================

async function handleGetProgress(request) {
  try {
    const userToken = getUserFromRequest(request);
    if (!userToken) return createResponse({ error: 'Unauthorized' }, 401);

    const db = await getDb();
    const userEnrollments = await db.collection('enrollments').find({ userId: userToken.userId }).toArray();

    const progressData = await Promise.all(
      userEnrollments.map(async (enrollment) => {
        const course = await db.collection('courses').findOne({ id: enrollment.courseId });
        const timeStatements = await db.collection('xapi_statements').find({
          'actor.mbox': `mailto:${userToken.email}`,
          'object.id': { $regex: enrollment.courseId }
        }).toArray();

        return {
          courseId: enrollment.courseId,
          courseName: course?.title || 'Unknown Course',
          progress: enrollment.progress || 0,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          completedAt: enrollment.completedAt,
          completedModules: enrollment.completedModules?.length || 0,
          totalModules: course?.modules || 0,
          timeSpent: calculateTimeSpent(timeStatements)
        };
      })
    );

    return createResponse({ progress: progressData });
  } catch (error) {
    console.error('Get progress error:', error);
    return createResponse({ error: 'Failed to fetch progress' }, 500);
  }
}

async function handleGetAnalytics(request) {
  try {
    const userToken = getUserFromRequest(request);
    if (!userToken) return createResponse({ error: 'Unauthorized' }, 401);

    const db = await getDb();
    const userEmail = `mailto:${userToken.email}`;

    const verbCounts = await db.collection('xapi_statements').aggregate([
      { $match: { 'actor.mbox': userEmail } },
      { $group: { _id: '$verb.display.en-US', count: { $sum: 1 } } }
    ]).toArray();

    const recentActivity = await db.collection('xapi_statements')
      .find({ 'actor.mbox': userEmail }).sort({ timestamp: -1 }).limit(20).toArray();

    const completedCount = await db.collection('enrollments').countDocuments({ userId: userToken.userId, status: 'completed' });
    const inProgressCount = await db.collection('enrollments').countDocuments({ userId: userToken.userId, status: 'in-progress' });

    const assessmentStatements = await db.collection('xapi_statements').find({
      'actor.mbox': userEmail,
      'verb.id': { $regex: 'passed|failed' },
      'result.score': { $exists: true }
    }).toArray();

    const avgScore = assessmentStatements.length > 0
      ? assessmentStatements.reduce((sum, s) => sum + (s.result?.score?.scaled || 0), 0) / assessmentStatements.length
      : 0;

    return createResponse({
      totalStatements: await db.collection('xapi_statements').countDocuments({ 'actor.mbox': userEmail }),
      verbCounts,
      recentActivity,
      coursesCompleted: completedCount,
      coursesInProgress: inProgressCount,
      averageScore: Math.round(avgScore * 100),
      totalTimeSpent: calculateTimeSpent(recentActivity)
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return createResponse({ error: 'Failed to fetch analytics' }, 500);
  }
}

function calculateTimeSpent(statements) {
  if (statements.length < 2) return 0;
  const sorted = statements.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const first = new Date(sorted[0].timestamp);
  const last = new Date(sorted[sorted.length - 1].timestamp);
  return Math.round((last - first) / (1000 * 60));
}

// ==================== REPORT ROUTES ====================

async function handleExportCSV(request) {
  try {
    const userToken = getUserFromRequest(request);
    if (!userToken) return createResponse({ error: 'Unauthorized' }, 401);

    const db = await getDb();
    const userStatements = await db.collection('xapi_statements')
      .find({ 'actor.mbox': `mailto:${userToken.email}` }).sort({ timestamp: -1 }).toArray();

    const csvRows = [['Timestamp', 'Verb', 'Activity', 'Result', 'Score'].join(',')];
    userStatements.forEach(stmt => {
      csvRows.push([
        stmt.timestamp,
        stmt.verb.display['en-US'],
        stmt.object.definition?.name?.['en-US'] || stmt.object.id,
        stmt.result?.completion ? 'Completed' : 'In Progress',
        stmt.result?.score?.raw || 'N/A'
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    return new NextResponse(csvContent, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=learning_records.csv' }
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    return createResponse({ error: 'Failed to export CSV' }, 500);
  }
}

// ==================== QUIZ SUBMISSION ====================

async function handleSubmitQuiz(request) {
  try {
    const userToken = getUserFromRequest(request);
    if (!userToken) return createResponse({ error: 'Unauthorized' }, 401);

    const { courseId, moduleId, answers, timeSpent } = await request.json();
    const db = await getDb();
    const module = await db.collection('modules').findOne({ id: moduleId, courseId });
    
    if (!module || module.type !== 'quiz') return createResponse({ error: 'Quiz not found' }, 404);

    let correctCount = 0;
    const results = module.questions.map(q => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return { questionId: q.id, question: q.question, userAnswer, correctAnswer: q.correctAnswer, isCorrect, explanation: q.explanation };
    });

    const score = correctCount / module.questions.length;
    const passed = score >= 0.7;

    return createResponse({
      score: Math.round(score * 100),
      passed,
      correctCount,
      totalQuestions: module.questions.length,
      results,
      timeSpent
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return createResponse({ error: 'Failed to submit quiz' }, 500);
  }
}

// ==================== MAIN HANDLER ====================

export async function GET(request, { params }) {
  try {
    const path = params.path?.join('/') || '';

    if (path === 'auth/me') return handleGetCurrentUser(request);
    if (path === 'courses') return handleGetCourses(request);
    if (path.startsWith('courses/') && !path.includes('modules')) {
      const courseId = path.split('/')[1];
      return handleGetCourse(request, courseId);
    }
    if (path.match(/^courses\/[^/]+\/modules$/)) {
      const courseId = path.split('/')[1];
      return handleGetModules(request, courseId);
    }
    if (path.match(/^courses\/[^/]+\/modules\/[^/]+$/)) {
      const parts = path.split('/');
      return handleGetModule(request, parts[1], parts[3]);
    }
    if (path === 'statements') return handleGetStatements(request);
    if (path === 'progress') return handleGetProgress(request);
    if (path === 'analytics') return handleGetAnalytics(request);
    if (path === 'reports/csv') return handleExportCSV(request);

    return createResponse({ error: 'Not found' }, 404);
  } catch (error) {
    console.error('GET error:', error);
    return createResponse({ error: 'Internal server error' }, 500);
  }
}

export async function POST(request, { params }) {
  try {
    const path = params.path?.join('/') || '';

    if (path === 'auth/register') return handleRegister(request);
    if (path === 'auth/login') return handleLogin(request);
    if (path === 'statements') return handlePostStatement(request);
    if (path === 'quiz/submit') return handleSubmitQuiz(request);
    if (path.match(/^courses\/[^/]+\/enroll$/)) {
      const courseId = path.split('/')[1];
      return handleEnrollCourse(request, courseId);
    }

    return createResponse({ error: 'Not found' }, 404);
  } catch (error) {
    console.error('POST error:', error);
    return createResponse({ error: 'Internal server error' }, 500);
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}