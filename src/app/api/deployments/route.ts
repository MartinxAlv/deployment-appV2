// src/app/api/deployments/route.ts
import { NextResponse } from 'next/server';
import { deploymentSheetService, DeploymentData } from '@/lib/googleSheetsService';
import { getServerSession } from 'next-auth';

// GET handler to fetch all deployments (unchanged)
export async function GET() {
  try {
    // Check authentication (optional but recommended)
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const deployments = await deploymentSheetService.getAllDeployments();
    
    // Add debug information
    console.log(`Retrieved ${deployments.length} deployments from Google Sheets`);
    
    // Ensure each deployment has the ID field properly set
    const enhancedDeployments = deployments.map(deployment => {
      // If there's no id but there is a Deployment ID, use that as the id
      if (!deployment.id && deployment["Deployment ID"]) {
        deployment.id = deployment["Deployment ID"];
      }
      return deployment;
    });
    
    return NextResponse.json(enhancedDeployments);
    
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployments' }, 
      { status: 500 }
    );
  }
}

// POST handler to add a new deployment (unchanged)
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const deploymentData: DeploymentData = await request.json();
    
    // Generate Deployment ID if not provided
    if (!deploymentData["Deployment ID"]) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      deploymentData["Deployment ID"] = `DEP-${dateStr}-${randomSuffix}`;
      console.log(`API generated Deployment ID: ${deploymentData["Deployment ID"]}`);
    }
    
    // Ensure Deployment Date is set
    if (!deploymentData["Deployment Date"]) {
      deploymentData["Deployment Date"] = new Date().toISOString().split('T')[0];
    }
    
    // Make sure id field is set for consistency
    if (!deploymentData.id && deploymentData["Deployment ID"]) {
      deploymentData.id = deploymentData["Deployment ID"];
    }
    
    // Add the deployment
    await deploymentSheetService.addDeployment(deploymentData);
    
    return NextResponse.json({ 
      message: 'Deployment added successfully',
      deploymentId: deploymentData["Deployment ID"]
    });
    
  } catch (error) {
    console.error('Error adding deployment:', error);
    return NextResponse.json(
      { error: `Failed to add deployment: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

// MODIFIED: PUT handler to support partial updates with changedFields parameter
export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const { deploymentData, changedFields } = await request.json();
    
    // Check for both standard id and Deployment ID
    if (!deploymentData.id && !deploymentData["Deployment ID"]) {
      return NextResponse.json(
        { error: 'Deployment ID is required' }, 
        { status: 400 }
      );
    }
    
    // If only Deployment ID is available, copy it to id for consistent handling
    if (!deploymentData.id && deploymentData["Deployment ID"]) {
      deploymentData.id = deploymentData["Deployment ID"];
    }
    
    console.log(`Updating deployment ${deploymentData.id} with ${changedFields?.length || 'all'} fields`);
    
    if (changedFields && Array.isArray(changedFields)) {
      console.log('Changed fields:', changedFields);
      
      // If we have specific fields to update, use the updateDeploymentFields function
      try {
        await deploymentSheetService.updateDeploymentFields(deploymentData, changedFields);
        
        return NextResponse.json({ 
          message: `Deployment updated successfully (${changedFields.length} fields)`,
          deploymentId: deploymentData.id || deploymentData["Deployment ID"],
          updatedFields: changedFields
        });
      } catch (updateError) {
        // If the deployment wasn't found, return a more specific error
        if (updateError instanceof Error && 
            updateError.message.includes("not found in the spreadsheet")) {
          return NextResponse.json({ 
            error: `Deployment with ID "${deploymentData.id}" not found in the spreadsheet. Please verify the ID is correct.`
          }, { status: 404 });
        }
        
        // For other errors, throw to catch block
        throw updateError;
      }
    } else {
      // Fall back to full update if no changedFields provided
      console.log('Performing full deployment update');
      
      try {
        await deploymentSheetService.updateDeployment(deploymentData);
        
        return NextResponse.json({ 
          message: 'Deployment updated successfully (full update)',
          deploymentId: deploymentData.id || deploymentData["Deployment ID"]
        });
      } catch (updateError) {
        // If the deployment wasn't found, return a more specific error
        if (updateError instanceof Error && 
            updateError.message.includes("not found in the spreadsheet")) {
          return NextResponse.json({ 
            error: `Deployment with ID "${deploymentData.id}" not found in the spreadsheet. Please verify the ID is correct.`
          }, { status: 404 });
        }
        
        // For other errors, throw to catch block
        throw updateError;
      }
    }
    
  } catch (error) {
    console.error('Error updating deployment:', error);
    return NextResponse.json(
      { error: `Failed to update deployment: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}