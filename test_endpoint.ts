async function test() {
  try {
    const resp = await fetch("http://localhost:3000/api/admin/test-ai");
    const data = await resp.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
test();
