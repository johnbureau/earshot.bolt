import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Calendar, Users, MessageSquare, Star, Zap, Shield, ChevronRight, Music, Mic, TrendingUp, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/ui/Button';

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="bg-white">
      <Header />
      
      {/* Hero Section - Modern */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white pt-16 md:pt-32 pb-16 md:pb-32 px-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container-custom relative">
          <div className="max-w-4xl mx-auto text-center pt-8 md:pt-0">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6 md:mb-8 animate-fade-in">
              <Zap size={16} />
              <span>Revolutionizing Event Management</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800 leading-tight md:leading-tight pb-1">
              Precision Events at Your Fingertips
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto px-2">
              The all-in-one platform that transforms how you manage events and talent bookings. 
              Streamline your workflow, boost revenue, and deliver exceptional experiences.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8 md:mb-12">
              <Link to={user ? "/dashboard" : "/signup"}>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto group"
                >
                  {user ? "Go to Dashboard" : "Get Started - It's Free"}
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto hover:bg-gray-50 transition-colors"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview with Gradient Overlay */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>
            <div className="rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
              <img
                src="/assets/images/dashboard-preview.png"
                alt="Earshot Dashboard"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Trusted by Industry Leaders</h2>
            <p className="text-gray-600">Join thousands of successful event organizers who trust Earshot</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-16">
            {[
              { number: "10K+", label: "Events Managed" },
              { number: "98%", label: "Customer Satisfaction" },
              { number: "$50M+", label: "Revenue Generated" },
              { number: "50K+", label: "Active Users" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star size={16} />
              <span>Powerful Features</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600">
              A comprehensive suite of tools designed to make event management seamless and profitable.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-24">
            {[
              {
                icon: <Calendar className="text-primary-600" size={24} />,
                title: "Smart Scheduling",
                description: "Intelligent calendar management with conflict detection and automated reminders."
              },
              {
                icon: <Users className="text-primary-600" size={24} />,
                title: "Talent Management",
                description: "Streamlined booking process with integrated contracts and payment processing."
              },
              {
                icon: <MessageSquare className="text-primary-600" size={24} />,
                title: "Communication Hub",
                description: "Centralized messaging system for seamless coordination with all stakeholders."
              },
              {
                icon: <TrendingUp className="text-primary-600" size={24} />,
                title: "Analytics Dashboard",
                description: "Real-time insights and reporting to optimize your event performance."
              },
              {
                icon: <Shield className="text-primary-600" size={24} />,
                title: "Secure Payments",
                description: "PCI-compliant payment processing with automated invoicing and payouts."
              },
              {
                icon: <Mic className="text-primary-600" size={24} />,
                title: "Artist Relations",
                description: "Comprehensive artist profiles, riders, and technical requirements management."
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 group"
              >
                <div className="mb-4 p-3 bg-primary-50 rounded-lg inline-block group-hover:bg-primary-100 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Feature Showcase */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center mb-16 md:mb-32">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
                <Zap size={16} />
                <span>Streamlined Workflow</span>
              </div>
              <h3 className="text-3xl font-bold mb-6">The only platform you'll ever need. Simple.</h3>
              <p className="text-gray-600 mb-8">
                Manage your entire event lifecycle from a single dashboard. From talent booking to payment processing, we've got you covered.
              </p>
              <ul className="space-y-4">
                {[
                  "Automated booking confirmations",
                  "Integrated payment processing",
                  "Real-time analytics and reporting",
                  "Custom branding options"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="p-1 bg-primary-100 rounded-full">
                      <CheckCircle className="text-primary-600" size={16} />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg transform hover:scale-[1.02] transition-transform duration-500">
              <img
                src="/assets/images/feature-booking.png"
                alt="Booking Feature"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-lg transform hover:scale-[1.02] transition-transform duration-500">
              <img
                src="/assets/images/feature-analytics.png"
                alt="Analytics Feature"
                className="w-full"
              />
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
                <TrendingUp size={16} />
                <span>Data-Driven Insights</span>
              </div>
              <h3 className="text-3xl font-bold mb-6">Powerful insights at your fingertips</h3>
              <p className="text-gray-600 mb-8">
                Make data-driven decisions with comprehensive analytics and reporting tools designed for event professionals.
              </p>
              <ul className="space-y-4">
                {[
                  "Revenue tracking and forecasting",
                  "Performance metrics dashboard",
                  "Customizable reports",
                  "Trend analysis and insights"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="p-1 bg-primary-100 rounded-full">
                      <CheckCircle className="text-primary-600" size={16} />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Zap size={16} />
              <span>Simple Pricing</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Choose Your Perfect Plan</h2>
            <p className="text-xl text-gray-600">
              Start free and scale as you grow. No hidden fees.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto px-4 md:px-0">
            {[
              {
                name: "Starter",
                price: "$20",
                description: "Perfect for individual creators and small events",
                features: [
                  "Up to 12 events per month",
                  "Booking management",
                  "Chat enabled",
                  "Payment processing",
                  "Basic analytics"
                ],
                icon: <Star className="text-primary-600" size={24} />,
                popular: false,
                cta: "Start Free Trial"
              },
              {
                name: "Professional",
                price: "$40",
                description: "Ideal for growing businesses and professional creators",
                features: [
                  "Up to 30 events per month",
                  "Booking management",
                  "Chat enabled",
                  "Payment processing",
                  "Basic analytics",
                  "Advanced analytics",
                  "Financial reporting",
                  "Social Post Accelerator",
                  "Priority support"
                ],
                icon: <Zap className="text-accent-600" size={24} />,
                popular: true,
                cta: "Start Free Trial"
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "Custom solutions for large organizations",
                features: [
                  "Unlimited events",
                  "Booking management",
                  "Chat enabled",
                  "Payment processing",
                  "Basic analytics",
                  "Advanced analytics",
                  "Financial reporting",
                  "Social Post Accelerator",
                  "Priority support",
                  "Dedicated support team",
                  "Custom integrations"
                ],
                icon: <Shield className="text-secondary-600" size={24} />,
                popular: false,
                cta: "Contact Sales"
              }
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`
                  relative bg-white rounded-2xl p-6 md:p-8 
                  ${plan.popular ? 'ring-2 ring-primary-600 shadow-xl md:scale-105' : 'border border-gray-200 shadow-lg'} 
                  hover:shadow-xl transition-all duration-200
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${plan.name === "Starter" ? "bg-primary-100" : plan.name === "Professional" ? "bg-accent-100" : "bg-secondary-100"}`}>
                    {plan.icon}
                  </div>
                  <div className="text-xl font-bold">{plan.name}</div>
                </div>
                
                <div className="flex items-end gap-1 mb-2">
                  <div className="text-4xl font-bold">{plan.price}</div>
                  {plan.price !== "Custom" && (
                    <div className="text-gray-600 mb-1">/month</div>
                  )}
                </div>
                <div className="text-gray-600 mb-8">{plan.description}</div>
                
                <Link to={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                  <Button
                    variant={plan.popular ? "primary" : "outline"}
                    className="w-full mb-8"
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <div className="space-y-4">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className={`p-1 rounded-full ${plan.popular ? 'bg-primary-100' : 'bg-gray-100'}`}>
                        <CheckCircle className={`${plan.popular ? 'text-primary-600' : 'text-gray-600'}`} size={16} />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to streamline your workflow?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of successful event organizers who trust Earshot
            </p>
            <Link to={user ? "/dashboard" : "/signup"}>
              <Button
                variant="primary"
                size="lg"
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 md:py-16">
        <div className="container-custom px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
            <div>
              <h3 className="text-xl font-bold mb-4">Earshot</h3>
              <p className="text-gray-600">
                Making event management seamless and profitable.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/pricing">Pricing</Link></li>
                <li><Link to="/security">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link to="/about">About</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link to="/terms">Terms</Link></li>
                <li><Link to="/privacy">Privacy</Link></li>
                <li><Link to="/cookies">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-600 text-sm">
            <p>&copy; {new Date().getFullYear()} Earshot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;