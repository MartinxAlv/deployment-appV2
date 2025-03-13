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
  private headerCache: string[] | null = null;
  private columnMappingCache: Map<string, number> | null = null;

  constructor(spreadsheetId?: string, sheetName?: string, formulaRows?: number[]) {
    // Get from environment variables if not provided
    this.spreadsheetId = spreadsheetId || process.env.DEPLOYMENT_SPREADSHEET_ID || '';
    this.sheetName = sheetName || process.env.DEPLOYMENT_SHEET_NAME || 'Sheet1';
    
    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }
    
    // Set up formula rows configuration - default to row 2
    if (formulaRows) {
      this.formulaRows = formulaRows;
    } else {
      this.formulaRows = [1]; // 0-based index for row 2
    }
    
    console.log('Formula rows configured to skip:', this.formulaRows.map(r => r + 1));
  }

  /**
   * Get the headers and their column positions from the sheet
   */
  async getHeadersAndColumnMapping(): Promise<{headers: string[], columnMapping: Map<string, number>}> {
    if (this.headerCache && this.columnMappingCache) {
      return {
        headers: this.headerCache,
        columnMapping: this.columnMappingCache
      };
    }

    try {
      const sheets = await getSheetsInstance();
      
      // Get the header row
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!1:1`,
      });
      
      const headers = response.data.values?.[0] || [];
      const columnMapping = new Map<string, number>();
      
      // Map each header to its column index
      headers.forEach((header, index) => {
        if (header) {
          columnMapping.set(header, index);
        }
      });
      
      // Cache the results
      this.headerCache = headers;
      this.columnMappingCache = columnMapping;
      
      // Log the column layout to help with debugging
      console.log('SHEET COLUMN MAPPING:');
      headers.forEach((header, index) => {
        console.log(`Column ${this.columnToLetter(index)} (${index+1}): "${header}"`);
      });
      
      return { headers, columnMapping };
    } catch (error) {
      console.error('Error getting headers:', error);
      throw new Error('Failed to get sheet headers');
    }
  }

  /**
   * Find the column letter for the Deployment ID field
   */
  async getDeploymentIdColumn(): Promise<string | null> {
    const { columnMapping } = await this.getHeadersAndColumnMapping();
    const columnIndex = columnMapping.get('Deployment ID');
    
    if (columnIndex === undefined) {
      console.error('Deployment ID column not found in headers');
      return null;
    }
    
    return this.columnToLetter(columnIndex);
  }

  /**
   * Get all deployment data from the sheet, skipping formula rows
   */
  async getAllDeployments(): Promise<DeploymentData[]> {
    try {
      const sheets = await getSheetsInstance();
      const { headers } = await this.getHeadersAndColumnMapping();
      
      // Get all data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}`,
      });
      
      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }
      
      // Convert rows to objects, skipping formula rows
      const deployments: DeploymentData[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        // Skip if this is a formula row (0-based index)
        if (this.formulaRows.includes(i)) {
          continue;
        }
        
        const row = rows[i];
        if (!row || row.length === 0) continue; // Skip empty rows
        
        const deployment: Record<string, string | undefined> = {};
        
        headers.forEach((header, index) => {
          // Ensure we don't try to access beyond the array length
          deployment[header] = index < row.length ? row[index] : '';
        });
        
        // If there's a Deployment ID, use it as the ID for consistent handling
        if (deployment['Deployment ID']) {
          deployment.id = deployment['Deployment ID'];
        }
        
        deployments.push(deployment as DeploymentData);
      }
      
      return deployments;
      
    } catch (error) {
      console.error('Error fetching deployment data:', error);
      throw new Error('Failed to fetch deployment data');
    }
  }

  /**
   * Find a row by Deployment ID - returns 1-based row index for sheets API
   */
  async findRowByDeploymentId(deploymentId: string): Promise<number | null> {
    try {
      const sheets = await getSheetsInstance();
      
      // Get the column for Deployment ID
      const deploymentIdColumn = await this.getDeploymentIdColumn();
      if (!deploymentIdColumn) {
        throw new Error('Could not determine Deployment ID column');
      }
      
      // Get all values in the Deployment ID column
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!${deploymentIdColumn}:${deploymentIdColumn}`,
      });
      
      const values = response.data.values || [];
      console.log(`Looking for Deployment ID: "${deploymentId}"`);
      
      // Show the first few values for debugging
      console.log('First 10 values in Deployment ID column:');
      for (let i = 0; i < Math.min(10, values.length); i++) {
        console.log(`Row ${i+1}: "${values[i]?.[0] || ''}" ${values[i]?.[0] === deploymentId ? '(MATCH)' : ''}`);
      }
      
      // Find the row with the matching ID
      for (let i = 0; i < values.length; i++) {
        if (values[i] && values[i][0] === deploymentId) {
          console.log(`Found matching Deployment ID at row ${i+1}`);
          return i + 1; // 1-based row index
        }
      }
      
      console.log(`No row found with Deployment ID: ${deploymentId}`);
      return null;
    } catch (error) {
      console.error('Error finding row by Deployment ID:', error);
      return null;
    }
  }

  /**
   * Update a deployment using direct API calls to individual cells
   * This approach avoids clearing any cells
   */
  async updateDeployment(deployment: DeploymentData): Promise<void> {
    try {
      const deploymentId = deployment.id || deployment["Deployment ID"];
      if (!deploymentId) {
        throw new Error('Either id or Deployment ID is required for updates');
      }
      
      console.log(`Updating deployment with ID: ${deploymentId}`);
      
      // Find the row with this Deployment ID
      const rowIndex = await this.findRowByDeploymentId(deploymentId);
      
      if (!rowIndex) {
        // Instead of adding a new row, throw an error
        const errorMessage = `Deployment with ID "${deploymentId}" not found in the spreadsheet`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Get column mapping
      const { columnMapping } = await this.getHeadersAndColumnMapping();
      
      // Prepare batch update request
      const sheets = await getSheetsInstance();
      const requests = [];
      
      // Specifically exclude Deployment ID and id fields to avoid clearing them
      const fieldsToUpdate = Object.entries(deployment).filter(
        ([key]) => key !== 'Deployment ID' && key !== 'id'
      );
      
      console.log(`Updating ${fieldsToUpdate.length} fields for row ${rowIndex}`);
      
      // Create individual cell update requests
      for (const [fieldName, fieldValue] of fieldsToUpdate) {
        const columnIndex = columnMapping.get(fieldName);
        
        if (columnIndex !== undefined) {
          const columnLetter = this.columnToLetter(columnIndex);
          const cellAddress = `${this.sheetName}!${columnLetter}${rowIndex}`;
          
          console.log(`Updating ${fieldName} at ${cellAddress} to "${fieldValue}"`);
          
          requests.push(
            sheets.spreadsheets.values.update({
              spreadsheetId: this.spreadsheetId,
              range: cellAddress,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [[fieldValue]]
              }
            })
          );
        }
      }
      
      // Execute all updates
      if (requests.length > 0) {
        await Promise.all(requests);
        console.log(`Successfully updated ${requests.length} cells in row ${rowIndex}`);
      } else {
        console.log('No cells to update');
      }
      
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
      const { headers } = await this.getHeadersAndColumnMapping();
      
      // Generate a Deployment ID if not provided
      if (!deployment["Deployment ID"]) {
        // Format: DEP-YYYYMMDD-XXXX (where XXXX is a random number)
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
        deployment["Deployment ID"] = `DEP-${dateStr}-${randomSuffix}`;
        console.log(`Generated Deployment ID: ${deployment["Deployment ID"]}`);
      }
      
      if (!deployment.id && deployment["Deployment ID"]) {
        deployment.id = deployment["Deployment ID"];
      }
      
      // Create a new row with the deployment data
      const newRow: (string | number | boolean)[] = [];
      headers.forEach((header) => {
        const key = header as string;
        newRow.push(deployment[key] !== undefined ? deployment[key] : '');
      });
      
      // Append the new row
      const lastColumnLetter = this.columnToLetter(headers.length - 1);
      const range = `${this.sheetName}!A:${lastColumnLetter}`;
      
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow]
        }
      });
      
      console.log(`Successfully added new deployment with ID ${deployment["Deployment ID"]}`);
      
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