// src/pages/BookingPage.jsx

import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

const BookingPage = () => {
  const location = useLocation();
  const history = useHistory();
  const { space, startDate, endDate, userId } = location.state || {};

  const [message, setMessage] = useState('');
  const [adFile, setAdFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    <div style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Confirm Booking</h1>
      <p><strong>Ad Space:</strong> {space.title}</p>
      <p><strong>Price per day:</strong> ${space.price}</p>
      <p><strong>Booking dates:</strong> {startDate} to {endDate} ({days} days)</p>
      <p><strong>Total price:</strong> ${totalPrice.toFixed(2)}</p>

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

      <br />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#004aad",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        {submitting ? "Submitting..." : "Confirm Booking"}
      </button>
    </div>
  );
};

export default BookingPage;





// import React, { useState } from 'react';
// import { useLocation, useHistory } from 'react-router-dom';

// const BookingPage = () => {
//   const location = useLocation();
//   const history = useHistory();
//   const { space, startDate, endDate, userId } = location.state || {};

//   const [message, setMessage] = useState('');
//   const [adFile, setAdFile] = useState(null);
//   const [submitting, setSubmitting] = useState(false);

//   if (!space || !startDate || !endDate || !userId) {
//     return <p>Missing booking information. Please return to the space detail page.</p>;
//   }

//   const days = Math.ceil(
//     (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
//   );
//   const totalPrice = parseFloat(space.price) * days;

//   const handleSubmit = async () => {
//     if (!adFile) {
//       alert("Please upload your ad material");
//       return;
//     }

//     setSubmitting(true);

//     try {
//       // Step 1: Create booking in DB
//       const bookingRes = await fetch("http://localhost:4000/bookings", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           startDate,
//           endDate,
//           SpaceId: space.id,
//           UserId: userId,
//           status: "pending",
//           message,
//         }),
//       });

//       const booking = await bookingRes.json();

//       if (!bookingRes.ok) {
//         alert(`Booking failed: ${booking.error || "unknown error"}`);
//         return;
//       }

//       // Step 2: Upload ad file
//       const formData = new FormData();
//       formData.append("adImage", adFile);
//       formData.append("bookingId", booking.id);

//       const uploadRes = await fetch(`http://localhost:4000/bookings/upload-ad/${booking.id}`, {
//         method: "POST",
//         body: formData,
//       });

//       if (!uploadRes.ok) {
//         alert("Booking was saved, but ad upload failed.");
//         return;
//       }

//       alert("Booking completed successfully!");
//       history.push("/bookings");

//     } catch (err) {
//       console.error("Booking error:", err);
//       alert("Unexpected error occurred.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
//       <h1>Confirm Booking</h1>
//       <p><strong>Ad Space:</strong> {space.title}</p>
//       <p><strong>Price per day:</strong> ${space.price}</p>
//       <p><strong>Booking dates:</strong> {startDate} to {endDate} ({days} days)</p>
//       <p><strong>Total price:</strong> ${totalPrice.toFixed(2)}</p>

//       <label>
//         Upload Ad Material:
//         <input
//           type="file"
//           accept="image/*"
//           onChange={e => setAdFile(e.target.files[0])}
//         />
//       </label>

//       <br /><br />

//       <label>
//         Leave a message:
//         <textarea
//           rows="4"
//           style={{ width: "100%" }}
//           value={message}
//           onChange={e => setMessage(e.target.value)}
//         />
//       </label>

//       <br />
//       <button
//         onClick={handleSubmit}
//         disabled={submitting}
//         style={{
//           padding: "0.75rem 1.5rem",
//           backgroundColor: "#004aad",
//           color: "white",
//           border: "none",
//           borderRadius: "4px",
//           cursor: "pointer",
//           fontSize: "1rem",
//         }}
//       >
//         {submitting ? "Submitting..." : "Confirm Booking"}
//       </button>
//     </div>
//   );
// };

// export default BookingPage;
