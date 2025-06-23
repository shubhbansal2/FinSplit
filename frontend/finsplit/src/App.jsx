import React from 'react'

import{
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import Home from './pages/Dashboard/Home.jsx';
import Income from './pages/Dashboard/Income';
import Expense from './pages/Dashboard/Expense';
import BillBuddy from './pages/Dashboard/BillBuddy';
import BillBuddyGroup from './pages/Dashboard/BillBuddyGroup';
import UserProvider from './context/UserContext';

const App = () => {
  return (
    <UserProvider>
      <div>
        <Router>
          <Routes>
            <Route path="/" element={<Root />}/>
            <Route path='/login' exact element={<Login />}/>
            <Route path='/signup' exact element={<SignUp />}/>
            <Route path='/dashboard' exact element={<Home />}/>
            <Route path='/income' exact element={<Income />}/>
            <Route path='/expense' exact element={<Expense />}/>
            <Route path='/billbuddy' exact element={<BillBuddy />}/>
            <Route path='/billbuddy/group/:groupId' element={<BillBuddyGroup />} />
          </Routes>
        </Router>
      </div>
      </UserProvider>
  )
}

export default App

const Root = () => {
    // Check if token exists in localStorage
    const isAuthenticated = !!localStorage.getItem("token");

    // Redirect to dashboard if authenticated, otherwise to login
    return isAuthenticated ? (
        <Navigate to="/dashboard" />
    ) : (
        <Navigate to="/login" />
    );
};