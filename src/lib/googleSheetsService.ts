// src/lib/googleSheetsService.ts
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Types for deployment data
export interface DeploymentData {
  // Define your columns based on the 2425 Deployment Sheet structure
  // For example:
  id?: string;
  deploymentDate?: string;
  clientName?: string;
  location?: string;
  technician?: string;
  status?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  // Add any other fields as needed
  [key: string]: string | undefined; // Allow for dynamic properties from spreadsheet but with proper typing
}

/**
 * Format the private key correctly regardless of how it's stored in env vars
 */
const formatPrivateKey = (key?: string): string => {
  if (!key) return '';
  
  // If the key doesn't start with the BEGIN marker, it needs formatting
  if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
    // Strip any surrounding quotes that might have been added
    const strippedKey = key.replace(/^['"]|['"]$/g, '');
    
    // Replace escaped newlines with actual newlines if present
    if (strippedKey.includes('\\n')) {
      return strippedKey.replace(/\\n/g, '\n');
    }
    
    // If it's a flat string without formatting, add proper PEM format
    if (!strippedKey.includes('\n')) {
      return `-----BEGIN PRIVATE KEY-----\n${strippedKey}\n-----END PRIVATE KEY-----`;
    }
  }
  
  // If it already has the BEGIN marker, just make sure escaped newlines are handled
  return key.replace(/\\n/g, '\n');
};

// Service account credentials should be stored as environment variables
// and loaded here in a secure way
const getServiceAccountCredentials = () => {
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    return {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: formatPrivateKey(privateKey),
      project_id: process.env.GOOGLE_PROJECT_ID,
    };
  } catch (error) {
    console.error('Error loading Google service account credentials:', error);
    throw new Error('Failed to load service account credentials');
  }
};

