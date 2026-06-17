import { NextResponse } from "next/server";
import { getPolicies, createPolicy, updatePolicy, deletePolicy } from "@/lib/policy-server";
import { createOrderCancelEmail, sendEmail } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const rawPageSize = Number(searchParams.get("pageSize")) || 25;
    const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
    const statusParam = searchParams.get("status") === "pending" ? "pending" : "confirmed";
    const searchTerm = searchParams.get("search") ?? undefined;
    const sortBy = (searchParams.get("sort") as any) ?? "latest";

    const policies = await getPolicies({
      page,
      pageSize,
      status: statusParam,
      searchTerm,
      sortBy,
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error("Error fetching policies:", error);
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const policyData = await request.json();
    const newPolicy = await createPolicy(policyData);
    return NextResponse.json(newPolicy);
  } catch (error) {
    console.error("Error creating policy:", error);
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { policyId, policyData } = await request.json();
    const { vehicleModifications, ...restOfPolicyData } = policyData;
    const updatedPolicy = await updatePolicy(policyId, {
      ...restOfPolicyData,
      vehicleModifications,
    });
    return NextResponse.json(updatedPolicy);
  } catch (error) {
    console.error("Error updating policy:", error);
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { policyId, notifyUser = false, reason = "" } = await request.json();
    const deletedPolicy = await deletePolicy(policyId);


    if (notifyUser) {
      const policy = deletedPolicy?.[0];
      const userEmail = policy?.user?.email;

      if (policy && userEmail) {
        const { subject, html } = await createOrderCancelEmail({
          firstName: policy.firstName || "Customer",
          lastName: policy.lastName || "",
          policyNumber: policy.policyNumber || "",
          reason,
        });

        if (subject !== "Error") {
          await sendEmail({
            to: userEmail,
            subject,
            html,
          });
        }
      }
    }
    
    return NextResponse.json(deletedPolicy);
  } catch (error) {
    console.error("Error deleting policy:", error);
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 });
  }
}
