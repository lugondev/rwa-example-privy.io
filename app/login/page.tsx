'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useAuthSafe } from '@/hooks/useAuthSafe'
import { useProfile } from '@/lib/hooks/useProfile'
import SEOHead from '@/components/seo/SEOHead'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Wallet, 
  Mail, 
  Shield, 
  Building, 
  Users, 
  Database,
  Eye,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Globe,
  Smartphone
} from 'lucide-react'
import { PublicLayout } from '@/components/layout/AppLayout'
import { UserType } from '@/types'
import { toast } from 'sonner'

interface LoginMethod {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  available: boolean
}

interface UserTypeOption {
  value: UserType
  label: string
  description: string
  icon: React.ReactNode
  requirements: string[]
}

export default function LoginPage() {
  const router = useRouter()
  const { login, linkEmail, linkWallet, user: privyUser, authenticated } = usePrivy()
  const { user: userData, updateUserType, getComplianceStatus, syncUser } = useAuthSafe()
  const { createProfile } = useProfile()
  const [loading, setLoading] = useState(false)
  const [selectedUserType, setSelectedUserType] = useState<UserType>('individual')
  const [email, setEmail] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (authenticated && privyUser && userData) {
      const compliance = getComplianceStatus()
      if (compliance === 'compliant') {
        router.push('/dashboard')
      } else if (userData.profile?.first_name && userData.profile?.last_name) {
        router.push('/profile/kyc')
      } else {
        router.push('/profile')
      }
    }
  }, [authenticated, privyUser, userData, router, getComplianceStatus])

  // Handle redirect after successful login
  useEffect(() => {
    if (authenticated && privyUser && !loading) {
      // Small delay to ensure userData is synced
      const timer = setTimeout(() => {
        if (userData) {
          const compliance = getComplianceStatus()
          if (compliance === 'compliant') {
            router.push('/dashboard')
          } else if (userData.profile?.first_name && userData.profile?.last_name) {
            router.push('/profile/kyc')
          } else {
            router.push('/profile')
          }
        } else {
          // If userData is not ready yet, redirect to profile for setup
          router.push('/profile')
        }
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [authenticated, privyUser, loading, userData, router, getComplianceStatus])

  const loginMethods: LoginMethod[] = [
    {
      id: 'wallet',
      name: 'Crypto Wallet',
      icon: <Wallet className="h-5 w-5" />,
      description: 'Connect with MetaMask, WalletConnect, or Coinbase Wallet',
      available: true
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="h-5 w-5" />,
      description: 'Sign in with your email address',
      available: true
    },
    {
      id: 'google',
      name: 'Google',
      icon: <Globe className="h-5 w-5" />,
      description: 'Continue with Google account',
      available: true
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'Sign in with Apple ID',
      available: true
    }
  ]

  const userTypeOptions: UserTypeOption[] = [
    {
      value: 'individual',
      label: 'Individual Investor',
      description: 'Personal investment account for individual users',
      icon: <Users className="h-6 w-6" />,
      requirements: [
        'Government-issued ID verification',
        'Proof of address',
        'Basic KYC compliance'
      ]
    },
    {
      value: 'institutional',
      label: 'Institutional Client',
      description: 'Corporate accounts for institutions and funds',
      icon: <Building className="h-6 w-6" />,
      requirements: [
        'Corporate registration documents',
        'Authorized representative verification',
        'Enhanced due diligence',
        'Compliance officer designation'
      ]
    },
    {
      value: 'custodian',
      label: 'Custodian Service',
      description: 'Licensed custodians and asset managers',
      icon: <Shield className="h-6 w-6" />,
      requirements: [
        'Custodial license verification',
        'Regulatory compliance certification',
        'Insurance coverage proof',
        'Audit trail capabilities'
      ]
    },
    {
      value: 'oracle_provider',
      label: 'Oracle Provider',
      description: 'Data providers and oracle services',
      icon: <Database className="h-6 w-6" />,
      requirements: [
        'Data source verification',
        'API reliability certification',
        'Technical integration testing',
        'Service level agreements'
      ]
    }
  ]

  const handleLogin = async (method: string) => {
    if (!acceptedTerms) {
      toast.error('Please accept the terms and conditions')
      return
    }

    setLoading(true)
    
    try {
      switch (method) {
        case 'wallet':
          await login()
          break
        case 'email':
          if (!email) {
            toast.error('Please enter your email address')
            return
          }
          await login()
          break
        case 'google':
          await login()
          break
        case 'apple':
          await login()
          break
        default:
          await login()
      }
      
      // Wait for user sync after login
      await new Promise(resolve => setTimeout(resolve, 1000))
      await syncUser()
      
      // Set user type after successful login
      if (selectedUserType !== 'individual') {
        await updateUserType(selectedUserType)
      }
      
      toast.success('Login successful! Redirecting...')
      
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    await handleLogin('email')
  }

  const getComplianceRequirements = (userType: UserType) => {
    const option = userTypeOptions.find(opt => opt.value === userType)
    return option?.requirements || []
  }

  const getKYCLevelForUserType = (userType: UserType) => {
    switch (userType) {
      case 'individual': return 'Enhanced KYC'
      case 'institutional': return 'Institutional KYC'
      case 'custodian': return 'Custodial KYC'
      case 'oracle_provider': return 'Provider KYC'
      default: return 'Basic KYC'
    }
  }

  return (
    <PublicLayout showNavigation={false} className="flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to RWA Platform
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Secure access to real-world asset tokenization platform
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="account-type">Account Type</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="w-full">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Shield className="h-6 w-6" />
                  Secure Authentication
                </CardTitle>
                <CardDescription>
                  Choose your preferred authentication method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Login Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    onClick={handleEmailLogin}
                    disabled={loading || !email}
                    className="w-full"
                    size="lg"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {loading ? 'Signing in...' : 'Continue with Email'}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                {/* Other Login Methods */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {loginMethods.filter(method => method.id !== 'email').map((method) => (
                    <Button
                      key={method.id}
                      variant="outline"
                      onClick={() => handleLogin(method.id)}
                      disabled={loading || !method.available}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      {method.icon}
                      <div className="text-center">
                        <div className="font-medium">{method.name}</div>
                        <div className="text-xs text-muted-foreground">{method.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>

                {/* Advanced Options */}
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                  </Button>
                  
                  {showAdvanced && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Advanced Authentication</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          Additional security features:
                        </div>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                            Multi-factor authentication (MFA)
                          </li>
                          <li className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                            Hardware wallet support
                          </li>
                          <li className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                            Biometric authentication
                          </li>
                          <li className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                            Session management
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{' '}
                      <a href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>
                  
                  {!acceptedTerms && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please accept the terms and conditions to continue
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button 
                  onClick={() => setActiveTab('account-type')}
                  variant="outline"
                  className="w-full"
                >
                  Next: Select Account Type
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account-type">
            <Card className="w-full">
              <CardHeader className="text-center">
                <CardTitle>Select Account Type</CardTitle>
                <CardDescription>
                  Choose the account type that best fits your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {userTypeOptions.map((option) => (
                    <Card 
                      key={option.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedUserType === option.value 
                          ? 'ring-2 ring-primary bg-primary/10' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedUserType(option.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            selectedUserType === option.value 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-muted text-foreground'
                          }`}>
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{option.label}</h3>
                              {selectedUserType === option.value && (
                                <Badge variant="default">Selected</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {option.description}
                            </p>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Requirements:</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {option.requirements.map((req, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Selected Account Type Summary */}
                <Card className="bg-primary/10 border-primary/20">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Selected Account Type</h4>
                    <div className="flex items-center gap-2 mb-2">
                      {userTypeOptions.find(opt => opt.value === selectedUserType)?.icon}
                      <span className="font-medium">
                        {userTypeOptions.find(opt => opt.value === selectedUserType)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      KYC Level Required: <strong>{getKYCLevelForUserType(selectedUserType)}</strong>
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Compliance Requirements:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {getComplianceRequirements(selectedUserType).map((req, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setActiveTab('login')}
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Login
                  </Button>
                  <Button 
                    onClick={() => handleLogin('wallet')}
                    disabled={loading || !acceptedTerms}
                    className="flex-1"
                  >
                    {loading ? 'Connecting...' : 'Continue with Selected Type'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Notice */}
        <Card className="mt-6 bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200/50 dark:border-yellow-800/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Security Notice</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Your account will be subject to KYC/AML verification based on your selected account type. 
                  This process ensures compliance with regulatory requirements and platform security.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}