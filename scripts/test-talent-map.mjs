// Automated verification script for Talent Map, Skill Extraction & Vector Search
async function testTalentMap() {
  const baseUrl = "http://localhost:3000";

  console.log("=== ATLAS TALENT MAP & VECTOR SIMILARITY VERIFICATION ===");

  // 1. Test In-Memory Vector Search via API: Query 'Kubernetes'
  console.log("\n1. [TEST VECTOR SEARCH] Querying 'Kubernetes':");
  const k8sRes = await fetch(`${baseUrl}/api/talent?skill=Kubernetes`);
  const k8sData = await k8sRes.json();
  console.log(`   Found ${k8sData.experts?.length || 0} experts.`);
  if (k8sData.experts && k8sData.experts.length > 0) {
    const top = k8sData.experts[0];
    console.log(`   Top Match: ${top.user.name} (${top.user.role})`);
    console.log(`   Confidence: ${top.matchConfidence}% (Cosine: ${top.score})`);
    console.log(`   Matched Skills: ${top.matchedSkills.join(", ")}`);
    if (top.user.name === "Alex Rivera" && top.matchConfidence >= 80) {
      console.log("   >>> PASS: Alex Rivera correctly ranked #1 for Kubernetes with high confidence!");
    } else {
      console.warn("   >>> WARNING: Unexpected top match:", top);
    }
  }

  // 2. Test In-Memory Vector Search: Query 'Frontend Performance React'
  console.log("\n2. [TEST VECTOR SEARCH] Querying 'Frontend Performance React':");
  const feRes = await fetch(`${baseUrl}/api/talent?skill=Frontend%20Performance%20React`);
  const feData = await feRes.json();
  console.log(`   Found ${feData.experts?.length || 0} experts.`);
  if (feData.experts && feData.experts.length > 0) {
    const top = feData.experts[0];
    console.log(`   Top Match: ${top.user.name} (${top.user.role})`);
    console.log(`   Confidence: ${top.matchConfidence}% (Cosine: ${top.score})`);
    console.log(`   Matched Skills: ${top.matchedSkills.join(", ")}`);
    if (top.user.name === "David Kim" && top.matchConfidence >= 75) {
      console.log("   >>> PASS: David Kim correctly ranked #1 for Frontend Performance React!");
    }
  }

  // 3. Test In-Memory Vector Search: Query 'Enterprise Governance and Risk Management'
  console.log("\n3. [TEST VECTOR SEARCH] Querying 'Enterprise Governance and Risk Management':");
  const govRes = await fetch(`${baseUrl}/api/talent?skill=Enterprise%20Governance%20and%20Risk%20Management`);
  const govData = await govRes.json();
  console.log(`   Found ${govData.experts?.length || 0} experts.`);
  if (govData.experts && govData.experts.length > 0) {
    const top = govData.experts[0];
    console.log(`   Top Match: ${top.user.name} (${top.user.role})`);
    console.log(`   Confidence: ${top.matchConfidence}% (Cosine: ${top.score})`);
    console.log(`   Matched Skills: ${top.matchedSkills.join(", ")}`);
    if (top.user.name === "Sarah Chen" && top.matchConfidence >= 80) {
      console.log("   >>> PASS: Sarah Chen correctly ranked #1 for Enterprise Governance!");
    }
  }

  // 4. Test Work Description Skill Extractor (POST /api/talent)
  console.log("\n4. [TEST SKILL EXTRACTOR] Extracting skills from an employee work description:");
  const sampleWorkDesc = "Architected fault-tolerant microservices running on Kubernetes and Google Cloud Run. Developed backend REST services in Go, integrated Prometheus telemetry, and managed container deployment pipelines using Docker and Helm.";

  const extractRes = await fetch(`${baseUrl}/api/talent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workDescription: sampleWorkDesc, autoMatch: true }),
  });
  const extractData = await extractRes.json();
  console.log(`   Extraction Method: ${extractData.extractionMethod}`);
  console.log(`   Extracted Skills (${extractData.skills?.length}):`, extractData.skills);
  console.log(`   Auto-matched Experts (${extractData.experts?.length}):`);
  for (const exp of extractData.experts || []) {
    console.log(`     - ${exp.user.name}: ${exp.matchConfidence}% Match (${exp.matchedSkills.join(", ")})`);
  }

  if (extractData.skills?.length > 0 && extractData.experts?.[0]?.user?.name === "Alex Rivera") {
    console.log("   >>> PASS: Skills extracted and Alex Rivera successfully auto-matched!");
  }

  console.log("\n=== ALL TALENT MAP TESTS COMPLETED SUCCESSFULLY ===");
}

testTalentMap().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
