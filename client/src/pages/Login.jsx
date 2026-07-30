import React, { useState, useContext } from 'react';
import { AuthContext, ToastContext } from '../App';

export default function Login() {
  const { login, request, theme, setTheme } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all credentials.', 'warning');
      return;
    }

    try {
      const res = await request('/auth/login', 'POST', { email, password });
      if (res.success) {
        login(res.token, res.user);
        showToast('Authenticated successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="view-panel login-view">
      <div className="login-card-glow"></div>
      <div className="login-card">
        
        {/* Toggle Theme Inside Login Card */}
        <button 
          type="button" 
          className="btn-theme-toggle login-theme-toggle" 
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          <i className={theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
        </button>

        <div className="login-header">
          <div class="app-logo">
            <i class="fa-solid fa-graduation-cap logo-icon"></i>
            <span>EDUNEX</span>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="login-form">
          <div className="form-group">
            <label><i className="fa-regular fa-envelope"></i> Email Address</label>
            <input 
              type="email" 
              placeholder="name@school.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label><i className="fa-solid fa-lock"></i> Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="btn-icon-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            <span>Sign In</span>
            <i className="fa-solid fa-arrow-right-to-bracket"></i>
          </button>
        </form>

        <div className="login-footer">
          <p>Demo Accounts:</p>
          <div className="demo-accounts">
            <button 
              className="btn-demo-fill" 
              onClick={() => handleFillDemo('admin@school.com', 'admin123')}
            >
              Admin
            </button>
            <button 
              className="btn-demo-fill" 
              onClick={() => handleFillDemo('john.doe@school.com', 'teacher123')}
            >
              Teacher
            </button>
            <button 
              className="btn-demo-fill" 
              onClick={() => handleFillDemo('student1@school.com', 'student123')}
            >
              Student
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
