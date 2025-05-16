// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Spaces from './pages/Spaces';
import SpaceDetail from './pages/SpaceDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider } from './auth/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route exact path="/" component={Spaces} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/spaces/:id" component={SpaceDetail} />
        </Switch>
      </Router>
    </AuthProvider>
  );
}

export default App;
