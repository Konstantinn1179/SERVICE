// const fetch = require('node-fetch'); // Native fetch is available in Node 18+

async function testBooking() {
  const bookingData = {
    name: "Тест Календаря Финал",
    phone: "+79990001122",
    car_brand: "Toyota",
    car_model: "Camry",
    year: "2022",
    reason: "Тестовая запись для проверки календаря (Trae AI)",
    booking_date: new Date().toISOString().split('T')[0], // Today
    booking_time: "14:00"
  };

  console.log("Sending booking request...", bookingData);

  try {
    const response = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Booking created successfully!");
      console.log("Response:", data);
    } else {
      console.error("❌ Booking failed:", data);
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

testBooking();
