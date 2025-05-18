import React, { useState } from 'react';

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Placeholder: send form data to backend or email service
  };

  return (
    <div className="container-custom py-16 max-w-xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
      <p className="text-lg text-gray-600 mb-8">Have a question or want to get in touch? Fill out the form below and our team will respond soon.</p>
      {submitted ? (
        <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl text-center">
          Thank you for reaching out! We'll get back to you soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-full font-semibold">Send Message</button>
        </form>
      )}
    </div>
  );
};

export default Contact; 