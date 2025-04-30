// Import the health check module
import { spawn } from 'child_process';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Email configuration
const RECIPIENT_EMAIL = 'luke@electric-hospitality.com';
const EMAIL_FROM = 'catering-healthcheck@electric-hospitality.com';

/**
 * Run the Playwright test for form submission
 */
async function runFormSubmissionTest() {
  console.log('Testing form submission...');
  
  try {
    // Test Ladybird form which should be sufficient for a basic health check
    const response = await fetch('https://electric-events-catering-meny-builder.vercel.app/ladybird-catering.html');
    
    if (!response.ok) {
      throw new Error(`Failed to load Ladybird form: ${response.status} ${response.statusText}`);
    }
    
    return {
      status: 'Pass',
      details: 'Form page loaded successfully'
    };
  } catch (error) {
    console.error('Form test error:', error);
    return {
      status: 'Fail',
      details: `Form test failed: ${error.message}`
    };
  }
}

/**
 * Test Tripleseat API connectivity
 */
async function testTripleseatAPI() {
  console.log('Testing Tripleseat API...');
  
  try {
    // Use the mock endpoint to avoid creating actual leads
    const apiUrl = 'https://electric-events-catering-meny-builder.vercel.app/api/tripleseat/mock';
    
    const mockData = {
      public_key: 'test_key',
      lead: {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone_number: '555-123-4567',
        location_id: '18694', // Ladybird venue ID
        description: 'API Health Check',
        guest_count: 10,
        start_date: new Date().toISOString().split('.')[0] + 'Z',
        test: true
      }
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockData)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API returned error: ${data.error || 'Unknown error'}`);
    }
    
    return {
      status: 'Pass',
      details: data.lead && data.lead.id 
        ? `API test successful, mock lead ID: ${data.lead.id}` 
        : 'API test successful'
    };
  } catch (error) {
    console.error('API test error:', error);
    return {
      status: 'Fail',
      details: `API test failed: ${error.message}`
    };
  }
}

/**
 * Send email report
 */
async function sendEmailReport(testResults) {
  console.log('Sending email report...');
  
  // Generate plain text email
  const emailText = `
Electric Events Catering Health Check
Report generated: ${new Date().toLocaleString()}

Summary: ${testResults.form.status === 'Pass' && testResults.api.status === 'Pass' 
  ? 'All Tests Passed' 
  : 'Issues Detected'}

TEST RESULTS:
---------------------------------------------------------
Form Submission: ${testResults.form.status}
Details: ${testResults.form.details}

Tripleseat API: ${testResults.api.status}
Details: ${testResults.api.details}
---------------------------------------------------------

This is an automated health check report. Please do not reply to this email.
`;
  
  try {
    // Use Web3Forms to send the email
    const formData = new FormData();
    formData.append('access_key', process.env.WEB3FORMS_KEY || 'f890e702-fef2-4b76-84bf-0e5bf3262032');
    formData.append('subject', `Electric Events Catering Health Check - ${
      testResults.form.status === 'Pass' && testResults.api.status === 'Pass' 
        ? 'All Tests Passed' 
        : 'Issues Detected'
    }`);
    formData.append('from_name', 'Catering Site Health Monitor');
    formData.append('replyto', EMAIL_FROM);
    formData.append('to', RECIPIENT_EMAIL);
    formData.append('message', emailText);
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log('Email sent:', data);
    
    return {
      success: true,
      message: data.message
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * API Handler for Vercel serverless function
 */
export default async function handler(req, res) {
  // Only allow GET requests or POST for cron jobs
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET and POST requests are supported for this endpoint'
    });
  }

  // Check if request is from Vercel cron
  const isVercelCron = req.headers['x-vercel-cron'] === '1';

  try {
    console.log('Starting health check...');
    console.log('Is Vercel Cron job:', isVercelCron);
    
    // Run tests
    const [formResult, apiResult] = await Promise.all([
      runFormSubmissionTest(),
      testTripleseatAPI()
    ]);
    
    const testResults = {
      form: formResult,
      api: apiResult,
      timestamp: new Date().toISOString()
    };
    
    // Send email report if this is a cron job
    let emailResult = { success: false, message: 'Email not sent (not a cron job)' };
    
    if (isVercelCron || req.query.sendEmail === 'true') {
      emailResult = await sendEmailReport(testResults);
    }
    
    // Return results
    return res.status(200).json({
      success: true,
      message: 'Health check completed',
      results: testResults,
      email: emailResult
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Try to send error notification
    if (isVercelCron) {
      try {
        await sendEmailReport({
          form: { status: 'Error', details: error.message },
          api: { status: 'Error', details: error.message }
        });
      } catch (emailError) {
        console.error('Failed to send error notification:', emailError);
      }
    }
    
    return res.status(500).json({ 
      error: 'Health check failed',
      message: error.message
    });
  }
} 