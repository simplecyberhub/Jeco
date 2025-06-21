import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertShareholderApplicationSchema } from "@shared/schema";
import { z } from "zod";
import { 
  TreePine, 
  User, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Target, 
  FileText, 
  Mail, 
  Phone,
  CheckCircle,
  Download,
  Send,
  AlertCircle,
  ChartLine,
  Leaf,
  Handshake
} from "lucide-react";
import jsPDF from "jspdf";

// Extend the schema with frontend validation
const formSchema = insertShareholderApplicationSchema.extend({
  businessBackground: z.array(z.string()).optional(),
  acknowledgments: z.array(z.string()).min(4, "All acknowledgments must be accepted"),
});

type FormData = z.infer<typeof formSchema>;

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" }
];

export default function ShareholderEnrollment() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      ssn: "",
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      phoneNumber: "",
      emailAddress: "",
      investmentAmount: "",
      shareClass: "",
      paymentMethod: "",
      expectedIncome: "",
      industryExperience: "",
      businessBackground: [],
      investmentObjective: "",
      riskTolerance: "",
      timeHorizon: "",
      acknowledgments: [],
      electronicSignature: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Submit to our backend first
      const response = await apiRequest("POST", "/api/shareholder-application", data);
      const result = await response.json();
      
      // Send management email notification using client-side FormSubmit.co
      try {
        const managementForm = new FormData();
        managementForm.append('_to', 'frankashley247@gmail.com');
        managementForm.append('_subject', `🌲 New Shareholder Application - ${data.firstName} ${data.lastName}`);
        managementForm.append('_template', 'box');
        managementForm.append('_captcha', 'false');
        
        // Create comprehensive application summary
        const applicationSummary = `
NEW SHAREHOLDER APPLICATION RECEIVED

Application Details:
- ID: ${result.applicationId}
- Submitted: ${new Date().toLocaleString()}

Personal Information:
- Name: ${data.firstName} ${data.lastName}
- Date of Birth: ${data.dateOfBirth}
- SSN: ${data.ssn}

Contact Information:
- Address: ${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}
- Phone: ${data.phoneNumber}
- Email: ${data.emailAddress}

Investment Details:
- Amount: $${Number(data.investmentAmount).toLocaleString()}
- Share Class: ${data.shareClass}
- Payment Method: ${data.paymentMethod}
${data.expectedIncome ? `- Expected Income: ${data.expectedIncome}` : ''}

Experience:
- Industry Experience: ${data.industryExperience}
${data.businessBackground && data.businessBackground.length > 0 ? `- Business Background: ${data.businessBackground.join(', ')}` : ''}

Investment Profile:
- Objective: ${data.investmentObjective}
- Risk Tolerance: ${data.riskTolerance}
- Time Horizon: ${data.timeHorizon}

Compliance:
- Electronic Signature: ${data.electronicSignature}
- Acknowledgments: ${data.acknowledgments.join(', ')}

Please review this application and contact the applicant within 2-3 business days.
        `;
        
        managementForm.append('message', applicationSummary);
        managementForm.append('Applicant_Name', `${data.firstName} ${data.lastName}`);
        managementForm.append('Investment_Amount', `$${Number(data.investmentAmount).toLocaleString()}`);
        managementForm.append('Applicant_Email', data.emailAddress);
        managementForm.append('Application_ID', result.applicationId?.toString() || 'Pending');
        
        await fetch('https://formsubmit.co/ajax/frankashley247@gmail.com', {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: managementForm
        });
        
        console.log('Management notification sent successfully');
      } catch (emailError) {
        console.log('Management email failed:', emailError);
      }
      
      // Send confirmation email to applicant using FormSubmit.co
      try {
        const confirmationForm = new FormData();
        confirmationForm.append('_to', data.emailAddress);
        confirmationForm.append('_subject', 'Application Received - J ECO INVESTMENT LLC Shareholder Enrollment');
        confirmationForm.append('_template', 'box');
        confirmationForm.append('_captcha', 'false');
        
        const confirmationMessage = `Dear ${data.firstName} ${data.lastName},

Thank you for your interest in becoming a shareholder with J ECO INVESTMENT LLC. We have successfully received your membership enrollment application.

Application Summary:
- Application ID: ${result.applicationId}
- Investment Amount: $${Number(data.investmentAmount).toLocaleString()}
- Share Class: ${data.shareClass}

What happens next?
- Our team will review your application within 2-3 business days
- We may contact you for additional documentation or clarification
- You will receive notification of our decision via email
- If approved, we'll guide you through the investment process

Thank you for considering J ECO INVESTMENT LLC for your investment portfolio. We look forward to potentially welcoming you as a shareholder in our sustainable lumber business.

Best regards,
J ECO INVESTMENT LLC
Shareholder Relations Team`;
        
        confirmationForm.append('message', confirmationMessage);
        confirmationForm.append('Application_ID', result.applicationId?.toString() || 'Pending');
        
        await fetch('https://formsubmit.co/ajax/' + data.emailAddress, {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: confirmationForm
        });
        
        console.log('Applicant confirmation sent successfully');
      } catch (emailError) {
        console.log('Confirmation email failed, but application was submitted successfully');
      }
      
      return result;
    },
    onSuccess: (data) => {
      setApplicationId(data.applicationId);
      setShowSuccessModal(true);
      toast({
        title: "Success!",
        description: "Your shareholder application has been submitted successfully. Check your email for confirmation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generatePDF = () => {
    const formData = form.getValues();
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(46, 125, 50); // lumber-green
    doc.text("J ECO INVESTMENT LLC", 20, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Shareholder Membership Enrollment", 20, 30);
    
    doc.setFontSize(10);
    doc.text("Sustainable Lumber Solutions", 20, 35);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
    
    let yPos = 55;
    const lineHeight = 6;
    doc.setFontSize(12);
    
    // Personal Information
    doc.setFont(undefined, 'bold');
    doc.text("PERSONAL INFORMATION", 20, yPos);
    yPos += lineHeight + 2;
    doc.setFont(undefined, 'normal');
    
    doc.text(`Name: ${formData.firstName || ''} ${formData.lastName || ''}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Date of Birth: ${formData.dateOfBirth || ''}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`SSN: ${formData.ssn || ''}`, 20, yPos);
    yPos += lineHeight + 3;
    
    // Contact Information
    doc.setFont(undefined, 'bold');
    doc.text("CONTACT INFORMATION", 20, yPos);
    yPos += lineHeight + 2;
    doc.setFont(undefined, 'normal');
    
    doc.text(`Address: ${formData.streetAddress || ''}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`City, State, ZIP: ${formData.city || ''}, ${formData.state || ''} ${formData.zipCode || ''}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Phone: ${formData.phoneNumber || ''}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Email: ${formData.emailAddress || ''}`, 20, yPos);
    yPos += lineHeight + 3;
    
    // Investment Information
    doc.setFont(undefined, 'bold');
    doc.text("INVESTMENT INFORMATION", 20, yPos);
    yPos += lineHeight + 2;
    doc.setFont(undefined, 'normal');
    
    doc.text(`Investment Amount: $${Number(formData.investmentAmount || 0).toLocaleString()}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Share Class: ${formData.shareClass || ''}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Payment Method: ${formData.paymentMethod || ''}`, 20, yPos);
    yPos += lineHeight;
    if (formData.expectedIncome) {
      doc.text(`Expected Income: ${formData.expectedIncome}`, 20, yPos);
      yPos += lineHeight;
    }
    yPos += 3;
    
    // Industry Experience
    doc.setFont(undefined, 'bold');
    doc.text("INDUSTRY EXPERIENCE", 20, yPos);
    yPos += lineHeight + 2;
    doc.setFont(undefined, 'normal');
    
    doc.text(`Experience Level: ${formData.industryExperience || ''}`, 20, yPos);
    yPos += lineHeight;
    if (formData.businessBackground && formData.businessBackground.length > 0) {
      doc.text(`Business Background: ${formData.businessBackground.join(', ')}`, 20, yPos);
      yPos += lineHeight;
    }
    yPos += 3;
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Investment Objectives
    doc.setFont(undefined, 'bold');
    doc.text("INVESTMENT OBJECTIVES", 20, yPos);
    yPos += lineHeight + 2;
    doc.setFont(undefined, 'normal');
    
    doc.text(`Investment Objective: ${formData.investmentObjective || ''}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Risk Tolerance: ${formData.riskTolerance || ''}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Time Horizon: ${formData.timeHorizon || ''}`, 20, yPos);
    yPos += lineHeight + 3;
    
    // Legal & Compliance
    doc.setFont(undefined, 'bold');
    doc.text("LEGAL & COMPLIANCE", 20, yPos);
    yPos += lineHeight + 2;
    doc.setFont(undefined, 'normal');
    
    doc.text(`Electronic Signature: ${formData.electronicSignature || ''}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Date Signed: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += lineHeight + 3;
    
    doc.text("Acknowledgments:", 20, yPos);
    yPos += lineHeight;
    (formData.acknowledgments || []).forEach((ack) => {
      doc.text(`✓ ${ack}`, 25, yPos);
      yPos += lineHeight;
    });
    
    // Footer
    yPos = 280;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text("J ECO INVESTMENT LLC - Shareholder Enrollment Form", 20, yPos);
    doc.text(`Application ID: ${applicationId || 'PENDING'}`, 20, yPos + 5);
    
    doc.save(`shareholder-enrollment-${formData.firstName || 'user'}-${formData.lastName || 'application'}.pdf`);
    
    toast({
      title: "PDF Generated",
      description: "Your enrollment form has been saved as a PDF.",
    });
  };

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-lumber-green text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg">
                <TreePine className="h-8 w-8 text-lumber-green" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">J ECO INVESTMENT LLC</h1>
                <p className="text-green-200 text-sm">Sustainable Lumber Solutions</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-200">Investment Opportunity</p>
              <p className="font-semibold">Shareholder Enrollment</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Introduction Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Shareholder Membership Enrollment</h2>
              <p className="text-gray-600">Join our growing lumber and wood investment community</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-lumber-light rounded-lg">
                <ChartLine className="h-8 w-8 text-lumber-green mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Growth Potential</h3>
                <p className="text-sm text-gray-600">Sustainable returns in timber markets</p>
              </div>
              <div className="text-center p-4 bg-lumber-light rounded-lg">
                <Leaf className="h-8 w-8 text-lumber-green mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Eco-Friendly</h3>
                <p className="text-sm text-gray-600">Responsible forestry practices</p>
              </div>
              <div className="text-center p-4 bg-lumber-light rounded-lg">
                <Handshake className="h-8 w-8 text-lumber-green mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Partnership</h3>
                <p className="text-sm text-gray-600">Strategic investment opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <User className="h-5 w-5 text-lumber-green mr-3" />
                  <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} className="focus:ring-lumber-green focus:border-lumber-green" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} className="focus:ring-lumber-green focus:border-lumber-green" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="focus:ring-lumber-green focus:border-lumber-green" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ssn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Security Number *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="XXX-XX-XXXX" 
                            className="focus:ring-lumber-green focus:border-lumber-green"
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 3) value = value.slice(0, 3) + '-' + value.slice(3);
                              if (value.length >= 6) value = value.slice(0, 6) + '-' + value.slice(6, 10);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <MapPin className="h-5 w-5 text-lumber-green mr-3" />
                  <h3 className="text-xl font-semibold text-gray-800">Contact Information</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="streetAddress"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input {...field} className="focus:ring-lumber-green focus:border-lumber-green" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input {...field} className="focus:ring-lumber-green focus:border-lumber-green" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-lumber-green focus:border-lumber-green">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code *</FormLabel>
                        <FormControl>
                          <Input {...field} className="focus:ring-lumber-green focus:border-lumber-green" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="(555) 123-4567" 
                            className="focus:ring-lumber-green focus:border-lumber-green"
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 3) value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
                              if (value.length >= 9) value = value.slice(0, 9) + '-' + value.slice(9, 13);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emailAddress"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} className="focus:ring-lumber-green focus:border-lumber-green" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Investment Information Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <DollarSign className="h-5 w-5 text-lumber-green mr-3" />
                  <h3 className="text-xl font-semibold text-gray-800">Investment Information</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="investmentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Amount *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500">$</span>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1000" 
                              step="100" 
                              placeholder="10,000" 
                              className="pl-8 focus:ring-lumber-green focus:border-lumber-green" 
                            />
                          </div>
                        </FormControl>
                        <p className="text-xs text-gray-500">Minimum investment: $1,000</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shareClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Share Class *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-lumber-green focus:border-lumber-green">
                              <SelectValue placeholder="Select Share Class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="common">Common Shares</SelectItem>
                            <SelectItem value="preferred">Preferred Shares</SelectItem>
                            <SelectItem value="premium">Premium Shares</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-lumber-green focus:border-lumber-green">
                              <SelectValue placeholder="Select Payment Method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="wire">Wire Transfer</SelectItem>
                            <SelectItem value="check">Certified Check</SelectItem>
                            <SelectItem value="ach">ACH Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expectedIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Annual Income</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-lumber-green focus:border-lumber-green">
                              <SelectValue placeholder="Select Range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="under50k">Under $50,000</SelectItem>
                            <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                            <SelectItem value="100k-250k">$100,000 - $250,000</SelectItem>
                            <SelectItem value="250k-500k">$250,000 - $500,000</SelectItem>
                            <SelectItem value="over500k">Over $500,000</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Industry Experience Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <Briefcase className="h-5 w-5 text-lumber-green mr-3" />
                  <h3 className="text-xl font-semibold text-gray-800">Lumber & Wood Industry Experience</h3>
                </div>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="industryExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry Experience Level *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-lumber-green focus:border-lumber-green">
                              <SelectValue placeholder="Select Experience Level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No prior experience</SelectItem>
                            <SelectItem value="limited">Limited (1-3 years)</SelectItem>
                            <SelectItem value="moderate">Moderate (3-10 years)</SelectItem>
                            <SelectItem value="extensive">Extensive (10+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="businessBackground"
                    render={() => (
                      <FormItem>
                        <FormLabel>Relevant Business Background</FormLabel>
                        <div className="grid md:grid-cols-2 gap-4">
                          {[
                            { value: "forestry", label: "Forestry/Logging" },
                            { value: "sawmill", label: "Sawmill Operations" },
                            { value: "construction", label: "Construction" },
                            { value: "woodworking", label: "Woodworking/Carpentry" },
                            { value: "real-estate", label: "Real Estate" },
                            { value: "other", label: "Other" }
                          ].map((item) => (
                            <FormField
                              key={item.value}
                              control={form.control}
                              name="businessBackground"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.value)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, item.value]);
                                        } else {
                                          field.onChange(current.filter((value) => value !== item.value));
                                        }
                                      }}
                                      className="data-[state=checked]:bg-lumber-green data-[state=checked]:border-lumber-green"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Investment Objectives & Risk Tolerance */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <Target className="h-5 w-5 text-lumber-green mr-3" />
                  <h3 className="text-xl font-semibold text-gray-800">Investment Objectives & Risk Tolerance</h3>
                </div>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="investmentObjective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Investment Objective *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-lumber-green focus:border-lumber-green">
                              <SelectValue placeholder="Select Objective" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="income">Regular Income Generation</SelectItem>
                            <SelectItem value="growth">Long-term Capital Growth</SelectItem>
                            <SelectItem value="balanced">Balanced Income & Growth</SelectItem>
                            <SelectItem value="speculation">Speculative Growth</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="riskTolerance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Tolerance Level *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-lumber-green focus:border-lumber-green">
                              <SelectValue placeholder="Select Risk Level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="conservative">Conservative - Preserve capital with minimal risk</SelectItem>
                            <SelectItem value="moderate">Moderate - Accept some risk for potential returns</SelectItem>
                            <SelectItem value="aggressive">Aggressive - Accept high risk for high potential returns</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="timeHorizon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Time Horizon *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="focus:ring-lumber-green focus:border-lumber-green">
                              <SelectValue placeholder="Select Time Frame" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="short">Short-term (1-3 years)</SelectItem>
                            <SelectItem value="medium">Medium-term (3-7 years)</SelectItem>
                            <SelectItem value="long">Long-term (7+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Legal & Compliance Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <FileText className="h-5 w-5 text-lumber-green mr-3" />
                  <h3 className="text-xl font-semibold text-gray-800">Legal & Compliance</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Required Acknowledgments</h4>
                    <FormField
                      control={form.control}
                      name="acknowledgments"
                      render={() => (
                        <FormItem>
                          <div className="space-y-3">
                            {[
                              { value: "accredited", label: "I certify that I am an accredited investor as defined by the SEC and understand the risks associated with this investment." },
                              { value: "disclosure", label: "I have received and reviewed all relevant disclosure documents and private placement memorandum." },
                              { value: "understanding", label: "I understand that this investment is illiquid and may not be suitable for all investors." },
                              { value: "tax", label: "I understand the tax implications of this investment and will consult with my tax advisor." }
                            ].map((item) => (
                              <FormField
                                key={item.value}
                                control={form.control}
                                name="acknowledgments"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.value)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, item.value]);
                                          } else {
                                            field.onChange(current.filter((value) => value !== item.value));
                                          }
                                        }}
                                        className="data-[state=checked]:bg-lumber-green data-[state=checked]:border-lumber-green mt-1"
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal leading-relaxed">
                                      {item.label}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="electronicSignature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electronic Signature *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Type your full legal name" 
                            className="focus:ring-lumber-green focus:border-lumber-green" 
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">By typing your name, you agree this constitutes a legal signature</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Section */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-6">
                    By submitting this form, you agree to our Terms of Service and Privacy Policy.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      type="button" 
                      onClick={generatePDF} 
                      variant="outline"
                      className="border-wood-brown text-wood-brown hover:bg-wood-brown hover:text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Generate PDF
                    </Button>
                    
                    <Button 
                      type="submit" 
                      disabled={submitMutation.isPending}
                      className="bg-lumber-green hover:bg-lumber-green/90 text-white"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle className="text-center">Application Submitted Successfully!</DialogTitle>
              <DialogDescription className="text-center">
                Your shareholder enrollment application has been sent to our team. We'll review your application and contact you within 2-3 business days.
              </DialogDescription>
              {applicationId && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm font-medium">Application ID: #{applicationId}</p>
                </div>
              )}
            </DialogHeader>
            <div className="flex justify-center">
              <Button 
                onClick={() => {
                  setShowSuccessModal(false);
                  form.reset();
                }}
                className="bg-lumber-green hover:bg-lumber-green/90"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold mb-4">J ECO INVESTMENT LLC</h4>
              <p className="text-gray-400 text-sm">Leading sustainable lumber investment opportunities with responsible forestry practices.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Information</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <p className="flex items-center"><Mail className="w-4 h-4 mr-2" />frankashley247@gmail.com</p>
                <p className="flex items-center"><Phone className="w-4 h-4 mr-2" />Questions? Contact our team</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Privacy & Security</h4>
              <p className="text-gray-400 text-sm">Your information is protected with industry-standard encryption and security measures.</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-4 text-center text-gray-400 text-sm">
            <p>&copy; 2024 J ECO INVESTMENT LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
