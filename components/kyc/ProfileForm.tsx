'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFormValidation } from '@/hooks/useFormValidation'
import { validateKYCPersonalData } from '@/utils/validation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Building, Shield, AlertCircle } from 'lucide-react'
import { InvestmentExperience, UserType } from '@/types'
import { toast } from 'sonner'

interface ProfileFormData {
  first_name: string
  last_name: string
  company_name?: string
  phone: string
  country: string
  date_of_birth: string
  nationality: string
  occupation: string
  source_of_funds: string
  investment_experience: InvestmentExperience
  accredited_investor: boolean
  politically_exposed_person: boolean
  [key: string]: unknown
}

interface InstitutionalFormData {
  company_registration_number: string
  tax_id: string
  aum: number
  primary_business: string
  compliance_officer_name: string
  compliance_officer_email: string
  compliance_officer_phone: string
}

export function ProfileForm() {
  const { user, updateProfile, updateUserType, updateKYCLevel } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  
  const initialPersonalData: ProfileFormData = {
    first_name: user?.profile?.first_name || '',
    last_name: user?.profile?.last_name || '',
    company_name: user?.profile?.company_name || '',
    phone: user?.profile?.phone || '',
    country: user?.profile?.country || '',
    date_of_birth: user?.profile?.date_of_birth || '',
    nationality: user?.profile?.nationality || '',
    occupation: user?.profile?.occupation || '',
    source_of_funds: user?.profile?.source_of_funds || '',
    investment_experience: user?.profile?.investment_experience || 'beginner',
    accredited_investor: user?.profile?.accredited_investor || false,
    politically_exposed_person: user?.profile?.politically_exposed_person || false,
  }

  const personalForm = useFormValidation({
    initialData: initialPersonalData,
    validator: validateKYCPersonalData,
    onSubmit: async (data) => {
      await handlePersonalSubmit(data)
    }
  })

  const [personalData, setPersonalData] = useState<ProfileFormData>(initialPersonalData)

  const [institutionalData, setInstitutionalData] = useState<InstitutionalFormData>({
    company_registration_number: user?.institutional_details?.company_registration_number || '',
    tax_id: user?.institutional_details?.tax_id || '',
    aum: user?.institutional_details?.aum || 0,
    primary_business: user?.institutional_details?.primary_business || '',
    compliance_officer_name: user?.institutional_details?.compliance_officer?.name || '',
    compliance_officer_email: user?.institutional_details?.compliance_officer?.email || '',
    compliance_officer_phone: user?.institutional_details?.compliance_officer?.phone || '',
  })

  const handlePersonalSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          wallet_address: user?.wallet_address
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      
      const updatedUser = await response.json()
      
      toast.success('Personal information updated successfully')
      
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
      throw error // Re-throw to let the form handle the error
    } finally {
      setLoading(false)
    }
  }

  const handleInstitutionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update user type to institutional
      await updateUserType('institutional')
      
      // Update institutional details
      await updateProfile({
        company_name: personalData.company_name,
        ...personalData,
      })
      
      // Upgrade to institutional KYC level
      await updateKYCLevel('institutional')
      
      toast.success('Institutional profile updated successfully')
    } catch (error) {
      toast.error('Failed to update institutional profile')
    } finally {
      setLoading(false)
    }
  }

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Japan', 'Singapore', 'Switzerland', 'Netherlands',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Austria',
    'Belgium', 'Ireland', 'Luxembourg', 'New Zealand', 'South Korea'
  ]

  const occupations = [
    'Finance Professional', 'Technology', 'Healthcare', 'Legal',
    'Real Estate', 'Consulting', 'Education', 'Government',
    'Retail', 'Manufacturing', 'Energy', 'Other'
  ]

  const sourcesOfFunds = [
    'Employment Income', 'Business Profits', 'Investment Returns',
    'Real Estate', 'Inheritance', 'Savings', 'Pension', 'Other'
  ]

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Please authenticate to access profile form</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Information</h2>
        <p className="text-muted-foreground">
          Complete your profile to improve your verification status
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="institutional" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Institutional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Provide your personal details for identity verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={personalForm.handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={personalForm.data.first_name}
                      onChange={(e) => personalForm.updateField('first_name', e.target.value)}
                      onBlur={() => personalForm.setFieldTouched('first_name')}
                      className={personalForm.getFieldError('first_name') ? 'border-red-500' : ''}
                      required
                    />
                    {personalForm.getFieldError('first_name') && (
                      <p className="text-sm text-red-500">{personalForm.getFieldError('first_name')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={personalForm.data.last_name}
                      onChange={(e) => personalForm.updateField('last_name', e.target.value)}
                      onBlur={() => personalForm.setFieldTouched('last_name')}
                      className={personalForm.getFieldError('last_name') ? 'border-red-500' : ''}
                      required
                    />
                    {personalForm.getFieldError('last_name') && (
                      <p className="text-sm text-red-500">{personalForm.getFieldError('last_name')}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={personalForm.data.phone}
                      onChange={(e) => personalForm.updateField('phone', e.target.value)}
                      onBlur={() => personalForm.setFieldTouched('phone')}
                      className={personalForm.getFieldError('phone') ? 'border-red-500' : ''}
                      required
                    />
                    {personalForm.getFieldError('phone') && (
                      <p className="text-sm text-red-500">{personalForm.getFieldError('phone')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={personalForm.data.date_of_birth}
                      onChange={(e) => personalForm.updateField('date_of_birth', e.target.value)}
                      onBlur={() => personalForm.setFieldTouched('date_of_birth')}
                      className={personalForm.getFieldError('date_of_birth') ? 'border-red-500' : ''}
                      required
                    />
                    {personalForm.getFieldError('date_of_birth') && (
                      <p className="text-sm text-red-500">{personalForm.getFieldError('date_of_birth')}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country of Residence *</Label>
                    <Select 
                      value={personalForm.data.country} 
                      onValueChange={(value) => {
                        personalForm.updateField('country', value)
                        personalForm.setFieldTouched('country')
                      }}
                    >
                      <SelectTrigger className={personalForm.getFieldError('country') ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {personalForm.getFieldError('country') && (
                      <p className="text-sm text-red-500">{personalForm.getFieldError('country')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Select 
                      value={personalForm.data.nationality} 
                      onValueChange={(value) => {
                        personalForm.updateField('nationality', value)
                        personalForm.setFieldTouched('nationality')
                      }}
                    >
                      <SelectTrigger className={personalForm.getFieldError('nationality') ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {personalForm.getFieldError('nationality') && (
                      <p className="text-sm text-red-500">{personalForm.getFieldError('nationality')}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation *</Label>
                    <Select 
                      value={personalData.occupation} 
                      onValueChange={(value) => setPersonalData(prev => ({ ...prev, occupation: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select occupation" />
                      </SelectTrigger>
                      <SelectContent>
                        {occupations.map((occupation) => (
                          <SelectItem key={occupation} value={occupation}>
                            {occupation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source_of_funds">Source of Funds *</Label>
                    <Select 
                      value={personalData.source_of_funds} 
                      onValueChange={(value) => setPersonalData(prev => ({ ...prev, source_of_funds: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourcesOfFunds.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investment_experience">Investment Experience</Label>
                  <Select 
                    value={personalData.investment_experience} 
                    onValueChange={(value: InvestmentExperience) => setPersonalData(prev => ({ ...prev, investment_experience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                      <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accredited_investor"
                      checked={personalData.accredited_investor}
                      onCheckedChange={(checked) => 
                        setPersonalData(prev => ({ ...prev, accredited_investor: checked as boolean }))
                      }
                    />
                    <Label htmlFor="accredited_investor" className="text-sm">
                      I am an accredited investor
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="politically_exposed_person"
                      checked={personalData.politically_exposed_person}
                      onCheckedChange={(checked) => 
                        setPersonalData(prev => ({ ...prev, politically_exposed_person: checked as boolean }))
                      }
                    />
                    <Label htmlFor="politically_exposed_person" className="text-sm">
                      I am a politically exposed person (PEP)
                    </Label>
                  </div>
                </div>

                {personalData.politically_exposed_person && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      As a politically exposed person, additional verification may be required.
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  disabled={personalForm.isSubmitting || !personalForm.isValid} 
                  className="w-full"
                >
                  {personalForm.isSubmitting ? 'Updating...' : 'Update Personal Information'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="institutional">
          <Card>
            <CardHeader>
              <CardTitle>Institutional Information</CardTitle>
              <CardDescription>
                Provide institutional details for enhanced verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInstitutionalSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={personalData.company_name}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, company_name: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_registration_number">Registration Number *</Label>
                    <Input
                      id="company_registration_number"
                      value={institutionalData.company_registration_number}
                      onChange={(e) => setInstitutionalData(prev => ({ ...prev, company_registration_number: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID *</Label>
                    <Input
                      id="tax_id"
                      value={institutionalData.tax_id}
                      onChange={(e) => setInstitutionalData(prev => ({ ...prev, tax_id: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aum">Assets Under Management (USD)</Label>
                    <Input
                      id="aum"
                      type="number"
                      value={institutionalData.aum}
                      onChange={(e) => setInstitutionalData(prev => ({ ...prev, aum: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary_business">Primary Business *</Label>
                    <Input
                      id="primary_business"
                      value={institutionalData.primary_business}
                      onChange={(e) => setInstitutionalData(prev => ({ ...prev, primary_business: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Compliance Officer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="compliance_officer_name">Name *</Label>
                      <Input
                        id="compliance_officer_name"
                        value={institutionalData.compliance_officer_name}
                        onChange={(e) => setInstitutionalData(prev => ({ ...prev, compliance_officer_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compliance_officer_email">Email *</Label>
                      <Input
                        id="compliance_officer_email"
                        type="email"
                        value={institutionalData.compliance_officer_email}
                        onChange={(e) => setInstitutionalData(prev => ({ ...prev, compliance_officer_email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compliance_officer_phone">Phone *</Label>
                      <Input
                        id="compliance_officer_phone"
                        type="tel"
                        value={institutionalData.compliance_officer_phone}
                        onChange={(e) => setInstitutionalData(prev => ({ ...prev, compliance_officer_phone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Institutional accounts require additional verification and may take 3-5 business days to process.
                  </AlertDescription>
                </Alert>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Updating...' : 'Submit Institutional Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}