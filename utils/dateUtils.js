// utils/dateUtils.js

export const getIndianFormattedDate = (date = new Date()) => {
  return new Date(date).toLocaleString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

export const getIndianFormattedDateTime = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ==========================================
// WhatsApp Event Date
// Example: 21 May 2026 - 24 May 2026
// ==========================================
export const formatWhatsAppEventDate = (startDate, endDate) => {
  if (!startDate) return "N/A";

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const start = formatDate(startDate);

  if (!endDate) {
    return start;
  }

  const end = formatDate(endDate);

  return `${start} - ${end}`;
};
