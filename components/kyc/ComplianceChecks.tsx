'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Users,
  Globe,
  FileText,
  Search,
  Activity
} from 'lucide-react'
import { ComplianceCheck, ComplianceCheckType, ComplianceCheckStatus } from '@/types'
import { toast } from 'sonner'

interface ComplianceMetrics {
  totalChecks: number
  passedChecks: number
  failedChecks: number
  pendingChecks: number
  riskScore: number
  lastUpdated: string
}

export function ComplianceChecks() {
  const { user, updateAMLStatus } = useAuth()
  const [checks, setChecks] = useState<ComplianceCheck[]>([])
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    pendingChecks: 0,
    riskScore: 0,
    lastUpdated: new Date().toISOString()
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')



  const updateMetrics = useCallback((checksList: ComplianceCheck[]) => {
    const totalChecks = checksList.length
    const passedChecks = checksList.filter(c => c.status === 'passed').length
    const failedChecks = checksList.filter(c => c.status === 'failed').length
    const pendingChecks = checksList.filter(c => c.status === 'pending').length
    
    // Calculate risk score based on check results
    let riskScore = 0
    checksList.forEach(check => {
      if (check.status === 'failed') {
        riskScore += check.details.risk_level === 'high' ? 30 : check.details.risk_level === 'medium' ? 20 : 10
      } else if (check.status === 'pending') {
        riskScore += 5
      }
    })
    
    setMetrics({
      totalChecks,
      passedChecks,
      failedChecks,
      pendingChecks,
      riskScore: Math.min(riskScore, 100),
      lastUpdated: new Date().toISOString()
    })
  }, [setMetrics])

  const initializeComplianceChecks = useCallback(() => {
    if (!user) return

    const defaultChecks: ComplianceCheck[] = [
      {
        id: 'sanctions_screening',
        user_id: user.id,
        check_type: 'sanctions_check',
        status: 'pending',
        risk_score: 10,
        details: {
          description: 'Screening against global sanctions lists (OFAC, UN, EU)',
          provider: 'Chainalysis',
          lists_checked: ['OFAC SDN', 'UN Consolidated', 'EU Sanctions'],
          risk_level: 'low'
        },
        performed_at: new Date().toISOString(),
        performed_by: 'system'
      },
      {
        id: 'pep_screening',
        user_id: user.id,
        check_type: 'pep_screening',
        status: 'pending',
        risk_score: 20,
        details: {
          description: 'Politically Exposed Person (PEP) screening',
          provider: 'World-Check',
          categories: ['Government Officials', 'Military Leaders', 'Judicial'],
          risk_level: 'medium'
        },
        performed_at: new Date().toISOString(),
        performed_by: 'system'
      },
      {
        id: 'adverse_media',
        user_id: user.id,
        check_type: 'adverse_media',
        status: 'pending',
        risk_score: 10,
        details: {
          description: 'Adverse media and negative news screening',
          provider: 'LexisNexis',
          sources: ['News Articles', 'Legal Proceedings', 'Regulatory Actions'],
          risk_level: 'low'
        },
        performed_at: new Date().toISOString(),
        performed_by: 'system'
      },
      {
        id: 'identity_verification',
        user_id: user.id,
        check_type: 'kyc_verification',
        status: user.kyc_status === 'verified' ? 'passed' : 'pending',
        risk_score: user.kyc_status === 'verified' ? 0 : 15,
        details: {
          description: 'Identity document verification and validation',
          provider: 'Jumio',
          documents_verified: user.verification_documents?.length || 0,
          result: user.kyc_status === 'verified' ? 'No issues found' : null,
          risk_level: 'low'
        },
        performed_at: new Date().toISOString(),
        performed_by: 'system'
      },
      {
        id: 'address_verification',
        user_id: user.id,
        check_type: 'kyc_verification',
        status: 'pending',
        risk_score: 10,
        details: {
          description: 'Address verification and geolocation validation',
          provider: 'Google Maps API',
          address: user.profile?.country || 'Not provided',
          risk_level: 'low'
        },
        performed_at: new Date().toISOString(),
        performed_by: 'system'
      },
      {
        id: 'transaction_monitoring',
        user_id: user.id,
        check_type: 'ongoing_monitoring',
        status: 'pending',
        risk_score: 5,
        details: {
          description: 'Ongoing transaction pattern analysis and monitoring',
          provider: 'Internal System',
          transactions_monitored: 0,
          alerts_generated: 0,
          result: 'Monitoring active',
          risk_level: 'low'
        },
        performed_at: new Date().toISOString(),
        performed_by: 'system'
      }
    ]

    setChecks(defaultChecks)
    updateMetrics(defaultChecks)
  }, [user, setChecks, updateMetrics])

  // Initialize compliance checks
  useEffect(() => {
    initializeComplianceChecks()
  }, [initializeComplianceChecks, user])

  const runComplianceCheck = async (checkId: string) => {
    setLoading(true)
    
    try {
      // Simulate compliance check API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setChecks(prev => prev.map(check => {
        if (check.id === checkId) {
          // Simulate random results for demo
          const outcomes = ['passed', 'failed', 'pending'] as ComplianceCheckStatus[]
          const randomOutcome = outcomes[Math.floor(Math.random() * 3)]
          
          return {
            ...check,
            status: randomOutcome,
            performed_at: new Date().toISOString(),
            details: {
              ...check.details,
              result: randomOutcome === 'passed' 
                ? 'No issues found' 
                : randomOutcome === 'failed' 
                ? 'Potential risk identified - manual review required'
                : 'Check in progress',
              last_check: new Date().toISOString()
            }
          }
        }
        return check
      }))
      
      toast.success('Compliance check completed')
      
      // Update AML status based on overall results
      const updatedChecks = checks.map(c => c.id === checkId ? { ...c, status: 'passed' as ComplianceCheckStatus } : c)
      const allPassed = updatedChecks.every(c => c.status === 'passed' || c.status === 'pending')
      
      if (allPassed) {
        await updateAMLStatus('clear')
      }
      
    } catch (error) {
      toast.error('Compliance check failed')
    } finally {
      setLoading(false)
    }
  }

  const runAllChecks = async () => {
    setLoading(true)
    
    try {
      // Simulate running all checks
      for (const check of checks) {
        if (check.status === 'pending') {
          await runComplianceCheck(check.id)
          await new Promise(resolve => setTimeout(resolve, 500)) // Delay between checks
        }
      }
      
      toast.success('All compliance checks completed')
    } catch (error) {
      toast.error('Failed to run compliance checks')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: ComplianceCheckStatus) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'requires_review':
        return <Activity className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: ComplianceCheckStatus) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      pending: 'secondary',
      requires_review: 'outline'
    } as const

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getCheckTypeIcon = (type: ComplianceCheckType) => {
    switch (type) {
      case 'sanctions_check': return <Shield className="h-4 w-4" />
      case 'pep_screening': return <Users className="h-4 w-4" />
      case 'adverse_media': return <FileText className="h-4 w-4" />
      case 'kyc_verification': return <Search className="h-4 w-4" />
      case 'aml_screening': return <AlertTriangle className="h-4 w-4" />
      case 'ongoing_monitoring': return <Activity className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Please authenticate to access compliance checks</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Monitoring</h2>
          <p className="text-muted-foreground">
            AML/KYC compliance checks and risk assessment
          </p>
        </div>
        <Button 
          onClick={runAllChecks} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Running Checks...' : 'Run All Checks'}
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Checks</p>
                <p className="text-2xl font-bold">{metrics.totalChecks}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-500">{metrics.passedChecks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">{metrics.pendingChecks}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className={`text-2xl font-bold ${metrics.riskScore > 50 ? 'text-red-500' : metrics.riskScore > 25 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {metrics.riskScore}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Score Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
          <CardDescription>
            Overall compliance risk score based on all checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Risk Level</span>
              <span className={metrics.riskScore > 50 ? 'text-red-500' : metrics.riskScore > 25 ? 'text-yellow-500' : 'text-green-500'}>
                {metrics.riskScore > 50 ? 'High Risk' : metrics.riskScore > 25 ? 'Medium Risk' : 'Low Risk'}
              </span>
            </div>
            <Progress 
              value={metrics.riskScore} 
              className={`h-3 ${metrics.riskScore > 50 ? '[&>div]:bg-red-500' : metrics.riskScore > 25 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
            />
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Results</TabsTrigger>
          <TabsTrigger value="history">Check History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4">
            {checks.map((check) => (
              <Card key={check.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCheckTypeIcon(check.check_type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{check.details.description}</h4>
                          {getStatusBadge(check.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Risk Level: <span className={getRiskLevelColor(check.details.risk_level)}>{check.details.risk_level}</span></span>
                          <span>Updated: {new Date(check.performed_at).toLocaleDateString()}</span>
                        </div>
                        {check.details.result && (
                          <p className="text-sm mt-2">{check.details.result}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(check.status)}
                      {check.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runComplianceCheck(check.id)}
                          disabled={loading}
                        >
                          Run Check
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="space-y-4">
            {checks.map((check) => (
              <Card key={check.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getCheckTypeIcon(check.check_type)}
                    {check.details.description}
                    {getStatusBadge(check.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Provider:</span> {check.details?.provider || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Risk Level:</span> 
                        <span className={getRiskLevelColor(check.details.risk_level)}> {check.details.risk_level}</span>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(check.performed_at).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Last Check:</span> {new Date(check.details?.last_check || check.performed_at).toLocaleString()}
                      </div>
                    </div>
                    
                    {check.details.result && (
                      <div>
                        <span className="font-medium">Result:</span>
                        <p className="mt-1 p-2 bg-muted rounded text-sm">{check.details.result}</p>
                      </div>
                    )}
                    
                    {check.details && Object.keys(check.details).length > 2 && (
                      <div>
                        <span className="font-medium">Additional Details:</span>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Check History</CardTitle>
              <CardDescription>
                Historical record of all compliance checks and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <p className="font-medium">{check.details.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(check.performed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(check.status)}
                      <p className={`text-sm ${getRiskLevelColor(check.details.risk_level)}`}>
                        {check.details.risk_level} risk
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compliance Status Alert */}
      {metrics.riskScore > 50 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High risk score detected. Please review failed compliance checks and contact support if needed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}