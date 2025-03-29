# Deployment App [ARCHIVED]

A comprehensive IT deployment management application built with Next.js, Supabase, and Google Sheets integration.

> **Note:** This project is no longer being actively maintained or developed.

## Overview

This application helps IT departments track and manage device deployments across an organization. It synchronizes data with Google Sheets while providing a modern web interface for technicians and administrators.

## Features

- **Authentication & Authorization**: Secure login with role-based access (admin and technician)
- **Dashboard**: Visual overview of deployment status with charts and statistics
- **Deployment Management**: CRUD operations for deployment tracking
- **Technician View**: Specialized interface for technicians to update deployment status
- **Ready-to-Deploy**: Dedicated workflow for completing deployments
- **Admin Panel**: User management with full CRUD operations
- **Dark/Light Mode**: Theme switching with persistent preferences
- **Responsive Design**: Works on mobile and desktop devices

## Technology Stack

- **Frontend**:
  - Next.js 15
  - React 19
  - Tailwind CSS 4
  - Styled Components
  - Recharts for data visualization

- **Backend**:
  - Next.js API Routes
  - Google Sheets API integration
  - NextAuth.js for authentication

- **Database**:
  - Supabase (PostgreSQL)
  - Google Sheets (for deployment data)

## Project Structure

The project follows a standard Next.js structure with:

- `/src/app`: Application routes and pages
- `/src/app/api`: API routes for backend functionality
- `/src/components`: Reusable React components
- `/src/lib`: Utility functions and services
- `/public`: Static assets

## Core Components

- **Google Sheets Integration**: The app syncs deployment data with a Google Sheet
- **Authentication**: NextAuth.js with Supabase credentials provider
- **Admin Dashboard**: User management system with history tracking
- **Technician Views**: Specialized interfaces for deployment management
- **Theme Provider**: Context-based theme switching with persistent preferences

## Setup Requirements

### Prerequisites

- Node.js (v18+)
- Supabase account and project
- Google Cloud account with Sheets API enabled
- Service account with appropriate permissions

### Environment Variables

Create a `.env.local` file with the following variables:

```
# Next Auth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email
GOOGLE_PRIVATE_KEY=your-private-key
GOOGLE_PROJECT_ID=your-project-id
DEPLOYMENT_SPREADSHEET_ID=your-spreadsheet-id
DEPLOYMENT_SHEET_NAME=Sheet1
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables as described above
4. Run the development server: `npm run dev`
5. Access the application at `http://localhost:3000`

## Database Schema

### Supabase Tables

1. **users**
   - user_id (UUID, PK)
   - email (String)
   - name (String)
   - role (String: 'admin' or 'technician')

2. **user_action_history**
   - id (UUID, PK)
   - action_type (String: 'create', 'update', 'delete', 'restore')
   - performed_by (UUID, FK to users)
   - performed_by_email (String)
   - target_user_id (UUID)
   - target_user_email (String)
   - previous_data (JSONB)
   - new_data (JSONB)
   - timestamp (Timestamp)

### Google Sheets Structure

The deployment data is stored in a Google Sheet with columns matching the fields in the `DeploymentData` interface.

## Deployment

The application can be deployed to Vercel or any other Next.js-compatible hosting service.

### Vercel Deployment

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

## Project Status

This project is **archived** and no longer under active development. It was developed as a functional deployment tracking system but will not receive further updates or maintenance. Feel free to fork the repository if you wish to continue development.

## Potential Future Development Ideas

While this project is no longer being actively developed, here are some feature ideas that could be implemented if someone were to continue the work:

- Email notifications for deployment status changes
- Image upload for deployment verification
- Signature capture for completed deployments
- Integration with inventory management systems
- Offline support for technicians in the field
- Mobile app version using React Native
