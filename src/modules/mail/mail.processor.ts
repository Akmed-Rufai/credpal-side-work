import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
         user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
})

@Processor('mail')
export class MailProcessor extends WorkerHost {

  async process(job: Job) {

    switch (job.name) {

      case 'welcome-email': {
        const { email, name, verificationLink } = job.data;

       await transporter.sendMail({
        from: `"Credpal" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to Credpal🎉',
        text: 'Welcome to our platform. We are glad to have you!',
        html: `
          <h2>Welcome ${name || 'there'} 🎉</h2>
          <p>Thanks for signing up to our platform.</p>
          <p><a href="${verificationLink}">Click here to verify your email</a></p>
          <br>
          <p> Or </p>
          <button style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
            <a href="${verificationLink}" style="color: white; text-decoration: none;">Verify Email</a>
          </button>
          <br><br>
          <p>link expires in 1 hour</p>
        `
      });

        console.log('Welcome email sent');
        break;
      }


      case 'forgot-mail': {
        const { email, resetLink } = job.data;

        await transporter.sendMail({
            from: `"Credpal" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            text: 'You requested a password reset. Click the link below to reset your password.',
            html: `
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${resetLink}" target="_blank">Reset Password</a>
            <br><br>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>link expires in 1 hour</p>
            `
        })

        console.log('Reset password email sent');
        break;
      }

      default:
        console.log(`Unknown job type: ${job.name}`);
    }
  }
}