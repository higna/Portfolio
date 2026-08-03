import axios from 'axios';
import { Logger } from '@nestjs/common';

const logger = new Logger('ReCaptcha');

export async function verifyRecaptcha(token: string, secret: string): Promise<boolean> {
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: { secret, response: token },
        timeout: 5000,
      },
    );
    logger.log(`ReCAPTCHA response: ${JSON.stringify(response.data)}`);
    return response.data.success === true;
  } catch (error: any) {
    logger.error(`ReCAPTCHA verification failed: ${error.message}`);
    return false;
  }
}