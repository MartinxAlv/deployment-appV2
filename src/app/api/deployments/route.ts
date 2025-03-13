// src/app/api/deployments/route.ts
import { NextResponse } from 'next/server';
import { deploymentSheetService, DeploymentData } from '@/lib/googleSheetsService';
import { getServerSession } from 'next-auth';

// GET handler to fetch all deployments
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

// POST handler to add a new deployment
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
      { error: 'Failed to add deployment' }, 
      { status: 500 }
    );
  }
}

// PUT handler to update an existing deployment
export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const deploymentData: DeploymentData = await request.json();
    
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
    
    console.log(`Updating deployment with ID: ${deploymentData.id}`);
    
    // Update the deployment
    await deploymentSheetService.updateDeployment(deploymentData);
    
    return NextResponse.json({ 
      message: 'Deployment updated successfully',
      deploymentId: deploymentData.id || deploymentData["Deployment ID"]
    });
    
  } catch (error) {
    console.error('Error updating deployment:', error);
    return NextResponse.json(
      { error: `Failed to update deployment: ${error instanceof Error ? error.message : String(error)}` }, 
      { status: 500 }
    );
  }
}