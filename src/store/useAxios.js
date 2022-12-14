import axios from 'axios'
import jwt_decode from "jwt-decode";
import dayjs from 'dayjs'
import { useContext } from 'react'
import AuthContext from './auth'

export const baseURL = 'https://restapibe-production.up.railway.app';


const useAxios = () => {
    const { token, setToken, userId, setUserId, setIsAuth,
         refreshToken, logout, setRefreshToken } = useContext(AuthContext);

    const axiosInstance = axios.create({
        baseURL,
        headers: { Authorization: `Bearer ${token}` }
    });


    axiosInstance.interceptors.request.use(async req => {
    
        const user = jwt_decode(token)
        const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;
    
        if(!isExpired) return req;
        const authData = {
            refreshToken: `Bearer ${refreshToken}`,
        }
        try {
            const response = await axios.put(`${baseURL}/user/refresh/${userId}`, authData);
            console.log(response.data);
            console.log('resfresh Call');
            localStorage.setItem('access_token', response.data.token);
            localStorage.setItem('userId', response.data.userId);
            localStorage.setItem('refresh_token', response.data.refreshToken);
            
            setToken(response.data.token);
            setUserId(response.data.userId);
            setRefreshToken(response.data.refreshToken);
            req.headers.Authorization = `Bearer ${response.data.token}`
            return req;

        } catch (err) {
            setIsAuth(false);
            logout();
        }
    })
    
    return axiosInstance
}

export default useAxios;