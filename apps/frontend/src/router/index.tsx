import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { MainLayout } from '@/components/layout';

// Lazy load pages for code splitting
import { lazy, Suspense } from 'react';

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Lazy loaded pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));

// Dashboard pages
const TeacherDashboard = lazy(() => import('@/pages/teacher/Dashboard'));
const TeacherProjectsPage = lazy(() => import('@/pages/teacher/ProjectsPage'));
const TeacherApplicationsPage = lazy(() => import('@/pages/teacher/ApplicationsPage'));
const TeacherInternshipsPage = lazy(() => import('@/pages/teacher/InternshipsPage'));
const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'));
const StudentProfilePage = lazy(() => import('@/pages/student/ProfilePage'));
const StudentRecommendationsPage = lazy(() => import('@/pages/student/RecommendationsPage'));
const StudentApplicationsPage = lazy(() => import('@/pages/student/ApplicationsPage'));
const StudentInternshipsPage = lazy(() => import('@/pages/student/InternshipsPage'));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminUsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const AdminMonitoringPage = lazy(() => import('@/pages/admin/MonitoringPage'));

// Not found page
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Protected route wrapper with role-based access control
interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return <Outlet />;
}

// Public route wrapper (redirect if already authenticated)
function PublicRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

// Helper to get dashboard path based on role
export function getDashboardPath(role: string): string {
  switch (role) {
    case 'TEACHER':
      return '/teacher';
    case 'STUDENT':
      return '/student';
    case 'ADMIN':
      return '/admin';
    default:
      return '/login';
  }
}

// Root redirect component
function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
}

// Router configuration
export const router = createBrowserRouter([
  // Public routes (no layout)
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },

  // Teacher routes (with layout)
  {
    path: '/teacher',
    element: <ProtectedRoute allowedRoles={['TEACHER']} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <TeacherDashboard />
              </Suspense>
            ),
          },
          {
            path: 'projects',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TeacherProjectsPage />
              </Suspense>
            ),
          },
          {
            path: 'applications',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TeacherApplicationsPage />
              </Suspense>
            ),
          },
          {
            path: 'internships',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TeacherInternshipsPage />
              </Suspense>
            ),
          },
          {
            path: 'analytics',
            element: (
              <Suspense fallback={<PageLoader />}>
                <div className="text-muted-foreground">数据统计页面待实现</div>
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // Student routes (with layout)
  {
    path: '/student',
    element: <ProtectedRoute allowedRoles={['STUDENT']} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <StudentDashboard />
              </Suspense>
            ),
          },
          {
            path: 'recommendations',
            element: (
              <Suspense fallback={<PageLoader />}>
                <StudentRecommendationsPage />
              </Suspense>
            ),
          },
          {
            path: 'profile',
            element: (
              <Suspense fallback={<PageLoader />}>
                <StudentProfilePage />
              </Suspense>
            ),
          },
          {
            path: 'applications',
            element: (
              <Suspense fallback={<PageLoader />}>
                <StudentApplicationsPage />
              </Suspense>
            ),
          },
          {
            path: 'internships',
            element: (
              <Suspense fallback={<PageLoader />}>
                <StudentInternshipsPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // Admin routes (with layout)
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['ADMIN']} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
            ),
          },
          {
            path: 'users',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminUsersPage />
              </Suspense>
            ),
          },
          {
            path: 'monitoring',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminMonitoringPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // Root redirect
  {
    path: '/',
    element: <RootRedirect />,
  },

  // 404 page
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);

export default router;
