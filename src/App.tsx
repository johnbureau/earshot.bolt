import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';
import Dashboard from './pages/Dashboard';
import MyEvents from './pages/MyEvents';
import Events from './pages/Events';
import Calendar from './pages/Calendar';
import Financials from './pages/Financials';
import Profile from './pages/Profile';
import Profiles from './pages/Profiles';
import Places from './pages/Places';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import EventDetail from './pages/EventDetail';
import EventCreate from './pages/EventCreate';
import Applications from './pages/Applications';
import Social from './pages/Social';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import SideNav from './components/SideNav';
import Header from './components/Header';
import Footer from './components/Footer';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Security from './pages/Security';
import About from './pages/About';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Checkout from './pages/Checkout';
import Subscription from './pages/Subscription';
import ErrorBoundary from './components/ErrorBoundary';
import Subscribe from './pages/Subscribe';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const pathname = window.location.pathname;
  const isChat = pathname.startsWith('/chats');
  const isMyEvents = pathname === '/my-events';
  const isProfiles = pathname.startsWith('/profiles');
  const isPlaces = pathname === '/places';
  const { user } = useAuth();

  // Show footer only on landing page or public pages when not authenticated
  const showFooter = pathname === '/' || 
    (!user && (
      pathname === '/events' || 
      pathname.startsWith('/profiles') || 
      pathname === '/places'
    ));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {user && <SideNav isOpen={isSideNavOpen} onClose={() => setIsSideNavOpen(false)} />}
      
      <main className={`flex-grow ${user ? 'lg:pl-64' : ''} pt-16`}>
        {children}
      </main>
      
      {showFooter && (
        <div className={`${user ? 'lg:pl-64' : ''}`}>
          <Footer />
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Public Routes with AppLayout */}
              <Route path="/events" element={<AppLayout><Events /></AppLayout>} />
              <Route path="/profiles" element={<AppLayout><Profiles /></AppLayout>} />
              <Route path="/profiles/:id" element={<AppLayout><Profiles /></AppLayout>} />
              <Route path="/places" element={<AppLayout><Places /></AppLayout>} />
              <Route path="/pricing" element={<AppLayout><Pricing /></AppLayout>} />
              <Route path="/subscription" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Subscription />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route 
                path="/role-selection" 
                element={
                  <ProtectedRoute>
                    <RoleSelection />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requireRole>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/my-events" 
                element={
                  <ProtectedRoute requireRole>
                    <AppLayout>
                      <MyEvents />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/calendar" 
                element={
                  <ProtectedRoute requireRole>
                    <AppLayout>
                      <Calendar />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/financials" 
                element={
                  <ProtectedRoute requireRole>
                    <AppLayout>
                      <Financials />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute requireRole>
                    <AppLayout>
                      <Profile />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute requireRole>
                    <AppLayout>
                      <Notifications />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/social" 
                element={
                  <ProtectedRoute requireRole>
                    <AppLayout>
                      <Social />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/events/create" 
                element={
                  <ProtectedRoute requireRole>
                    <AppLayout>
                      <EventCreate />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/events/:id" 
                element={
                  <ProtectedRoute requireRole>
                    <AppLayout>
                      <EventDetail />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/chats/:id?" 
                element={
                  <ProtectedRoute requireRole>
                    <AppLayout>
                      <Chat />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/applications" 
                element={
                  <ProtectedRoute requireRole>
                    <AppLayout>
                      <Applications />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/features" element={<AppLayout><Features /></AppLayout>} />
              <Route path="/security" element={<AppLayout><Security /></AppLayout>} />
              <Route path="/about" element={<AppLayout><About /></AppLayout>} />
              <Route path="/careers" element={<AppLayout><Careers /></AppLayout>} />
              <Route path="/contact" element={<AppLayout><Contact /></AppLayout>} />
              <Route path="/terms" element={<AppLayout><Terms /></AppLayout>} />
              <Route path="/privacy" element={<AppLayout><Privacy /></AppLayout>} />
              <Route path="/cookies" element={<AppLayout><Cookies /></AppLayout>} />
              <Route path="/checkout" element={<AppLayout><Checkout /></AppLayout>} />
              
              <Route 
                path="/subscribe/:priceId" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Subscribe />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;