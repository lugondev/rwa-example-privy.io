'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Upload,
  User,
  Building,
  FileText,
  Eye
} from 'lucide-react'
import { KYCStatus, KYCLevel, UserType } from '@/types'
import { DocumentUpload } from './DocumentUpload'
import { ProfileForm } from './ProfileForm'
import { ComplianceChecks } from './ComplianceChecks'

export function KYCDashboard() {
  const { 
    user, 
    updateKYCStatus, 
    updateKYCLevel, 
    updateUserType, 
    getComplianceStatus,
    canAccessFeature 
  } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Please authenticate to access KYC dashboard</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const complianceStatus = getComplianceStatus()
  const kycProgress = getKYCProgress()

  function getKYCProgress() {
    let progress = 0
    if (!user) return progress
    if (user.profile?.first_name && user.profile?.last_name) progress += 20
    if (user.profile?.country) progress += 20
    if (user.verification_documents && user.verification_documents.length > 0) progress += 30
    if (user.kyc_status === 'verified') progress = 100
    return progress
  }

  function getStatusIcon(status: KYCStatus) {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
      case 'in_review':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'suspended':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  function getStatusColor(status: KYCStatus) {
    switch (status) {
      case 'verified':
        return 'bg-green-500'
      case 'rejected':
      case 'suspended':
        return 'bg-red-500'
      case 'pending':
      case 'in_review':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KYC & Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your verification status and compliance requirements
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          {getStatusIcon(user.kyc_status)}
          {user.kyc_status.toUpperCase()}
        </Badge>
      </div>

      {/* Status Alert */}
      <Alert className={`border-l-4 ${getStatusColor(user.kyc_status)}`}>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Compliance Status:</strong> {complianceStatus.message}
        </AlertDescription>
      </Alert>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Progress</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{kycProgress}%</div>
              <Progress value={kycProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {kycProgress === 100 ? 'Verification complete' : 'Complete your profile'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Type</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold capitalize">{user.user_type}</div>
              <Badge variant="secondary">{user.kyc_level.toUpperCase()}</Badge>
              <p className="text-xs text-muted-foreground">
                Tier {user.compliance_tier.split('_')[1]} compliance
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{user.risk_score || 0}</div>
              <Badge 
                variant={user.risk_score && user.risk_score > 50 ? 'destructive' : 'default'}
              >
                {user.risk_score && user.risk_score > 50 ? 'High Risk' : 'Low Risk'}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Last check: {user.last_compliance_check ? 
                  new Date(user.last_compliance_check).toLocaleDateString() : 'Never'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Complete these steps to improve your verification status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!user.profile?.first_name && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span>Complete basic profile</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('profile')}
                    >
                      Complete
                    </Button>
                  </div>
                )}
                
                {(!user.verification_documents || user.verification_documents.length === 0) && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span>Upload ID documents</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('documents')}
                    >
                      Upload
                    </Button>
                  </div>
                )}

                {user.user_type === 'individual' && user.kyc_level === 'basic' && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <span>Upgrade to institutional</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => updateUserType('institutional')}
                    >
                      Upgrade
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feature Access */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Access</CardTitle>
                <CardDescription>
                  Your current verification level grants access to these features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Basic Trading</span>
                  {canAccessFeature('basic_trading') ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Institutional Trading</span>
                  {canAccessFeature('institutional_trading') ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Vault Management</span>
                  {canAccessFeature('vault_management') ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Oracle Services</span>
                  {canAccessFeature('oracle_services') ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <ProfileForm />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentUpload />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceChecks />
        </TabsContent>
      </Tabs>
    </div>
  )
}