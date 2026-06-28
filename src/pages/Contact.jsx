import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <Navbar />

      <section style={{ background: 'var(--gradient-dark)', minHeight: '80vh', padding: '4rem 0' }}>
        <div className="container">
          <h2 className="section-title"><i className="fas fa-envelope me-2" style={{ fontSize: '0.7em' }}></i> Contact Us</h2>
          <p className="section-subtitle">We&apos;re here for you 24/7, partner</p>

          <div className="row g-4 justify-content-center">
            <div className="col-lg-8">
              <div className="deposit-form-card" style={{ maxWidth: '100%' }}>
                {!submitted ? (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="contactName">
                          <i className="fas fa-user me-1"></i> Your Name
                        </label>
                        <input type="text" className="form-control" id="contactName" placeholder="Full name" required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="contactEmail">
                          <i className="fas fa-envelope me-1"></i> Email
                        </label>
                        <input type="email" className="form-control" id="contactEmail" placeholder="your@email.com" required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="contactPhone">
                          <i className="fas fa-phone me-1"></i> Phone (optional)
                        </label>
                        <input type="tel" className="form-control" id="contactPhone" placeholder="(555) 123-4567" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="contactSubject">
                          <i className="fas fa-tag me-1"></i> Subject
                        </label>
                        <select className="form-control" id="contactSubject" required defaultValue="">
                          <option value="" disabled>Select topic...</option>
                          <option value="deposit">Deposit Issue</option>
                          <option value="redeem">Redemption Request</option>
                          <option value="account">Account Help</option>
                          <option value="bonus">Bonus Inquiry</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label" htmlFor="contactUsername">
                          <i className="fas fa-gamepad me-1"></i> Game Username
                        </label>
                        <input type="text" className="form-control" id="contactUsername" placeholder="Your in-game username" />
                      </div>
                      <div className="col-12">
                        <label className="form-label" htmlFor="contactMsg">
                          <i className="fas fa-comment me-1"></i> Message
                        </label>
                        <textarea className="form-control" id="contactMsg" rows="5" placeholder="How can we help you?" required></textarea>
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn-texas w-100 text-center">
                          <i className="fas fa-paper-plane me-2"></i>Send Message
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="success-box">
                    <i className="fas fa-check-circle me-1"></i> Message sent! We&apos;ll get back to you ASAP.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row g-4 mt-4 justify-content-center">
            <div className="col-md-4">
              <div className="card-texas text-center">
                <div className="card-icon mx-auto"><i className="fab fa-telegram"></i></div>
                <h5 className="card-title">Telegram</h5>
                <p className="card-text">Message us on Telegram for the fastest response. Available 24/7.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card-texas text-center">
                <div className="card-icon mx-auto"><i className="fas fa-clock"></i></div>
                <h5 className="card-title">Response Time</h5>
                <p className="card-text">Average response time is under 15 minutes. We don&apos;t keep you waiting.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card-texas text-center">
                <div className="card-icon mx-auto"><i className="fas fa-headset"></i></div>
                <h5 className="card-title">24/7 Support</h5>
                <p className="card-text">Our support team is available around the clock, every day of the year.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer minimal />
    </>
  );
}
