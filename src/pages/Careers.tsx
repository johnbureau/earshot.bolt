import React from 'react';

const Careers: React.FC = () => (
  <div className="container-custom py-16">
    <h1 className="text-4xl font-bold mb-4">Careers</h1>
    <p className="text-lg text-gray-600 mb-8">Join our team and help shape the future of live events and creator collaboration.</p>
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Open Positions</h2>
        <ul className="space-y-4">
          <li className="border rounded-lg p-4">
            <div className="font-semibold">Frontend Engineer</div>
            <div className="text-sm text-gray-500 mb-2">Remote · Full Time</div>
            <div className="text-gray-700">Help us build beautiful, performant user experiences for event organizers and creators.</div>
          </li>
          <li className="border rounded-lg p-4">
            <div className="font-semibold">Community Manager</div>
            <div className="text-sm text-gray-500 mb-2">Remote · Part Time</div>
            <div className="text-gray-700">Grow and support our vibrant community of hosts and creators.</div>
          </li>
          <li className="border rounded-lg p-4">
            <div className="font-semibold">Product Designer</div>
            <div className="text-sm text-gray-500 mb-2">Remote · Contract</div>
            <div className="text-gray-700">Design intuitive, delightful interfaces for our platform.</div>
          </li>
        </ul>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-2">Don't see your role?</h2>
        <p className="text-gray-700">We're always looking for talented people. Email <a href="mailto:careers@earshot.events" className="text-primary-600 underline">careers@earshot.events</a> to introduce yourself!</p>
      </div>
    </div>
  </div>
);

export default Careers; 