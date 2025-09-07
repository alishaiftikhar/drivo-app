// ✅ Full Name
export const validateFullName = (name: string): string => {
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!name.trim()) return 'Full name is required.';
  if (!nameRegex.test(name)) return 'Full name must contain only letters and spaces.';
  return '';
};

// ✅ Password
export const validatePassword = (password: string): string => {
  if (!password.trim()) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return '';
};

// ✅ Confirm Password
export const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword.trim()) return 'Confirm password is required.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return '';
};

// ✅ Age
export const validateAge = (age: string): string => {
  const numAge = parseInt(age);
  if (!age.trim()) return 'Age is required.';
  if (isNaN(numAge)) return 'Age must be a number.';
  if (numAge < 18) return 'You must be at least 18 years old.';
  return '';
};

// ✅ Phone Number (with +92 prefix)
export const validatePhoneNumber = (phone: string): string => {
  if (!phone.trim()) return 'Phone number is required.';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if starts with 92 (country code)
  if (!digits.startsWith('92')) return 'Phone number must start with +92';
  
  // Check total length (92 + 10 digits = 12)
  if (digits.length !== 12) return 'Phone number must be 12 digits after country code';
  
  return '';
};

// ✅ CNIC (13-digit national ID with dashes after 4th and 11th digits)
export const validateCNIC = (cnic: string): string => {
  if (!cnic.trim()) return 'CNIC is required.';
  
  // Remove all non-digit characters
  const digits = cnic.replace(/\D/g, '');
  
  // Check for exactly 13 digits
  if (digits.length !== 13) return 'CNIC must be exactly 13 digits.';
  
  return '';
};

// ✅ Email (Proper format + no spaces)
export const validateEmail = (email: string): string => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) return 'Email is required.';
  if (!emailRegex.test(email)) return 'Enter a valid email address.';
  return '';
};

export const validateAddress = (address: string): string => {
  if (!address.trim()) return 'Address is required.';
  return '';
};

// Auto-formatting functions to use with input fields
export const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length > 10) {
    return '+92' + digits.slice(-10);
  }
  return digits ? '+92' + digits : '';
};

export const formatCNIC = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Truncate to 13 digits
  const truncated = digits.slice(0, 13);
  
  // Format with dashes after 4th and 11th digits (4-7-2 format)
  if (truncated.length <= 4) {
    return truncated;
  } else if (truncated.length <= 11) {
    return `${truncated.slice(0, 4)}-${truncated.slice(4)}`;
  } else {
    return `${truncated.slice(0, 4)}-${truncated.slice(4, 11)}-${truncated.slice(11)}`;
  }
};