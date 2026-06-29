
export function loadStripeScript() {
  return new Promise((resolve) => {
    if (window.Stripe) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      console.log('[Payments] Stripe.js script loaded successfully.');
      resolve(true);
    };
    script.onerror = () => {
      console.error('[Payments] Failed to load Stripe.js script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      console.log('[Payments] Razorpay checkout script loaded successfully.');
      resolve(true);
    };
    script.onerror = () => {
      console.error('[Payments] Failed to load Razorpay checkout script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
