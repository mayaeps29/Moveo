import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage';
import CodeBlockPage from './pages/CodeBlockPage';

const AppRouter = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={LobbyPage} />
        <Route path="/code-block/:id" component={CodeBlockPage} />
      </Switch>
    </Router>
  );
};

export default AppRouter;