import React from 'react';
import { NavLink } from 'react-router-dom';

import './NavigationItems.css';

const navItems = [
  { id: 'feed', text: 'Feed', link: '/', auth: true },
  { id: 'login', text: 'Login', link: '/', auth: false },
  { id: 'signup', text: 'Signup', link: '/signup', auth: false },
];

const navigationItems = props => {
  return (
    <ul>
      {navItems.filter(item => item.auth === props.isAuth).map(item => (
        <li
          key={item.id}
          className={['navigation-item', props.mobile ? 'mobile' : ''].join(' ')}
        >
          <NavLink to={item.link} exact onClick={props.onChoose}>
            {item.text}
          </NavLink>
        </li>
      ))}
      {props.isAuth && (
        <li className={['navigation-item', props.mobile ? 'mobile' : ''].join(' ')} key="logout-11">
          <button onClick={props.onLogout}>Logout</button>
        </li>
      )}
    </ul>
  )
};

export default navigationItems;
