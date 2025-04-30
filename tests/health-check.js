// @ts-check
import { spawn } from 'child_process';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get directory name for this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Email configuration
const RECIPIENT_EMAIL = 'luke@electric-hospitality.com';
const EMAIL_FROM = 'catering-healthcheck@electric-hospitality.com';

// Test results container
const testResults = {
  e2e: {
    ladybird: { status: 'Not Run', details: '' },
    muchacho: { status: 'Not Run', details: '' },
    dugout: { status: 'Not Run', details: '' }
  },
  tripleseat: {
    api: { status: 'Not Run', details: '' },
    config: { status: 'Not Run', details: '' }
  },
  timestamp: new Date().toISOString()
};

/**
 * Run Playwright E2E tests
 */
async function runE2ETests() {
  console.log('Starting E2E tests...');
  
  return new Promise((resolve) => {
    // Run Playwright test with specific grep to only run form submission tests
    const playwright = spawn('npx', ['playwright', 'test', '--grep', 'Form Submission']);
    
    let output = '';
    
    playwright.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log(chunk);
      
      // Extract test results from output
      if (chunk.includes('Ladybird form submission')) {
        if (chunk.includes('✓')) {
          testResults.e2e.ladybird.status = 'Pass';
        } else if (chunk.includes('✗')) {
          testResults.e2e.ladybird.status = 'Fail';
        }
      }
      
      if (chunk.includes('Muchacho form submission')) {
        if (chunk.includes('✓')) {
          testResults.e2e.muchacho.status = 'Pass';
        } else if (chunk.includes('✗')) {
          testResults.e2e.muchacho.status = 'Fail';
        }
      }
      
      if (chunk.includes('Dug-Out form submission')) {
        if (chunk.includes('✓')) {
          testResults.e2e.dugout.status = 'Pass';
        } else if (chunk.includes('✗')) {
          testResults.e2e.dugout.status = 'Fail';
        }
      }
    });
    
    playwright.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      output += data.toString();
    });
    
    playwright.on('close', (code) => {
      console.log(`Playwright process exited with code ${code}`);
      
      // Save output for email report
      testResults.e2e.ladybird.details = output;
      testResults.e2e.muchacho.details = output;
      testResults.e2e.dugout.details = output;
      
      resolve();
    });
  });
}

/**
 * Run Jest API tests
 */
async function runAPITests() {
  console.log('Starting API tests...');
  
  return new Promise((resolve) => {
    // Run Jest tests for the API
    const jest = spawn('npx', ['jest', '--testPathPattern=tests/api']);
    
    let output = '';
    
    jest.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log(chunk);
      
      // Extract test results from output
      if (chunk.includes('Tripleseat API should accept form data without error')) {
        if (chunk.includes('PASS')) {
          testResults.tripleseat.api.status = 'Pass';
        } else if (chunk.includes('FAIL')) {
          testResults.tripleseat.api.status = 'Fail';
        }
      }
      
      if (chunk.includes('Tripleseat API should have required venue IDs configured')) {
        if (chunk.includes('PASS')) {
          testResults.tripleseat.config.status = 'Pass';
        } else if (chunk.includes('FAIL')) {
          testResults.tripleseat.config.status = 'Fail';
        }
      }
    });
    
    jest.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      output += data.toString();
    });
    
    jest.on('close', (code) => {
      console.log(`Jest process exited with code ${code}`);
      
      // Save output for email report
      testResults.tripleseat.api.details = output;
      testResults.tripleseat.config.details = output;
      
      resolve();
    });
  });
}

/**
 * Send email report using Web3Forms
 */
async function sendEmailReport() {
  console.log('Sending email report...');

  // Generate plain text email content
  const emailText = generateEmailText();
  
  try {
    // Check if we have SMTP settings
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Use SMTP directly if we have credentials
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      const info = await transporter.sendMail({
        from: EMAIL_FROM,
        to: RECIPIENT_EMAIL,
        subject: `Electric Events Catering Health Check - ${getSummaryStatus()}`,
        text: emailText
      });
      
      console.log('Email sent via SMTP:', info.messageId);
    } else {
      // Fall back to Web3Forms
      const formData = new FormData();
      formData.append('access_key', process.env.WEB3FORMS_KEY || 'f890e702-fef2-4b76-84bf-0e5bf3262032');
      formData.append('subject', `Electric Events Catering Health Check - ${getSummaryStatus()}`);
      formData.append('from_name', 'Catering Site Health Monitor');
      formData.append('replyto', EMAIL_FROM);
      formData.append('to', RECIPIENT_EMAIL);
      formData.append('message', emailText);
      
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log('Email sent via Web3Forms:', data.message);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

/**
 * Get summary status for email subject
 */
function getSummaryStatus() {
  // Check if any tests failed
  const hasFailures = Object.values(testResults.e2e).some(test => test.status === 'Fail') || 
                      Object.values(testResults.tripleseat).some(test => test.status === 'Fail');
  
  // Check if any tests didn't run
  const hasNotRun = Object.values(testResults.e2e).some(test => test.status === 'Not Run') || 
                    Object.values(testResults.tripleseat).some(test => test.status === 'Not Run');
  
  if (hasFailures) {
    return 'FAILURES Detected';
  } else if (hasNotRun) {
    return 'Partial Success';
  } else {
    return 'All Tests Passed';
  }
}

/**
 * Generate plain text email content
 */
function generateEmailText() {
  let text = `
ELECTRIC EVENTS CATERING HEALTH CHECK
======================================
Report generated: ${new Date(testResults.timestamp).toLocaleString()}

SUMMARY: ${getSummaryStatus()}

FORM SUBMISSION TESTS
---------------------
Ladybird Form: ${testResults.e2e.ladybird.status}
Muchacho Form: ${testResults.e2e.muchacho.status}
Dug-Out Form: ${testResults.e2e.dugout.status}

TRIPLESEAT API TESTS
-------------------
API Connection: ${testResults.tripleseat.api.status}
Configuration Validation: ${testResults.tripleseat.config.status}
`;

  // Add failure details if present
  const failures = getFailureDetailsText();
  if (failures) {
    text += `
FAILURE DETAILS
--------------
${failures}
`;
  }

  text += `
This is an automated health check report. Please do not reply to this email.
`;

  return text;
}

/**
 * Get failure details for email
 */
function getFailureDetailsText() {
  const failures = [];
  
  // Check for failed E2E tests
  Object.entries(testResults.e2e).forEach(([name, test]) => {
    if (test.status === 'Fail') {
      failures.push(`${name} Form Submission Test Failed:\n${test.details.substring(0, 500)}...`);
    }
  });
  
  // Check for failed API tests
  Object.entries(testResults.tripleseat).forEach(([name, test]) => {
    if (test.status === 'Fail') {
      failures.push(`Tripleseat ${name} Test Failed:\n${test.details.substring(0, 500)}...`);
    }
  });
  
  if (failures.length === 0) {
    return '';
  }
  
  return failures.join('\n\n');
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting health check...');
    
    // Run all tests
    await Promise.all([
      runE2ETests(),
      runAPITests()
    ]);
    
    // Generate and send report
    await sendEmailReport();
    
    console.log('Health check completed successfully');
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Try to send error report
    testResults.e2e.ladybird.status = 'Error';
    testResults.e2e.ladybird.details = error.toString();
    await sendEmailReport();
  }
}

// Run the main function
main().catch(console.error); 