'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, GraduationCap, TrendingUp, Award, Clock, CheckCircle2, XCircle, PlayCircle, FileText, BarChart3, Download, LogOut, User, Shield, AlertCircle, ChevronRight } from 'lucide-react';
import { createStatement, VERBS, ACTIVITY_TYPES, createActivity, createResult, createContext } from '@/lib/xapi';

export default function App() {
  const [view, setView] = useState('auth');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [scenarioProgress, setScenarioProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [moduleStartTime, setModuleStartTime] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', organization: '' });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setView('dashboard');
      fetchCourses(storedToken);
    }
  }, []);

  const apiCall = async (endpoint, method = 'GET', data = null) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`/api/${endpoint}`, options);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Request failed');
    }
    return response.json();
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = authMode === 'login' ? 'auth/login' : 'auth/register';
      const result = await apiCall(endpoint, 'POST', authForm);
      
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      setView('dashboard');
      fetchCourses(result.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('auth');
    setAuthForm({ name: '', email: '', password: '', organization: '' });
  };

  const fetchCourses = async (authToken = token) => {
    try {
      const data = await apiCall('courses');
      setCourses(data);
    } catch (err) {
      console.error('Fetch courses error:', err);
    }
  };

  const handleEnrollCourse = async (courseId) => {
    setLoading(true);
    setError('');
    try {
      await apiCall(`courses/${courseId}/enroll`, 'POST');
      
      const course = courses.find(c => c.id === courseId);
      const statement = createStatement({
        actor: { email: user.email, name: user.name },
        verb: VERBS.INITIALIZED,
        object: createActivity(
          `https://ethicomply.com/courses/${courseId}`,
          course.title,
          course.description,
          ACTIVITY_TYPES.COURSE
        ),
        context: createContext({ registration: user.userId })
      });
      
      await apiCall('statements', 'POST', statement);
      await fetchCourses();
      alert('Enrolled successfully! xAPI statement recorded.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourse = async (courseId) => {
    setLoading(true);
    try {
      const courseData = await apiCall(`courses/${courseId}`);
      setSelectedCourse(courseData);
      
      const modulesData = await apiCall(`courses/${courseId}/modules`);
      setModules(modulesData);
      
      setView('course-view');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewModule = async (module) => {
    setLoading(true);
    try {
      const moduleData = await apiCall(`courses/${selectedCourse.id}/modules/${module.id}`);
      setSelectedModule(moduleData);
      setModuleStartTime(new Date());
      setView('module-view');
      setQuizAnswers({});
      setQuizResults(null);
      setScenarioProgress({});
      
      const statement = createStatement({
        actor: { email: user.email, name: user.name },
        verb: VERBS.INITIALIZED,
        object: createActivity(
          `https://ethicomply.com/courses/${selectedCourse.id}/modules/${module.id}`,
          module.title,
          `Module: ${module.title}`,
          ACTIVITY_TYPES.MODULE
        ),
        context: createContext({
          registration: user.userId,
          parentActivity: createActivity(
            `https://ethicomply.com/courses/${selectedCourse.id}`,
            selectedCourse.title,
            selectedCourse.description,
            ACTIVITY_TYPES.COURSE
          )
        })
      });
      
      await apiCall('statements', 'POST', statement);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteModule = async () => {
    setLoading(true);
    try {
      const duration = moduleStartTime ? Math.round((new Date() - moduleStartTime) / 1000) : 0;
      
      const statement = createStatement({
        actor: { email: user.email, name: user.name },
        verb: VERBS.COMPLETED,
        object: createActivity(
          `https://ethicomply.com/courses/${selectedCourse.id}/modules/${selectedModule.id}`,
          selectedModule.title,
          `Module: ${selectedModule.title}`,
          ACTIVITY_TYPES.MODULE
        ),
        result: createResult({ completion: true, duration: `PT${duration}S` }),
        context: createContext({
          registration: user.userId,
          parentActivity: createActivity(
            `https://ethicomply.com/courses/${selectedCourse.id}`,
            selectedCourse.title,
            selectedCourse.description,
            ACTIVITY_TYPES.COURSE
          )
        })
      });
      
      await apiCall('statements', 'POST', statement);
      const modulesData = await apiCall(`courses/${selectedCourse.id}/modules`);
      setModules(modulesData);
      
      alert('Module completed! xAPI statement recorded.');
      setView('course-view');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const duration = moduleStartTime ? Math.round((new Date() - moduleStartTime) / 1000) : 0;
      const result = await apiCall('quiz/submit', 'POST', {
        courseId: selectedCourse.id,
        moduleId: selectedModule.id,
        answers: quizAnswers,
        timeSpent: duration
      });
      
      setQuizResults(result);
      
      const statement = createStatement({
        actor: { email: user.email, name: user.name },
        verb: result.passed ? VERBS.PASSED : VERBS.FAILED,
        object: createActivity(
          `https://ethicomply.com/courses/${selectedCourse.id}/modules/${selectedModule.id}`,
          selectedModule.title,
          `Quiz: ${selectedModule.title}`,
          ACTIVITY_TYPES.ASSESSMENT
        ),
        result: createResult({
          score: result.score / 100,
          success: result.passed,
          completion: true,
          duration: `PT${duration}S`
        }),
        context: createContext({
          registration: user.userId,
          parentActivity: createActivity(
            `https://ethicomply.com/courses/${selectedCourse.id}`,
            selectedCourse.title,
            selectedCourse.description,
            ACTIVITY_TYPES.COURSE
          )
        })
      });
      
      await apiCall('statements', 'POST', statement);
      
      if (result.passed) {
        await handleCompleteModule();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioAnswer = async (scenarioId, selectedOption) => {
    const scenario = selectedModule.scenarios.find(s => s.id === scenarioId);
    const option = scenario.options.find(o => o.id === selectedOption);
    
    setScenarioProgress({
      ...scenarioProgress,
      [scenarioId]: {
        answered: true,
        correct: option.correct,
        selectedOption
      }
    });
    
    const statement = createStatement({
      actor: { email: user.email, name: user.name },
      verb: VERBS.INTERACTED,
      object: createActivity(
        `https://ethicomply.com/courses/${selectedCourse.id}/modules/${selectedModule.id}/scenario/${scenarioId}`,
        scenario.title,
        scenario.description,
        ACTIVITY_TYPES.INTERACTION
      ),
      result: createResult({
        success: option.correct,
        response: option.text
      }),
      context: createContext({
        registration: user.userId
      })
    });
    
    await apiCall('statements', 'POST', statement);
  };

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const data = await apiCall('progress');
      setProgressData(data.progress);
      setView('progress');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await apiCall('analytics');
      setAnalyticsData(data);
      setView('analytics');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/reports/csv', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'learning_records.csv';
      a.click();
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  const renderAuth = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-4 rounded-full">
              <Shield className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">EthiComply</CardTitle>
          <CardDescription>Ethics & Compliance Training with xAPI Tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={authMode} onValueChange={setAuthMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      required={authMode === 'register'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization (Optional)</Label>
                    <Input
                      id="organization"
                      placeholder="Acme Corp"
                      value={authForm.organization}
                      onChange={(e) => setAuthForm({ ...authForm, organization: e.target.value })}
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-xs text-muted-foreground">
          <p>Demo Credentials: demo@example.com / demo123</p>
        </CardFooter>
      </Card>
    </div>
  );

  const renderNavbar = () => (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setView('dashboard'); fetchCourses(); }}>
            <div className="bg-primary p-2 rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">EthiComply</h1>
              <p className="text-xs text-muted-foreground">xAPI Compliant LMS</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => { setView('dashboard'); fetchCourses(); }}>
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchProgress}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchAnalytics}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center space-x-2 px-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-background">
      {renderNavbar()}
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-muted-foreground">Continue your ethics and compliance training journey</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="enrolled">My Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary">{course.category}</Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {course.duration}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {course.modules} modules
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Award className="h-4 w-4 mr-2" />
                        Passing score: {course.passingScore}%
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {course.enrolled ? (
                      <Button onClick={() => handleViewCourse(course.id)} className="w-full">
                        Continue Learning
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button onClick={() => handleEnrollCourse(course.id)} className="w-full" disabled={loading}>
                        Enroll Now
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="enrolled">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter(c => c.enrolled).map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary">{course.category}</Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button onClick={() => handleViewCourse(course.id)} className="w-full">
                      Continue Learning
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {courses.filter(c => c.enrolled).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No enrolled courses yet. Enroll in a course to get started!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  const renderCourseView = () => (
    <div className="min-h-screen bg-background">
      {renderNavbar()}
      
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => setView('dashboard')} className="mb-6">
          ← Back to Courses
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="relative h-64 rounded-lg overflow-hidden mb-6">
              <img src={selectedCourse?.thumbnail} alt={selectedCourse?.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <Badge variant="secondary" className="mb-2">{selectedCourse?.category}</Badge>
                  <h1 className="text-3xl font-bold">{selectedCourse?.title}</h1>
                </div>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{selectedCourse?.description}</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold">{selectedCourse?.duration}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Modules</p>
                    <p className="font-semibold">{selectedCourse?.modules}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Passing Score</p>
                    <p className="font-semibold">{selectedCourse?.passingScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Course Modules</CardTitle>
                <CardDescription>{modules.filter(m => m.completed).length} of {modules.length} completed</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={(modules.filter(m => m.completed).length / modules.length) * 100} className="mb-4" />
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {modules.map((module, index) => (
                      <div
                        key={module.id}
                        onClick={() => handleViewModule(module)}
                        className="p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-muted-foreground">Module {index + 1}</span>
                              {module.completed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            </div>
                            <h4 className="font-semibold text-sm mb-1">{module.title}</h4>
                            <div className="flex items-center text-xs text-muted-foreground">
                              {module.type === 'text' && <FileText className="h-3 w-3 mr-1" />}
                              {module.type === 'video' && <PlayCircle className="h-3 w-3 mr-1" />}
                              {module.type === 'quiz' && <Award className="h-3 w-3 mr-1" />}
                              {module.type === 'interactive' && <GraduationCap className="h-3 w-3 mr-1" />}
                              <span>{module.duration}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModuleContent = () => {
    if (selectedModule.type === 'text') {
      return (
        <div className="prose prose-slate max-w-none space-y-4">
          {selectedModule.content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{line.substring(2)}</h1>;
            if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.substring(3)}</h2>;
            if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(4)}</h3>;
            if (line.match(/^\d+\./)) return <li key={i} className="ml-6 my-1">{line.substring(line.indexOf('.') + 2)}</li>;
            if (line.startsWith('- ')) return <li key={i} className="ml-6 my-1">{line.substring(2)}</li>;
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} className="my-2"><strong>{line.substring(2, line.length - 2)}</strong></p>;
            }
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="my-2">{line}</p>;
          })}
        </div>
      );
    }

    if (selectedModule.type === 'video') {
      return (
        <div>
          <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
            <iframe
              src={selectedModule.videoUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-muted-foreground">{selectedModule.content}</p>
        </div>
      );
    }

    if (selectedModule.type === 'interactive') {
      return (
        <div className="space-y-6">
          {selectedModule.scenarios?.map((scenario) => (
            <Card key={scenario.id} className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">{scenario.title}</CardTitle>
                <CardDescription>{scenario.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {scenario.options.map((option) => (
                  <Button
                    key={option.id}
                    variant={
                      scenarioProgress[scenario.id]?.selectedOption === option.id
                        ? option.correct
                          ? 'default'
                          : 'destructive'
                        : 'outline'
                    }
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => handleScenarioAnswer(scenario.id, option.id)}
                    disabled={scenarioProgress[scenario.id]?.answered}
                  >
                    <div className="flex items-center w-full">
                      <span className="flex-1">{option.text}</span>
                      {scenarioProgress[scenario.id]?.selectedOption === option.id && (
                        option.correct ? (
                          <CheckCircle2 className="h-5 w-5 ml-2" />
                        ) : (
                          <XCircle className="h-5 w-5 ml-2" />
                        )
                      )}
                    </div>
                  </Button>
                ))}
                {scenarioProgress[scenario.id]?.answered && (
                  <Alert className={scenarioProgress[scenario.id]?.correct ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                    <AlertDescription>
                      {scenarioProgress[scenario.id]?.correct ? scenario.feedback.correct : scenario.feedback.incorrect}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (selectedModule.type === 'quiz' && !quizResults) {
      return (
        <div className="space-y-6">
          {selectedModule.questions?.map((question, qIndex) => (
            <Card key={question.id} className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {question.options.map((option) => (
                  <Button
                    key={option.id}
                    variant={quizAnswers[question.id] === option.id ? 'default' : 'outline'}
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => setQuizAnswers({ ...quizAnswers, [question.id]: option.id })}
                  >
                    {option.text}
                  </Button>
                ))}
              </CardContent>
            </Card>
          ))}
          <Button
            onClick={handleQuizSubmit}
            size="lg"
            className="w-full"
            disabled={Object.keys(quizAnswers).length !== selectedModule.questions?.length || loading}
          >
            Submit Quiz
          </Button>
        </div>
      );
    }

    if (selectedModule.type === 'quiz' && quizResults) {
      return (
        <div className="space-y-6">
          <Card className={`border-2 ${quizResults.passed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {quizResults.passed ? (
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                )}
              </div>
              <CardTitle className="text-3xl">{quizResults.passed ? 'Congratulations!' : 'Not Quite There'}</CardTitle>
              <CardDescription className="text-lg">
                You scored {quizResults.score}% ({quizResults.correctCount}/{quizResults.totalQuestions} correct)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quizResults.results.map((result, i) => (
                  <Card key={i} className={result.isCorrect ? 'border-green-300' : 'border-red-300'}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm flex-1">{result.question}</CardTitle>
                        {result.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 ml-2" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="text-muted-foreground mb-2">{result.explanation}</p>
                      {!result.isCorrect && (
                        <p className="text-sm">
                          <span className="font-semibold">Correct answer:</span> {result.correctAnswer}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          <Button onClick={() => setView('course-view')} size="lg" className="w-full">
            Return to Course
          </Button>
        </div>
      );
    }
  };

  const renderModuleView = () => {
    if (!selectedModule) return null;

    return (
      <div className="min-h-screen bg-background">
        {renderNavbar()}
        
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => setView('course-view')} className="mb-6">
            ← Back to Course
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedModule.title}</CardTitle>
                  <CardDescription>{selectedModule.duration}</CardDescription>
                </div>
                <Badge>{selectedModule.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderModuleContent()}
            </CardContent>
            {!quizResults && selectedModule.type !== 'quiz' && (
              <CardFooter>
                <Button onClick={handleCompleteModule} size="lg" className="w-full" disabled={loading}>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Mark as Complete
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    );
  };

  const renderProgress = () => (
    <div className="min-h-screen bg-background">
      {renderNavbar()}
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Learning Progress</h2>
          <p className="text-muted-foreground">Track your course completion and performance</p>
        </div>

        <div className="space-y-6">
          {progressData.map((progress) => (
            <Card key={progress.courseId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{progress.courseName}</CardTitle>
                    <CardDescription>
                      Enrolled: {new Date(progress.enrolledAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={progress.status === 'completed' ? 'default' : 'secondary'}>
                    {progress.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-semibold">{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Modules Completed</p>
                    <p className="font-semibold">{progress.completedModules} / {progress.totalModules}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time Spent</p>
                    <p className="font-semibold">{progress.timeSpent} min</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Accessed</p>
                    <p className="font-semibold">{new Date(progress.lastAccessedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {progressData.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No progress data yet. Enroll in courses to see your progress!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="min-h-screen bg-background">
      {renderNavbar()}
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Learning Analytics</h2>
            <p className="text-muted-foreground">Detailed insights from your xAPI learning records</p>
          </div>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV Report
          </Button>
        </div>

        {analyticsData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analyticsData.totalStatements}</div>
                  <p className="text-xs text-muted-foreground mt-1">xAPI statements recorded</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Courses Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analyticsData.coursesCompleted}</div>
                  <p className="text-xs text-muted-foreground mt-1">{analyticsData.coursesInProgress} in progress</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analyticsData.averageScore}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all assessments</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Time Invested</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analyticsData.totalTimeSpent}</div>
                  <p className="text-xs text-muted-foreground mt-1">Minutes of learning</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Activity Breakdown</CardTitle>
                <CardDescription>Distribution of learning activities by type (xAPI verbs)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.verbCounts.map((verb) => (
                    <div key={verb._id} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{verb._id}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-48 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{
                              width: `${(verb.count / analyticsData.totalStatements) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">{verb.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest learning interactions tracked via xAPI</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {analyticsData.recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="p-2 rounded-full bg-primary/10">
                          {activity.verb.display['en-US'] === 'completed' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          {activity.verb.display['en-US'] === 'initialized' && <PlayCircle className="h-4 w-4 text-primary" />}
                          {activity.verb.display['en-US'] === 'passed' && <Award className="h-4 w-4 text-green-500" />}
                          {activity.verb.display['en-US'] === 'interacted' && <GraduationCap className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.verb.display['en-US'].charAt(0).toUpperCase() + activity.verb.display['en-US'].slice(1)}:{' '}
                            {activity.object.definition?.name?.['en-US'] || 'Activity'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                          {activity.result?.score && (
                            <p className="text-xs text-primary mt-1">
                              Score: {activity.result.score.raw}%
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );

  if (view === 'auth') return renderAuth();
  if (view === 'dashboard') return renderDashboard();
  if (view === 'course-view') return renderCourseView();
  if (view === 'module-view') return renderModuleView();
  if (view === 'progress') return renderProgress();
  if (view === 'analytics') return renderAnalytics();

  return null;
}
