// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Spaces from './pages/Spaces';
import SpaceDetail from './pages/SpaceDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider } from './auth/AuthContext';
import BookingDashboard from './pages/BookingDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route exact path="/" component={Spaces} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/spaces/:id" component={SpaceDetail} />
          <Route path="/bookings" component={BookingDashboard} />
          <Route path="/create-space" component={require('./pages/CreateSpace').default} />
          <Route path="/my-spaces" component={require('./pages/MySpaces').default} />
        </Switch>
      </Router>
    </AuthProvider>
  );
}

export default App;
