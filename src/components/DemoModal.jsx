import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DemoModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <motion.div
          className="modal"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <h2 className="modal-title">Book a Demo</h2>
              <p className="modal-subtitle">Fill out the details below and our team will get back to you shortly.</p>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          {submitted ? (
            <motion.div
              className="modal-success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="modal-success-icon">✓</div>
              <h3 className="modal-success-title">Request received!</h3>
              <p className="modal-success-body">We'll be in touch within 24 hours.</p>
              <button className="btn btn--ghost btn--sm" onClick={onClose} style={{ marginTop: 8 }}>Close</button>
            </motion.div>
          ) : (
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Work Email</label>
                <input
                  className="form-input"
                  name="email"
                  type="email"
                  placeholder="john@yourcafe.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Company Name</label>
                <input
                  className="form-input"
                  name="company"
                  type="text"
                  placeholder="Blue Tokai Coffee"
                  value={form.company}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">How can we help?</label>
                <textarea
                  className="form-input form-textarea"
                  name="message"
                  placeholder="Tell us about your café and what you're looking to improve..."
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>

              <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
                Submit Request
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
