// src/app/api/deployments/route.ts
import { NextResponse } from 'next/server';
import { deploymentSheetService, DeploymentData } from '@/lib/googleSheetsService';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    // Check authentication with more robust error handling
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.error('Authentication failed: No session found');
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    // Log successful authentication for debugging
    console.log(`Authenticated request from ${session.user.email}`);
    
    const deployments = await deploymentSheetService.getAllDeployments();
    
    console.log(`Retrieved ${deployments.length} deployments from Google Sheets`);
    
    // Enhance deployments with consistent ID field
    const enhancedDeployments = deployments.map(deployment => {
      if (!deployment.id && deployment["Deployment ID"]) {
        deployment.id = deployment["Deployment ID"];
      }
      return deployment;
    });
    
    return NextResponse.json(enhancedDeployments);
    
  } catch (error) {
    console.error('Error fetching deployments:', error);
    // Provide more detailed error info
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch deployments: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}

// POST handler to add a new deployment
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
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

// UPDATED: PUT handler to support partial updates with changedFields parameter
export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const requestData = await request.json();
    let deploymentData: DeploymentData;
    let changedFields: string[] = [];
    
    // Handle both formats for backward compatibility:
    // 1. New format: { deploymentData: {...}, changedFields: [...] }
    // 2. Old format: direct deployment object
    if (requestData.deploymentData && Array.isArray(requestData.changedFields)) {
      deploymentData = requestData.deploymentData;
      changedFields = requestData.changedFields;
      console.log("Received deployment with changed fields:", changedFields);
    } else {
      // Legacy format - assume the whole object needs updating
      deploymentData = requestData;
      // In this case, we'll update all fields except id and Deployment ID
      changedFields = Object.keys(deploymentData).filter(
        key => key !== 'id' && key !== 'Deployment ID'
      );
      console.log("Received legacy deployment update format - updating all fields");
    }
    
    // Validate the deployment data has an ID
    if (!deploymentData.id && !deploymentData["Deployment ID"]) {
      return NextResponse.json(
        { error: 'Missing ID: Deployment must have either id or Deployment ID' }, 
        { status: 400 }
      );
    }
    
    // Ensure we have both id formats for consistency
    if (!deploymentData.id && deploymentData["Deployment ID"]) {
      deploymentData.id = deploymentData["Deployment ID"];
    } else if (!deploymentData["Deployment ID"] && deploymentData.id) {
      deploymentData["Deployment ID"] = deploymentData.id;
    }
    
    // Now update the deployment
    try {
      if (changedFields.length > 0) {
        // Use the optimized update method if we have specific fields to update
        await deploymentSheetService.updateDeploymentFields(deploymentData, changedFields);
      } else {
        // Fall back to full update if no changed fields specified (should be rare)
        await deploymentSheetService.updateDeployment(deploymentData);
      }
      
      return NextResponse.json({ 
        message: 'Deployment updated successfully',
        deploymentId: deploymentData.id || deploymentData["Deployment ID"],
        fieldsUpdated: changedFields.length
      });
    } catch (updateError) {
      // Handle specific errors
      if (updateError instanceof Error && 
          updateError.message.includes("not found in the spreadsheet")) {
        return NextResponse.json({ 
          error: `Deployment with ID "${deploymentData.id}" not found. Please verify the ID is correct.`
        }, { status: 404 });
      }
      
      // For other errors, throw to catch block
      throw updateError;
    }
  } catch (error) {
    console.error('Error updating deployment:', error);
    return NextResponse.json(
      { error: `Failed to update deployment: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}