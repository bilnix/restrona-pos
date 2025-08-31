import { 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  signInWithCredential 
} from 'firebase/auth';
import { auth, setupRecaptcha, clearRecaptcha } from '../firebase/config';

class PhoneAuthService {
  constructor() {
    this.verificationId = null;
    this.recaptchaVerifier = null;
  }

  // Setup reCAPTCHA for phone auth
  setupRecaptcha(containerId) {
    try {
      console.log('🔐 Setting up reCAPTCHA for container:', containerId);
      
      // Clear any existing reCAPTCHA first
      if (this.recaptchaVerifier) {
        try {
          console.log('🧹 Clearing existing reCAPTCHA verifier...');
          this.recaptchaVerifier.clear();
          this.recaptchaVerifier = null;
        } catch (e) {
          console.warn('⚠️ Error clearing existing reCAPTCHA:', e);
        }
      }
      
      // Clear the container more thoroughly
      const container = document.getElementById(containerId);
      if (container) {
        console.log('🧹 Cleaning container:', containerId);
        
        // Remove any existing reCAPTCHA widgets
        const existingWidgets = container.querySelectorAll('.grecaptcha-badge, iframe[src*="recaptcha"], .grecaptcha');
        existingWidgets.forEach(widget => {
          console.log('🗑️ Removing widget:', widget);
          widget.remove();
        });
        
        // Clear the container content completely
        container.innerHTML = '';
        
        // Force a small delay to ensure DOM cleanup
        setTimeout(() => {
          console.log('⏳ DOM cleanup delay completed');
        }, 100);
      }
      
      // Create new reCAPTCHA verifier with error handling
      console.log('🆕 Creating new reCAPTCHA verifier...');
      this.recaptchaVerifier = setupRecaptcha(containerId);
      
      if (!this.recaptchaVerifier) {
        throw new Error('Failed to create reCAPTCHA verifier');
      }
      
      console.log('✅ reCAPTCHA verifier created successfully');
      return this.recaptchaVerifier;
    } catch (error) {
      console.error('❌ Error setting up reCAPTCHA:', error);
      
      // If it's a reCAPTCHA rendering error, provide specific guidance
      if (error.message.includes('reCAPTCHA has already been rendered') || 
          error.message.includes('already been rendered')) {
        throw new Error(
          'reCAPTCHA rendering conflict. Please:\n' +
          '1. Wait 5 seconds\n' +
          '2. Click "Refresh Verification" button\n' +
          '3. Try again'
        );
      }
      
      throw error;
    }
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber, containerId) {
    try {
      console.log('🔐 Setting up reCAPTCHA for phone:', phoneNumber);
      
      // Add a small delay to prevent rapid reCAPTCHA setup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Always setup fresh reCAPTCHA for each request
      await this.setupRecaptcha(containerId);

      console.log('✅ reCAPTCHA setup complete, sending OTP...');

      // Send OTP
      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        phoneNumber, 
        this.recaptchaVerifier
      );

      console.log('📱 OTP sent successfully, verification ID:', confirmationResult.verificationId);

      // Store verification ID for later use
      this.verificationId = confirmationResult.verificationId;

      return {
        success: true,
        message: 'OTP sent successfully',
        verificationId: this.verificationId
      };
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
      
      // Clear reCAPTCHA on error
      this.clearVerification();

      // Handle specific error cases
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format. Please use international format (e.g., +1234567890)');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      } else if (error.code === 'auth/quota-exceeded') {
        throw new Error('SMS quota exceeded. Please try again later.');
      } else if (error.code === 'auth/invalid-app-credential') {
        throw new Error(
          'reCAPTCHA configuration error. Please ensure:\n' +
          '1. reCAPTCHA keys are set in Firebase Console\n' +
          '2. localhost is added to authorized domains\n' +
          '3. reCAPTCHA Enterprise is enabled'
        );
      } else if (error.message.includes('reCAPTCHA has already been rendered') || 
                 error.message.includes('already been rendered')) {
        // Try to automatically resolve the conflict
        console.log('🔄 Attempting to resolve reCAPTCHA conflict automatically...');
        const resolved = await this.handleRecaptchaConflict();
        
        if (resolved) {
          throw new Error(
            'reCAPTCHA conflict resolved. Please try sending OTP again.'
          );
        } else {
          throw new Error(
            'reCAPTCHA rendering conflict. Please:\n' +
            '1. Wait 5 seconds\n' +
            '2. Click "Reset Verification System" button\n' +
            '3. Try again'
          );
        }
      } else if (error.message.includes('Verification system error')) {
        throw new Error(
          'reCAPTCHA system error. Please:\n' +
          '1. Wait 5 seconds\n' +
          '2. Click "Reset Verification System" button\n' +
          '3. Try again'
        );
      } else {
        throw new Error('Failed to send OTP: ' + error.message);
      }
    }
  }

  // Verify OTP
  async verifyOTP(otp) {
    try {
      if (!this.verificationId) {
        throw new Error('No verification ID found. Please send OTP first.');
      }

      console.log('🔍 Verifying OTP:', otp);

      // Create credential
      const credential = PhoneAuthProvider.credential(this.verificationId, otp);

      // Sign in with credential
      const result = await signInWithCredential(auth, credential);

      console.log('✅ OTP verified successfully:', result.user);

      // Clear verification ID after successful verification
      this.verificationId = null;

      return {
        success: true,
        message: 'OTP verified successfully',
        user: result.user
      };
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP. Please check and try again.');
      } else if (error.code === 'auth/invalid-verification-id') {
        throw new Error('OTP expired. Please request a new one.');
      } else {
        throw new Error('Failed to verify OTP: ' + error.message);
      }
    }
  }

  // Clear verification state
  clearVerification() {
    console.log('🧹 Clearing verification state...');
    console.log('🔍 Previous verification ID:', this.verificationId);
    
    this.verificationId = null;
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
        console.log('✅ reCAPTCHA verifier cleared');
      } catch (e) {
        console.warn('⚠️ Error clearing reCAPTCHA:', e);
      }
      this.recaptchaVerifier = null;
    }
    
    // Force cleanup of any remaining reCAPTCHA elements
    this.forceRecaptchaCleanup();
    
    clearRecaptcha();
    console.log('✅ Verification state cleared');
  }

  // Force cleanup of reCAPTCHA elements
  forceRecaptchaCleanup() {
    try {
      console.log('🧹 Force cleaning reCAPTCHA elements...');
      
      // Remove any reCAPTCHA elements from the entire page
      const allRecaptchaElements = document.querySelectorAll('.grecaptcha-badge, iframe[src*="recaptcha"], .grecaptcha');
      allRecaptchaElements.forEach(element => {
        console.log('🗑️ Force removing reCAPTCHA element:', element);
        element.remove();
      });
      
      // Clear the specific container
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
        console.log('✅ Container cleared');
      }
      
      // Also try to clear any global reCAPTCHA state
      if (window.grecaptcha && window.grecaptcha.reset) {
        try {
          window.grecaptcha.reset();
          console.log('✅ Global reCAPTCHA reset');
        } catch (e) {
          console.warn('⚠️ Could not reset global reCAPTCHA:', e);
        }
      }
      
      console.log('✅ Force cleanup completed');
    } catch (error) {
      console.warn('⚠️ Error during force cleanup:', error);
    }
  }

  // Handle reCAPTCHA conflicts
  async handleRecaptchaConflict() {
    console.log('🔄 Handling reCAPTCHA conflict...');
    
    try {
      // Complete reset
      await this.resetRecaptcha();
      
      // Wait a bit more
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ reCAPTCHA conflict resolved');
      return true;
    } catch (error) {
      console.error('❌ Failed to resolve reCAPTCHA conflict:', error);
      return false;
    }
  }

  // Complete reCAPTCHA reset
  async resetRecaptcha() {
    console.log('�� Complete reCAPTCHA reset...');
    
    // Clear verification state
    this.clearVerification();
    
    // Force cleanup
    this.forceRecaptchaCleanup();
    
    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ reCAPTCHA reset completed');
  }

  // Get current verification ID
  getVerificationId() {
    return this.verificationId;
  }

  // Sync verification ID from external state
  syncVerificationId(verificationId) {
    console.log('🔄 Syncing verification ID:', verificationId);
    this.verificationId = verificationId;
    console.log('✅ Verification ID synced:', this.verificationId);
  }
}

// Export singleton instance
export const phoneAuthService = new PhoneAuthService();
export default phoneAuthService;
