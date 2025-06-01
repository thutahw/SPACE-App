// src/pages/BookingPage.jsx

import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import '../styles/BookingPage.css';

export default function BookingPage() {
  const location = useLocation();
  const history = useHistory();
  const { space, startDate, endDate, userId } = location.state || {};

  const [message, setMessage] = useState('');
  const [adFile, setAdFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const apiBaseUrl = process.env.REACT_APP_API_URL;

  if (!space || !startDate || !endDate || !userId) {
    return <p>Missing booking information. Please return to the space detail page.</p>;
  }

  const days = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  );
  const totalPrice = parseFloat(space.price) * days;

  const handleSubmit = async () => {
    if (!adFile) {
      alert("Please upload your ad material");
      return;
    }
    if (!cardName || !cardNumber || !expiry || !cvc) {
      alert("Please enter all payment details");
      return;
    }
    setSubmitting(true);
    try {
      const bookingRes = await fetch(`${apiBaseUrl}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          SpaceId: space.id,
          UserId: userId,
          status: "pending",
          message,
          payment: {
            cardName,
            cardNumber,
            expiry,
            cvc,
          },
        }),
      });

      const booking = await bookingRes.json();

      if (!bookingRes.ok) {
        alert(`Booking failed: ${booking.error || "unknown error"}`);
        return;
      }

      const formData = new FormData();
      formData.append("adImage", adFile);
      formData.append("bookingId", booking.id);

      const uploadRes = await fetch(`${apiBaseUrl}/bookings/upload-ad/${booking.id}`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        alert("Booking was saved, but ad upload failed.");
        return;
      }

      alert("Booking completed successfully!");
      history.push("/bookings");

    } catch (err) {
      console.error("Booking error:", err);
      alert("Unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-wrapper">
      <header className="booking-header">
        <h2>Booking Details</h2>
        <span className="booking-status-badge">pending</span>
      </header>

      <form className="booking-info">
        <div>
          <strong>Ad Space:</strong> {space.title}
        </div>
        <div>
          <strong>Price per day:</strong> ${space.price}
        </div>
        <div>
          <strong>Booking dates:</strong> {startDate} to {endDate} ({days} days)
        </div>
        <div>
          <strong>Total price:</strong> ${totalPrice.toFixed(2)}
        </div>

        <label>
          Upload Ad Material:
          <input
            type="file"
            accept="image/*"
            onChange={e => setAdFile(e.target.files[0])}
          />
        </label>
        <br /><br />
        <label>
          Leave a message:
          <textarea
            rows="4"
            style={{ width: "100%" }}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </label>
        <br /><br />
        <fieldset className="payment-section">
          <legend>Payment Details</legend>
          <div className="payment-fields">
            <label className="payment-label">
              Name on Card:
              <input
                type="text"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                maxLength={40}
                placeholder="Full Name"
                className="payment-input"
                autoComplete="cc-name"
              />
            </label>
            <label className="payment-label">
              Card Number:
              <input
                type="text"
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value)}
                maxLength={19}
                placeholder="1234 5678 9012 3456"
                className="payment-input"
                autoComplete="cc-number"
              />
            </label>
            <label className="payment-label">
              Expiry (MM/YY):
              <input
                type="text"
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                maxLength={5}
                placeholder="MM/YY"
                className="payment-input"
                autoComplete="cc-exp"
              />
            </label>
            <label className="payment-label">
              CVV:
              <input
                type="password"
                value={cvc}
                onChange={e => setCvc(e.target.value)}
                maxLength={4}
                placeholder="CVV"
                className="payment-input"
                autoComplete="cc-csc"
              />
            </label>
          </div>
        </fieldset>
      </form>

      <div className="total-row">Total ${totalPrice.toFixed(2)}</div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="confirm-btn"
      >
        {submitting ? "Submitting..." : "Confirm Booking"}
      </button>
    </div>
  );
};
