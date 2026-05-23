import { NextResponse } from "next/server";
import {
  isValidImportRow,
  parseImportRow,
  SANDHA_PLAN_OPTIONS,
} from "@/lib/member-import-utils";
import prisma from "@/lib/prisma";

const BATCH_SIZE = 500;

export async function POST(request) {
  try {
    const body = await request.json();
    const { members } = body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: "Invalid data provided" },
        { status: 400 },
      );
    }

    const settings = await prisma.appSettings.findFirst();
    const prefix = settings?.memberIdPrefix || "MEM";
    const idFormat = settings?.memberIdFormat || "Auto";
    let nextId = settings?.nextMemberId || 1;

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const membersToCreate = [];
    const seenMemberNos = new Set();

    for (let i = 0; i < members.length; i++) {
      const parsed = parseImportRow(members[i]);

      if (!isValidImportRow(parsed)) {
        continue;
      }

      const rowNum = i + 1;

      if (!parsed.contact) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Contact is required`);
        continue;
      }

      if (!SANDHA_PLAN_OPTIONS.includes(parsed.paymentFrequency)) {
        results.failed++;
        results.errors.push(
          `Row ${rowNum}: Invalid Sandha Plan "${parsed.paymentFrequency}". Use: ${SANDHA_PLAN_OPTIONS.join(", ")}`,
        );
        continue;
      }

      let { memberNo } = parsed;

      if (!memberNo) {
        if (idFormat === "Manual") {
          results.failed++;
          results.errors.push(
            `Row ${rowNum}: Member ID is required (manual ID mode)`,
          );
          continue;
        }
        memberNo = `${prefix}-${String(nextId).padStart(3, "0")}`;
        nextId++;
      }

      if (seenMemberNos.has(memberNo)) {
        results.failed++;
        results.errors.push(
          `Row ${rowNum}: Duplicate Member ID "${memberNo}" in file`,
        );
        continue;
      }
      seenMemberNos.add(memberNo);

      membersToCreate.push({
        memberNo,
        name: parsed.name,
        contact: parsed.contact,
        address: parsed.address || null,
        email: parsed.email || null,
        paymentFrequency: parsed.paymentFrequency,
        amountPerCycle: parsed.amountPerCycle,
        status: "active",
      });
    }

    if (membersToCreate.length === 0) {
      return NextResponse.json(
        {
          error: results.errors.length
            ? "No valid members to import. See details."
            : "No member rows found in file.",
          failed: results.failed,
          messages: results.errors,
        },
        { status: 400 },
      );
    }

    let totalCreated = 0;
    for (let i = 0; i < membersToCreate.length; i += BATCH_SIZE) {
      const batch = membersToCreate.slice(i, i + BATCH_SIZE);
      const batchResult = await prisma.member.createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalCreated += batchResult.count;
    }

    if (settings && nextId > settings.nextMemberId) {
      await prisma.appSettings.update({
        where: { id: settings.id },
        data: { nextMemberId: nextId },
      });
    }

    results.success = totalCreated;
    results.failed += membersToCreate.length - totalCreated;

    if (membersToCreate.length > totalCreated) {
      results.errors.push(
        `${membersToCreate.length - totalCreated} record(s) skipped (duplicate Member ID).`,
      );
    }

    return NextResponse.json({
      count: results.success,
      failed: results.failed,
      messages: results.errors,
    });
  } catch (error) {
    console.error("Error processing bulk upload:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
