import React from 'react';

const Security: React.FC = () => (
  <div className="container-custom py-16">
    <h1 className="text-4xl font-bold mb-4">Security</h1>
    <p className="text-lg text-gray-600 mb-8">Your data and privacy are our top priorities. Learn how we keep your information safe.</p>
    <ul className="space-y-6">
      <li>
        <span className="font-semibold text-primary-600">Data Encryption:</span> All sensitive data is encrypted in transit and at rest.
      </li>
      <li>
        <span className="font-semibold text-primary-600">Regular Audits:</span> We conduct regular security audits and vulnerability assessments.
      </li>
      <li>
        <span className="font-semibold text-primary-600">GDPR & CCPA Compliant:</span> We adhere to global privacy standards and regulations.
      </li>
      <li>
        <span className="font-semibold text-primary-600">Access Controls:</span> Strict access controls ensure only authorized users can access your data.
      </li>
      <li>
        <span className="font-semibold text-primary-600">Incident Response:</span> Our team is prepared to respond quickly to any security incidents.
      </li>
    </ul>
  </div>
);

export default Security; 