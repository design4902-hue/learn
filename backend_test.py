#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Ethics and Compliance Training Platform
Tests all backend endpoints including authentication, course management, xAPI statements, and more.
"""

import requests
import json
import time
import uuid
from datetime import datetime
import os

# Get base URL from environment
BASE_URL = "https://ethicomply.preview.emergentagent.com/api"

class EthicsComplianceAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.user_data = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if self.auth_token:
            default_headers['Authorization'] = f'Bearer {self.auth_token}'
        
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        # Generate unique user data
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "name": f"Sarah Johnson {unique_id}",
            "email": f"sarah.johnson.{unique_id}@ethicstest.com",
            "password": "SecurePass123!",
            "organization": "Ethics Test Corp"
        }
        
        response = self.make_request('POST', '/auth/register', user_data)
        
        if response is None:
            self.log_result("User Registration", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get('success') and data.get('token') and data.get('user'):
                    self.auth_token = data['token']
                    self.user_data = data['user']
                    self.log_result("User Registration", True, f"User registered successfully: {user_data['email']}")
                    return True
                else:
                    self.log_result("User Registration", False, "Invalid response format", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("User Registration", False, "Invalid JSON response", response.text)
                return False
        else:
            try:
                error_data = response.json()
                self.log_result("User Registration", False, f"Registration failed: {error_data.get('error', 'Unknown error')}")
            except:
                self.log_result("User Registration", False, f"Registration failed with status {response.status_code}")
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        if not self.user_data:
            self.log_result("User Login", False, "No user data available for login test")
            return False
        
        login_data = {
            "email": self.user_data['email'],
            "password": "SecurePass123!"
        }
        
        response = self.make_request('POST', '/auth/login', login_data)
        
        if response is None:
            self.log_result("User Login", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get('success') and data.get('token'):
                    self.auth_token = data['token']  # Update token
                    self.log_result("User Login", True, f"Login successful for {login_data['email']}")
                    return True
                else:
                    self.log_result("User Login", False, "Invalid login response format", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("User Login", False, "Invalid JSON response", response.text)
                return False
        else:
            try:
                error_data = response.json()
                self.log_result("User Login", False, f"Login failed: {error_data.get('error', 'Unknown error')}")
            except:
                self.log_result("User Login", False, f"Login failed with status {response.status_code}")
            return False
    
    def test_get_current_user(self):
        """Test get current user endpoint"""
        print("\n=== Testing Get Current User ===")
        
        if not self.auth_token:
            self.log_result("Get Current User", False, "No auth token available")
            return False
        
        response = self.make_request('GET', '/auth/me')
        
        if response is None:
            self.log_result("Get Current User", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get('userId') and data.get('email'):
                    self.log_result("Get Current User", True, f"User profile retrieved: {data['email']}")
                    return True
                else:
                    self.log_result("Get Current User", False, "Invalid user profile format", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Get Current User", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Get Current User", False, f"Failed with status {response.status_code}")
            return False
    
    def test_get_courses(self):
        """Test get courses endpoint"""
        print("\n=== Testing Get Courses ===")
        
        response = self.make_request('GET', '/courses')
        
        if response is None:
            self.log_result("Get Courses", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                courses = response.json()
                if isinstance(courses, list) and len(courses) > 0:
                    self.log_result("Get Courses", True, f"Retrieved {len(courses)} courses")
                    return courses
                else:
                    self.log_result("Get Courses", False, "No courses found or invalid format", courses)
                    return False
            except json.JSONDecodeError:
                self.log_result("Get Courses", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Get Courses", False, f"Failed with status {response.status_code}")
            return False
    
    def test_get_course_details(self, course_id):
        """Test get specific course details"""
        print(f"\n=== Testing Get Course Details: {course_id} ===")
        
        response = self.make_request('GET', f'/courses/{course_id}')
        
        if response is None:
            self.log_result("Get Course Details", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                course = response.json()
                if course.get('id') == course_id and course.get('title'):
                    self.log_result("Get Course Details", True, f"Course details retrieved: {course['title']}")
                    return course
                else:
                    self.log_result("Get Course Details", False, "Invalid course format", course)
                    return False
            except json.JSONDecodeError:
                self.log_result("Get Course Details", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Get Course Details", False, f"Failed with status {response.status_code}")
            return False
    
    def test_enroll_in_course(self, course_id):
        """Test course enrollment"""
        print(f"\n=== Testing Course Enrollment: {course_id} ===")
        
        if not self.auth_token:
            self.log_result("Course Enrollment", False, "No auth token available")
            return False
        
        response = self.make_request('POST', f'/courses/{course_id}/enroll')
        
        if response is None:
            self.log_result("Course Enrollment", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get('success'):
                    self.log_result("Course Enrollment", True, f"Successfully enrolled in course {course_id}")
                    return True
                else:
                    self.log_result("Course Enrollment", False, "Enrollment failed", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Course Enrollment", False, "Invalid JSON response", response.text)
                return False
        else:
            try:
                error_data = response.json()
                # Check if already enrolled (this is acceptable)
                if "already enrolled" in error_data.get('error', '').lower():
                    self.log_result("Course Enrollment", True, f"Already enrolled in course {course_id}")
                    return True
                else:
                    self.log_result("Course Enrollment", False, f"Enrollment failed: {error_data.get('error', 'Unknown error')}")
            except:
                self.log_result("Course Enrollment", False, f"Enrollment failed with status {response.status_code}")
            return False
    
    def test_get_modules(self, course_id):
        """Test get course modules"""
        print(f"\n=== Testing Get Modules: {course_id} ===")
        
        if not self.auth_token:
            self.log_result("Get Modules", False, "No auth token available")
            return False
        
        response = self.make_request('GET', f'/courses/{course_id}/modules')
        
        if response is None:
            self.log_result("Get Modules", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                modules = response.json()
                if isinstance(modules, list) and len(modules) > 0:
                    self.log_result("Get Modules", True, f"Retrieved {len(modules)} modules for course {course_id}")
                    return modules
                else:
                    self.log_result("Get Modules", False, "No modules found or invalid format", modules)
                    return False
            except json.JSONDecodeError:
                self.log_result("Get Modules", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Get Modules", False, f"Failed with status {response.status_code}")
            return False
    
    def test_get_module_content(self, course_id, module_id):
        """Test get specific module content"""
        print(f"\n=== Testing Get Module Content: {course_id}/{module_id} ===")
        
        if not self.auth_token:
            self.log_result("Get Module Content", False, "No auth token available")
            return False
        
        response = self.make_request('GET', f'/courses/{course_id}/modules/{module_id}')
        
        if response is None:
            self.log_result("Get Module Content", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                module = response.json()
                if module.get('id') == module_id and module.get('title'):
                    self.log_result("Get Module Content", True, f"Module content retrieved: {module['title']}")
                    return module
                else:
                    self.log_result("Get Module Content", False, "Invalid module format", module)
                    return False
            except json.JSONDecodeError:
                self.log_result("Get Module Content", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Get Module Content", False, f"Failed with status {response.status_code}")
            return False
    
    def test_post_xapi_statement(self):
        """Test posting xAPI statement"""
        print("\n=== Testing Post xAPI Statement ===")
        
        if not self.auth_token or not self.user_data:
            self.log_result("Post xAPI Statement", False, "No auth token or user data available")
            return False
        
        # Create a valid xAPI statement
        statement = {
            "actor": {
                "objectType": "Agent",
                "mbox": f"mailto:{self.user_data['email']}",
                "name": self.user_data['name']
            },
            "verb": {
                "id": "http://adlnet.gov/expapi/verbs/experienced",
                "display": {"en-US": "experienced"}
            },
            "object": {
                "objectType": "Activity",
                "id": "https://ethicomply.preview.emergentagent.com/courses/course-001/modules/module-001-01",
                "definition": {
                    "type": "http://adlnet.gov/expapi/activities/module",
                    "name": {"en-US": "Introduction to Business Ethics"},
                    "description": {"en-US": "First module of ethics training"}
                }
            },
            "timestamp": datetime.now().isoformat(),
            "result": {
                "completion": True,
                "success": True,
                "duration": "PT8M30S"
            }
        }
        
        response = self.make_request('POST', '/statements', statement)
        
        if response is None:
            self.log_result("Post xAPI Statement", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get('success') and data.get('id'):
                    self.log_result("Post xAPI Statement", True, f"xAPI statement stored with ID: {data['id']}")
                    return True
                else:
                    self.log_result("Post xAPI Statement", False, "Invalid statement response", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Post xAPI Statement", False, "Invalid JSON response", response.text)
                return False
        else:
            try:
                error_data = response.json()
                self.log_result("Post xAPI Statement", False, f"Statement failed: {error_data.get('error', 'Unknown error')}")
            except:
                self.log_result("Post xAPI Statement", False, f"Statement failed with status {response.status_code}")
            return False
    
    def test_get_xapi_statements(self):
        """Test retrieving xAPI statements"""
        print("\n=== Testing Get xAPI Statements ===")
        
        if not self.auth_token:
            self.log_result("Get xAPI Statements", False, "No auth token available")
            return False
        
        response = self.make_request('GET', '/statements')
        
        if response is None:
            self.log_result("Get xAPI Statements", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if 'statements' in data and isinstance(data['statements'], list):
                    count = data.get('count', len(data['statements']))
                    self.log_result("Get xAPI Statements", True, f"Retrieved {count} xAPI statements")
                    return True
                else:
                    self.log_result("Get xAPI Statements", False, "Invalid statements format", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Get xAPI Statements", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Get xAPI Statements", False, f"Failed with status {response.status_code}")
            return False
    
    def test_get_progress(self):
        """Test get user progress"""
        print("\n=== Testing Get Progress ===")
        
        if not self.auth_token:
            self.log_result("Get Progress", False, "No auth token available")
            return False
        
        response = self.make_request('GET', '/progress')
        
        if response is None:
            self.log_result("Get Progress", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if 'progress' in data and isinstance(data['progress'], list):
                    self.log_result("Get Progress", True, f"Retrieved progress for {len(data['progress'])} enrollments")
                    return True
                else:
                    self.log_result("Get Progress", False, "Invalid progress format", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Get Progress", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Get Progress", False, f"Failed with status {response.status_code}")
            return False
    
    def test_get_analytics(self):
        """Test get analytics"""
        print("\n=== Testing Get Analytics ===")
        
        if not self.auth_token:
            self.log_result("Get Analytics", False, "No auth token available")
            return False
        
        response = self.make_request('GET', '/analytics')
        
        if response is None:
            self.log_result("Get Analytics", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if 'totalStatements' in data and 'verbCounts' in data:
                    self.log_result("Get Analytics", True, f"Analytics retrieved - {data['totalStatements']} total statements")
                    return True
                else:
                    self.log_result("Get Analytics", False, "Invalid analytics format", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Get Analytics", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Get Analytics", False, f"Failed with status {response.status_code}")
            return False
    
    def test_submit_quiz(self):
        """Test quiz submission"""
        print("\n=== Testing Quiz Submission ===")
        
        if not self.auth_token:
            self.log_result("Quiz Submission", False, "No auth token available")
            return False
        
        # Submit quiz answers for the assessment module
        quiz_data = {
            "courseId": "course-001",
            "moduleId": "module-001-05",
            "answers": {
                "q1": "b",  # Correct answer
                "q2": "b",  # Correct answer
                "q3": "b",  # Correct answer
                "q4": "a",  # Correct answer
                "q5": "a"   # Correct answer
            },
            "timeSpent": 480  # 8 minutes in seconds
        }
        
        response = self.make_request('POST', '/quiz/submit', quiz_data)
        
        if response is None:
            self.log_result("Quiz Submission", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            try:
                data = response.json()
                if 'score' in data and 'passed' in data and 'results' in data:
                    score = data['score']
                    passed = data['passed']
                    self.log_result("Quiz Submission", True, f"Quiz submitted - Score: {score}%, Passed: {passed}")
                    return True
                else:
                    self.log_result("Quiz Submission", False, "Invalid quiz response format", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Quiz Submission", False, "Invalid JSON response", response.text)
                return False
        else:
            try:
                error_data = response.json()
                self.log_result("Quiz Submission", False, f"Quiz submission failed: {error_data.get('error', 'Unknown error')}")
            except:
                self.log_result("Quiz Submission", False, f"Quiz submission failed with status {response.status_code}")
            return False
    
    def test_csv_export(self):
        """Test CSV export"""
        print("\n=== Testing CSV Export ===")
        
        if not self.auth_token:
            self.log_result("CSV Export", False, "No auth token available")
            return False
        
        response = self.make_request('GET', '/reports/csv')
        
        if response is None:
            self.log_result("CSV Export", False, "Request failed - no response")
            return False
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'text/csv' in content_type:
                csv_content = response.text
                lines = csv_content.split('\n')
                self.log_result("CSV Export", True, f"CSV exported successfully - {len(lines)} lines")
                return True
            else:
                self.log_result("CSV Export", False, f"Invalid content type: {content_type}")
                return False
        else:
            self.log_result("CSV Export", False, f"Failed with status {response.status_code}")
            return False
    
    def run_comprehensive_test(self):
        """Run all backend tests in sequence"""
        print("🚀 Starting Comprehensive Backend API Testing")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Authentication flow
        if not self.test_user_registration():
            print("❌ Registration failed - stopping tests")
            return False
        
        if not self.test_user_login():
            print("❌ Login failed - stopping tests")
            return False
        
        if not self.test_get_current_user():
            print("❌ Get current user failed")
        
        # Course management
        courses = self.test_get_courses()
        if not courses:
            print("❌ Get courses failed - stopping course tests")
        else:
            # Test with first course
            first_course = courses[0]
            course_id = first_course['id']
            
            # Test course details
            course_details = self.test_get_course_details(course_id)
            
            # Test enrollment
            if self.test_enroll_in_course(course_id):
                # Test modules after enrollment
                modules = self.test_get_modules(course_id)
                if modules:
                    # Test first module content
                    first_module = modules[0]
                    self.test_get_module_content(course_id, first_module['id'])
        
        # xAPI and learning tracking
        self.test_post_xapi_statement()
        self.test_get_xapi_statements()
        
        # Progress and analytics
        self.test_get_progress()
        self.test_get_analytics()
        
        # Quiz and reporting
        self.test_submit_quiz()
        self.test_csv_export()
        
        # Summary
        self.print_test_summary()
        return True
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"  - {result['test']}: {result['message']}")

def main():
    """Main test execution"""
    print("Ethics and Compliance Training Platform - Backend API Test Suite")
    print("Testing xAPI-compliant Learning Management System")
    
    tester = EthicsComplianceAPITester()
    
    try:
        success = tester.run_comprehensive_test()
        if success:
            print("\n🎉 Backend testing completed!")
        else:
            print("\n💥 Backend testing failed!")
            exit(1)
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {e}")
        exit(1)

if __name__ == "__main__":
    main()