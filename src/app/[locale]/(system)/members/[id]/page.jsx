"use client";

import React, { use } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    Edit, 
    User, 
    Phone, 
    MapPin, 
    Mail, 
    Calendar, 
    CreditCard, 
    Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function MemberProfilePage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const { data: member, error, isLoading } = useSWR(`/api/members/${id}`, fetcher);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 gap-4">
        <p className="text-slate-500">Member not found or failed to load.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Member Profile</h1>
          </div>
          <Link href={`/members/${id}/edit`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Edit className="w-4 h-4" /> Edit Details
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Identity Card */}
          <Card className="md:col-span-1 border-slate-200 shadow-sm">
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <Avatar className="w-32 h-32 border-4 border-slate-50 shadow-sm">
                <AvatarImage src={member.profilePicture} className="object-cover" />
                <AvatarFallback className="bg-slate-100 text-slate-400">
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-xl font-bold text-slate-900">{member?.name}</h2>
                <p className="text-sm text-slate-500 font-mono mt-1">{member?.memberNo || member?.id?.slice(-6).toUpperCase()}</p>
              </div>

              <Badge variant={member?.status === 'active' ? 'default' : 'secondary'} className="capitalize px-4 py-1">
                {member.status}
              </Badge>

              <div className="w-full pt-4 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>{member.contact}</span>
                </div>
                {member.email && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-emerald-600" />
                        <span className="truncate">{member.email}</span>
                    </div>
                )}
                <div className="flex items-start gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <span>{member.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Details & Stats */}
          <div className="md:col-span-2 space-y-6">
            {/* Subscription Plan */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                        Subscription Plan
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-medium">Frequency</p>
                            <p className="text-lg font-semibold text-slate-900 mt-1">{member.paymentFrequency}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase font-medium">Amount / Cycle</p>
                            <p className="text-lg font-semibold text-slate-900 mt-1">
                                {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(member.amountPerCycle)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>Member since {new Date(member.startDate).toLocaleDateString()}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity Placeholder */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-500 italic">No recent payments or donations found.</p>
                    {/* TODO: Fetch and display recent transactions here */}
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
