// lib/bookings.ts
//
// Used by the public booking form on the website (no login needed).

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type BookingFormData = {
  full_name: string;
  email: string;
  phone?: string;
  check_in?: string; // YYYY-MM-DD
  check_out?: string; // YYYY-MM-DD
  guests?: number;
  hotel_preference?: string;
  message?: string;
  // Any other fields on the form, as text.
  extra?: Record<string, string>;
  // Honeypot: render a hidden input named "website" and pass its value.
  website?: string;
};

export async function submitBooking(
  data: BookingFormData
): Promise<{ reference_number: string; message: string }> {
  const res = await fetch(`${API_URL}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await res.json();
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (res.status === 422) {
        message = "Please check the form and try again.";
      }
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }

  return res.json();
}