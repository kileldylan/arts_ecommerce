// backend/utils/mpesaUtils.js

// Generate timestamp in the format required by M-Pesa (YYYYMMDDHHmmss)
const generateTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Format phone number to 2547XXXXXXXX format
const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('0')) {
    // Convert 07... to 2547...
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7')) {
    // Convert 7... to 2547...
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('+254')) {
    // Remove the + from +254...
    cleaned = cleaned.substring(1);
  }
  
  // Ensure it's exactly 12 digits
  if (cleaned.length !== 12) {
    throw new Error('Invalid phone number format');
  }
  
  return cleaned;
};

module.exports = {
  generateTimestamp,
  formatPhoneNumber
};