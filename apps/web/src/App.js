// src/App.js
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Spaces from './pages/Spaces';
import SpaceDetail from './pages/SpaceDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BookingDashboard from './pages/BookingDashboard';
import BookingPage from './pages/BookingPage';
import { AuthProvider } from './auth/AuthContext';

import Header from './components/Header';

// Lazy‑loaded pages
const CreateSpace = lazy(() => import('./pages/CreateSpace'));
const MySpaces    = lazy(() => import('./pages/MySpaces'));
const NotFound    = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Suspense fallback={<div>Loading…</div>}>
          <Switch>
            <Route exact path="/" component={Spaces} />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route path="/spaces/:id" component={SpaceDetail} />
            <Route path="/bookings" component={BookingDashboard} />
            <Route path="/booking" component={BookingPage} />
            <Route path="/create-space" component={CreateSpace} />
            <Route path="/my-spaces"    component={MySpaces} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
