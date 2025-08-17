import { lazy, Suspense } from 'react';
import { Route,Routes } from 'react-router';

import '@/assets/css/index.css';
import '@/assets/css/keyframes.css';

// PAGES
const HomePage = lazy(() => import('@/pages/home'))

function App() {
  return (
    <Suspense>
      <Routes>
        <Route element={<HomePage />} path='/' />
      </Routes>
    </Suspense>
  )
}

export default App
