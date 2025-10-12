// Utility untuk validasi dan troubleshoot ngrok URL
export const validateNgrokUrl = (url) => {
  if (!url) {
    return {
      valid: false,
      error: 'URL is required',
      suggestion: 'Set NEXT_PUBLIC_API_URL in your .env.local file'
    };
  }

  // Check if it's a valid ngrok URL
  const ngrokPattern = /^https:\/\/.*\.ngrok(-free)?\.dev/;
  if (!ngrokPattern.test(url)) {
    return {
      valid: false,
      error: 'Not a valid ngrok URL',
      suggestion: 'URL should be in format: https://your-subdomain.ngrok-free.dev'
    };
  }

  return {
    valid: true,
    error: null,
    suggestion: null
  };
};

export const getNgrokTroubleshootingSteps = () => {
  return [
    '1. Check if ngrok is running: ngrok status',
    '2. Restart ngrok: ngrok http 3001 (or your port)',
    '3. Update NEXT_PUBLIC_API_URL with new ngrok URL',
    '4. Restart Next.js dev server: npm run dev',
    '5. Clear browser cache (Ctrl + Shift + R)',
    '6. Make sure API server is running on the specified port'
  ];
};

export const logNgrokInfo = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const validation = validateNgrokUrl(apiUrl);
  
  console.group('🚀 Ngrok Configuration');
  console.log('API URL:', apiUrl);
  console.log('Valid:', validation.valid);
  if (!validation.valid) {
    console.error('Error:', validation.error);
    console.log('Suggestion:', validation.suggestion);
    console.log('Troubleshooting Steps:', getNgrokTroubleshootingSteps());
  }
  console.groupEnd();
  
  return validation;
};