import {Home, About, NotFound, Test, Timelines, TimelineDetail, AIVideos} from './pages';
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

                        <Home />
                ),
            },
            {
                path: 'about',
                element: (
                        <About />
                ),
            },
            {
                path: 'test',
                element: (
                        <Test />
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
                        <Timelines />
                ),
            },
            {
                path: 'timelines/:id',
                element: (
                        <TimelineDetail />
                ),
            },
            {
                path: 'ai-videos',
                element: <AIVideos />,
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
