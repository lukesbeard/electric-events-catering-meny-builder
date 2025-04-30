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

  // Generate email content
  const emailHtml = generateEmailHTML();
  
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
        html: emailHtml
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
      formData.append('message', 'See HTML report');
      formData.append('html', emailHtml);
      
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
 * Generate HTML email content
 */
function generateEmailHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #444; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        .not-run { color: orange; font-weight: bold; }
        .details { background-color: #f9f9f9; padding: 10px; border: 1px solid #ddd; margin-top: 10px; white-space: pre-wrap; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; }
      </style>
    </head>
    <body>
      <h1>Electric Events Catering Health Check</h1>
      <p>Report generated: ${new Date(testResults.timestamp).toLocaleString()}</p>
      
      <h2>Summary: ${getSummaryStatus()}</h2>
      
      <h2>Form Submission Tests</h2>
      <table>
        <tr>
          <th>Test</th>
          <th>Status</th>
        </tr>
        <tr>
          <td>Ladybird Form</td>
          <td class="${getStatusClass(testResults.e2e.ladybird.status)}">${testResults.e2e.ladybird.status}</td>
        </tr>
        <tr>
          <td>Muchacho Form</td>
          <td class="${getStatusClass(testResults.e2e.muchacho.status)}">${testResults.e2e.muchacho.status}</td>
        </tr>
        <tr>
          <td>Dug-Out Form</td>
          <td class="${getStatusClass(testResults.e2e.dugout.status)}">${testResults.e2e.dugout.status}</td>
        </tr>
      </table>
      
      <h2>Tripleseat API Tests</h2>
      <table>
        <tr>
          <th>Test</th>
          <th>Status</th>
        </tr>
        <tr>
          <td>API Connection</td>
          <td class="${getStatusClass(testResults.tripleseat.api.status)}">${testResults.tripleseat.api.status}</td>
        </tr>
        <tr>
          <td>Configuration Validation</td>
          <td class="${getStatusClass(testResults.tripleseat.config.status)}">${testResults.tripleseat.config.status}</td>
        </tr>
      </table>
      
      ${getFailureDetails()}
      
      <p>This is an automated health check report. Please do not reply to this email.</p>
    </body>
    </html>
  `;
}

/**
 * Get CSS class for status
 */
function getStatusClass(status) {
  switch (status) {
    case 'Pass': return 'pass';
    case 'Fail': return 'fail';
    case 'Not Run': return 'not-run';
    default: return '';
  }
}

/**
 * Get failure details for email
 */
function getFailureDetails() {
  const failures = [];
  
  // Check for failed E2E tests
  Object.entries(testResults.e2e).forEach(([name, test]) => {
    if (test.status === 'Fail') {
      failures.push(`
        <h3>${name} Form Submission Test Failed</h3>
        <div class="details">${test.details}</div>
      `);
    }
  });
  
  // Check for failed API tests
  Object.entries(testResults.tripleseat).forEach(([name, test]) => {
    if (test.status === 'Fail') {
      failures.push(`
        <h3>Tripleseat ${name} Test Failed</h3>
        <div class="details">${test.details}</div>
      `);
    }
  });
  
  if (failures.length === 0) {
    return '';
  }
  
  return `
    <h2>Failure Details</h2>
    ${failures.join('')}
  `;
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