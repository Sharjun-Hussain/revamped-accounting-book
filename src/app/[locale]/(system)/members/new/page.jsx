import MemberRegistration from "@/components/members/new/member-add-new-form";


export default function AddMemberPage() {
  return (
    <div className="px-6 pb-6 pt-3">
      <MemberRegistration/>
    </div>
  );
}

export const metadata = {
  title: "Add New Members | Inzeedo Mosque Accounting System",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};
