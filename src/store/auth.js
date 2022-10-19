import axios from "axios";
import React, { useState, useCallback } from "react";
import { baseURL } from "./useAxios";

const AuthContext = React.createContext({
    token: null,
    userId: null,
    isAuth: false,
    login: (payload) => {},
    logout: (payload) => {},
    hasError: false,
    setToken: () => {},
    setIsAuth: () => {},
    setHasError: () => {},
    setRefreshToken: () => {},
    setUserId: () => {},
});

const calculateRemainingTime = (expirationTime) => {
    const currentTime = new Date().getTime();
    const adjExpirationTime = new Date(expirationTime).getTime();
  
    const remainingDuration = adjExpirationTime - currentTime;
  
    return remainingDuration;
};

const retrieveStoredToken = () => {
    const storedToken = localStorage.getItem('access_token');
    const storedExpirationDate = localStorage.getItem('expiryDate');
    const storedUserId = localStorage.getItem('userId');
    const storedRefreshToken = localStorage.getItem('refresh_token');
  
    const remainingTime = calculateRemainingTime(storedExpirationDate);

    return {
        token: storedToken,
        duration: remainingTime,
        userId: storedUserId,
        refreshToken: storedRefreshToken,
    };
};

export const AuthContextProvider = (props) => {
    const tokenData = retrieveStoredToken();

  let initialToken;
  let initialUserId;
  let initialRefreshToken;
  let initialAuth;
  if (tokenData) {
    initialToken = tokenData.token;
    initialUserId =  tokenData.userId;
    initialRefreshToken = tokenData.refreshToken;
    initialAuth = !!tokenData.token;
  }

  const [token, setToken] = useState(initialToken);
  const [userId, setUserId] = useState(initialUserId);
  const [refreshToken, setRefreshToken] = useState(initialRefreshToken);
  const [isAuth, setIsAuth] = useState(initialAuth);
  const [hasError, setHasError] = useState(false);

    const logout = useCallback(() => {
        async function deleteFromDB() {
            try {
                const res = await axios.delete(`${baseURL}/user/logout/${userId}`);
                console.log(res.data);
            } catch (err) {
                console.log(err);
            } finally {
                localStorage.removeItem('access_token');
                localStorage.removeItem('expiryDate');
                localStorage.removeItem('userId');
                localStorage.removeItem('remainingTime');
                localStorage.removeItem('refresh_token');
                setToken(null);
                setUserId(null);
                setRefreshToken(null);
                setIsAuth(false);
                setHasError(false);
            }
        }
        deleteFromDB();
    }, []);

    const login = (payload) => {
        const {
            token: accessToken,
            refreshToken,
            userId,
            expiryDate,
        } = payload;

        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('userId', userId);
        localStorage.setItem('expiryDate', expiryDate);
        const remainingDuration = calculateRemainingTime(expiryDate);
        localStorage.setItem('remainingTime', remainingDuration);
        setToken(accessToken);
        setUserId(userId);
        setRefreshToken(refreshToken);
        setIsAuth(true);
        setHasError(false);
    };

    const AUTH_STATE = {
        token,
        userId,
        login,
        logout,
        isAuth,
        refreshToken,
        hasError,
        setToken,
        setIsAuth,
        setHasError,
        setRefreshToken,
        setUserId,
    }

    return (
        <AuthContext.Provider value={AUTH_STATE}>
            {props.children}
        </AuthContext.Provider>
    )
};

export default AuthContext;