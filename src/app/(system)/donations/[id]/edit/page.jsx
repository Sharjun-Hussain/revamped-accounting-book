"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DonationEntryWithPrint from "@/components/donations/new/donation-add-new-form";
import { donationService } from "@/services/donationService";
import { Loader2 } from "lucide-react";

export default function EditDonationPage() {
    const params = useParams();
    const router = useRouter();
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDonation = async () => {
            try {
                // Unwrap params if necessary (though useParams usually returns unwrapped object in client components)
                // In Next.js 15+, params might be a promise in server components, but this is a client component.
                // However, to be safe and consistent with recent changes:
                const id = params?.id; 
                if (!id) return;

                const data = await donationService.getById(id);
                setDonation(data);
            } catch (error) {
                console.error("Failed to fetch donation", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDonation();
    }, [params?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!donation) {
        return <div>Donation not found</div>;
    }

    return <DonationEntryWithPrint initialData={donation} />;
}
