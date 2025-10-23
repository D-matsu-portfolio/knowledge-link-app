import { Routes, Route } from 'react-router-dom';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import UserList from './pages/UserList';
import UserProfile from './pages/UserProfile';
import Commitments from './pages/Commitments';
import Chat from './pages/Chat';

function App() {
  return (
    <Routes>
      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
      <Route path="/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/commitments" element={<ProtectedRoute><Commitments /></ProtectedRoute>} />
      <Route path="/chat/:commitmentId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

      {/* Public Routes */}
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
