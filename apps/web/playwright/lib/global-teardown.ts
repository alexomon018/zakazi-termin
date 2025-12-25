async function globalTeardown() {
  console.log("🧹 Running global teardown...");

  // Cleanup can be extended as needed
  // For now, we leave the test database intact for debugging
  // If you want to clean up between runs, add cleanup logic here

  console.log("✅ Global teardown completed");
}

export default globalTeardown;
