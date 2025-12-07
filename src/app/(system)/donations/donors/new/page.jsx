import NewDonationPage from "@/components/donations/new/donation-add-new-form";
import MemberRegistration from "@/components/members/new/member-add-new-form";


export default function AddMemberPage() {
  return (
    <div className=" pb-6 pt-3">
      <NewDonationPage/>
    </div>
  );
}

export const metadata = {
  title: "New Donation | Inzeedo Mosque Accounting System",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};
