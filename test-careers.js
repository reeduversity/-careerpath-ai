async function testAPI() {
  console.log("=== Testing POST /api/careers ===");
  const postRes = await fetch("http://localhost:4000/api/careers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categoryName: "Software Development",
      roleTitle: "Frontend Developer",
      roleDescription: "Builds user interfaces.",
      requiredSkills: ["React", "CSS"] // Just to test the schema, we will delete it right after.
    })
  });
  const postData = await postRes.json();
  console.log(JSON.stringify(postData, null, 2));

  if (!postData.data || !postData.data.id) return;
  const roleId = postData.data.id;

  console.log("\n=== Testing GET /api/careers ===");
  const getRes = await fetch("http://localhost:4000/api/careers");
  const getData = await getRes.json();
  console.log(JSON.stringify(getData, null, 2));

  console.log(`\n=== Testing GET /api/careers/${roleId} ===`);
  const getOneRes = await fetch(`http://localhost:4000/api/careers/${roleId}`);
  const getOneData = await getOneRes.json();
  console.log(JSON.stringify(getOneData, null, 2));

  console.log(`\n=== Testing PUT /api/careers/${roleId} ===`);
  const putRes = await fetch(`http://localhost:4000/api/careers/${roleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Senior Frontend Developer",
      description: "Builds advanced UIs."
    })
  });
  const putData = await putRes.json();
  console.log(JSON.stringify(putData, null, 2));

  console.log(`\n=== Testing DELETE /api/careers/${roleId} ===`);
  const delRes = await fetch(`http://localhost:4000/api/careers/${roleId}`, {
    method: "DELETE"
  });
  const delData = await delRes.json();
  console.log(JSON.stringify(delData, null, 2));
}

testAPI();
