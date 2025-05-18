import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  Star, 
  Zap, 
  Shield, 
  Music, 
  Mic, 
  CheckCircle,
  BarChart2,
  Bell,
  CreditCard,
  FileText,
  Settings,
  Globe
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  color: string;
  delay: number;
}> = ({ icon, title, description, features, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
  >
    <div className={`w-12 h-12 mb-6 flex items-center justify-center ${color} rounded-xl`}>
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <motion.li
          key={index}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: delay + (index * 0.1) }}
          className="flex items-center text-sm text-gray-600"
        >
          <CheckCircle size={16} className={`mr-2 ${color.replace('bg-', 'text-')}`} />
          {feature}
        </motion.li>
      ))}
    </ul>
  </motion.div>
);

const Features: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <Calendar size={24} />,
      title: "Smart Booking",
      description: "Streamline your event scheduling and management with our intelligent booking system.",
      features: [
        "Automated scheduling and calendar sync",
        "Real-time availability tracking",
        "Custom booking rules and preferences",
        "Automated reminders and notifications"
      ],
      color: "bg-primary-100 text-primary-600"
    },
    {
      icon: <Users size={24} />,
      title: "Talent Management",
      description: "Find and manage top talent with our comprehensive creator management tools.",
      features: [
        "Verified creator profiles",
        "Performance tracking and reviews",
        "Talent matching algorithm",
        "Background checks and verification"
      ],
      color: "bg-accent-100 text-accent-600"
    },
    {
      icon: <MessageSquare size={24} />,
      title: "Communication Hub",
      description: "Keep all event-related communication in one secure, organized place.",
      features: [
        "Real-time messaging and updates",
        "File sharing and collaboration",
        "Automated notifications",
        "Communication history tracking"
      ],
      color: "bg-secondary-100 text-secondary-600"
    },
    {
      icon: <Zap size={24} />,
      title: "Fast Payments",
      description: "Handle all financial transactions securely and efficiently.",
      features: [
        "Instant payment processing",
        "Automated invoicing",
        "Financial reporting and analytics",
        "Secure payment gateway integration"
      ],
      color: "bg-primary-100 text-primary-600"
    },
    {
      icon: <Shield size={24} />,
      title: "Security & Compliance",
      description: "Enterprise-grade security to protect your data and transactions.",
      features: [
        "End-to-end encryption",
        "GDPR compliance",
        "Regular security audits",
        "Data backup and recovery"
      ],
      color: "bg-accent-100 text-accent-600"
    },
    {
      icon: <BarChart2 size={24} />,
      title: "Analytics & Insights",
      description: "Make data-driven decisions with comprehensive analytics.",
      features: [
        "Real-time performance metrics",
        "Custom reporting tools",
        "Trend analysis and forecasting",
        "ROI tracking"
      ],
      color: "bg-secondary-100 text-secondary-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Powerful Features for Modern Events
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              Everything you need to manage events, connect with talent, and create unforgettable experiences.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to={user ? "/dashboard" : "/signup"}>
                <Button
                  variant="accent"
                  size="lg"
                >
                  {user ? "Go to Dashboard" : "Get Started Free"}
                </Button>
              </Link>
              <Link to="/pricing">
                <Button
                  variant="outline"
                  size="lg"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything You Need</h2>
            <p className="text-xl text-gray-600">
              Powerful tools and features to help you succeed
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                {...feature}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of successful event organizers who trust Earshot
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to={user ? "/dashboard" : "/signup"}>
                <Button
                  variant="accent"
                  size="lg"
                >
                  {user ? "Go to Dashboard" : "Start Free Trial"}
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant="outline"
                  size="lg"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Features; 