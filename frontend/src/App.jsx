import {Home, About, NotFound, Test, Timelines, TimelineDetail} from './pages';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ThemeProvider } from "@/components/theme-provider";
import Layout from './Layout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import {createBrowserRouter, RouterProvider} from 'react-router-dom';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                path: '',
                element: (
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'about',
                element: (
                    <ProtectedRoute>
                        <About />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'test',
                element: (
                    <ProtectedRoute>
                        <Test />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'login',
                element: <Login />,
            },
            {
                path: 'signup',
                element: <Signup />,
            },
            {
                path: 'timelines',
                element: (
                    <ProtectedRoute>
                        <Timelines />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'timelines/:id',
                element: (
                    <ProtectedRoute>
                        <TimelineDetail />
                    </ProtectedRoute>
                ),
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
]);

function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <ErrorBoundary>
            <RouterProvider router={router} />
        </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;
