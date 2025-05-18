import React from 'react';

const Terms: React.FC = () => (
  <div className="container-custom py-16 max-w-2xl mx-auto">
    <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
    <p className="text-lg text-gray-600 mb-8">Please read these terms and conditions carefully before using Earshot.</p>
    <div className="text-gray-700 space-y-4">
      <p>By accessing or using our platform, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service.</p>
      <p>[Insert detailed terms of service here. This is placeholder text.]</p>
      <p>For questions, contact us at <a href="mailto:support@earshot.events" className="text-primary-600 underline">support@earshot.events</a>.</p>
    </div>
  </div>
);

export default Terms; 