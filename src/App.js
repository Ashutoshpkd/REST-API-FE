import React, { Fragment, useState, useContext, useEffect } from 'react';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Backdrop from './components/Backdrop/Backdrop';
import Toolbar from './components/Toolbar/Toolbar';
import MainNavigation from './components/Navigation/MainNavigation/MainNavigation';
import MobileNavigation from './components/Navigation/MobileNavigation/MobileNavigation';
import ErrorHandler from './components/ErrorHandler/ErrorHandler';
import FeedPage from './pages/Feed/Feed';
import SinglePostPage from './pages/Feed/SinglePost/SinglePost';
import LoginPage from './pages/Auth/Login';
import SignupPage from './pages/Auth/Signup';
import './App.css';
import AuthContext from './store/auth';
import { baseURL } from './store/useAxios';

function App(props) {
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const ctx = useContext(AuthContext);

  const {
    token,
    userId,
    isAuth,
    hasError,
  } = ctx;

  const mobileNavHandler = isOpen => {
    setShowMobileNav(isOpen);
    setShowBackdrop(isOpen);
  };

  const backdropClickHandler = () => {
    setShowBackdrop(false);
    setShowMobileNav(false);
    setError(null);
  };

  const loginHandler = (event, authData) => {
    event.preventDefault();
    setAuthLoading(true);
    const requestBody = {
      email: authData.email,
      password: authData.password,
    }
    fetch(`${baseURL}/user/login`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(res => {
        if (res.status === 422) {
          throw new Error('Validation failed.');
        }
        if (res.status !== 200 && res.status !== 201) {
          console.log('Error!');
          throw new Error('Could not authenticate you!');
        }
        return res.json();
      })
      .then(resData => {
        setAuthLoading(false);
        const remainingMilliseconds = 60 * 60 * resData.tokenExpiration * 1000;
        const expiryDate = new Date(
          new Date().getTime() + remainingMilliseconds
        );
        const payload = {
          token: resData.token,
          expiryDate,
          userId: resData.userId,
          refreshToken: resData.refreshToken,
        }
        ctx.login(payload);
      })
      .catch(err => {
        console.log(err);
        setAuthLoading(false);
        setError(err);
      });
  };

  const signupHandler = (event, authData) => {
    event.preventDefault();
    setAuthLoading(true);
    const requestBody = {
      email: authData.signupForm.email.value,
      name: authData.signupForm.name.value,
      password: authData.signupForm.password.value,
    }
    fetch(`${baseURL}/user/signup`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    })
      .then(res => {
        if (res.status === 422) {
          throw new Error(
            "Validation failed. Make sure the email address isn't used yet!"
          );
        }
        if (res.status !== 200 && res.status !== 201) {
          console.log('Error!');
          throw new Error('Creating a user failed!');
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        setAuthLoading(false);
        props.history.replace('/');
      })
      .catch(err => {
        console.log(err);
        setAuthLoading(false);
        setError(err);
      });
  };

  const errorHandler = () => {
    setError(null);
  };

  useEffect(() => {
    setError(hasError);
  }, [hasError])

    let routes = (
      <Switch>
        <Route
          path="/"
          exact
          render={props => (
            <LoginPage
              {...props}
              onLogin={loginHandler}
              loading={authLoading}
            />
          )}
        />
        <Route
          path="/signup"
          exact
          render={props => (
            <SignupPage
              {...props}
              onSignup={signupHandler}
              loading={authLoading}
            />
          )}
        />
        <Redirect to="/" />
      </Switch>
    );
    if (isAuth) {
      routes = (
        <Switch>
          <Route
            path="/"
            exact
            render={props => (
              <FeedPage userId={userId} token={token} />
            )}
          />
          <Route
            path="/:postId"
            render={props => (
              <SinglePostPage
                {...props}
                userId={userId}
                token={token}
              />
            )}
          />
          <Redirect to="/" />
        </Switch>
      );
    }
    return (
      <Fragment>
        {showBackdrop && (
          <Backdrop onClick={backdropClickHandler} />
        )}
        <ErrorHandler error={error} onHandle={errorHandler} />
        <Layout
          header={
            <Toolbar>
              <MainNavigation
                onOpenMobileNav={mobileNavHandler.bind(this, true)}
                onLogout={ctx.logout}
                isAuth={isAuth}
              />
            </Toolbar>
          }
          mobileNav={
            <MobileNavigation
              open={showMobileNav}
              mobile
              onChooseItem={mobileNavHandler.bind(this, false)}
              onLogout={ctx.logout}
              isAuth={isAuth}
            />
          }
        />
        {routes}
      </Fragment>
    );
  }

export default withRouter(App);
