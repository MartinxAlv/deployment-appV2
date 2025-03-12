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

// Service account credentials should be stored as environment variables
// and loaded here in a secure way
const getServiceAccountCredentials = () => {
  try {
    return {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
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

  constructor(spreadsheetId?: string, sheetName?: string) {
    // Get from environment variables if not provided
    this.spreadsheetId = spreadsheetId || process.env.DEPLOYMENT_SPREADSHEET_ID || '';
    this.sheetName = sheetName || process.env.DEPLOYMENT_SHEET_NAME || 'Sheet1';
    
    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }
  }

  /**
   * Get all deployment data from the sheet
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
      
      // Convert the rows to objects with the headers as keys
      const deployments = rows.slice(1).map(row => {
        const deployment: Record<string, string | undefined> = {};
        headers.forEach((header, index) => {
          deployment[header] = row[index] || '';
        });
        return deployment as DeploymentData;
      });
      
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
      
      // Convert to actual row index in the sheet (add 2: 1 for 0-index, 1 for header row)
      const sheetRowIndex = rowIndex + 2;
      
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
        range: `${this.sheetName}!A${sheetRowIndex}:${this.columnToLetter(headers.length)}${sheetRowIndex}`,
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