"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Save, 
  X, 
  UploadCloud, 
  Calendar as CalendarIcon, 
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Loader2,
  ArrowLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { JoinedDatePicker } from "./JoinedDatePicker";
import { memberService } from "@/services/memberService";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- Animation Variants (Matching Dashboard) ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

import useSWR from 'swr';

// --- Zod Schema ---
const formSchema = z.object({
  memberNo: z.string().optional(), // Optional because it might be auto-generated
  name: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  email: z.string().email().optional().or(z.literal("")),
  contact: z.string().min(9, "Contact number is required"),
  payment_frequency: z.string(),
  amount_per_cycle: z.coerce.number().min(100),
  start_date: z.date(),
  profilePicture: z.any().optional(),
});

export default function MemberRegistration({ memberId }) {
  const fetcher = (url) => fetch(url).then((res) => res.json());
  const { data: settings } = useSWR('/api/settings/app', fetcher);
  
  // Fetch member data if in edit mode
  const { data: memberData, isLoading: isLoadingMember } = useSWR(
    memberId ? `/api/members/${memberId}` : null,
    fetcher
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberNo: "",
      name: "",
      address: "",
      email: "",
      contact: "",
      payment_frequency: "Monthly",
      amount_per_cycle: 1000,
      start_date: new Date(),
      profilePicture: null,
    },
  });

  // Pre-fill form when member data is loaded
  useEffect(() => {
    if (memberData) {
        form.reset({
            memberNo: memberData.memberNo || "",
            name: memberData.name || "",
            address: memberData.address || "",
            email: memberData.email || "",
            contact: memberData.contact || "",
            payment_frequency: memberData.paymentFrequency || "Monthly",
            amount_per_cycle: memberData.amountPerCycle || 1000,
            start_date: memberData.startDate ? new Date(memberData.startDate) : new Date(),
            profilePicture: memberData.profilePicture,
        });
        setPreviewUrl(memberData.profilePicture);
    }
  }, [memberData, form]);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      // Convert image to base64 if it's a File object
      let profilePicture = values.profilePicture;
      if (values.profilePicture instanceof File) {
        profilePicture = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(values.profilePicture);
        });
      }

      const payload = {
        ...values,
        profilePicture,
        // Ensure date is ISO string
        start_date: values.start_date.toISOString(),
      };

      const url = memberId ? `/api/members/${memberId}` : '/api/members';
      const method = memberId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(memberId ? "Member updated successfully" : "Member registered successfully");
        router.push("/members");
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save member");
      }
    } catch (error) {
      console.error("Error saving member:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (memberId && isLoadingMember) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className=" space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{memberId ? 'Edit Member Details' : 'Register New Member'}</h1>
            <p className="text-slate-500">{memberId ? 'Update member information and subscription plan.' : 'Add a new member to the system and set up their Sanda plan.'}</p>
          </div>
        </div>
        <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
            <X className="w-4 h-4 mr-2" /> Cancel
        </Button>
      </motion.div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Photo & Basic Info */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Identity */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <User className="h-32 w-32 text-emerald-600 transform -rotate-12" />
                </div>
                
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg">
                    <User className="h-4 w-4" />
                  </span>
                  Personal Details
                </h3>

                <div className="flex flex-col sm:flex-row gap-8">
                  {/* Photo Upload Area */}
                  <FormField
                    control={form.control}
                    name="profilePicture"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center space-y-3">
                        <div className="relative group cursor-pointer">
                            <Avatar className="w-32 h-32 border-4 border-slate-50 shadow-sm group-hover:border-emerald-100 transition-all">
                            <AvatarImage src={previewUrl || ""} className="object-cover" />
                            <AvatarFallback className="bg-slate-100 text-slate-400">
                                <User className="w-12 h-12" />
                            </AvatarFallback>
                            </Avatar>
                            <label 
                                htmlFor="file-upload" 
                                className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full shadow-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                                <UploadCloud className="w-4 h-4" />
                            </label>
                        </div>
                        <FormControl>
                          <Input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => field.onChange(e.target.files?.[0] ?? null)}
                          />
                        </FormControl>
                        <p className="text-xs text-slate-400 font-medium">JPG, PNG max 5MB</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Text Fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Member ID Field */}
                    <div className="md:col-span-2">
                        <FormLabel className="text-slate-700">Member ID</FormLabel>
                        {settings?.memberIdFormat === 'Manual' ? (
                            <FormField
                                control={form.control}
                                name="memberNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="Enter Custom ID" className="bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                            <div className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-slate-100 text-slate-500 text-sm flex items-center">
                                {settings ? `${settings.memberIdPrefix || 'MEM'}-${String(settings.nextMemberId || 1).padStart(3, '0')}` : 'Loading...'} 
                                <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Auto-Generated</span>
                            </div>
                        )}
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-slate-700">Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Abdul Rahman" className="bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Phone Number</FormLabel>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <FormControl>
                                <Input placeholder="077xxxxxxx" className="pl-9 bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Email (Optional)</FormLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <FormControl>
                                <Input placeholder="email@example.com" className="pl-9 bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-slate-700">Residential Address</FormLabel>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <FormControl>
                                <Input placeholder="No. 123, Mosque Road, Kandy" className="pl-9 bg-slate-50 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: Sanda Settings */}
            <motion.div variants={itemVariants} className="space-y-6">
                
              {/* Card 2: Billing Config */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-full">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  Sanda Configuration
                </h3>

                <div className="space-y-5">
                    <FormField
                    control={form.control}
                    name="payment_frequency"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-slate-700">Billing Cycle</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-emerald-500 w-full">
                                <SelectValue placeholder="Select Frequency" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Quarterly">Quarterly</SelectItem>
                                <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                                <SelectItem value="Yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="amount_per_cycle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-slate-700">Amount (LKR)</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-semibold">Rs.</span>
                                <Input type="number" className="pl-10 bg-slate-50 border-slate-200 font-semibold text-slate-900 focus:ring-emerald-500 focus:border-emerald-500" {...field} />
                            </div>
                        </FormControl>
                        <p className="text-xs text-slate-500">Fixed amount per billing cycle.</p>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel className="text-slate-700">Start Billing From</FormLabel>
                        <FormControl>
                            <JoinedDatePicker
                                value={field.value}
                                onChange={field.onChange}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <Separator className="bg-slate-100 my-4" />

                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {memberId ? 'Updating...' : 'Registering...'}
                    </>
                ) : (
                    memberId ? 'Update Member' : 'Register Member'
                )}
              </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}