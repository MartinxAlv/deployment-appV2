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
    return NextResponse.json(deployments);
    
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
    
    // Add the deployment
    await deploymentSheetService.addDeployment(deploymentData);
    
    return NextResponse.json({ message: 'Deployment added successfully' });
    
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
    
    if (!deploymentData.id) {
      return NextResponse.json(
        { error: 'Deployment ID is required' }, 
        { status: 400 }
      );
    }
    
    // Update the deployment
    await deploymentSheetService.updateDeployment(deploymentData);
    
    return NextResponse.json({ message: 'Deployment updated successfully' });
    
  } catch (error) {
    console.error('Error updating deployment:', error);
    return NextResponse.json(
      { error: 'Failed to update deployment' }, 
      { status: 500 }
    );
  }
}