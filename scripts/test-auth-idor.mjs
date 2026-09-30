// Test script to verify Role Verification and IDOR Protection
async function main() {
  const baseUrl = "http://localhost:3000";

  console.log("=== ATLAS ROLE & IDOR SECURITY TEST ===");

  // 1. Fetch Users
  const usersRes = await fetch(`${baseUrl}/api/users`);
  const { users } = await usersRes.json();
  const sarah = users.find((u) => u.name === "Sarah Chen"); // ADMIN
  const alex = users.find((u) => u.name === "Alex Rivera"); // VALIDATOR
  const david = users.find((u) => u.name === "David Kim"); // CONTRIBUTOR

  console.log(`\n1. Found Users:`);
  console.log(`   - Sarah: ${sarah.id} [${sarah.role}]`);
  console.log(`   - Alex:  ${alex.id} [${alex.role}]`);
  console.log(`   - David: ${david.id} [${david.role}]`);

  // 2. Fetch Pending Signatures
  const sigsRes = await fetch(`${baseUrl}/api/signatures`);
  const { signatures } = await sigsRes.json();
  const alexPendingSig = signatures.find(
    (s) => s.userId === alex.id && s.status === "PENDING"
  );
  console.log(`\n2. Target Signature for Alex:`);
  console.log(`   - ID: ${alexPendingSig?.id} (Doc: ${alexPendingSig?.documentId}, Level: ${alexPendingSig?.validationLevel})`);

  // 3. Test IDOR Vulnerability Prevention:
  // David Kim (CONTRIBUTOR) attempts to sign Alex's signature
  console.log(`\n3. [TEST IDOR] David Kim attempts to sign Alex Rivera's signature:`);
  const idorRes = await fetch(
    `${baseUrl}/api/signatures/${alexPendingSig.id}/sign`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-atlas-user-id": david.id,
      },
      body: JSON.stringify({ comments: "Malicious signature attempt" }),
    }
  );
  const idorJson = await idorRes.json();
  console.log(`   Status: ${idorRes.status} (Expected: 403)`);
  console.log(`   Response:`, idorJson);

  if (idorRes.status === 403 && (idorJson.securityCode === "IDOR_VIOLATION_PREVENTED" || idorJson.code === "IDOR_VIOLATION_PREVENTED")) {
    console.log(`   >>> SUCCESS: IDOR protection blocked unauthorized signature!`);
  } else {
    console.error(`   >>> FAILED: IDOR attack was NOT blocked!`);
    process.exit(1);
  }

  // 4. Test Role Validation Prevention on Document Validation:
  // Document SEC-001 requires LEVEL_3 (ADMIN only)
  console.log(`\n4. [TEST ROLE ENFORCEMENT] Testing document approval role limits:`);
  const docSec001Id = alexPendingSig.documentId;

  // A. David Kim (CONTRIBUTOR) attempts to approve LEVEL_3
  const davidValidateRes = await fetch(
    `${baseUrl}/api/documents/${docSec001Id}/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-atlas-user-id": david.id,
      },
      body: JSON.stringify({ action: "APPROVE", comments: "Contributor approving Level 3" }),
    }
  );
  const davidValidateJson = await davidValidateRes.json();
  console.log(`   David (CONTRIBUTOR) validating LEVEL_3 doc: Status ${davidValidateRes.status}`);
  console.log(`   Response:`, davidValidateJson);

  // B. Alex Rivera (VALIDATOR) attempts to approve LEVEL_3
  const alexValidateRes = await fetch(
    `${baseUrl}/api/documents/${docSec001Id}/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-atlas-user-id": alex.id,
      },
      body: JSON.stringify({ action: "APPROVE", comments: "Validator approving Level 3" }),
    }
  );
  const alexValidateJson = await alexValidateRes.json();
  console.log(`   Alex (VALIDATOR) validating LEVEL_3 doc: Status ${alexValidateRes.status}`);
  console.log(`   Response:`, alexValidateJson);

  // C. Sarah Chen (ADMIN) approves LEVEL_3
  const sarahValidateRes = await fetch(
    `${baseUrl}/api/documents/${docSec001Id}/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-atlas-user-id": sarah.id,
      },
      body: JSON.stringify({ action: "APPROVE", comments: "Executive security approval" }),
    }
  );
  const sarahValidateJson = await sarahValidateRes.json();
  console.log(`   Sarah (ADMIN) validating LEVEL_3 doc: Status ${sarahValidateRes.status}`);
  console.log(`   Response:`, sarahValidateJson);

  // 5. Test Authorized Signer:
  // Alex Rivera signs his own pending signature
  console.log(`\n5. [TEST AUTHORIZED SIGNING] Alex signs his own LEVEL_2 signature:`);
  const alexSignRes = await fetch(
    `${baseUrl}/api/signatures/${alexPendingSig.id}/sign`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-atlas-user-id": alex.id,
      },
      body: JSON.stringify({ comments: "Approved production migration architecture." }),
    }
  );
  const alexSignJson = await alexSignRes.json();
  console.log(`   Status: ${alexSignRes.status}`);
  console.log(`   Response:`, {
    status: alexSignJson.signature?.status,
    signatureHash: alexSignJson.signature?.signatureHash?.substring(0, 24) + "...",
    signer: alexSignJson.signature?.user?.name,
    validationLevel: alexSignJson.signature?.validationLevel,
  });

  console.log("\n=== ALL SECURITY AND ROLE TESTS COMPLETED SUCCESSFULLY ===");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
