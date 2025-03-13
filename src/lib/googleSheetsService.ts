// src/lib/googleSheetsService.ts
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Types for deployment data
export interface DeploymentData {
  id?: string;
  Status?: string;
  "Assigned To"?: string;
  Position?: string;
  "Department - Division"?: string;
  Department?: string;
  Division?: string;
  Location?: string;
  "Deployment Type"?: string;
  "Current Model"?: string;
  "Current SN"?: string;
  "New Device Type"?: string;
  "Deployment Notes"?: string;
  "New Model"?: string;
  "New SN"?: string;
  "New Monitor Type"?: string;
  "New Monitor 1 SN"?: string;
  "New Monitor 2 SN"?: string;
  "New Other"?: string;
  "SR#"?: string;
  "SR Link"?: string;
  Priority?: string;
  Technician?: string;
  "Deployment SR#"?: string;
  "Deployment SR Link"?: string;
  "Technician Notes"?: string;
  "Deployment ID"?: string;
  "Unique ID"?: string;
  "Refuse to sign"?: string;
  "Signatory Name"?: string;
  "Signature Column"?: string;
  "Deployment Date"?: string;
  "Deployment Picture"?: string;
  // Support for any other fields
  [key: string]: string | undefined;
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
          // Removed the console.log message about skipping formula rows
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
  /**
 * Update a deployment row by ID - Fixed to preserve existing data
 */
async updateDeployment(deployment: DeploymentData): Promise<void> {
  try {
    // Ensure we have a valid ID to use for lookup
    const lookupId = deployment.id || deployment["Deployment ID"];
    
    if (!lookupId) {
      throw new Error('Either id or Deployment ID field is required for updates');
    }
    
    console.log(`Updating deployment with lookup ID: ${lookupId}`);
    
    const sheets = await getSheetsInstance();
    
    // First, get all data to find the row with matching ID
    const allData = await this.getAllDeployments();
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!1:1`,
    });
    
    const headers = headerResponse.data.values?.[0] || [];
    
    // Find the existing deployment by either id or Deployment ID
    const existingDeployment = allData.find(d => 
      (d.id === lookupId) || (d["Deployment ID"] === lookupId)
    );
    
    const rowIndex = allData.findIndex(d => 
      (d.id === lookupId) || (d["Deployment ID"] === lookupId)
    );
    
    if (rowIndex === -1 || !existingDeployment) {
      throw new Error(`Deployment with ID ${lookupId} not found`);
    }
    
    console.log(`Found deployment at index: ${rowIndex}`);
    
    // Calculate the actual row in the sheet by counting formula rows before this index
    let actualSheetRowIndex = rowIndex + 2; // +1 for 0-index to 1-index conversion, +1 for header row
    
    // Adjust for formula rows that appear before this row
    for (const formulaRow of this.formulaRows) {
      if (formulaRow < actualSheetRowIndex - 1) { // -1 to convert back to 0-based for comparison
        actualSheetRowIndex++;
      }
    }
    
    console.log(`Calculated actual row in sheet: ${actualSheetRowIndex}`);
    
    // Create a new row with updated values
    // CRITICAL FIX: Preserve existing data for fields not included in the update
    const newRow: (string | number | boolean)[] = [];
    headers.forEach((header) => {
      const key = header as string;
      
      // IMPORTANT: First check if this field is being updated
      if (deployment[key] !== undefined) {
        // This field is being updated, use the new value
        newRow.push(deployment[key] || '');
      } else if (existingDeployment[key] !== undefined) {
        // This field is not being updated, preserve the existing value
        newRow.push(existingDeployment[key] || '');
      } else {
        // This field doesn't exist in either object, use empty string
        newRow.push('');
      }
    });
    
    // Ensure critical IDs are preserved
    if (existingDeployment["Deployment ID"] && !deployment["Deployment ID"]) {
      // Find the index of the Deployment ID column
      const idIndex = headers.findIndex(h => h === "Deployment ID");
      if (idIndex >= 0) {
        newRow[idIndex] = existingDeployment["Deployment ID"];
      }
    }
    
    // Update the entire row
    await sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!A${actualSheetRowIndex}:${this.columnToLetter(headers.length - 1)}${actualSheetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });
    
    console.log(`Successfully updated row ${actualSheetRowIndex} in the sheet`);
    
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
      // Generate a Deployment ID if not provided
if (!deployment["Deployment ID"]) {
  // Format: DEP-YYYYMMDD-XXXX (where XXXX is a random number)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  deployment["Deployment ID"] = `DEP-${dateStr}-${randomSuffix}`;
  console.log(`Generated Deployment ID: ${deployment["Deployment ID"]}`);
}
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