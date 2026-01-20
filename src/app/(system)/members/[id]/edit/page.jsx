"use client";

import React, { use } from "react";
import MemberRegistration from "@/components/members/new/member-add-new-form";

export default function EditMemberPage({ params }) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  return <MemberRegistration memberId={id} />;
}