// Create and authorize a JWT client
const getAuthClient = () => {
  const credentials = getServiceAccountCredentials();
  
  if (!credentials.private_key) {
    throw new Error('Private key is missing or improperly formatted');
  }
  
  if (!credentials.client_email) {
    throw new Error('Service account email is missing');
  }
  
  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

// Create a sheets instance with the authenticated client
const getSheetsInstance = async () => {
  const authClient = getAuthClient();
  return google.sheets({ version: 'v4', auth: authClient });
};

// Main class to interact with the deployment sheet
export class DeploymentSheetService {
  private spreadsheetId: string;
  private sheetName: string;
  private formulaRows: number[]; // Store formula row indices to skip

  constructor(spreadsheetId?: string, sheetName?: string, formulaRows?: number[]) {
    // Get from environment variables if not provided
    this.spreadsheetId = spreadsheetId || process.env.DEPLOYMENT_SPREADSHEET_ID || '';
    this.sheetName = sheetName || process.env.DEPLOYMENT_SHEET_NAME || 'Sheet1';
    
    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }
    
    // Set up formula rows configuration
    // Use environment variable (comma-separated list of 1-based row numbers)
    // Example: SHEET_FORMULA_ROWS=2,5,10
    if (formulaRows) {
      this.formulaRows = formulaRows;
    } else {
      const formulaRowsEnv = process.env.SHEET_FORMULA_ROWS || '2'; // Default to row 2 (index 1)
      this.formulaRows = formulaRowsEnv
        .split(',')
        .filter(Boolean)
        .map(row => parseInt(row.trim(), 10) - 1) // Convert to 0-based indices
        .filter(rowNum => !isNaN(rowNum));
    }
    
    console.log('Formula rows configured to skip:', this.formulaRows.map(r => r + 1));
  }

  /**
   * Get all deployment data from the sheet, skipping formula rows
   */
  async getAllDeployments(): Promise<DeploymentData[]> {
    try {
      const sheets = await getSheetsInstance();
      
      // Get all data including headers
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}`,
      });
      
      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }
      
      // First row contains headers
      const headers = rows[0] as string[];
      
      // Convert rows to objects, skipping formula rows
      const deployments: DeploymentData[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        // Skip if this is a formula row (0-based index)
        if (this.formulaRows.includes(i)) {
          console.log(`Skipping formula row ${i+1}`);
          continue;
        }
        
        const row = rows[i];
        const deployment: Record<string, string | undefined> = {};
        
        headers.forEach((header, index) => {
          deployment[header] = row[index] || '';
        });
        
        deployments.push(deployment as DeploymentData);
      }
      
      return deployments;
      
    } catch (error) {
      console.error('Error fetching deployment data:', error);
      throw new Error('Failed to fetch deployment data');
    }
  }

  /**
   * Update a specific cell in the sheet
   */
  async updateCell(row: number, column: number, value: string | number | boolean): Promise<void> {
    try {
      const sheets = await getSheetsInstance();
      
      // Convert 0-based indices to A1 notation
      const columnLetter = this.columnToLetter(column);
      const range = `${this.sheetName}!${columnLetter}${row + 1}`; // +1 because sheets are 1-indexed
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[value]]
        }
      });
      
    } catch (error) {
      console.error('Error updating cell:', error);
      throw new Error('Failed to update cell');
    }
  }

  /**
   * Update a deployment row by ID
   */
  async updateDeployment(deployment: DeploymentData): Promise<void> {
    try {
      if (!deployment.id) {
        throw new Error('Deployment ID is required for updates');
      }
      
      const sheets = await getSheetsInstance();
      
      // First, get all data to find the row with matching ID
      const allData = await this.getAllDeployments();
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!1:1`,
      });
      
      const headers = headerResponse.data.values?.[0] || [];
      const rowIndex = allData.findIndex(d => d.id === deployment.id);
      
      if (rowIndex === -1) {
        throw new Error(`Deployment with ID ${deployment.id} not found`);
      }
      
      // Calculate the actual row in the sheet by counting formula rows before this index
      let actualSheetRowIndex = rowIndex + 2; // +1 for 0-index to 1-index conversion, +1 for header row
      
      // Adjust for formula rows that appear before this row
      for (const formulaRow of this.formulaRows) {
        if (formulaRow < actualSheetRowIndex - 1) { // -1 to convert back to 0-based for comparison
          actualSheetRowIndex++;
        }
      }
      
      // Create a new row with updated values
      const newRow: (string | number | boolean)[] = [];
      headers.forEach((header) => {
        const key = header as string;
        // Use the new value from deployment if available, otherwise use ''
        newRow.push(deployment[key] !== undefined ? deployment[key] : '');
      });
      
      // Update the entire row
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A${actualSheetRowIndex}:${this.columnToLetter(headers.length)}${actualSheetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [newRow]
        }
      });
      
    } catch (error) {
      console.error('Error updating deployment:', error);
      throw new Error(`Failed to update deployment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a new deployment row
   */
  async addDeployment(deployment: DeploymentData): Promise<void> {
    try {
      const sheets = await getSheetsInstance();
      
      // Get headers first
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!1:1`,
      });
      
      const headers = headerResponse.data.values?.[0] || [];
      
      // Create a new row with the deployment data
      const newRow: (string | number | boolean)[] = [];
      headers.forEach((header) => {
        const key = header as string;
        newRow.push(deployment[key] !== undefined ? deployment[key] : '');
      });
      
      // Append the new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:${this.columnToLetter(headers.length)}`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow]
        }
      });
      
    } catch (error) {
      console.error('Error adding deployment:', error);
      throw new Error('Failed to add deployment');
    }
  }

  /**
   * Convert a column index to letter (0 = A, 1 = B, etc.)
   */
  private columnToLetter(column: number): string {
    let letter = '';
    let temp = column;
    
    while (temp >= 0) {
      letter = String.fromCharCode(65 + (temp % 26)) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    
    return letter;
  }
}

// Export a singleton instance with default settings
export const deploymentSheetService = new DeploymentSheetService();